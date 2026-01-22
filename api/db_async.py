"""
Async database configuration using SQLAlchemy 2.0 + asyncpg.
Modern async/await pattern for high-performance database operations.
"""

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase

# Import existing models to maintain compatibility
from .db import (
    User,
    Progress,
    Content,
    Comment,
    PageView,
    Session,
    RateLimit,
    Question,
    CommentVote,
    ProblemDetail,
    ProblemTestCase,
    ProblemReference,
    Base as SyncBase,
)


# Get database URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL", "")

# Convert to async driver
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    ASYNC_DATABASE_URL = DATABASE_URL


# Create async engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,  # Set to True for SQL logging
    pool_pre_ping=True,  # Verify connections before using
    pool_size=20,  # Connection pool size
    max_overflow=0,  # Don't create extra connections beyond pool_size
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
)


# Dependency for FastAPI
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for async database sessions.
    
    Usage:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_async_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# For Alembic migrations (sync operations)
def get_sync_database_url() -> str:
    """Get synchronous database URL for Alembic migrations."""
    url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


# Helper function to run async queries
async def execute_query(query):
    """
    Execute a query asynchronously.
    
    Usage:
        from sqlalchemy import select
        result = await execute_query(select(User).where(User.email == "test@example.com"))
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(query)
        return result


# Use the same Base from db.py for Alembic compatibility
Base = SyncBase


__all__ = [
    "async_engine",
    "AsyncSessionLocal",
    "get_async_db",
    "get_sync_database_url",
    "execute_query",
    "Base",
    # Re-export models
    "User",
    "Progress",
    "Content",
    "Comment",
    "PageView",
    "Session",
    "RateLimit",
    "Question",
    "CommentVote",
    "ProblemDetail",
    "ProblemTestCase",
    "ProblemReference",
]
