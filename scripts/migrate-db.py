#!/usr/bin/env python3
"""
Database migration script for ML Interview API.

Run this script when you need to update the database schema
to match the SQLAlchemy models.

Usage:
    uv run python scripts/migrate-db.py
"""

import os
import sys

# Load environment from .env.local
def load_env():
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env()

from sqlalchemy import text

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from api.db import get_engine

MIGRATIONS = [
    # Comments: Add parent_id for threading
    ("comments.parent_id",
     "ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id)"),

    # Comments: Index on parent_id
    ("ix_comments_parent_id",
     "CREATE INDEX IF NOT EXISTS ix_comments_parent_id ON comments(parent_id)"),

    # Comment votes table
    ("comment_votes table", """
        CREATE TABLE IF NOT EXISTS comment_votes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            comment_id INTEGER NOT NULL REFERENCES comments(id),
            vote INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, comment_id)
        )
    """),

    # Comment votes indexes
    ("ix_comment_votes_user_id",
     "CREATE INDEX IF NOT EXISTS ix_comment_votes_user_id ON comment_votes(user_id)"),
    ("ix_comment_votes_comment_id",
     "CREATE INDEX IF NOT EXISTS ix_comment_votes_comment_id ON comment_votes(comment_id)"),
]


def run_migrations():
    """Run all pending migrations."""
    print("Starting database migration...")

    engine = get_engine()

    with engine.connect() as conn:
        for name, sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"  ✓ {name}")
            except Exception as e:
                error_msg = str(e)
                if "already exists" in error_msg.lower():
                    print(f"  - {name} (already exists)")
                else:
                    print(f"  ✗ {name}: {error_msg[:60]}")

    print("\nMigration complete!")


if __name__ == "__main__":
    run_migrations()
