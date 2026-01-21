"""
FastAPI backend for ML Interview site.
Deployed as Vercel serverless functions.
"""

import os
import re
import html
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional, List

from .db import get_session, Progress, Comment, PageView, User, RateLimit, init_db
from .auth import router as auth_router, get_current_user_required, get_current_user_optional, verify_admin_secret

app = FastAPI(title="ML Interview API")

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
    endpoint: str = "default",
    db=None
) -> bool:
    """Check and update rate limit for a client."""
    if db is None:
        return True  # Skip if no db

    client_ip = get_client_ip(request)
    limit, window_seconds = RATE_LIMITS.get(endpoint, RATE_LIMITS["default"])

    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)

    # Clean old entries
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
    return True


# --- Database Dependency ---

def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()


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


class CommentResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    content_slug: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


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
        db.execute("SELECT 1")
        db.close()
        health["database_connection"] = "ok"
    except Exception as e:
        health["database_connection"] = f"error: {str(e)}"
        health["status"] = "degraded"
    
    return health


@app.get("/api/init-db")
def initialize_database(admin_secret: str):
    """Initialize database tables (protected by admin secret)."""
    # Verify admin secret
    if not ADMIN_SECRET:
        raise HTTPException(status_code=500, detail="ADMIN_SECRET not configured")
    
    if admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    
    try:
        init_db()
        return {"status": "ok", "message": "Database initialized"}
    except Exception as e:
        # Log the error for debugging
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Database initialization error: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Database initialization failed: {str(e)}")


# --- Progress Routes (Authenticated) ---

@app.get("/api/progress", response_model=List[ProgressResponse])
def get_progress(
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get all progress for the authenticated user."""
    check_rate_limit(request, "default", db)
    progress = db.query(Progress).filter(Progress.user_id == user.id).all()
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
    db=Depends(get_db)
):
    """Get comments for a content item (public)."""
    check_rate_limit(request, "default", db)
    content_slug = validate_slug(content_slug)

    comments = db.query(Comment).filter(
        Comment.content_slug == content_slug
    ).order_by(Comment.created_at.desc()).all()

    result = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append(CommentResponse(
            id=c.id,
            user_id=c.user_id,
            user_name=user.name if user else None,
            content_slug=c.content_slug,
            body=c.body,
            created_at=c.created_at
        ))
    return result


@app.post("/api/comments", response_model=CommentResponse)
def create_comment(
    data: CommentCreate,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Create a new comment (authenticated)."""
    check_rate_limit(request, "comments", db)

    comment = Comment(
        user_id=user.id,
        content_slug=data.content_slug,
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
        created_at=comment.created_at
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
