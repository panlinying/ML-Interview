#!/usr/bin/env python3
"""
Generate test cases for problems using reference solutions.

This script:
1. Loads problems with reference solutions from the database
2. For problems without test cases, generates test inputs
3. Uses the reference solution to compute expected outputs
4. Stores the test cases in the database

Usage:
    python -m api.scripts.generate_test_cases --problem-id lc-two-sum
    python -m api.scripts.generate_test_cases --all

Requires:
    - DATABASE_URL environment variable
    - PISTON_API_URL environment variable (optional, defaults to public Piston)
"""

import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.db import get_session, ProblemReference, ProblemTestCase, init_db

# Piston API configuration
PISTON_API_URL = os.environ.get("PISTON_API_URL", "https://emkc.org/api/v2/piston").rstrip("/")
PISTON_LANGUAGE = os.environ.get("PISTON_PYTHON_LANGUAGE", "python")
PISTON_VERSION = os.environ.get("PISTON_PYTHON_VERSION", "3.10.0")
PISTON_TIMEOUT = 10.0

# Default time limits
DEFAULT_TIME_LIMIT_MS = 2000
DEFAULT_SLOW_LIMIT_MS = 4000


# Pre-defined test inputs for common problems
# Format: problem_id -> list of input test cases (as JSON strings)
PREDEFINED_TEST_INPUTS: Dict[str, List[str]] = {
    "lc-two-sum": [
        "[[2,7,11,15], 9]",
        "[[3,2,4], 6]",
        "[[3,3], 6]",
        "[list(range(10000)), 19997]",  # Large input for performance
    ],
    "lc-best-time-to-buy-and-sell-stock": [
        "[[7,1,5,3,6,4]]",
        "[[7,6,4,3,1]]",
        "[[1,2,3,4,5]]",
        "[list(range(10000, 0, -1)) + list(range(10000))]",
    ],
    "lc-contains-duplicate": [
        "[[1,2,3,1]]",
        "[[1,2,3,4]]",
        "[[1,1,1,3,3,4,3,2,4,2]]",
        "[list(range(100000))]",
    ],
    "lc-product-of-array-except-self": [
        "[[1,2,3,4]]",
        "[[-1,1,0,-3,3]]",
        "[[2,3,4,5]]",
    ],
    "lc-maximum-subarray": [
        "[[-2,1,-3,4,-1,2,1,-5,4]]",
        "[[1]]",
        "[[5,4,-1,7,8]]",
    ],
    "lc-maximum-product-subarray": [
        "[[2,3,-2,4]]",
        "[[-2,0,-1]]",
        "[[-2,3,-4]]",
    ],
    "lc-find-minimum-in-rotated-sorted-array": [
        "[[3,4,5,1,2]]",
        "[[4,5,6,7,0,1,2]]",
        "[[11,13,15,17]]",
    ],
    "lc-search-in-rotated-sorted-array": [
        "[[4,5,6,7,0,1,2], 0]",
        "[[4,5,6,7,0,1,2], 3]",
        "[[1], 0]",
    ],
    "lc-container-with-most-water": [
        "[[1,8,6,2,5,4,8,3,7]]",
        "[[1,1]]",
        "[[4,3,2,1,4]]",
    ],
    "lc-3sum": [
        "[[-1,0,1,2,-1,-4]]",
        "[[0,1,1]]",
        "[[0,0,0]]",
    ],
    "lc-valid-parentheses": [
        '["()"]',
        '["()[]{}"]',
        '["(]"]',
        '["([)]"]',
        '["((({{[[(([[]]))]]}}))){[]}"]',
    ],
    "lc-merge-two-sorted-lists": [
        "[[1,2,4], [1,3,4]]",
        "[[], []]",
        "[[], [0]]",
    ],
    "lc-merge-k-sorted-lists": [
        "[[[1,4,5],[1,3,4],[2,6]]]",
        "[[]]",
        "[[[]]]",
    ],
    "lc-remove-nth-node-from-end-of-list": [
        "[[1,2,3,4,5], 2]",
        "[[1], 1]",
        "[[1,2], 1]",
    ],
    "lc-reorder-list": [
        "[[1,2,3,4]]",
        "[[1,2,3,4,5]]",
    ],
    "lc-linked-list-cycle": [
        '{"args": [[3,2,0,-4], 1]}',
        '{"args": [[1,2], 0]}',
        '{"args": [[1], -1]}',
    ],
    "lc-reverse-linked-list": [
        "[[1,2,3,4,5]]",
        "[[1,2]]",
        "[[]]",
    ],
    "lc-invert-binary-tree": [
        "[[4,2,7,1,3,6,9]]",
        "[[2,1,3]]",
        "[[]]",
    ],
    "lc-maximum-depth-of-binary-tree": [
        "[[3,9,20,null,null,15,7]]",
        "[[1,null,2]]",
        "[[]]",
    ],
    "lc-same-tree": [
        "[[1,2,3], [1,2,3]]",
        "[[1,2], [1,null,2]]",
        "[[1,2,1], [1,1,2]]",
    ],
    "lc-subtree-of-another-tree": [
        "[[3,4,5,1,2], [4,1,2]]",
        "[[3,4,5,1,2,null,null,null,null,0], [4,1,2]]",
    ],
    "lc-lowest-common-ancestor-of-a-binary-search-tree": [
        "[[6,2,8,0,4,7,9,null,null,3,5], 2, 8]",
        "[[6,2,8,0,4,7,9,null,null,3,5], 2, 4]",
    ],
    "lc-binary-tree-level-order-traversal": [
        "[[3,9,20,null,null,15,7]]",
        "[[1]]",
        "[[]]",
    ],
    "lc-validate-binary-search-tree": [
        "[[2,1,3]]",
        "[[5,1,4,null,null,3,6]]",
        "[[5,4,6,null,null,3,7]]",
    ],
    "lc-kth-smallest-element-in-a-bst": [
        "[[3,1,4,null,2], 1]",
        "[[5,3,6,2,4,null,null,1], 3]",
    ],
    "lc-construct-binary-tree-from-preorder-and-inorder-traversal": [
        "[[3,9,20,15,7], [9,3,15,20,7]]",
        "[[-1], [-1]]",
    ],
    "lc-binary-tree-maximum-path-sum": [
        "[[1,2,3]]",
        "[[-10,9,20,null,null,15,7]]",
    ],
    "lc-serialize-and-deserialize-binary-tree": [
        "[[1,2,3,null,null,4,5]]",
        "[[]]",
    ],
    "lc-climbing-stairs": [
        "[2]",
        "[3]",
        "[45]",
    ],
    "lc-coin-change": [
        "[[1,2,5], 11]",
        "[[2], 3]",
        "[[1], 0]",
    ],
    "lc-longest-increasing-subsequence": [
        "[[10,9,2,5,3,7,101,18]]",
        "[[0,1,0,3,2,3]]",
        "[[7,7,7,7,7,7,7]]",
    ],
    "lc-word-break": [
        '["leetcode", ["leet","code"]]',
        '["applepenapple", ["apple","pen"]]',
        '["catsandog", ["cats","dog","sand","and","cat"]]',
    ],
    "lc-combination-sum": [
        "[[2,3,6,7], 7]",
        "[[2,3,5], 8]",
        "[[2], 1]",
    ],
    "lc-house-robber": [
        "[[1,2,3,1]]",
        "[[2,7,9,3,1]]",
        "[[2,1,1,2]]",
    ],
    "lc-house-robber-ii": [
        "[[2,3,2]]",
        "[[1,2,3,1]]",
        "[[1,2,3]]",
    ],
    "lc-decode-ways": [
        '["12"]',
        '["226"]',
        '["06"]',
    ],
    "lc-unique-paths": [
        "[3, 7]",
        "[3, 2]",
        "[7, 3]",
    ],
    "lc-jump-game": [
        "[[2,3,1,1,4]]",
        "[[3,2,1,0,4]]",
    ],
    "lc-clone-graph": [
        "[[[2,4],[1,3],[2,4],[1,3]]]",
        "[[[]]]",
        "[[]]",
    ],
    "lc-course-schedule": [
        "[2, [[1,0]]]",
        "[2, [[1,0],[0,1]]]",
    ],
    "lc-pacific-atlantic-water-flow": [
        "[[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]]",
        "[[[1]]]",
    ],
    "lc-number-of-islands": [
        '[[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]]',
        '[[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]]',
    ],
    "lc-longest-consecutive-sequence": [
        "[[100,4,200,1,3,2]]",
        "[[0,3,7,2,5,8,4,6,0,1]]",
    ],
    "lc-insert-interval": [
        "[[[1,3],[6,9]], [2,5]]",
        "[[[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]]",
        "[[], [5,7]]",
    ],
    "lc-merge-intervals": [
        "[[[1,3],[2,6],[8,10],[15,18]]]",
        "[[[1,4],[4,5]]]",
    ],
    "lc-non-overlapping-intervals": [
        "[[[1,2],[2,3],[3,4],[1,3]]]",
        "[[[1,2],[1,2],[1,2]]]",
        "[[[1,2],[2,3]]]",
    ],
    "lc-meeting-rooms": [
        "[[[0,30],[5,10],[15,20]]]",
        "[[[7,10],[2,4]]]",
    ],
    "lc-meeting-rooms-ii": [
        "[[[0,30],[5,10],[15,20]]]",
        "[[[7,10],[2,4]]]",
    ],
    "lc-rotate-image": [
        "[[[1,2,3],[4,5,6],[7,8,9]]]",
        "[[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]]",
    ],
    "lc-spiral-matrix": [
        "[[[1,2,3],[4,5,6],[7,8,9]]]",
        "[[[1,2,3,4],[5,6,7,8],[9,10,11,12]]]",
    ],
    "lc-set-matrix-zeroes": [
        "[[[1,1,1],[1,0,1],[1,1,1]]]",
        "[[[0,1,2,0],[3,4,5,2],[1,3,1,5]]]",
    ],
    "lc-number-of-1-bits": [
        "[11]",
        "[128]",
        "[4294967293]",
    ],
    "lc-counting-bits": [
        "[2]",
        "[5]",
    ],
    "lc-missing-number": [
        "[[3,0,1]]",
        "[[0,1]]",
        "[[9,6,4,2,3,5,7,0,1]]",
    ],
    "lc-reverse-bits": [
        "[43261596]",
        "[4294967293]",
    ],
    "lc-sum-of-two-integers": [
        "[1, 2]",
        "[2, 3]",
        "[-1, 1]",
    ],
    "lc-top-k-frequent-elements": [
        "[[1,1,1,2,2,3], 2]",
        "[[1], 1]",
    ],
    "lc-encode-and-decode-strings": [
        '[["Hello","World"]]',
        '[["lint","code","love","you"]]',
        '[[""]]',
    ],
}


# Python wrapper for executing code (same as in index.py)
PYTHON_WRAPPER_PRELUDE = """
import json
import sys
import ast
import inspect
import typing

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
""".strip()

PYTHON_WRAPPER_POSTLUDE = """
def _lc_parse_input(text):
    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        try:
            return ast.literal_eval(text)
        except Exception:
            return text


def _lc_is_list_of_str(values):
    return isinstance(values, list) and all(isinstance(v, str) for v in values)


def _lc_is_design_input(data):
    if isinstance(data, dict):
        return "operations" in data or "ops" in data
    return (
        isinstance(data, (list, tuple))
        and len(data) == 2
        and _lc_is_list_of_str(data[0])
        and isinstance(data[1], list)
    )


def _lc_get_class(name):
    obj = globals().get(name)
    if isinstance(obj, type):
        return obj
    return None


def _lc_get_solution_callable(method_name=None):
    if "Solution" in globals():
        inst = globals()["Solution"]()
        if method_name and hasattr(inst, method_name):
            return getattr(inst, method_name)
        methods = [m for m in dir(inst) if callable(getattr(inst, m)) and not m.startswith("_")]
        if len(methods) == 1:
            return getattr(inst, methods[0])

    funcs = []
    for name, val in globals().items():
        if callable(val) and not name.startswith("_") and not isinstance(val, type):
            if name in {"json", "sys", "ast", "inspect", "typing"}:
                continue
            funcs.append(name)

    if method_name and method_name in globals():
        val = globals()[method_name]
        if callable(val):
            return val

    if len(funcs) == 1:
        return globals()[funcs[0]]

    raise RuntimeError("Could not resolve function to run")


def _lc_annotation_matches(ann, name):
    if ann is None:
        return False
    if ann is globals().get(name):
        return True
    if ann == name:
        return True
    if isinstance(ann, str):
        return ann == name or ann.endswith(f".{name}")
    origin = typing.get_origin(ann)
    if origin is typing.Union:
        return any(_lc_annotation_matches(a, name) for a in typing.get_args(ann) if a is not type(None))
    return False


def _lc_list_to_listnode(values):
    if values is None:
        return None
    if isinstance(values, ListNode):
        return values
    dummy = ListNode(0)
    current = dummy
    for value in values:
        current.next = ListNode(value)
        current = current.next
    return dummy.next


def _lc_listnode_to_list(node):
    values = []
    current = node
    while current is not None:
        values.append(current.val)
        current = current.next
    return values


def _lc_list_to_treenode(values):
    if values is None:
        return None
    if isinstance(values, TreeNode):
        return values
    if not values:
        return None
    nodes = [TreeNode(values[0]) if values[0] is not None else None]
    idx = 1
    for node in nodes:
        if node is None:
            continue
        if idx < len(values):
            val = values[idx]
            node.left = TreeNode(val) if val is not None else None
            nodes.append(node.left)
            idx += 1
        if idx < len(values):
            val = values[idx]
            node.right = TreeNode(val) if val is not None else None
            nodes.append(node.right)
            idx += 1
    return nodes[0]


def _lc_treenode_to_list(root):
    if root is None:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            result.append(None)
            continue
        result.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while result and result[-1] is None:
        result.pop()
    return result


def _lc_convert_arg(value, ann):
    if _lc_annotation_matches(ann, "ListNode"):
        return _lc_list_to_listnode(value)
    if _lc_annotation_matches(ann, "TreeNode"):
        return _lc_list_to_treenode(value)
    return value


def _lc_prepare_args(func, args):
    try:
        sig = inspect.signature(func)
    except (TypeError, ValueError):
        return args
    params = [p for p in sig.parameters.values() if p.name != "self"]
    converted = []
    for idx, arg in enumerate(args):
        ann = params[idx].annotation if idx < len(params) else None
        converted.append(_lc_convert_arg(arg, ann))
    return converted


def _lc_serialize(value):
    if isinstance(value, ListNode):
        return _lc_listnode_to_list(value)
    if isinstance(value, TreeNode):
        return _lc_treenode_to_list(value)
    if isinstance(value, list):
        return [_lc_serialize(v) for v in value]
    if isinstance(value, tuple):
        return [_lc_serialize(v) for v in value]
    if isinstance(value, dict):
        return {k: _lc_serialize(v) for k, v in value.items()}
    return value


def _lc_normalize_args(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return [value]


def _lc_run_design(operations, arguments):
    class_name = operations[0]
    cls = _lc_get_class(class_name)
    if cls is None:
        raise RuntimeError(f"Class {class_name} not found")
    init_args = _lc_normalize_args(arguments[0] if arguments else [])
    obj = cls(*_lc_prepare_args(cls.__init__, init_args))
    outputs = [None]
    for op, arg in zip(operations[1:], arguments[1:]):
        method = getattr(obj, op)
        call_args = _lc_prepare_args(method, _lc_normalize_args(arg))
        outputs.append(method(*call_args))
    print(json.dumps(_lc_serialize(outputs), separators=(",", ":"), ensure_ascii=False))


def _lc_run_single(method_name, args):
    func = _lc_get_solution_callable(method_name)
    call_args = _lc_prepare_args(func, args)
    result = func(*call_args)
    print(json.dumps(_lc_serialize(result), separators=(",", ":"), ensure_ascii=False))


def _lc_main():
    data = sys.stdin.read()
    parsed = _lc_parse_input(data)

    if _lc_is_design_input(parsed):
        if isinstance(parsed, dict):
            operations = parsed.get("operations") or parsed.get("ops") or []
            arguments = parsed.get("arguments") or parsed.get("args") or []
        else:
            operations, arguments = parsed
        _lc_run_design(operations, arguments)
        return

    method_name = None
    args = []
    if isinstance(parsed, dict) and "args" in parsed:
        args = parsed.get("args") or []
        method_name = parsed.get("method")
    elif isinstance(parsed, dict) and parsed is not None:
        args = [parsed]
    elif isinstance(parsed, (list, tuple)):
        args = list(parsed)
    elif parsed is None:
        args = []
    else:
        args = [parsed]

    _lc_run_single(method_name, args)


if __name__ == "__main__":
    _lc_main()
""".strip()


def build_python_wrapper(user_code: str) -> str:
    return "\n".join([PYTHON_WRAPPER_PRELUDE, user_code, PYTHON_WRAPPER_POSTLUDE])


def run_reference_solution(solution_code: str, input_text: str) -> Optional[str]:
    """Run the reference solution and return the output."""
    wrapped = build_python_wrapper(solution_code)

    payload = {
        "language": PISTON_LANGUAGE,
        "files": [{"content": wrapped}],
        "stdin": input_text,
    }
    if PISTON_VERSION:
        payload["version"] = PISTON_VERSION

    try:
        response = httpx.post(
            f"{PISTON_API_URL}/execute",
            json=payload,
            timeout=PISTON_TIMEOUT,
        )
        if response.status_code != 200:
            print(f"    Piston error: {response.status_code}")
            return None

        result = response.json()
        run_result = result.get("run") or {}

        if run_result.get("code", 0) != 0:
            stderr = run_result.get("stderr", "")
            print(f"    Runtime error: {stderr[:200]}")
            return None

        stdout = run_result.get("stdout", "").strip()
        return stdout

    except Exception as e:
        print(f"    Exception: {e}")
        return None


def generate_test_cases_for_problem(
    problem_id: str,
    solution_code: str,
    db,
    dry_run: bool = False
) -> int:
    """Generate test cases for a single problem."""
    print(f"\nProcessing {problem_id}...")

    # Check if test cases already exist
    existing_count = db.query(ProblemTestCase).filter(
        ProblemTestCase.problem_id == problem_id
    ).count()

    if existing_count > 0:
        print(f"  Already has {existing_count} test cases, skipping.")
        return 0

    # Get predefined inputs for this problem
    inputs = PREDEFINED_TEST_INPUTS.get(problem_id, [])

    if not inputs:
        print(f"  No predefined test inputs found.")
        return 0

    created = 0
    for i, input_text in enumerate(inputs):
        print(f"  Test case {i + 1}/{len(inputs)}...")

        # Run reference solution to get expected output
        expected = run_reference_solution(solution_code, input_text)

        if expected is None:
            print(f"    Failed to generate expected output")
            continue

        # Determine if this is a large/performance test
        is_large = "range(" in input_text or len(input_text) > 500
        is_hidden = is_large  # Hide large test cases

        if dry_run:
            print(f"    Input: {input_text[:80]}...")
            print(f"    Expected: {expected[:80]}...")
            print(f"    Hidden: {is_hidden}")
        else:
            test_case = ProblemTestCase(
                problem_id=problem_id,
                input_text=input_text,
                expected_output=expected,
                is_hidden=is_hidden,
                time_limit_ms=DEFAULT_TIME_LIMIT_MS,
                slow_limit_ms=DEFAULT_SLOW_LIMIT_MS,
            )
            db.add(test_case)
            created += 1

    if not dry_run and created > 0:
        db.commit()

    print(f"  Created {created} test cases")
    return created


def main(problem_id: Optional[str] = None, all_problems: bool = False, dry_run: bool = False):
    """Main entry point."""
    print("Initializing database...")
    init_db()

    db = get_session()
    try:
        if problem_id:
            # Generate for a single problem
            ref = db.query(ProblemReference).filter(
                ProblemReference.problem_id == problem_id
            ).first()

            if not ref:
                print(f"Error: Problem {problem_id} not found in references")
                return False

            generate_test_cases_for_problem(
                problem_id,
                ref.solution_code,
                db,
                dry_run=dry_run
            )

        elif all_problems:
            # Generate for all problems with predefined inputs
            refs = db.query(ProblemReference).all()
            total_created = 0

            for ref in refs:
                if ref.problem_id in PREDEFINED_TEST_INPUTS:
                    created = generate_test_cases_for_problem(
                        ref.problem_id,
                        ref.solution_code,
                        db,
                        dry_run=dry_run
                    )
                    total_created += created

            print(f"\n\nTotal test cases created: {total_created}")

        else:
            print("Please specify --problem-id or --all")
            return False

        return True

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate test cases using reference solutions")
    parser.add_argument("--problem-id", help="Generate test cases for a specific problem")
    parser.add_argument("--all", action="store_true", dest="all_problems", help="Generate test cases for all problems with predefined inputs")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created without making changes")
    args = parser.parse_args()

    success = main(
        problem_id=args.problem_id,
        all_problems=args.all_problems,
        dry_run=args.dry_run
    )
    sys.exit(0 if success else 1)
