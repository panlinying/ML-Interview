"""
Database models and connection for Vercel Postgres.
"""

import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Get database URL from environment (try both common names)
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL", "")

# For Vercel Postgres, convert postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

Base = declarative_base()


# --- Models ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    image = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Streak tracking
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime, nullable=True)

    progress = relationship("Progress", back_populates="user")
    comments = relationship("Comment", back_populates="user")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_slug = Column(String(255), nullable=False, index=True)
    completed = Column(Boolean, default=False)
    notes = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Spaced repetition tracking
    review_count = Column(Integer, default=0)
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress")


class Content(Base):
    __tablename__ = "content"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    category = Column(String(100))
    body = Column(Text)
    frontmatter = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content_slug = Column(String(255), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="comments")


class CommentVote(Base):
    __tablename__ = "comment_votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False, index=True)
    vote = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "comment_id", name="uq_comment_vote_user"),
    )


class PageView(Base):
    __tablename__ = "page_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    path = Column(String(500), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(String(50), nullable=False, index=True)
    leetcode_number = Column(Integer, nullable=True, index=True)
    problem_name = Column(String(500), nullable=False)
    difficulty = Column(String(50))
    pattern = Column(String(255))
    video_solution = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProblemDetail(Base):
    __tablename__ = "problem_details"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description_html = Column(Text, nullable=False)
    difficulty = Column(String(20))
    source = Column(String(50), nullable=False, default="leetcode")
    fetched_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProblemTestCase(Base):
    __tablename__ = "problem_test_cases"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(String(100), nullable=False, index=True)
    input_text = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)
    time_limit_ms = Column(Integer, default=2000)
    slow_limit_ms = Column(Integer, default=4000)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("problem_id", "input_text", "expected_output", name="uq_problem_test_case"),
    )


class ProblemReference(Base):
    __tablename__ = "problem_references"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(String(100), nullable=False, unique=True, index=True)
    language = Column(String(20), nullable=False, default="python")
    solution_code = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=True)  # LeetCode starter template
    optimal_time_complexity = Column(String(50))
    optimal_space_complexity = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Session(Base):
    """Store OAuth state tokens and other temporary session data."""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class RateLimit(Base):
    """Track rate limiting per IP/user."""
    __tablename__ = "rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), nullable=False, index=True)  # IP or user_id
    endpoint = Column(String(255), nullable=False)
    count = Column(Integer, default=1)
    window_start = Column(DateTime, default=datetime.utcnow)


class ProblemProgress(Base):
    """Track user progress on coding problems (LeetCode, etc.)."""
    __tablename__ = "problem_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    problem_id = Column(String(100), nullable=False, index=True)  # e.g., "lc-two-sum"
    problem_name = Column(String(500), nullable=False)
    difficulty = Column(String(20))  # easy, medium, hard
    pattern = Column(String(100))  # e.g., "two-pointers", "sliding-window"
    status = Column(String(20), default="not_started")  # not_started, attempted, solved, need_review
    notes = Column(Text)
    time_spent_minutes = Column(Integer, default=0)
    attempts = Column(Integer, default=0)
    last_attempted_at = Column(DateTime, nullable=True)
    solved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "problem_id", name="uq_problem_progress_user"),
    )


# --- Database Session ---

from functools import lru_cache


@lru_cache(maxsize=1)
def get_engine():
    """
    Create a singleton database engine with connection pooling.

    Uses lru_cache to ensure only one engine is created per process,
    preventing connection pool exhaustion and memory leaks.
    """
    if not DATABASE_URL:
        available_vars = [k for k in os.environ.keys() if 'DATABASE' in k or 'POSTGRES' in k]
        raise RuntimeError(
            f"DATABASE_URL not set. Available database env vars: {available_vars}. "
            f"Set DATABASE_URL or POSTGRES_URL environment variable."
        )
    return create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
    )


# Module-level session factory (singleton pattern)
_SessionLocal = None


def get_session_factory():
    """Get or create the session factory singleton."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine()
        )
    return _SessionLocal


def get_session():
    """Create a new database session."""
    return get_session_factory()()


def get_db():
    """FastAPI dependency for database sessions."""
    db = get_session()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
