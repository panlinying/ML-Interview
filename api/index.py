"""
FastAPI backend for ML Interview site.
Deployed as Vercel serverless functions.
"""

import os
import re
import html
import json
import time
import uuid
from datetime import datetime, timedelta
from html.parser import HTMLParser
from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional, List
import httpx
from sqlalchemy import func, text
from sqlalchemy.orm import joinedload

from .db import get_db, get_session, Progress, Comment, CommentVote, PageView, User, RateLimit, ProblemProgress, ProblemDetail, ProblemTestCase, ProblemReference, init_db
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
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Secret"],
)


# --- Rate Limiting ---

RATE_LIMITS = {
    "default": (100, 60),      # 100 requests per 60 seconds
    "comments": (10, 60),      # 10 comments per 60 seconds
    "auth": (5, 60),           # 5 auth attempts per 60 seconds
    "leetcode": (20, 60),      # 20 fetches per 60 seconds
    "judge": (30, 60),         # 30 judge requests per 60 seconds
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


def validate_leetcode_slug(slug: str) -> str:
    """Validate a LeetCode problem slug."""
    normalized = slug.strip().lower()
    if not normalized or len(normalized) > 255:
        raise HTTPException(status_code=400, detail="Invalid problem slug")
    if not re.match(r'^[a-z0-9-]+$', normalized):
        raise HTTPException(status_code=400, detail="Invalid problem slug")
    return normalized


def validate_problem_id_value(problem_id: str) -> str:
    """Validate a problem ID."""
    normalized = problem_id.strip()
    if not normalized or len(normalized) > 100:
        raise HTTPException(status_code=400, detail="Invalid problem ID")
    if not re.match(r'^[\w-]+$', normalized):
        raise HTTPException(status_code=400, detail="Invalid problem ID")
    return normalized


def truncate_text(value: str, max_length: int = 20000) -> str:
    if value is None:
        return ""
    return value[:max_length]


LEETCODE_ALLOWED_TAGS = {
    "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4",
    "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "strong", "sub",
    "sup", "table", "tbody", "td", "th", "thead", "tr", "ul", "span",
}
LEETCODE_VOID_TAGS = {"br", "hr", "img"}
LEETCODE_ALLOWED_ATTRS = {
    "a": {"href", "title"},
    "img": {"src", "alt", "title"},
    "code": {"class"},
    "pre": {"class"},
}


def _is_safe_link(url: str) -> bool:
    return url.startswith(("http://", "https://", "/", "#"))


def _is_safe_image(url: str) -> bool:
    return url.startswith(("http://", "https://"))


class LeetCodeHTMLSanitizer(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:
        tag = tag.lower()
        if tag not in LEETCODE_ALLOWED_TAGS:
            return
        attr_text = self._build_attr_text(tag, attrs)
        self.parts.append(f"<{tag}{attr_text}>")

    def handle_startendtag(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> None:
        tag = tag.lower()
        if tag not in LEETCODE_ALLOWED_TAGS:
            return
        attr_text = self._build_attr_text(tag, attrs)
        self.parts.append(f"<{tag}{attr_text}>")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in LEETCODE_ALLOWED_TAGS and tag not in LEETCODE_VOID_TAGS:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        if data:
            self.parts.append(html.escape(data))

    def _build_attr_text(self, tag: str, attrs: List[tuple[str, Optional[str]]]) -> str:
        allowed_attrs = LEETCODE_ALLOWED_ATTRS.get(tag, set())
        pieces: List[str] = []
        for key, value in attrs:
            if value is None:
                continue
            key = key.lower()
            if key not in allowed_attrs:
                continue
            if key == "href" and not _is_safe_link(value):
                continue
            if key == "src" and not _is_safe_image(value):
                continue
            pieces.append(f' {key}="{html.escape(value, quote=True)}"')
        return "".join(pieces)


def sanitize_leetcode_html(raw_html: str, max_length: int = 200000) -> str:
    """Strip unsafe tags/attrs and normalize HTML from LeetCode."""
    if not raw_html:
        return ""
    trimmed = raw_html[:max_length]
    parser = LeetCodeHTMLSanitizer()
    parser.feed(trimmed)
    parser.close()
    return "".join(parser.parts)


def normalize_output(value: str) -> str:
    if value is None:
        return ""
    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in normalized.split("\n")]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def compare_outputs(actual: str, expected: str) -> bool:
    actual_norm = normalize_output(actual)
    expected_norm = normalize_output(expected)
    if actual_norm == expected_norm:
        return True
    try:
        actual_json = json.loads(actual_norm)
        expected_json = json.loads(expected_norm)
        return actual_json == expected_json
    except Exception:
        return False


def parse_time_ms(raw_time) -> int:
    if raw_time is None:
        return 0
    try:
        return int(round(float(raw_time) * 1000))
    except (TypeError, ValueError):
        return 0


PYTHON_WRAPPER_PRELUDE = """
import json
import sys
import ast
import inspect
import typing

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
""".strip()

PYTHON_WRAPPER_POSTLUDE = """
def _lc_parse_input(text):
    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        try:
            return ast.literal_eval(text)
        except Exception:
            return text


def _lc_is_list_of_str(values):
    return isinstance(values, list) and all(isinstance(v, str) for v in values)


def _lc_is_design_input(data):
    if isinstance(data, dict):
        return "operations" in data or "ops" in data
    return (
        isinstance(data, (list, tuple))
        and len(data) == 2
        and _lc_is_list_of_str(data[0])
        and isinstance(data[1], list)
    )


def _lc_get_class(name):
    obj = globals().get(name)
    if isinstance(obj, type):
        return obj
    return None


def _lc_get_solution_callable(method_name=None):
    if "Solution" in globals():
        inst = globals()["Solution"]()
        if method_name and hasattr(inst, method_name):
            return getattr(inst, method_name)
        methods = [m for m in dir(inst) if callable(getattr(inst, m)) and not m.startswith("_")]
        if len(methods) == 1:
            return getattr(inst, methods[0])

    funcs = []
    for name, val in globals().items():
        if callable(val) and not name.startswith("_") and not isinstance(val, type):
            if name in {"json", "sys", "ast", "inspect", "typing"}:
                continue
            funcs.append(name)

    if method_name and method_name in globals():
        val = globals()[method_name]
        if callable(val):
            return val

    if len(funcs) == 1:
        return globals()[funcs[0]]

    raise RuntimeError("Could not resolve function to run")


def _lc_annotation_matches(ann, name):
    if ann is None:
        return False
    if ann is globals().get(name):
        return True
    if ann == name:
        return True
    if isinstance(ann, str):
        return ann == name or ann.endswith(f".{name}")
    origin = typing.get_origin(ann)
    if origin is typing.Union:
        return any(_lc_annotation_matches(a, name) for a in typing.get_args(ann) if a is not type(None))
    return False


def _lc_list_to_listnode(values):
    if values is None:
        return None
    if isinstance(values, ListNode):
        return values
    dummy = ListNode(0)
    current = dummy
    for value in values:
        current.next = ListNode(value)
        current = current.next
    return dummy.next


def _lc_listnode_to_list(node):
    values = []
    current = node
    while current is not None:
        values.append(current.val)
        current = current.next
    return values


def _lc_list_to_treenode(values):
    if values is None:
        return None
    if isinstance(values, TreeNode):
        return values
    if not values:
        return None
    nodes = [TreeNode(values[0]) if values[0] is not None else None]
    idx = 1
    for node in nodes:
        if node is None:
            continue
        if idx < len(values):
            val = values[idx]
            node.left = TreeNode(val) if val is not None else None
            nodes.append(node.left)
            idx += 1
        if idx < len(values):
            val = values[idx]
            node.right = TreeNode(val) if val is not None else None
            nodes.append(node.right)
            idx += 1
    return nodes[0]


def _lc_treenode_to_list(root):
    if root is None:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            result.append(None)
            continue
        result.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while result and result[-1] is None:
        result.pop()
    return result


def _lc_convert_arg(value, ann):
    if _lc_annotation_matches(ann, "ListNode"):
        return _lc_list_to_listnode(value)
    if _lc_annotation_matches(ann, "TreeNode"):
        return _lc_list_to_treenode(value)
    return value


def _lc_prepare_args(func, args):
    try:
        sig = inspect.signature(func)
    except (TypeError, ValueError):
        return args
    params = [p for p in sig.parameters.values() if p.name != "self"]
    converted = []
    for idx, arg in enumerate(args):
        ann = params[idx].annotation if idx < len(params) else None
        converted.append(_lc_convert_arg(arg, ann))
    return converted


def _lc_serialize(value):
    if isinstance(value, ListNode):
        return _lc_listnode_to_list(value)
    if isinstance(value, TreeNode):
        return _lc_treenode_to_list(value)
    if isinstance(value, list):
        return [_lc_serialize(v) for v in value]
    if isinstance(value, tuple):
        return [_lc_serialize(v) for v in value]
    if isinstance(value, dict):
        return {k: _lc_serialize(v) for k, v in value.items()}
    return value


def _lc_normalize_args(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return [value]


def _lc_run_design(operations, arguments):
    class_name = operations[0]
    cls = _lc_get_class(class_name)
    if cls is None:
        raise RuntimeError(f"Class {class_name} not found")
    init_args = _lc_normalize_args(arguments[0] if arguments else [])
    obj = cls(*_lc_prepare_args(cls.__init__, init_args))
    outputs = [None]
    for op, arg in zip(operations[1:], arguments[1:]):
        method = getattr(obj, op)
        call_args = _lc_prepare_args(method, _lc_normalize_args(arg))
        outputs.append(method(*call_args))
    print(json.dumps(_lc_serialize(outputs), separators=(",", ":"), ensure_ascii=False))


def _lc_run_single(method_name, args):
    func = _lc_get_solution_callable(method_name)
    call_args = _lc_prepare_args(func, args)
    result = func(*call_args)
    print(json.dumps(_lc_serialize(result), separators=(",", ":"), ensure_ascii=False))


def _lc_main():
    data = sys.stdin.read()
    parsed = _lc_parse_input(data)

    if _lc_is_design_input(parsed):
        if isinstance(parsed, dict):
            operations = parsed.get("operations") or parsed.get("ops") or []
            arguments = parsed.get("arguments") or parsed.get("args") or []
        else:
            operations, arguments = parsed
        _lc_run_design(operations, arguments)
        return

    method_name = None
    args = []
    if isinstance(parsed, dict) and "args" in parsed:
        args = parsed.get("args") or []
        method_name = parsed.get("method")
    elif isinstance(parsed, dict) and parsed is not None:
        args = [parsed]
    elif isinstance(parsed, (list, tuple)):
        args = list(parsed)
    elif parsed is None:
        args = []
    else:
        args = [parsed]

    _lc_run_single(method_name, args)


if __name__ == "__main__":
    _lc_main()
""".strip()


def build_python_wrapper(user_code: str) -> str:
    return "\n".join([PYTHON_WRAPPER_PRELUDE, user_code, PYTHON_WRAPPER_POSTLUDE])


def piston_execute(code: str, stdin: str, language: str) -> dict:
    payload = {
        "language": language,
        "files": [{"content": code}],
        "stdin": stdin,
    }
    if PISTON_VERSION:
        payload["version"] = PISTON_VERSION

    try:
        response = httpx.post(
            f"{PISTON_API_URL}/execute",
            json=payload,
            timeout=PISTON_TIMEOUT_SECONDS,
        )
    except httpx.HTTPError:
        logger.warning("Piston execution failed", exc_info=True)
        raise HTTPException(status_code=502, detail="Runner unavailable.")

    if response.status_code != 200:
        logger.warning("Piston returned non-200", extra={"status_code": response.status_code})
        raise HTTPException(status_code=502, detail="Runner error.")

    try:
        return response.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Runner response invalid.")


def run_python_with_wrapper(code: str, stdin: str) -> dict:
    wrapped = build_python_wrapper(code)
    return piston_execute(wrapped, stdin, PISTON_LANGUAGE)


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

    # Update streak on learning activity
    update_user_streak(user, db)

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

    # Update streak on comment activity
    update_user_streak(user, db)

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


# --- Streak Helper ---

def update_user_streak(user: User, db) -> None:
    """
    Update user's streak based on activity.
    Call this when user performs any learning activity.
    """
    now = datetime.utcnow()
    today = now.date()

    if user.last_activity_date:
        last_date = user.last_activity_date.date()
        days_diff = (today - last_date).days

        if days_diff == 0:
            # Same day, no streak update needed
            return
        elif days_diff == 1:
            # Consecutive day, increment streak
            user.current_streak = (user.current_streak or 0) + 1
        else:
            # Streak broken, reset to 1
            user.current_streak = 1
    else:
        # First activity
        user.current_streak = 1

    # Update longest streak if current exceeds it
    if (user.current_streak or 0) > (user.longest_streak or 0):
        user.longest_streak = user.current_streak

    user.last_activity_date = now
    db.commit()


# --- Dashboard Routes ---

class DashboardResponse(BaseModel):
    current_streak: int
    longest_streak: int
    completion_percentage: float
    total_completed: int
    total_content: int
    total_comments: int
    recent_activity: List[dict]
    streak_active_today: bool


# Total content items in curriculum (approximate)
TOTAL_CONTENT_ITEMS = 98


@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get dashboard stats for authenticated user."""
    check_rate_limit(request, "default", db)

    # Get completion stats
    completed_count = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.completed == True
    ).count()

    # Get comment count
    comment_count = db.query(Comment).filter(
        Comment.user_id == user.id
    ).count()

    # Get recent activity (last 10 progress updates)
    recent_progress = db.query(Progress).filter(
        Progress.user_id == user.id
    ).order_by(Progress.updated_at.desc()).limit(10).all()

    recent_activity = [
        {
            "type": "progress",
            "content_slug": p.content_slug,
            "completed": p.completed,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        }
        for p in recent_progress
    ]

    # Check if streak is active today
    today = datetime.utcnow().date()
    streak_active_today = False
    if user.last_activity_date:
        streak_active_today = user.last_activity_date.date() == today

    completion_pct = (completed_count / TOTAL_CONTENT_ITEMS * 100) if TOTAL_CONTENT_ITEMS > 0 else 0

    return DashboardResponse(
        current_streak=user.current_streak or 0,
        longest_streak=user.longest_streak or 0,
        completion_percentage=round(completion_pct, 1),
        total_completed=completed_count,
        total_content=TOTAL_CONTENT_ITEMS,
        total_comments=comment_count,
        recent_activity=recent_activity,
        streak_active_today=streak_active_today
    )


@app.post("/api/dashboard/activity")
def record_activity(
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Record user activity and update streak."""
    check_rate_limit(request, "default", db)
    update_user_streak(user, db)
    return {
        "current_streak": user.current_streak or 0,
        "longest_streak": user.longest_streak or 0,
        "streak_active_today": True
    }


# --- Spaced Repetition ---

# Spaced repetition intervals (in days): 1, 3, 7, 14, 30, 60
REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60]


def calculate_next_review(review_count: int) -> datetime:
    """Calculate next review date based on review count."""
    interval_index = min(review_count, len(REVIEW_INTERVALS) - 1)
    days = REVIEW_INTERVALS[interval_index]
    return datetime.utcnow() + timedelta(days=days)


class ReviewItem(BaseModel):
    content_slug: str
    completed: bool
    review_count: int
    last_reviewed_at: Optional[datetime]
    next_review_at: Optional[datetime]
    days_overdue: int

    class Config:
        from_attributes = True


@app.get("/api/reviews/due", response_model=List[ReviewItem])
def get_due_reviews(
    request: Request,
    limit: int = 10,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get content items due for review (spaced repetition)."""
    check_rate_limit(request, "default", db)

    now = datetime.utcnow()

    # Get completed items that are due for review
    due_items = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.completed == True,
        Progress.next_review_at <= now
    ).order_by(Progress.next_review_at.asc()).limit(limit).all()

    # Also get completed items that have never been reviewed
    never_reviewed = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.completed == True,
        Progress.next_review_at == None
    ).order_by(Progress.updated_at.asc()).limit(limit).all()

    all_due = due_items + never_reviewed

    return [
        ReviewItem(
            content_slug=p.content_slug,
            completed=p.completed,
            review_count=p.review_count or 0,
            last_reviewed_at=p.last_reviewed_at,
            next_review_at=p.next_review_at,
            days_overdue=(now - p.next_review_at).days if p.next_review_at else 0
        )
        for p in all_due[:limit]
    ]


class ReviewComplete(BaseModel):
    content_slug: str

    @field_validator('content_slug')
    @classmethod
    def validate_content_slug(cls, v):
        return validate_slug(v)


@app.post("/api/reviews/complete")
def complete_review(
    data: ReviewComplete,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Mark a content item as reviewed and schedule next review."""
    check_rate_limit(request, "default", db)

    progress = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.content_slug == data.content_slug
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    # Update review tracking
    progress.review_count = (progress.review_count or 0) + 1
    progress.last_reviewed_at = datetime.utcnow()
    progress.next_review_at = calculate_next_review(progress.review_count)

    db.commit()

    # Update streak
    update_user_streak(user, db)

    return {
        "content_slug": data.content_slug,
        "review_count": progress.review_count,
        "next_review_at": progress.next_review_at.isoformat()
    }


# --- Problem Details ---

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
LEETCODE_QUESTION_QUERY = """
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title
    content
    difficulty
  }
}
"""

PISTON_API_URL = os.environ.get("PISTON_API_URL", "https://emkc.org/api/v2/piston").rstrip("/")
PISTON_LANGUAGE = os.environ.get("PISTON_PYTHON_LANGUAGE", "python")
PISTON_VERSION = os.environ.get("PISTON_PYTHON_VERSION", "3.10.0")
PISTON_TIMEOUT_SECONDS = float(os.environ.get("PISTON_TIMEOUT_SECONDS", "10"))

DEFAULT_TIME_LIMIT_MS = int(os.environ.get("JUDGE_TIME_LIMIT_MS", "2000"))
DEFAULT_SLOW_LIMIT_MS = int(os.environ.get("JUDGE_SLOW_LIMIT_MS", "4000"))


def fetch_leetcode_problem(slug: str) -> dict:
    payload = {"query": LEETCODE_QUESTION_QUERY, "variables": {"titleSlug": slug}}
    headers = {
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/problems/{slug}/",
        "User-Agent": "ml-interview/1.0",
    }
    try:
        response = httpx.post(
            LEETCODE_GRAPHQL_URL,
            json=payload,
            headers=headers,
            timeout=10.0,
        )
    except httpx.HTTPError:
        logger.warning("LeetCode fetch failed", extra={"slug": slug}, exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch problem description.")

    if response.status_code != 200:
        logger.warning(
            "LeetCode fetch returned non-200",
            extra={"slug": slug, "status_code": response.status_code},
        )
        raise HTTPException(status_code=502, detail="Failed to fetch problem description.")

    try:
        payload = response.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Failed to parse problem description.")

    question = payload.get("data", {}).get("question")
    if not question or not question.get("content"):
        raise HTTPException(status_code=404, detail="Problem description not found.")

    difficulty = question.get("difficulty")
    if difficulty:
        difficulty = difficulty.lower()

    description_html = sanitize_leetcode_html(question.get("content", ""))
    if not description_html:
        raise HTTPException(status_code=502, detail="Problem description could not be parsed.")

    return {
        "title": question.get("title") or slug,
        "difficulty": difficulty,
        "description_html": description_html,
    }


class ProblemDetailResponse(BaseModel):
    slug: str
    title: str
    description_html: str
    difficulty: Optional[str]
    source: str
    fetched_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


@app.get("/api/problem-details/{slug}", response_model=ProblemDetailResponse)
def get_problem_detail(
    slug: str,
    request: Request,
    refresh: bool = False,
    db=Depends(get_db),
):
    """Fetch a LeetCode problem description and cache it."""
    check_rate_limit(request, "leetcode", db)

    normalized = validate_leetcode_slug(slug)
    existing = db.query(ProblemDetail).filter(ProblemDetail.slug == normalized).first()

    if existing and existing.description_html and not refresh:
        return ProblemDetailResponse.model_validate(existing)

    detail = fetch_leetcode_problem(normalized)
    now = datetime.utcnow()

    if existing:
        existing.title = detail["title"]
        existing.description_html = detail["description_html"]
        existing.difficulty = detail["difficulty"]
        existing.source = "leetcode"
        existing.fetched_at = now
        db.commit()
        db.refresh(existing)
        return ProblemDetailResponse.model_validate(existing)

    record = ProblemDetail(
        slug=normalized,
        title=detail["title"],
        description_html=detail["description_html"],
        difficulty=detail["difficulty"],
        source="leetcode",
        fetched_at=now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ProblemDetailResponse.model_validate(record)


# --- Problem Test Cases & Judge ---

class ProblemTestCaseCreate(BaseModel):
    input_text: str
    expected_output: str
    is_hidden: bool = False
    time_limit_ms: Optional[int] = None
    slow_limit_ms: Optional[int] = None

    @field_validator('input_text')
    @classmethod
    def validate_input(cls, v):
        if v is None:
            raise ValueError("Input is required")
        return truncate_text(v, max_length=20000)

    @field_validator('expected_output')
    @classmethod
    def validate_expected(cls, v):
        if v is None:
            raise ValueError("Expected output is required")
        return truncate_text(v, max_length=20000)

    @field_validator('time_limit_ms')
    @classmethod
    def validate_time_limit(cls, v):
        if v is not None and v <= 0:
            raise ValueError("time_limit_ms must be positive")
        return v

    @field_validator('slow_limit_ms')
    @classmethod
    def validate_slow_limit(cls, v):
        if v is not None and v <= 0:
            raise ValueError("slow_limit_ms must be positive")
        return v


class ProblemTestCaseUpdate(BaseModel):
    input_text: Optional[str] = None
    expected_output: Optional[str] = None
    is_hidden: Optional[bool] = None
    time_limit_ms: Optional[int] = None
    slow_limit_ms: Optional[int] = None

    @field_validator('input_text')
    @classmethod
    def validate_input(cls, v):
        if v is None:
            return v
        return truncate_text(v, max_length=20000)

    @field_validator('expected_output')
    @classmethod
    def validate_expected(cls, v):
        if v is None:
            return v
        return truncate_text(v, max_length=20000)

    @field_validator('time_limit_ms')
    @classmethod
    def validate_time_limit(cls, v):
        if v is not None and v <= 0:
            raise ValueError("time_limit_ms must be positive")
        return v

    @field_validator('slow_limit_ms')
    @classmethod
    def validate_slow_limit(cls, v):
        if v is not None and v <= 0:
            raise ValueError("slow_limit_ms must be positive")
        return v


class ProblemTestCaseBulkCreate(BaseModel):
    cases: List[ProblemTestCaseCreate]

    @field_validator('cases')
    @classmethod
    def validate_cases(cls, v):
        if not v:
            raise ValueError("At least one test case is required")
        return v


class ProblemTestCaseResponse(BaseModel):
    id: int
    problem_id: str
    input_text: str
    expected_output: str
    is_hidden: bool
    time_limit_ms: int
    slow_limit_ms: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProblemSubmissionRequest(BaseModel):
    code: str
    language: str = "python"

    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if not v or not v.strip():
            raise ValueError("Code is required")
        return truncate_text(v, max_length=30000)

    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        if v != "python":
            raise ValueError("Only python is supported")
        return v


class JudgeCaseResult(BaseModel):
    id: int
    status: str
    time_ms: int
    reason: Optional[str] = None
    input_text: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    stderr: Optional[str] = None
    is_hidden: bool


class JudgeSummary(BaseModel):
    total: int
    passed: int
    slow: int
    failed: int


class ProblemJudgeResponse(BaseModel):
    status: str
    summary: JudgeSummary
    results: List[JudgeCaseResult]


@app.post("/api/problems/{problem_id}/tests", response_model=List[ProblemTestCaseResponse])
def create_problem_tests(
    problem_id: str,
    data: ProblemTestCaseBulkCreate,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """Create test cases for a problem (admin only)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)

    created: List[ProblemTestCase] = []
    for case in data.cases:
        time_limit = case.time_limit_ms or DEFAULT_TIME_LIMIT_MS
        slow_limit = case.slow_limit_ms or max(time_limit, DEFAULT_SLOW_LIMIT_MS)
        if slow_limit < time_limit:
            slow_limit = time_limit
        record = ProblemTestCase(
            problem_id=normalized,
            input_text=case.input_text,
            expected_output=case.expected_output,
            is_hidden=case.is_hidden,
            time_limit_ms=time_limit,
            slow_limit_ms=slow_limit,
        )
        db.add(record)
        created.append(record)

    db.commit()
    for record in created:
        db.refresh(record)

    return [ProblemTestCaseResponse.model_validate(record) for record in created]


@app.get("/api/problems/{problem_id}/tests", response_model=List[ProblemTestCaseResponse])
def list_problem_tests(
    problem_id: str,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """List test cases for a problem (admin only)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)
    tests = db.query(ProblemTestCase).filter(ProblemTestCase.problem_id == normalized).order_by(ProblemTestCase.id.asc()).all()
    return [ProblemTestCaseResponse.model_validate(test_case) for test_case in tests]


@app.patch("/api/problems/{problem_id}/tests/{test_id}", response_model=ProblemTestCaseResponse)
def update_problem_test(
    problem_id: str,
    test_id: int,
    data: ProblemTestCaseUpdate,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """Update a test case (admin only)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)
    test_case = db.query(ProblemTestCase).filter(
        ProblemTestCase.id == test_id,
        ProblemTestCase.problem_id == normalized,
    ).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    if data.input_text is not None:
        test_case.input_text = data.input_text
    if data.expected_output is not None:
        test_case.expected_output = data.expected_output
    if data.is_hidden is not None:
        test_case.is_hidden = data.is_hidden

    time_limit = test_case.time_limit_ms
    slow_limit = test_case.slow_limit_ms
    if data.time_limit_ms is not None:
        time_limit = data.time_limit_ms
    if data.slow_limit_ms is not None:
        slow_limit = data.slow_limit_ms

    if slow_limit < time_limit:
        slow_limit = time_limit

    test_case.time_limit_ms = time_limit
    test_case.slow_limit_ms = slow_limit

    db.commit()
    db.refresh(test_case)
    return ProblemTestCaseResponse.model_validate(test_case)


@app.delete("/api/problems/{problem_id}/tests/{test_id}")
def delete_problem_test(
    problem_id: str,
    test_id: int,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """Delete a test case (admin only)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)
    test_case = db.query(ProblemTestCase).filter(
        ProblemTestCase.id == test_id,
        ProblemTestCase.problem_id == normalized,
    ).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    db.delete(test_case)
    db.commit()
    return {"status": "ok", "deleted": test_id}


def evaluate_tests(
    test_cases: List[ProblemTestCase],
    code: str,
    language: str,
    include_public_details: bool,
) -> ProblemJudgeResponse:
    results: List[JudgeCaseResult] = []

    for test_case in test_cases:
        time_limit = test_case.time_limit_ms or DEFAULT_TIME_LIMIT_MS
        slow_limit = test_case.slow_limit_ms or max(time_limit, DEFAULT_SLOW_LIMIT_MS)
        if slow_limit < time_limit:
            slow_limit = time_limit

        piston_response = run_python_with_wrapper(code, test_case.input_text)
        run_result = piston_response.get("run") or {}
        compile_result = piston_response.get("compile") or {}

        stderr = compile_result.get("stderr") or compile_result.get("output") or ""
        if compile_result and compile_result.get("code", 0) != 0:
            status = "fail"
            reason = "compile_error"
            time_ms = parse_time_ms(compile_result.get("time"))
            actual_output = ""
        else:
            stderr = run_result.get("stderr") or ""
            stdout = run_result.get("stdout") or ""
            exit_code = run_result.get("code", 0)
            signal = run_result.get("signal")
            time_ms = parse_time_ms(run_result.get("time"))
            actual_output = normalize_output(stdout)
            expected_output = normalize_output(test_case.expected_output)

            if signal or exit_code != 0:
                status = "fail"
                reason = "runtime_error"
            elif not compare_outputs(actual_output, expected_output):
                status = "fail"
                reason = "wrong_answer"
            elif time_ms > slow_limit:
                status = "fail"
                reason = "time_limit_exceeded"
            elif time_ms > time_limit:
                status = "slow"
                reason = "time_warning"
            else:
                status = "pass"
                reason = None

        show_details = include_public_details and not test_case.is_hidden
        results.append(
            JudgeCaseResult(
                id=test_case.id,
                status=status,
                time_ms=time_ms,
                reason=reason,
                input_text=test_case.input_text if show_details else None,
                expected_output=test_case.expected_output if show_details else None,
                actual_output=actual_output if show_details else None,
                stderr=stderr if show_details and stderr else None,
                is_hidden=test_case.is_hidden,
            )
        )

    total = len(results)
    passed = sum(1 for r in results if r.status == "pass")
    slow = sum(1 for r in results if r.status == "slow")
    failed = total - passed - slow

    if failed > 0:
        status = "fail"
    elif slow > 0:
        status = "pass_slow"
    else:
        status = "pass"

    summary = JudgeSummary(total=total, passed=passed, slow=slow, failed=failed)
    return ProblemJudgeResponse(status=status, summary=summary, results=results)


@app.post("/api/problems/{problem_id}/run", response_model=ProblemJudgeResponse)
def run_problem(
    problem_id: str,
    data: ProblemSubmissionRequest,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db),
):
    """Run public test cases for a problem (authenticated)."""
    check_rate_limit(request, "judge", db)
    normalized = validate_problem_id_value(problem_id)
    tests = db.query(ProblemTestCase).filter(
        ProblemTestCase.problem_id == normalized,
        ProblemTestCase.is_hidden == False,
    ).order_by(ProblemTestCase.id.asc()).all()

    if not tests:
        raise HTTPException(status_code=404, detail="No public test cases configured.")

    response = evaluate_tests(tests, data.code, PISTON_LANGUAGE, include_public_details=True)
    return response


@app.post("/api/problems/{problem_id}/submit", response_model=ProblemJudgeResponse)
def submit_problem(
    problem_id: str,
    data: ProblemSubmissionRequest,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db),
):
    """Run all test cases for a problem (authenticated)."""
    check_rate_limit(request, "judge", db)
    normalized = validate_problem_id_value(problem_id)
    tests = db.query(ProblemTestCase).filter(
        ProblemTestCase.problem_id == normalized,
    ).order_by(ProblemTestCase.id.asc()).all()

    if not tests:
        raise HTTPException(status_code=404, detail="No test cases configured.")

    response = evaluate_tests(tests, data.code, PISTON_LANGUAGE, include_public_details=True)
    update_user_streak(user, db)
    return response


# --- Problem Reference Solutions ---

class ProblemReferenceUpsert(BaseModel):
    solution_code: str
    optimal_time_complexity: Optional[str] = None
    optimal_space_complexity: Optional[str] = None
    language: str = "python"

    @field_validator('solution_code')
    @classmethod
    def validate_solution(cls, v):
        if not v or not v.strip():
            raise ValueError("Solution code is required")
        return truncate_text(v, max_length=50000)

    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        if v != "python":
            raise ValueError("Only python is supported")
        return v

    @field_validator('optimal_time_complexity')
    @classmethod
    def validate_time_complexity(cls, v):
        if v:
            return truncate_text(v, max_length=50)
        return v

    @field_validator('optimal_space_complexity')
    @classmethod
    def validate_space_complexity(cls, v):
        if v:
            return truncate_text(v, max_length=50)
        return v


class ProblemReferenceResponse(BaseModel):
    id: int
    problem_id: str
    language: str
    solution_code: str
    optimal_time_complexity: Optional[str]
    optimal_space_complexity: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProblemReferenceRunRequest(BaseModel):
    input_text: str

    @field_validator('input_text')
    @classmethod
    def validate_input(cls, v):
        if v is None:
            raise ValueError("Input is required")
        return truncate_text(v, max_length=20000)


class ProblemReferenceRunResponse(BaseModel):
    output: str
    time_ms: int
    stderr: Optional[str] = None


class ProblemComplexityResponse(BaseModel):
    problem_id: str
    optimal_time_complexity: Optional[str]
    optimal_space_complexity: Optional[str]


@app.get("/api/problems/{problem_id}/reference", response_model=ProblemReferenceResponse)
def get_problem_reference(
    problem_id: str,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """Get reference solution (admin only)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)
    record = db.query(ProblemReference).filter(ProblemReference.problem_id == normalized).first()
    if not record:
        raise HTTPException(status_code=404, detail="Reference solution not found")
    return ProblemReferenceResponse.model_validate(record)


@app.put("/api/problems/{problem_id}/reference", response_model=ProblemReferenceResponse)
def upsert_problem_reference(
    problem_id: str,
    data: ProblemReferenceUpsert,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """Create or update a reference solution (admin only)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)
    record = db.query(ProblemReference).filter(ProblemReference.problem_id == normalized).first()

    if record:
        record.solution_code = data.solution_code
        record.language = data.language
        record.optimal_time_complexity = data.optimal_time_complexity
        record.optimal_space_complexity = data.optimal_space_complexity
        db.commit()
        db.refresh(record)
        return ProblemReferenceResponse.model_validate(record)

    record = ProblemReference(
        problem_id=normalized,
        solution_code=data.solution_code,
        language=data.language,
        optimal_time_complexity=data.optimal_time_complexity,
        optimal_space_complexity=data.optimal_space_complexity,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ProblemReferenceResponse.model_validate(record)


@app.post("/api/problems/{problem_id}/reference/run", response_model=ProblemReferenceRunResponse)
def run_problem_reference(
    problem_id: str,
    data: ProblemReferenceRunRequest,
    request: Request,
    _: bool = Depends(verify_admin_secret),
    db=Depends(get_db),
):
    """Run reference solution against provided input (admin only)."""
    check_rate_limit(request, "judge", db)
    normalized = validate_problem_id_value(problem_id)
    record = db.query(ProblemReference).filter(ProblemReference.problem_id == normalized).first()
    if not record:
        raise HTTPException(status_code=404, detail="Reference solution not found")

    piston_response = run_python_with_wrapper(record.solution_code, data.input_text)
    run_result = piston_response.get("run") or {}
    compile_result = piston_response.get("compile") or {}

    if compile_result and compile_result.get("code", 0) != 0:
        stderr = compile_result.get("stderr") or compile_result.get("output") or ""
        raise HTTPException(status_code=400, detail=f"Reference compile error: {stderr}".strip())

    stderr = run_result.get("stderr") or ""
    exit_code = run_result.get("code", 0)
    signal = run_result.get("signal")
    if signal or exit_code != 0:
        detail = stderr or "Reference runtime error"
        raise HTTPException(status_code=400, detail=detail)

    output = normalize_output(run_result.get("stdout") or "")
    time_ms = parse_time_ms(run_result.get("time"))
    return ProblemReferenceRunResponse(output=output, time_ms=time_ms, stderr=stderr or None)


@app.get("/api/problems/{problem_id}/complexity", response_model=ProblemComplexityResponse)
def get_problem_complexity(
    problem_id: str,
    request: Request,
    db=Depends(get_db),
):
    """Get optimal complexity for a problem."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)
    record = db.query(ProblemReference).filter(ProblemReference.problem_id == normalized).first()
    if not record:
        raise HTTPException(status_code=404, detail="Problem complexity not found")
    return ProblemComplexityResponse(
        problem_id=record.problem_id,
        optimal_time_complexity=record.optimal_time_complexity,
        optimal_space_complexity=record.optimal_space_complexity,
    )


class ProblemSolutionResponse(BaseModel):
    problem_id: str
    solution_code: str
    optimal_time_complexity: Optional[str]
    optimal_space_complexity: Optional[str]
    user_solved: bool


@app.get("/api/problems/{problem_id}/solution", response_model=ProblemSolutionResponse)
def get_problem_solution(
    problem_id: str,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db),
):
    """
    Get reference solution for a problem.

    Users can view solutions after they've attempted the problem (any status except not_started).
    This encourages users to try first before viewing the solution.
    """
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)

    # Check if user has attempted this problem
    progress = db.query(ProblemProgress).filter(
        ProblemProgress.user_id == user.id,
        ProblemProgress.problem_id == normalized,
    ).first()

    user_solved = progress is not None and progress.status == "solved"
    user_attempted = progress is not None and progress.status != "not_started"

    if not user_attempted:
        raise HTTPException(
            status_code=403,
            detail="You must attempt the problem before viewing the solution. Submit at least one attempt first."
        )

    # Get reference solution
    record = db.query(ProblemReference).filter(ProblemReference.problem_id == normalized).first()
    if not record:
        raise HTTPException(status_code=404, detail="Solution not found for this problem")

    return ProblemSolutionResponse(
        problem_id=record.problem_id,
        solution_code=record.solution_code,
        optimal_time_complexity=record.optimal_time_complexity,
        optimal_space_complexity=record.optimal_space_complexity,
        user_solved=user_solved,
    )


class ProblemStarterCodeResponse(BaseModel):
    problem_id: str
    starter_code: Optional[str]
    optimal_time_complexity: Optional[str]
    optimal_space_complexity: Optional[str]


@app.get("/api/problems/{problem_id}/starter", response_model=ProblemStarterCodeResponse)
def get_problem_starter_code(
    problem_id: str,
    request: Request,
    db=Depends(get_db),
):
    """Get starter code template for a problem (public endpoint)."""
    check_rate_limit(request, "default", db)
    normalized = validate_problem_id_value(problem_id)

    record = db.query(ProblemReference).filter(ProblemReference.problem_id == normalized).first()
    if not record:
        raise HTTPException(status_code=404, detail="Problem not found")

    return ProblemStarterCodeResponse(
        problem_id=record.problem_id,
        starter_code=record.starter_code,
        optimal_time_complexity=record.optimal_time_complexity,
        optimal_space_complexity=record.optimal_space_complexity,
    )


# --- Problem Tracker ---

class ProblemCreate(BaseModel):
    problem_id: str
    problem_name: str
    difficulty: Optional[str] = None
    pattern: Optional[str] = None
    status: str = "not_started"
    notes: Optional[str] = None
    time_spent_minutes: int = 0

    @field_validator('problem_id')
    @classmethod
    def validate_problem_id(cls, v):
        if not v or len(v) > 100:
            raise ValueError("Invalid problem ID")
        if not re.match(r'^[\w-]+$', v):
            raise ValueError("Problem ID must be alphanumeric with dashes")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        valid_statuses = ["not_started", "attempted", "solved", "need_review"]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {valid_statuses}")
        return v

    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, v):
        if v and v not in ["easy", "medium", "hard"]:
            raise ValueError("Difficulty must be easy, medium, or hard")
        return v

    @field_validator('notes')
    @classmethod
    def sanitize_notes(cls, v):
        if v:
            return sanitize_string(v, max_length=5000)
        return v


class ProblemUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    time_spent_minutes: Optional[int] = None
    pattern: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v:
            valid_statuses = ["not_started", "attempted", "solved", "need_review"]
            if v not in valid_statuses:
                raise ValueError(f"Status must be one of: {valid_statuses}")
        return v

    @field_validator('notes')
    @classmethod
    def sanitize_notes(cls, v):
        if v:
            return sanitize_string(v, max_length=5000)
        return v


class ProblemResponse(BaseModel):
    id: int
    problem_id: str
    problem_name: str
    difficulty: Optional[str]
    pattern: Optional[str]
    status: str
    notes: Optional[str]
    time_spent_minutes: int
    attempts: int
    last_attempted_at: Optional[datetime]
    solved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ProblemStatsResponse(BaseModel):
    total: int
    solved: int
    attempted: int
    need_review: int
    by_difficulty: dict
    by_pattern: dict
    total_time_minutes: int


@app.get("/api/problems", response_model=List[ProblemResponse])
def get_problems(
    request: Request,
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    pattern: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get all tracked problems for the user."""
    check_rate_limit(request, "default", db)

    query = db.query(ProblemProgress).filter(ProblemProgress.user_id == user.id)

    if status:
        query = query.filter(ProblemProgress.status == status)
    if difficulty:
        query = query.filter(ProblemProgress.difficulty == difficulty)
    if pattern:
        query = query.filter(ProblemProgress.pattern == pattern)

    problems = query.order_by(ProblemProgress.updated_at.desc()).offset(skip).limit(min(limit, 500)).all()

    return [ProblemResponse.model_validate(p) for p in problems]


@app.get("/api/problems/stats", response_model=ProblemStatsResponse)
def get_problem_stats(
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Get problem tracking statistics."""
    check_rate_limit(request, "default", db)

    problems = db.query(ProblemProgress).filter(ProblemProgress.user_id == user.id).all()

    stats = {
        "total": len(problems),
        "solved": sum(1 for p in problems if p.status == "solved"),
        "attempted": sum(1 for p in problems if p.status == "attempted"),
        "need_review": sum(1 for p in problems if p.status == "need_review"),
        "by_difficulty": {},
        "by_pattern": {},
        "total_time_minutes": sum(p.time_spent_minutes or 0 for p in problems)
    }

    # Count by difficulty
    for diff in ["easy", "medium", "hard"]:
        stats["by_difficulty"][diff] = {
            "total": sum(1 for p in problems if p.difficulty == diff),
            "solved": sum(1 for p in problems if p.difficulty == diff and p.status == "solved")
        }

    # Count by pattern
    patterns = set(p.pattern for p in problems if p.pattern)
    for pattern in patterns:
        stats["by_pattern"][pattern] = {
            "total": sum(1 for p in problems if p.pattern == pattern),
            "solved": sum(1 for p in problems if p.pattern == pattern and p.status == "solved")
        }

    return stats


@app.post("/api/problems", response_model=ProblemResponse)
def create_problem(
    data: ProblemCreate,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Add a new problem to track."""
    check_rate_limit(request, "default", db)

    # Check if problem already exists
    existing = db.query(ProblemProgress).filter(
        ProblemProgress.user_id == user.id,
        ProblemProgress.problem_id == data.problem_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Problem already tracked")

    now = datetime.utcnow()
    problem = ProblemProgress(
        user_id=user.id,
        problem_id=data.problem_id,
        problem_name=data.problem_name,
        difficulty=data.difficulty,
        pattern=data.pattern,
        status=data.status,
        notes=data.notes,
        time_spent_minutes=data.time_spent_minutes,
        attempts=1 if data.status in ["attempted", "solved"] else 0,
        last_attempted_at=now if data.status in ["attempted", "solved"] else None,
        solved_at=now if data.status == "solved" else None
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)

    # Update streak
    update_user_streak(user, db)

    return ProblemResponse.model_validate(problem)


@app.patch("/api/problems/{problem_id}", response_model=ProblemResponse)
def update_problem(
    problem_id: str,
    data: ProblemUpdate,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Update a tracked problem."""
    check_rate_limit(request, "default", db)

    problem = db.query(ProblemProgress).filter(
        ProblemProgress.user_id == user.id,
        ProblemProgress.problem_id == problem_id
    ).first()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    now = datetime.utcnow()

    if data.status is not None:
        old_status = problem.status
        problem.status = data.status

        # Track attempts and solve time
        if data.status in ["attempted", "solved"] and old_status == "not_started":
            problem.attempts = (problem.attempts or 0) + 1
            problem.last_attempted_at = now

        if data.status == "solved" and old_status != "solved":
            problem.solved_at = now

    if data.notes is not None:
        problem.notes = data.notes

    if data.time_spent_minutes is not None:
        problem.time_spent_minutes = data.time_spent_minutes

    if data.pattern is not None:
        problem.pattern = data.pattern

    db.commit()
    db.refresh(problem)

    # Update streak
    update_user_streak(user, db)

    return ProblemResponse.model_validate(problem)


@app.delete("/api/problems/{problem_id}")
def delete_problem(
    problem_id: str,
    request: Request,
    user: User = Depends(get_current_user_required),
    db=Depends(get_db)
):
    """Delete a tracked problem."""
    check_rate_limit(request, "default", db)

    problem = db.query(ProblemProgress).filter(
        ProblemProgress.user_id == user.id,
        ProblemProgress.problem_id == problem_id
    ).first()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    db.delete(problem)
    db.commit()

    return {"status": "ok", "deleted": problem_id}
