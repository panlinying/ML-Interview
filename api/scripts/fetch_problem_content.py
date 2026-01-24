#!/usr/bin/env python3
"""
Fetch LeetCode problem descriptions and store them in the database.

Usage:
    python -m api.scripts.fetch_problem_content
    python -m api.scripts.fetch_problem_content --dry-run
    python -m api.scripts.fetch_problem_content --slug two-sum

Requires DATABASE_URL environment variable.
"""

import html
import os
import re
import sys
import time
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import List, Optional

import httpx

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.db import get_session, ProblemDetail, ProblemReference, init_db

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

# Headers to mimic browser request
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://leetcode.com",
    "Origin": "https://leetcode.com",
}

# HTML sanitization (same as in index.py)
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

    def handle_starttag(self, tag: str, attrs: List[tuple]) -> None:
        tag = tag.lower()
        if tag not in LEETCODE_ALLOWED_TAGS:
            return
        attr_text = self._build_attr_text(tag, attrs)
        self.parts.append(f"<{tag}{attr_text}>")

    def handle_startendtag(self, tag: str, attrs: List[tuple]) -> None:
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

    def _build_attr_text(self, tag: str, attrs: List[tuple]) -> str:
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


def fetch_leetcode_problem(slug: str) -> Optional[dict]:
    """Fetch problem details from LeetCode GraphQL API."""
    payload = {"query": LEETCODE_QUESTION_QUERY, "variables": {"titleSlug": slug}}

    try:
        response = httpx.post(
            LEETCODE_GRAPHQL_URL,
            json=payload,
            headers=HEADERS,
            timeout=30.0,
        )

        if response.status_code != 200:
            print(f"    HTTP error: {response.status_code}")
            return None

        data = response.json()
        question = data.get("data", {}).get("question")

        if not question or not question.get("content"):
            print(f"    Problem not found or no content")
            return None

        difficulty = question.get("difficulty")
        if difficulty:
            difficulty = difficulty.lower()

        description_html = sanitize_leetcode_html(question.get("content", ""))
        if not description_html:
            print(f"    Could not parse description")
            return None

        return {
            "title": question.get("title") or slug,
            "difficulty": difficulty,
            "description_html": description_html,
        }

    except Exception as e:
        print(f"    Error: {e}")
        return None


def main(slug: Optional[str] = None, dry_run: bool = False):
    """Main entry point."""
    print("Initializing database...")
    init_db()

    db = get_session()
    try:
        # Get all problem references
        refs = db.query(ProblemReference).all()

        # Get existing problem details
        details = db.query(ProblemDetail).all()
        details_by_slug = {d.slug: d for d in details}

        # Find problems missing content
        missing = []
        for ref in refs:
            problem_slug = ref.problem_id[3:] if ref.problem_id.startswith("lc-") else ref.problem_id

            if slug and problem_slug != slug:
                continue

            detail = details_by_slug.get(problem_slug)
            if not detail or not detail.description_html:
                missing.append((ref.problem_id, problem_slug))

        print(f"\nFound {len(missing)} problems to fetch")

        fetched = 0
        skipped = 0
        errors = 0

        for i, (problem_id, problem_slug) in enumerate(missing):
            print(f"\n[{i+1}/{len(missing)}] Fetching {problem_slug}...")

            data = fetch_leetcode_problem(problem_slug)

            if data:
                if dry_run:
                    print(f"    Would save: {data['title']} ({data['difficulty']})")
                    print(f"    Content length: {len(data['description_html'])} chars")
                else:
                    now = datetime.utcnow()
                    existing = details_by_slug.get(problem_slug)

                    if existing:
                        existing.title = data["title"]
                        existing.description_html = data["description_html"]
                        existing.difficulty = data["difficulty"]
                        existing.source = "leetcode"
                        existing.fetched_at = now
                    else:
                        record = ProblemDetail(
                            slug=problem_slug,
                            title=data["title"],
                            description_html=data["description_html"],
                            difficulty=data["difficulty"],
                            source="leetcode",
                            fetched_at=now,
                        )
                        db.add(record)
                        details_by_slug[problem_slug] = record

                    db.commit()
                    print(f"    Saved: {data['title']} ({data['difficulty']})")

                fetched += 1
            else:
                errors += 1

            # Rate limiting - be nice to LeetCode
            if not dry_run and i < len(missing) - 1:
                time.sleep(1.5)

        print(f"\n\nSummary:")
        print(f"  - Fetched: {fetched}")
        print(f"  - Errors: {errors}")

        return errors == 0

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch LeetCode problem content")
    parser.add_argument("--slug", help="Fetch for a specific problem slug")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    args = parser.parse_args()

    success = main(slug=args.slug, dry_run=args.dry_run)
    sys.exit(0 if success else 1)
