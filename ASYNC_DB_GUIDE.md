# Async SQLAlchemy 2.0 + Alembic + asyncpg Guide

Complete guide for using modern async database operations with automatic migrations.

---

## 🎯 Tech Stack

- **SQLAlchemy 2.0**: Modern ORM with full async support
- **asyncpg**: High-performance PostgreSQL driver for Python
- **Alembic**: Automatic database migration tool
- **FastAPI**: Native async/await support

---

## 🚀 Quick Start

### 1. Define Models (in `api/db.py`)

```python
from sqlalchemy import Column, Integer, String
from api.db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True)
    name = Column(String(255))
```

### 2. Generate Migration

```bash
./migrate.sh create 'add user table'
```

Alembic will auto-generate:
```python
# alembic/versions/xxx_add_user_table.py
def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
```

### 3. Apply Migration

```bash
./migrate.sh upgrade
```

### 4. Use in FastAPI Routes

```python
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from api.db_async import get_async_db, User

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    return user
```

---

## 📖 Migration Commands

### Create Migration (Auto-detect Changes)
```bash
./migrate.sh create 'description of changes'
```

### Apply Migrations
```bash
./migrate.sh upgrade
```

### Rollback Last Migration
```bash
./migrate.sh downgrade
```

### View Current Version
```bash
./migrate.sh current
```

### View Migration History
```bash
./migrate.sh history
```

---

## 💡 Common Patterns

### Get Single Record
```python
async def get_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()
```

### Get Multiple Records
```python
async def get_users(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(10)
    )
    return result.scalars().all()
```

### Create Record
```python
async def create_user(email: str, db: AsyncSession = Depends(get_async_db)):
    user = User(email=email)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
```

### Update Record
```python
async def update_user(user_id: int, name: str, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user:
        user.name = name
        await db.commit()
        await db.refresh(user)
    
    return user
```

### Delete Record
```python
async def delete_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user:
        await db.delete(user)
        await db.commit()
```

### Complex Query with Joins
```python
from sqlalchemy.orm import selectinload

async def get_user_with_progress(user_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.progress))  # Eager load relationship
    )
    return result.scalar_one_or_none()
```

### Aggregation Query
```python
from sqlalchemy import func

async def get_stats(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        select(
            func.count(User.id).label('total_users'),
            func.max(User.created_at).label('last_signup')
        )
    )
    return result.one()
```

---

## 🔄 Migration Workflow

### Scenario 1: Add New Column

**1. Edit model:**
```python
# api/db.py
class User(Base):
    # ... existing columns
    bio = Column(Text)  # Add this
```

**2. Generate migration:**
```bash
./migrate.sh create 'add bio to users'
```

**3. Review generated file:**
```python
# alembic/versions/xxx_add_bio_to_users.py
def upgrade():
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
```

**4. Apply:**
```bash
./migrate.sh upgrade
```

### Scenario 2: Add New Table

**1. Define model:**
```python
# api/db.py
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    title = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.id"))
```

**2. Generate & apply:**
```bash
./migrate.sh create 'add posts table'
./migrate.sh upgrade
```

### Scenario 3: Modify Column

**1. Change model:**
```python
# api/db.py
class User(Base):
    email = Column(String(500))  # Changed from 255 to 500
```

**2. Generate & apply:**
```bash
./migrate.sh create 'increase email max length'
./migrate.sh upgrade
```

---

## ⚡ Performance Tips

### 1. Use `selectinload` for Relationships
```python
# Bad - N+1 queries
users = (await db.execute(select(User))).scalars().all()
for user in users:
    print(user.progress)  # Separate query for each user!

# Good - Single query with join
result = await db.execute(
    select(User).options(selectinload(User.progress))
)
users = result.scalars().all()
```

### 2. Batch Inserts
```python
# Create many records efficiently
users = [User(email=f"user{i}@example.com") for i in range(1000)]
db.add_all(users)
await db.commit()
```

### 3. Use Indexes
```python
# In your model
class User(Base):
    email = Column(String(255), index=True)  # Add index
    created_at = Column(DateTime, index=True)
```

Then generate migration:
```bash
./migrate.sh create 'add indexes to users'
```

---

## 🛠️ Troubleshooting

### Migration Conflict
```bash
# If migrations get out of sync
./migrate.sh current  # See where you are
./migrate.sh history  # See all migrations

# Rollback if needed
./migrate.sh downgrade
```

### Database Not in Sync
```bash
# Force database to match models (CAUTION: can lose data)
./migrate.sh upgrade head
```

### Check Generated Migration
Always review the auto-generated migration before applying:
```bash
./migrate.sh create 'my changes'
# Review file in alembic/versions/
# Edit if needed
./migrate.sh upgrade
```

---

## 🌐 Local vs Production

### Local Development
```bash
# Uses DATABASE_URL from .env.local
./migrate.sh create 'add feature'
./migrate.sh upgrade
```

### Production (Railway)
```bash
# Make sure .env.local has Railway's public DATABASE_URL
./migrate.sh upgrade

# Or SSH into Railway and run migrations there
```

---

## 📚 Learn More

- [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [asyncpg](https://magicstack.github.io/asyncpg/)
- [FastAPI + SQLAlchemy](https://fastapi.tiangolo.com/tutorial/sql-databases/)

---

## ✅ Summary

| Task | Command |
|------|---------|
| Add/modify model | Edit `api/db.py` |
| Generate migration | `./migrate.sh create 'message'` |
| Apply migrations | `./migrate.sh upgrade` |
| Rollback | `./migrate.sh downgrade` |
| Check status | `./migrate.sh current` |

**No more manual SQL! Just change your models and let Alembic handle the rest.** 🎉
