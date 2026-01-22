#!/bin/bash
# Setup script for importing problem references and generating test cases
#
# Usage:
#   ./api/scripts/setup_problems.sh          # Full setup
#   ./api/scripts/setup_problems.sh --dry-run # Preview changes
#
# Requires:
#   - DATABASE_URL environment variable
#   - Python 3 with required dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

DRY_RUN=""
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN="--dry-run"
    echo "=== DRY RUN MODE ==="
fi

echo ""
echo "=== Step 1: Import Problem References ==="
echo ""
python -m api.scripts.import_references $DRY_RUN

echo ""
echo "=== Step 2: Generate Test Cases ==="
echo ""
python -m api.scripts.generate_test_cases --all $DRY_RUN

echo ""
echo "=== Setup Complete ==="
