#!/usr/bin/env python3
"""
Fetch LeetCode starter code templates and store them in the database.

Usage:
    python -m api.scripts.fetch_starter_codes
    python -m api.scripts.fetch_starter_codes --dry-run
    python -m api.scripts.fetch_starter_codes --problem-id lc-two-sum

Requires DATABASE_URL environment variable.
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Optional
import httpx

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.db import get_session, ProblemReference, init_db

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/"

# Query to get starter code snippets
QUESTION_EDITOR_QUERY = """
query questionEditorData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    codeSnippets {
      lang
      langSlug
      code
    }
  }
}
"""

# Headers to mimic browser request
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://leetcode.com",
    "Origin": "https://leetcode.com",
}


def extract_slug_from_problem_id(problem_id: str) -> str:
    """Extract LeetCode slug from our problem_id format (e.g., 'lc-two-sum' -> 'two-sum')."""
    if problem_id.startswith("lc-"):
        return problem_id[3:]
    return problem_id


def fetch_starter_code(slug: str) -> Optional[str]:
    """Fetch Python starter code from LeetCode for a problem slug."""
    try:
        response = httpx.post(
            LEETCODE_GRAPHQL_URL,
            json={
                "query": QUESTION_EDITOR_QUERY,
                "variables": {"titleSlug": slug},
                "operationName": "questionEditorData",
            },
            headers=HEADERS,
            timeout=30.0,
        )

        if response.status_code != 200:
            print(f"    HTTP error: {response.status_code}")
            return None

        data = response.json()
        question = data.get("data", {}).get("question")

        if not question:
            print(f"    Question not found")
            return None

        code_snippets = question.get("codeSnippets", [])
        if not code_snippets:
            print(f"    No code snippets found")
            return None

        # Find Python3 snippet (preferred) or Python
        for snippet in code_snippets:
            if snippet.get("langSlug") == "python3":
                return snippet.get("code")

        for snippet in code_snippets:
            if snippet.get("langSlug") == "python":
                return snippet.get("code")

        print(f"    No Python snippet found")
        return None

    except Exception as e:
        print(f"    Error: {e}")
        return None


def main(problem_id: Optional[str] = None, dry_run: bool = False):
    """Main entry point."""
    print("Initializing database...")
    init_db()

    db = get_session()
    try:
        # Get problems to process
        if problem_id:
            refs = db.query(ProblemReference).filter(
                ProblemReference.problem_id == problem_id
            ).all()
        else:
            # Get all problems without starter code
            refs = db.query(ProblemReference).filter(
                (ProblemReference.starter_code == None) |
                (ProblemReference.starter_code == "")
            ).all()

        print(f"\nFound {len(refs)} problems to process")

        fetched = 0
        skipped = 0
        errors = 0

        for i, ref in enumerate(refs):
            slug = extract_slug_from_problem_id(ref.problem_id)
            print(f"\n[{i+1}/{len(refs)}] Processing {ref.problem_id} (slug: {slug})...")

            starter_code = fetch_starter_code(slug)

            if starter_code:
                if dry_run:
                    print(f"    Would save starter code ({len(starter_code)} chars)")
                    print(f"    Preview: {starter_code[:100]}...")
                else:
                    ref.starter_code = starter_code
                    db.commit()
                    print(f"    Saved starter code ({len(starter_code)} chars)")
                fetched += 1
            else:
                errors += 1

            # Rate limiting - be nice to LeetCode
            if not dry_run and i < len(refs) - 1:
                time.sleep(1.0)

        print(f"\n\nSummary:")
        print(f"  - Fetched: {fetched}")
        print(f"  - Errors: {errors}")

        return errors == 0

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch LeetCode starter codes")
    parser.add_argument("--problem-id", help="Fetch for a specific problem")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    args = parser.parse_args()

    success = main(problem_id=args.problem_id, dry_run=args.dry_run)
    sys.exit(0 if success else 1)
