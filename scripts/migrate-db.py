#!/usr/bin/env python3
"""
Database migration script for ML Interview API.

Run this script when you need to update the database schema
to match the SQLAlchemy models.

Usage:
    uv run python scripts/migrate-db.py
"""

import os
import re
import sys
from pathlib import Path

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
    # Questions table
    ("questions table", """
        CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            question_type VARCHAR(50) NOT NULL,
            leetcode_number INTEGER,
            problem_name VARCHAR(500) NOT NULL,
            difficulty VARCHAR(50),
            pattern VARCHAR(255),
            video_solution TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """),
    ("ix_questions_question_type",
     "CREATE INDEX IF NOT EXISTS ix_questions_question_type ON questions(question_type)"),
    ("ix_questions_leetcode_number",
     "CREATE INDEX IF NOT EXISTS ix_questions_leetcode_number ON questions(leetcode_number)"),
]


def extract_tags(value: str) -> list[str]:
    return [tag.strip() for tag in re.findall(r'`tag:([^`]+)`', value) if tag.strip()]


def clean_cell(value: str) -> str:
    return value.replace('`', '').strip()


def derive_pattern(heading: str) -> str:
    if not heading:
        return "Pattern"
    normalized = re.sub(r'^#+\s*', '', heading).strip()
    normalized = re.sub(r'^Day\s+\d+(?:-\d+)?:\s*', '', normalized, flags=re.IGNORECASE)
    if re.search(r'dp review', normalized, flags=re.IGNORECASE):
        return "DP"
    return normalized


def parse_guide_questions(content_root: Path) -> list[dict]:
    guide_path = content_root / "ml_interview_detailed_guide.md"
    if not guide_path.exists():
        print(f"  - Skipping seed: {guide_path} not found")
        return []

    lines = guide_path.read_text(encoding="utf-8").splitlines()
    questions: dict[int, dict] = {}
    current_heading = ""
    header_map: dict[str, int] | None = None
    in_table = False

    for line in lines:
        if re.match(r'^#{2,3}\s+', line):
            current_heading = line
            continue

        if line.startswith("|") and "LeetCode" in line and "Problem Name" in line:
            header = [part.strip() for part in line.strip().strip("|").split("|")]
            header_map = {name.strip().lower(): idx for idx, name in enumerate(header)}
            in_table = True
            continue

        if not in_table:
            continue

        if not line.startswith("|"):
            in_table = False
            header_map = None
            continue

        if line.strip().startswith("|---"):
            continue

        row = [part.strip() for part in line.strip().strip("|").split("|")]
        if not header_map or len(row) < 4:
            continue

        lc_idx = header_map.get("leetcode")
        name_idx = header_map.get("problem name")
        difficulty_idx = header_map.get("difficulty")
        pattern_idx = header_map.get("pattern")
        video_idx = header_map.get("video solution")

        if lc_idx is None or name_idx is None or difficulty_idx is None:
            continue

        lc_cell = row[lc_idx]
        match = re.search(r'LC\s*#?(\d+)', lc_cell, flags=re.IGNORECASE)
        if not match:
            continue

        leetcode_number = int(match.group(1))
        if leetcode_number in questions:
            continue

        name_cell = row[name_idx]
        name_tags = extract_tags(name_cell)
        problem_name = name_tags[0] if name_tags else clean_cell(name_cell)

        pattern = None
        if pattern_idx is not None and pattern_idx < len(row):
            pattern_cell = row[pattern_idx]
            pattern_tags = extract_tags(pattern_cell)
            pattern = pattern_tags[0] if pattern_tags else clean_cell(pattern_cell)
        else:
            if len(name_tags) > 1:
                pattern = name_tags[1]
            else:
                pattern = derive_pattern(current_heading)

        difficulty = clean_cell(row[difficulty_idx]) if difficulty_idx < len(row) else None
        video_solution = None
        if video_idx is not None and video_idx < len(row):
            video_solution = clean_cell(row[video_idx]) or None

        questions[leetcode_number] = {
            "question_type": "leetcode",
            "leetcode_number": leetcode_number,
            "problem_name": problem_name,
            "difficulty": difficulty,
            "pattern": pattern,
            "video_solution": video_solution,
        }

    return list(questions.values())


def seed_questions(engine) -> None:
    print("Seeding questions from curriculum content...")
    content_root = Path(__file__).resolve().parents[1] / "content"
    questions = parse_guide_questions(content_root)

    if not questions:
        print("  - No questions found to seed")
        return

    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT question_type, leetcode_number, problem_name FROM questions")
        ).fetchall()

        existing_leetcode = {
            (row[0], row[1])
            for row in existing
            if row[1] is not None
        }
        existing_other = {
            (row[0], row[2])
            for row in existing
            if row[1] is None
        }

        insert_sql = text(
            """
            INSERT INTO questions (
                question_type,
                leetcode_number,
                problem_name,
                difficulty,
                pattern,
                video_solution
            ) VALUES (
                :question_type,
                :leetcode_number,
                :problem_name,
                :difficulty,
                :pattern,
                :video_solution
            )
            """
        )

        for question in questions:
            key = ("leetcode", question["leetcode_number"])
            if question["leetcode_number"] is not None:
                if key in existing_leetcode:
                    skipped += 1
                    continue
            else:
                name_key = (question["question_type"], question["problem_name"])
                if name_key in existing_other:
                    skipped += 1
                    continue

            conn.execute(insert_sql, question)
            inserted += 1

    print(f"  ✓ Seeded {inserted} questions ({skipped} skipped)")


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
    seed_questions(engine)


if __name__ == "__main__":
    run_migrations()
