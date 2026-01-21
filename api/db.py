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
