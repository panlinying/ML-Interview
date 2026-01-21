"""
Examples of using async SQLAlchemy 2.0 in FastAPI routes.
This file demonstrates the new async patterns.
"""

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .db_async import get_async_db, User, Progress, Comment


# Example 1: Get a single user by ID
async def get_user_by_id(user_id: int, db: AsyncSession = Depends(get_async_db)):
    """Get user by ID using async."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


# Example 2: Get all users with pagination
async def get_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_async_db)):
    """Get users with pagination using async."""
    result = await db.execute(
        select(User)
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return users


# Example 3: Create a new user
async def create_user(email: str, name: str, db: AsyncSession = Depends(get_async_db)):
    """Create a new user using async."""
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(email=email, name=name)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


# Example 4: Update user
async def update_user_streak(user_id: int, streak: int, db: AsyncSession = Depends(get_async_db)):
    """Update user streak using async."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.current_streak = streak
    if streak > user.longest_streak:
        user.longest_streak = streak
    
    await db.commit()
    await db.refresh(user)
    
    return user


# Example 5: Complex query with joins
async def get_user_with_progress(user_id: int, db: AsyncSession = Depends(get_async_db)):
    """Get user with their progress using async with joinedload."""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.progress))  # Eagerly load progress
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user": user,
        "progress_count": len(user.progress),
        "completed_count": sum(1 for p in user.progress if p.completed)
    }


# Example 6: Batch insert
async def batch_create_progress(user_id: int, slugs: list[str], db: AsyncSession = Depends(get_async_db)):
    """Create multiple progress entries efficiently."""
    progress_entries = [
        Progress(user_id=user_id, content_slug=slug, completed=False)
        for slug in slugs
    ]
    
    db.add_all(progress_entries)
    await db.commit()
    
    return {"created": len(progress_entries)}


# Example 7: Transaction with rollback
async def transfer_progress(from_user_id: int, to_user_id: int, db: AsyncSession = Depends(get_async_db)):
    """Transfer progress from one user to another with transaction."""
    try:
        # Get progress from source user
        result = await db.execute(
            select(Progress).where(Progress.user_id == from_user_id)
        )
        progress_items = result.scalars().all()
        
        if not progress_items:
            raise HTTPException(status_code=404, detail="No progress found")
        
        # Update all progress to new user
        for progress in progress_items:
            progress.user_id = to_user_id
        
        await db.commit()
        return {"transferred": len(progress_items)}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")


# Example 8: Raw SQL with async
async def get_user_stats(user_id: int, db: AsyncSession = Depends(get_async_db)):
    """Execute raw SQL using async."""
    from sqlalchemy import text
    
    query = text("""
        SELECT 
            COUNT(*) as total_progress,
            SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_count,
            COUNT(DISTINCT DATE(updated_at)) as active_days
        FROM progress
        WHERE user_id = :user_id
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    row = result.one()
    
    return {
        "total_progress": row.total_progress,
        "completed_count": row.completed_count,
        "active_days": row.active_days
    }


"""
Usage in your FastAPI routes:

from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.db_async import get_async_db, User
from sqlalchemy import select

app = FastAPI()

@app.get("/users/{user_id}")
async def read_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users")
async def create_user(email: str, name: str, db: AsyncSession = Depends(get_async_db)):
    user = User(email=email, name=name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
"""
