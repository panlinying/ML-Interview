"""
FastAPI backend for ML Interview site.
Deployed as Vercel serverless functions.
"""

import os
import re
import html
import time
import uuid
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional, List
from sqlalchemy import func, text
from sqlalchemy.orm import joinedload

from .db import get_db, get_session, Progress, Comment, CommentVote, PageView, User, RateLimit, init_db
from .auth import router as auth_router, get_current_user_required, get_current_user_optional, verify_admin_secret
from .logging_config import setup_logging, get_logger

# Initialize logging
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_JSON = os.environ.get("LOG_JSON", "true").lower() == "true"
setup_logging(level=LOG_LEVEL, json_format=LOG_JSON)

logger = get_logger(__name__)

app = FastAPI(title="ML Interview API")


# --- Request Logging Middleware ---

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests with timing information."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log request details
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "client_ip": self._get_client_ip(request),
            }
        )

        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


app.add_middleware(RequestLoggingMiddleware)

# Include auth routes
app.include_router(auth_router)

# Environment variables
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")

# CORS - Restrict to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Secret"],
)


# --- Rate Limiting ---

RATE_LIMITS = {
    "default": (100, 60),      # 100 requests per 60 seconds
    "comments": (10, 60),      # 10 comments per 60 seconds
    "auth": (5, 60),           # 5 auth attempts per 60 seconds
}


def get_client_ip(request: Request) -> str:
    """Get client IP from request, handling proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(
    request: Request,
    endpoint: str,
    db
) -> None:
    """
    Check and update rate limit for a client.

    Raises HTTPException with 429 status if rate limit exceeded.
    Database session is required - rate limiting cannot be bypassed.
    """
    client_ip = get_client_ip(request)
    limit, window_seconds = RATE_LIMITS.get(endpoint, RATE_LIMITS["default"])

    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)

    # Clean old entries (only occasionally to avoid doing this on every request)
    # TODO: Move to a background task for better performance
    db.query(RateLimit).filter(RateLimit.window_start < window_start).delete()

    # Check current count
    rate_entry = db.query(RateLimit).filter(
        RateLimit.key == client_ip,
        RateLimit.endpoint == endpoint,
        RateLimit.window_start >= window_start
    ).first()

    if rate_entry:
        if rate_entry.count >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {window_seconds} seconds."
            )
        rate_entry.count += 1
    else:
        rate_entry = RateLimit(
            key=client_ip,
            endpoint=endpoint,
            count=1,
            window_start=now
        )
        db.add(rate_entry)

    db.commit()


# --- Input Sanitization ---

def sanitize_string(value: str, max_length: int = 10000) -> str:
    """Sanitize user input to prevent XSS and injection attacks."""
    if not value:
        return value

    # Truncate to max length
    value = value[:max_length]

    # HTML escape to prevent XSS
    value = html.escape(value)

    return value


def validate_slug(slug: str) -> str:
    """Validate and sanitize a content slug."""
    # Allow common filename characters used in the curriculum.
    if not re.match(r'^[\w\s/.,()+&-]+$', slug):
        raise HTTPException(status_code=400, detail="Invalid slug format")
    return slug[:255]  # Limit length


# --- Pydantic Models with Validation ---

class ProgressCreate(BaseModel):
    content_slug: str
    completed: bool = False
    notes: Optional[str] = None

    @field_validator('content_slug')
    @classmethod
    def validate_content_slug(cls, v):
        return validate_slug(v)

    @field_validator('notes')
    @classmethod
    def sanitize_notes(cls, v):
        if v:
            return sanitize_string(v, max_length=5000)
        return v


class ProgressResponse(BaseModel):
    id: int
    user_id: int
    content_slug: str
    completed: bool
    notes: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content_slug: str
    body: str
    parent_id: Optional[int] = None

    @field_validator('content_slug')
    @classmethod
    def validate_content_slug(cls, v):
        return validate_slug(v)

    @field_validator('body')
    @classmethod
    def sanitize_body(cls, v):
        if not v or len(v.strip()) < 1:
            raise ValueError("Comment body cannot be empty")
        return sanitize_string(v, max_length=10000)

    @field_validator('parent_id')
    @classmethod
    def validate_parent_id(cls, v):
        if v is not None and v < 1:
            raise ValueError("Invalid parent id")
        return v


class CommentResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    content_slug: str
    body: str
    created_at: datetime
    parent_id: Optional[int] = None
    score: int = 0
    user_vote: int = 0

    class Config:
        from_attributes = True


class CommentVoteCreate(BaseModel):
    vote: int

    @field_validator('vote')
    @classmethod
    def validate_vote(cls, v):
        if v not in (-1, 0, 1):
            raise ValueError("Vote must be -1, 0, or 1")
        return v


class CommentVoteResponse(BaseModel):
    comment_id: int
    score: int
    user_vote: int


class PageViewCreate(BaseModel):
    path: str

    @field_validator('path')
    @classmethod
    def validate_path(cls, v):
        if not v or len(v) > 500:
            raise ValueError("Invalid path")
        # Allow encoded URL paths and common filename characters.
        if not re.match(r'^[\w\s/.,()+&%-]+$', v):
            raise ValueError("Invalid path format")
        return v


# --- Health Check ---

@app.get("/api")
def health_check():
    return {"status": "ok", "message": "ML Interview API"}


@app.get("/api/health")
def health_check_detailed():
    """Detailed health check including database connection."""
    import os
    
    health = {
        "status": "ok",
        "database_url_set": bool(os.environ.get("DATABASE_URL")),
        "admin_secret_set": bool(ADMIN_SECRET),
        "github_oauth_configured": bool(os.environ.get("GITHUB_CLIENT_ID")),
        "google_oauth_configured": bool(os.environ.get("GOOGLE_CLIENT_ID")),
    }
    
    # Test database connection
    try:
        db = get_session()
        db.execute(text("SELECT 1"))
        db.close()
        health["database_connection"] = "ok"
    except Exception:
        # Don't leak error details to clients
        health["database_connection"] = "error"
        health["status"] = "degraded"
    
    return health


@app.post("/api/admin/init-db")
def initialize_database(_: bool = Depends(verify_admin_secret)):
    """
    Initialize database tables (admin only).

    Requires X-Admin-Secret header for authentication.
    """
    try:
        init_db()
        logger.info("Database initialized successfully")
        return {"status": "ok", "message": "Database initialized"}
    except Exception as e:
        logger.exception("Database initialization failed")
        raise HTTPException(status_code=500, detail="Database initialization failed")


# --- Progress Routes (Authenticated) ---

@app.get("/api/progress", response_model=List[ProgressResponse])
def get_progress(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get progress for the authenticated user with pagination."""
    check_rate_limit(request, "default", db)
    # Cap limit to prevent excessive data retrieval
    limit = min(limit, 500)
    progress = db.query(Progress).filter(
        Progress.user_id == user.id
    ).offset(skip).limit(limit).all()
    return progress


@app.get("/api/progress/{content_slug:path}")
def get_progress_by_slug(
    content_slug: str,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get progress for a specific content item."""
    check_rate_limit(request, "default", db)
    content_slug = validate_slug(content_slug)

    progress = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.content_slug == content_slug
    ).first()

    if not progress:
        return {"completed": False, "notes": None}
    return ProgressResponse.model_validate(progress)


@app.post("/api/progress", response_model=ProgressResponse)
def update_progress(
    data: ProgressCreate,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Update or create progress for a content item."""
    check_rate_limit(request, "default", db)

    progress = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.content_slug == data.content_slug
    ).first()

    if progress:
        progress.completed = data.completed
        progress.notes = data.notes
        progress.updated_at = datetime.utcnow()
    else:
        progress = Progress(
            user_id=user.id,
            content_slug=data.content_slug,
            completed=data.completed,
            notes=data.notes
        )
        db.add(progress)

    db.commit()
    db.refresh(progress)
    return progress


# --- Comments Routes (Authenticated for posting) ---

@app.get("/api/comments/{content_slug:path}", response_model=List[CommentResponse])
def get_comments(
    content_slug: str,
    request: Request,
    skip: int = 0,
    limit: int = 50,
    user: Optional[User] = Depends(get_current_user_optional),
    db=Depends(get_db)
):
    """Get comments for a content item (public) with pagination."""
    check_rate_limit(request, "default", db)
    content_slug = validate_slug(content_slug)

    # Cap limit to prevent excessive data retrieval
    limit = min(limit, 100)

    # Use joinedload to fetch users in a single JOIN query (fixes N+1 problem)
    comments = db.query(Comment).options(
        joinedload(Comment.user)
    ).filter(
        Comment.content_slug == content_slug
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

    if not comments:
        return []

    comment_ids = [comment.id for comment in comments]

    # Batch fetch vote scores in a single query
    score_by_comment = {comment_id: 0 for comment_id in comment_ids}
    score_rows = db.query(
        CommentVote.comment_id,
        func.coalesce(func.sum(CommentVote.vote), 0)
    ).filter(
        CommentVote.comment_id.in_(comment_ids)
    ).group_by(CommentVote.comment_id).all()
    score_by_comment.update({row[0]: int(row[1] or 0) for row in score_rows})

    # Batch fetch user votes in a single query
    user_votes = {}
    if user:
        vote_rows = db.query(
            CommentVote.comment_id,
            CommentVote.vote
        ).filter(
            CommentVote.comment_id.in_(comment_ids),
            CommentVote.user_id == user.id
        ).all()
        user_votes = {row[0]: row[1] for row in vote_rows}

    # Build response - user is already loaded via joinedload
    return [
        CommentResponse(
            id=c.id,
            user_id=c.user_id,
            user_name=c.user.name if c.user else None,
            content_slug=c.content_slug,
            body=c.body,
            created_at=c.created_at,
            parent_id=c.parent_id,
            score=score_by_comment.get(c.id, 0),
            user_vote=user_votes.get(c.id, 0)
        )
        for c in comments
    ]


@app.post("/api/comments", response_model=CommentResponse)
def create_comment(
    data: CommentCreate,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Create a new comment (authenticated)."""
    check_rate_limit(request, "comments", db)

    parent_id = data.parent_id
    if parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == parent_id).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent_comment.content_slug != data.content_slug:
            raise HTTPException(status_code=400, detail="Parent comment does not match content")
        if parent_comment.parent_id:
            parent_id = parent_comment.parent_id

    comment = Comment(
        user_id=user.id,
        content_slug=data.content_slug,
        parent_id=parent_id,
        body=data.body
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        user_name=user.name,
        content_slug=comment.content_slug,
        body=comment.body,
        created_at=comment.created_at,
        parent_id=comment.parent_id,
        score=0,
        user_vote=0
    )


@app.post("/api/comments/{comment_id}/vote", response_model=CommentVoteResponse)
def vote_comment(
    comment_id: int,
    data: CommentVoteCreate,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Vote on a comment (authenticated)."""
    check_rate_limit(request, "default", db)

    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing_vote = db.query(CommentVote).filter(
        CommentVote.comment_id == comment_id,
        CommentVote.user_id == user.id
    ).first()

    if data.vote == 0:
        if existing_vote:
            db.delete(existing_vote)
    else:
        if existing_vote:
            existing_vote.vote = data.vote
        else:
            db.add(CommentVote(
                user_id=user.id,
                comment_id=comment_id,
                vote=data.vote
            ))

    db.commit()

    score = db.query(func.coalesce(func.sum(CommentVote.vote), 0)).filter(
        CommentVote.comment_id == comment_id
    ).scalar()

    return CommentVoteResponse(
        comment_id=comment_id,
        score=int(score or 0),
        user_vote=data.vote if data.vote in (-1, 1) else 0
    )


# --- Analytics Routes ---

@app.post("/api/analytics/pageview")
def log_pageview(
    data: PageViewCreate,
    request: Request,
    user: Optional[User] = Depends(get_current_user_optional),
    db=Depends(get_db)
):
    """Log a page view."""
    check_rate_limit(request, "default", db)

    pageview = PageView(
        user_id=user.id if user else None,
        path=data.path
    )
    db.add(pageview)
    db.commit()
    return {"status": "ok"}


@app.get("/api/analytics/stats")
def get_stats(
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db)
):
    """Get analytics stats (admin only)."""
    check_rate_limit(request, "default", db)

    total_views = db.query(PageView).count()
    unique_paths = db.query(PageView.path).distinct().count()
    return {
        "total_views": total_views,
        "unique_paths": unique_paths
    }
