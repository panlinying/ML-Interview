#!/usr/bin/env python3
"""
Add more simple test cases for problems with low coverage (1-3 test cases).
These use simple inputs that are more likely to work with the execution wrapper.
"""

import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
import time

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.db import get_session, ProblemReference, ProblemTestCase, init_db

# Piston API configuration
PISTON_API_URL = os.environ.get("PISTON_API_URL", "https://emkc.org/api/v2/piston").rstrip("/")
PISTON_LANGUAGE = "python"
PISTON_VERSION = "3.10.0"

# Python wrapper from generate_test_cases.py
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


# Additional test cases for low-coverage problems
ADDITIONAL_TEST_INPUTS: Dict[str, List[str]] = {
    # Clone graph - 1 case, add more
    "lc-clone-graph": [
        "[[[2],[1,3],[2]]]",  # Simple triangle
        "[[[2,3],[1],[1]]]",  # Star pattern
    ],
    # Merge k sorted lists - 2 cases
    "lc-merge-k-sorted-lists": [
        "[[[1,2,3]]]",  # Single list
        "[[[1,5],[2,4],[3]]]",  # Three lists
    ],
    # Find median from data stream - 2 cases
    "lc-find-median-from-data-stream": [
        '[["MedianFinder","addNum","findMedian","addNum","findMedian","addNum","findMedian"],[[],[1],[],[2],[],[3],[]]]',
        '[["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"],[[],[5],[2],[],[3],[]]]',
    ],
    # Implement trie - 2 cases
    "lc-implement-trie-prefix-tree": [
        '[["Trie","insert","search","search","startsWith"],[[],["hello"],["hello"],["hel"],["hel"]]]',
        '[["Trie","insert","insert","search","search","startsWith"],[[],["apple"],["app"],["app"],["apple"],["ap"]]]',
    ],
    # Redundant connection - 2 cases
    "lc-redundant-connection": [
        "[[[1,2],[1,3],[2,3]]]",
        "[[[1,2],[2,3],[3,4],[4,1]]]",
    ],
    # LRU Cache - 2 cases
    "lc-lru-cache": [
        '[["LRUCache","put","put","get","put","get"],[[2],[1,1],[2,2],[1],[3,3],[2]]]',
        '[["LRUCache","put","get","put","get","get"],[[1],[2,1],[2],[3,2],[2],[3]]]',
    ],
    # Subtree of another tree - 3 cases
    "lc-subtree-of-another-tree": [
        "[[1,2,3], [2]]",  # Simple match
    ],
    # Cheapest flights - 3 cases
    "lc-cheapest-flights-within-k-stops": [
        "[3, [[0,1,100],[1,2,100]], 0, 2, 1]",
        "[3, [[0,1,100],[1,2,100],[0,2,500]], 0, 2, 0]",
    ],
    # Burst balloons - 3 cases
    "lc-burst-balloons": [
        "[[3,1,5]]",
        "[[1,5]]",
    ],
    # Min path sum - 3 cases
    "lc-minimum-path-sum": [
        "[[[1,2],[3,4]]]",
        "[[[1,1,1],[1,1,1]]]",
    ],
    # Kth largest in array - 3 cases
    "lc-kth-largest-element-in-an-array": [
        "[[3,2,1,5,6,4], 2]",
        "[[1], 1]",
    ],
    # Word ladder - 3 cases
    "lc-word-ladder": [
        '["hot", "dog", ["hot","dot","dog"]]',
        '["hit", "hot", ["hot"]]',
    ],
    # Combination sum II - 3 cases
    "lc-combination-sum-ii": [
        "[[2,5,2,1,2], 5]",
        "[[1,1,1,1,1], 3]",
    ],
    # Best time to buy - cooldown - 3 cases
    "lc-best-time-to-buy-and-sell-stock-with-cooldown": [
        "[[1,2,3,0,2]]",
        "[[1,2,4]]",
    ],
    # Network delay time - 3 cases
    "lc-network-delay-time": [
        "[[[1,2,1]], 2, 1]",
        "[[[1,2,1],[2,3,1]], 3, 1]",
    ],
    # Task scheduler - 3 cases
    "lc-task-scheduler": [
        '["A","A","A"], 1]',  # This needs to be a string with proper format
    ],
    # Pacific atlantic - 3 cases
    "lc-pacific-atlantic-water-flow": [
        "[[[1,2],[2,1]]]",
        "[[[3,2],[1,4]]]",
    ],
    # Subsets II - 3 cases
    "lc-subsets-ii": [
        "[[1,1]]",
        "[[1,2,2]]",
    ],
    # Non overlapping intervals - 3 cases
    "lc-non-overlapping-intervals": [
        "[[[0,1],[1,2]]]",
        "[[[1,3],[2,4],[3,5]]]",
    ],
    # N-Queens - 3 cases
    "lc-n-queens": [
        "[1]",
        "[2]",
    ],
    # Permutations - 3 cases
    "lc-permutations": [
        "[[1]]",
        "[[1,2]]",
    ],
    # Min cost climbing - 3 cases
    "lc-min-cost-climbing-stairs": [
        "[[1,100]]",
        "[[10,15,20]]",
    ],
    # Merge two sorted lists - 3 cases
    "lc-merge-two-sorted-lists": [
        "[[1], [2]]",
        "[[1,3,5], [2,4,6]]",
    ],
    # Max area of island - 3 cases
    "lc-max-area-of-island": [
        '[[["1"]]]',
        '[[["1","1"],["1","1"]]]',
    ],
    # Min stack - 3 cases
    "lc-min-stack": [
        '[["MinStack","push","push","getMin","pop","getMin"],[[],[2],[1],[],[],[]]]',
        '[["MinStack","push","getMin","push","getMin","pop","getMin"],[[],[5],[],[3],[],[],[]]]',
    ],
}


def run_reference_solution(solution_code: str, input_text: str) -> Optional[str]:
    """Run the reference solution and return the output."""
    wrapped = "\n".join([PYTHON_WRAPPER_PRELUDE, solution_code, PYTHON_WRAPPER_POSTLUDE])

    payload = {
        "language": PISTON_LANGUAGE,
        "version": PISTON_VERSION,
        "files": [{"content": wrapped}],
        "stdin": input_text,
    }

    try:
        response = httpx.post(
            f"{PISTON_API_URL}/execute",
            json=payload,
            timeout=15.0,
        )
        if response.status_code != 200:
            print(f"    Piston error: {response.status_code}")
            return None

        result = response.json()
        run_result = result.get("run") or {}

        if run_result.get("code", 0) != 0:
            stderr = run_result.get("stderr", "")
            print(f"    Runtime error: {stderr[:100]}")
            return None

        stdout = run_result.get("stdout", "").strip()
        return stdout

    except Exception as e:
        print(f"    Exception: {e}")
        return None


def add_test_cases_for_problem(problem_id: str, inputs: List[str], db) -> int:
    """Add test cases for a single problem."""
    ref = db.query(ProblemReference).filter(
        ProblemReference.problem_id == problem_id
    ).first()

    if not ref:
        print(f"  No reference solution found")
        return 0

    added = 0
    for input_text in inputs:
        expected = run_reference_solution(ref.solution_code, input_text)

        if expected is None:
            print(f"  - Failed: {input_text[:50]}...")
            continue

        # Check if test case already exists
        existing = db.query(ProblemTestCase).filter(
            ProblemTestCase.problem_id == problem_id,
            ProblemTestCase.input_text == input_text
        ).first()

        if existing:
            print(f"  - Already exists: {input_text[:50]}...")
            continue

        test_case = ProblemTestCase(
            problem_id=problem_id,
            input_text=input_text,
            expected_output=expected,
            is_hidden=False,
            time_limit_ms=2000,
            slow_limit_ms=4000,
        )
        db.add(test_case)
        added += 1
        print(f"  + Added: {input_text[:50]}... -> {expected[:30]}...")

    if added > 0:
        db.commit()

    return added


def main():
    print("Initializing database...")
    init_db()

    db = get_session()
    total_added = 0

    try:
        for problem_id, inputs in ADDITIONAL_TEST_INPUTS.items():
            print(f"\n{problem_id}:")
            added = add_test_cases_for_problem(problem_id, inputs, db)
            total_added += added
            time.sleep(0.5)  # Rate limiting

        print(f"\n\nTotal test cases added: {total_added}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
