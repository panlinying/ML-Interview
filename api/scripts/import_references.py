#!/usr/bin/env python3
"""
Import problem references from generated JSON files into the database.

Usage:
    python -m api.scripts.import_references

Requires DATABASE_URL environment variable to be set.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.db import get_session, ProblemReference, init_db


def load_batch_files(generated_dir: Path) -> list:
    """Load all problem reference batch files."""
    all_problems = []

    for batch_file in sorted(generated_dir.glob("problem_references_batch*.json")):
        print(f"Loading {batch_file.name}...")
        with open(batch_file, "r", encoding="utf-8") as f:
            problems = json.load(f)
            all_problems.extend(problems)

    return all_problems


def import_references(dry_run: bool = False):
    """Import problem references into the database."""
    # Find the generated directory
    script_dir = Path(__file__).parent
    generated_dir = script_dir.parent.parent / "generated"

    if not generated_dir.exists():
        print(f"Error: Generated directory not found at {generated_dir}")
        return False

    # Load all batch files
    problems = load_batch_files(generated_dir)
    print(f"\nLoaded {len(problems)} problem references")

    if dry_run:
        print("\n[DRY RUN] Would import the following problems:")
        for p in problems[:5]:
            print(f"  - {p['problem_id']}: {p['title']}")
        if len(problems) > 5:
            print(f"  ... and {len(problems) - 5} more")
        return True

    # Initialize database
    print("\nInitializing database...")
    init_db()

    # Import into database
    db = get_session()
    try:
        imported = 0
        updated = 0
        errors = 0

        for problem in problems:
            try:
                problem_id = problem["problem_id"]

                # Check if exists
                existing = db.query(ProblemReference).filter(
                    ProblemReference.problem_id == problem_id
                ).first()

                if existing:
                    # Update existing
                    existing.solution_code = problem["solution_code"]
                    existing.optimal_time_complexity = problem.get("optimal_time_complexity")
                    existing.optimal_space_complexity = problem.get("optimal_space_complexity")
                    existing.updated_at = datetime.utcnow()
                    updated += 1
                else:
                    # Create new
                    ref = ProblemReference(
                        problem_id=problem_id,
                        language="python",
                        solution_code=problem["solution_code"],
                        optimal_time_complexity=problem.get("optimal_time_complexity"),
                        optimal_space_complexity=problem.get("optimal_space_complexity"),
                    )
                    db.add(ref)
                    imported += 1

                # Commit each record to avoid bulk insert issues
                db.commit()

            except Exception as e:
                print(f"Error importing {problem.get('problem_id', 'unknown')}: {e}")
                db.rollback()
                errors += 1
        print(f"\nImport complete:")
        print(f"  - Imported: {imported}")
        print(f"  - Updated: {updated}")
        print(f"  - Errors: {errors}")

        return errors == 0

    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Import problem references into database")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be imported without making changes")
    args = parser.parse_args()

    success = import_references(dry_run=args.dry_run)
    sys.exit(0 if success else 1)
