#!/usr/bin/env python3
"""
Generate Obsidian daily notes from a markdown study plan.

This utility parses a markdown file containing "## Week X Checklist" blocks
and generates structured daily notes for an Obsidian vault.

Usage:
    python run.py ml_interview_detailed_guide.md --out . --days 7 --start 2026-01-12
"""

import re
import argparse
from pathlib import Path
from datetime import datetime, timedelta


def parse_week_checklists(text: str) -> list[tuple[str, list[str]]]:
    """
    Extract week checklists from markdown text.

    Args:
        text: Markdown content containing "## Week X Checklist" blocks

    Returns:
        List of tuples: (week_name, list_of_checklist_items)
    """
    pattern = re.compile(
        r"^##\s+(Week\s+[\d-]+)\s+Checklist\s*\n(.*?)(?=^##\s+Week|\Z)",
        re.MULTILINE | re.DOTALL
    )
    weeks = []
    for match in pattern.finditer(text):
        week_name = match.group(1)
        block = match.group(2).strip()
        items = [
            line.strip()
            for line in block.splitlines()
            if line.strip().startswith("- [ ]")
        ]
        weeks.append((week_name, items))
    return weeks


def chunk_items(items: list[str], n_chunks: int) -> list[list[str]]:
    """
    Distribute items evenly across n chunks.

    Args:
        items: List of items to distribute
        n_chunks: Number of chunks to create

    Returns:
        List of item lists, distributed as evenly as possible
    """
    if n_chunks <= 0 or not items:
        return [items] if items else []

    result = []
    total = len(items)
    base_size, remainder = divmod(total, n_chunks)

    idx = 0
    for i in range(n_chunks):
        size = base_size + (1 if i < remainder else 0)
        if size > 0:
            result.append(items[idx:idx + size])
            idx += size

    return result


def parse_date(date_str: str) -> datetime:
    """Parse date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as e:
        raise ValueError(f"Invalid date format '{date_str}'. Use YYYY-MM-DD.") from e


def generate_day_note(week_name: str, day_num: int, items: list[str]) -> str:
    """Generate content for a daily note."""
    lines = [
        f"# {week_name} - Day {day_num}",
        "",
        "## Tasks",
        *items,
        "",
        "## Notes / Blockers",
        "- ",
        "",
        "## Review (2–5 lines)",
        "- ",
        "",
    ]
    return "\n".join(lines)


def generate_week_note(week_name: str, day_entries: list[tuple[str, list[str]]]) -> str:
    """Generate content for a week overview note."""
    lines = [f"# {week_name}", ""]
    for day_num, (link, items) in enumerate(day_entries, start=1):
        lines.append(f"## Day {day_num} → {link}")
        lines.append("")
        lines.extend(items)
        lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Generate Obsidian daily notes from a markdown study plan.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py plan.md
  python run.py plan.md --out ./vault --days 5
  python run.py plan.md --start 2026-01-12 --days 7
        """
    )
    parser.add_argument("md_path", help="Path to your plan .md file")
    parser.add_argument("--out", default=".", help="Output vault root folder (default: current directory)")
    parser.add_argument("--days", type=int, default=5, help="Days per week to split tasks into (default: 5)")
    parser.add_argument("--start", help="Start date in YYYY-MM-DD format for dated notes")
    parser.add_argument("--force", action="store_true", help="Overwrite existing day notes")
    args = parser.parse_args()

    # Validate input file
    md_path = Path(args.md_path)
    if not md_path.exists():
        raise SystemExit(f"Error: File not found: {md_path}")
    if not md_path.is_file():
        raise SystemExit(f"Error: Not a file: {md_path}")

    # Parse markdown
    text = md_path.read_text(encoding="utf-8")
    weeks = parse_week_checklists(text)
    if not weeks:
        raise SystemExit(
            "Error: No '## Week X Checklist' blocks found in the input file.\n"
            "Expected format:\n"
            "  ## Week 1 Checklist\n"
            "  - [ ] Task 1\n"
            "  - [ ] Task 2"
        )

    # Setup output directories
    out = Path(args.out)
    weeks_dir = out / "10-Weeks"
    daily_dir = out / "20-Daily"

    try:
        weeks_dir.mkdir(parents=True, exist_ok=True)
        daily_dir.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        raise SystemExit(f"Error: Cannot create output directories: {e}")

    # Parse start date
    current_date = parse_date(args.start) if args.start else None

    # Generate notes
    notes_created = 0
    notes_skipped = 0

    for week_name, items in weeks:
        day_lists = chunk_items(items, args.days)
        day_entries = []

        for day_num, day_items in enumerate(day_lists, start=1):
            if current_date:
                day_title = current_date.isoformat()
                link = f"[[20-Daily/{day_title}]]"
                current_date = current_date + timedelta(days=1)
            else:
                day_title = f"{week_name} - Day {day_num}"
                link = f"[[20-Daily/{day_title}]]"

            day_entries.append((link, day_items))
            day_file = daily_dir / f"{day_title}.md"

            if day_file.exists() and not args.force:
                notes_skipped += 1
            else:
                day_content = generate_day_note(week_name, day_num, day_items)
                day_file.write_text(day_content, encoding="utf-8")
                notes_created += 1

        # Write week note (always overwrite)
        week_content = generate_week_note(week_name, day_entries)
        (weeks_dir / f"{week_name}.md").write_text(week_content, encoding="utf-8")

    print(f"Done! Generated notes in {out}")
    print(f"  - Week notes: {len(weeks)}")
    print(f"  - Day notes created: {notes_created}")
    if notes_skipped:
        print(f"  - Day notes skipped (already exist): {notes_skipped}")
        print("  (Use --force to overwrite existing notes)")


if __name__ == "__main__":
    main()
