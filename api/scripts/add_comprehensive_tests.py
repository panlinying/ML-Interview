#!/usr/bin/env python3
"""
Add comprehensive test cases for all problems.
Includes edge cases, normal cases, and performance tests.
"""

import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.db import get_session, ProblemTestCase, ProblemReference, init_db
from api.scripts.generate_test_cases import run_reference_solution

# Comprehensive test inputs organized by problem
# Format: problem_id -> list of (input, is_hidden, description)
COMPREHENSIVE_TESTS = {
    # ===== Arrays =====
    "lc-two-sum": [
        ('[[2,7,11,15], 9]', False, "basic case"),
        ('[[3,2,4], 6]', False, "non-adjacent"),
        ('[[3,3], 6]', False, "duplicate values"),
        ('[[1,2,3,4,5], 9]', False, "sum at end"),
        ('[[0,4,3,0], 0]', False, "zero sum"),
        ('[[-1,-2,-3,-4,-5], -8]', False, "negative numbers"),
        ('[list(range(10000)) + [10001], 19999]', True, "large array"),
    ],
    "lc-best-time-to-buy-and-sell-stock": [
        ('[[7,1,5,3,6,4]]', False, "basic case"),
        ('[[7,6,4,3,1]]', False, "decreasing - no profit"),
        ('[[1,2,3,4,5]]', False, "increasing"),
        ('[[2,4,1]]', False, "buy after drop"),
        ('[[1]]', False, "single element"),
        ('[[1,1,1,1]]', False, "all same"),
        ('[list(range(10000, 0, -1)) + list(range(10000))]', True, "large V-shape"),
    ],
    "lc-contains-duplicate": [
        ('[[1,2,3,1]]', False, "has duplicate"),
        ('[[1,2,3,4]]', False, "no duplicate"),
        ('[[1,1,1,3,3,4,3,2,4,2]]', False, "multiple duplicates"),
        ('[[1]]', False, "single element"),
        ('[[]]', False, "empty array"),
        ('[list(range(100000))]', True, "large no dup"),
        ('[list(range(50000)) + [0]]', True, "large with dup"),
    ],
    "lc-product-of-array-except-self": [
        ('[[1,2,3,4]]', False, "basic"),
        ('[[-1,1,0,-3,3]]', False, "with zero"),
        ('[[0,0]]', False, "multiple zeros"),
        ('[[1,1,1,1]]', False, "all ones"),
        ('[[-1,-2,-3,-4]]', False, "all negative"),
        ('[[2,3]]', False, "two elements"),
    ],
    "lc-maximum-subarray": [
        ('[[-2,1,-3,4,-1,2,1,-5,4]]', False, "mixed"),
        ('[[1]]', False, "single"),
        ('[[5,4,-1,7,8]]', False, "mostly positive"),
        ('[[-1]]', False, "single negative"),
        ('[[-2,-1]]', False, "all negative"),
        ('[[1,2,3,4,5]]', False, "all positive"),
    ],
    "lc-maximum-product-subarray": [
        ('[[2,3,-2,4]]', False, "basic"),
        ('[[-2,0,-1]]', False, "with zero"),
        ('[[-2,3,-4]]', False, "two negatives"),
        ('[[0,2]]', False, "starts with zero"),
        ('[[-2]]', False, "single negative"),
        ('[[2,-5,-2,-4,3]]', False, "complex"),
    ],
    "lc-find-minimum-in-rotated-sorted-array": [
        ('[[3,4,5,1,2]]', False, "rotated"),
        ('[[4,5,6,7,0,1,2]]', False, "rotated more"),
        ('[[11,13,15,17]]', False, "not rotated"),
        ('[[2,1]]', False, "two elements"),
        ('[[1]]', False, "single"),
        ('[[2,3,4,5,1]]', False, "min at end"),
    ],
    "lc-search-in-rotated-sorted-array": [
        ('[[4,5,6,7,0,1,2], 0]', False, "found in right"),
        ('[[4,5,6,7,0,1,2], 3]', False, "not found"),
        ('[[1], 0]', False, "single not found"),
        ('[[1], 1]', False, "single found"),
        ('[[3,1], 3]', False, "two elements"),
        ('[[4,5,6,7,8,1,2,3], 8]', False, "found at pivot"),
    ],
    "lc-3sum": [
        ('[[-1,0,1,2,-1,-4]]', False, "basic"),
        ('[[0,1,1]]', False, "no triplet"),
        ('[[0,0,0]]', False, "all zeros"),
        ('[[0,0,0,0]]', False, "multiple zeros"),
        ('[[-2,0,1,1,2]]', False, "multiple solutions"),
        ('[[]]', False, "empty"),
        ('[[1]]', False, "single"),
    ],
    "lc-container-with-most-water": [
        ('[[1,8,6,2,5,4,8,3,7]]', False, "basic"),
        ('[[1,1]]', False, "minimum"),
        ('[[4,3,2,1,4]]', False, "same at ends"),
        ('[[1,2,1]]', False, "peak in middle"),
        ('[[2,3,4,5,18,17,6]]', False, "large values"),
    ],

    # ===== Binary Search =====
    "lc-binary-search": [
        ('[[-1,0,3,5,9,12], 9]', False, "found"),
        ('[[-1,0,3,5,9,12], 2]', False, "not found"),
        ('[[5], 5]', False, "single found"),
        ('[[5], -5]', False, "single not found"),
        ('[[1,2,3,4,5], 1]', False, "first element"),
        ('[[1,2,3,4,5], 5]', False, "last element"),
    ],
    "lc-search-a-2d-matrix": [
        ('[[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3]', False, "found"),
        ('[[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 13]', False, "not found"),
        ('[[[1]], 1]', False, "single found"),
        ('[[[1]], 0]', False, "single not found"),
        ('[[[1,3],[10,11]], 10]', False, "start of row"),
    ],
    "lc-koko-eating-bananas": [
        ('[[3,6,7,11], 8]', False, "basic"),
        ('[[30,11,23,4,20], 5]', False, "tight"),
        ('[[30,11,23,4,20], 6]', False, "relaxed"),
        ('[[1,1,1,999999999], 10]', False, "large pile"),
        ('[[312884470], 968709470]', False, "single pile"),
    ],
    "lc-median-of-two-sorted-arrays": [
        ('[[1,3], [2]]', False, "odd total"),
        ('[[1,2], [3,4]]', False, "even total"),
        ('[[0,0], [0,0]]', False, "all zeros"),
        ('[[1,2,3], []]', False, "one empty"),
        ('[[], [1]]', False, "first empty"),
        ('[[2], []]', False, "second empty single"),
    ],

    # ===== Sliding Window / Two Pointers =====
    "lc-valid-anagram": [
        ('["anagram", "nagaram"]', False, "valid"),
        ('["rat", "car"]', False, "invalid"),
        ('["a", "a"]', False, "single char"),
        ('["", ""]', False, "empty"),
        ('["ab", "ba"]', False, "swapped"),
        ('["aacc", "ccac"]', False, "same chars diff count"),
    ],
    "lc-group-anagrams": [
        ('[["eat","tea","tan","ate","nat","bat"]]', False, "basic"),
        ('[["a"]]', False, "single"),
        ('[[""]]', False, "empty string"),
        ('[["", ""]]', False, "multiple empty"),
        ('[["abc", "bca", "cab", "xyz"]]', False, "with non-anagram"),
    ],
    "lc-longest-consecutive-sequence": [
        ('[[100,4,200,1,3,2]]', False, "basic"),
        ('[[0,3,7,2,5,8,4,6,0,1]]', False, "with dup"),
        ('[[]]', False, "empty"),
        ('[[1]]', False, "single"),
        ('[[1,2,0,1]]', False, "duplicates"),
        ('[[-1,0,1,2,-2]]', False, "negative"),
    ],

    # ===== Stack =====
    "lc-valid-parentheses": [
        ('["()"]', False, "simple"),
        ('["()[]{}"]', False, "all types"),
        ('["(]"]', False, "mismatch"),
        ('["([)]"]', False, "interleaved"),
        ('[""]', False, "empty"),
        ('["(((())))"]', False, "nested"),
        ('["}{"]', False, "wrong order"),
    ],
    "lc-min-stack": [
        ('[["MinStack","push","push","push","getMin","pop","top","getMin"],[[],[-2],[0],[-3],[],[],[],[]]]', False, "basic"),
        ('[["MinStack","push","push","getMin","pop","getMin"],[[],[0],[1],[],[],[]]]', False, "ascending"),
        ('[["MinStack","push","getMin","push","getMin"],[[],[1],[],[0],[]]]', False, "new min"),
    ],
    "lc-evaluate-reverse-polish-notation": [
        ('[["2","1","+","3","*"]]', False, "basic"),
        ('[["4","13","5","/","+"]]', False, "division"),
        ('[["10","6","9","3","+","-11","*","/","*","17","+","5","+"]]', False, "complex"),
        ('[["18"]]', False, "single"),
        ('[["4","3","-"]]', False, "subtraction"),
    ],
    "lc-daily-temperatures": [
        ('[[73,74,75,71,69,72,76,73]]', False, "basic"),
        ('[[30,40,50,60]]', False, "increasing"),
        ('[[30,60,90]]', False, "always next"),
        ('[[90,80,70,60]]', False, "decreasing"),
        ('[[55,55,55,55]]', False, "all same"),
    ],
    "lc-largest-rectangle-in-histogram": [
        ('[[2,1,5,6,2,3]]', False, "basic"),
        ('[[2,4]]', False, "two bars"),
        ('[[1]]', False, "single"),
        ('[[1,1,1,1]]', False, "all same"),
        ('[[0,9]]', False, "with zero"),
        ('[[4,2,0,3,2,5]]', False, "with zero middle"),
    ],
    "lc-car-fleet": [
        ('[12, [10,8,0,5,3], [2,4,1,1,3]]', False, "basic"),
        ('[10, [3], [3]]', False, "single car"),
        ('[100, [0,2,4], [4,2,1]]', False, "all catch up"),
        ('[10, [6,8], [3,2]]', False, "no catch"),
    ],

    # ===== Linked List =====
    "lc-reverse-linked-list": [
        ('[[1,2,3,4,5]]', False, "basic"),
        ('[[1,2]]', False, "two nodes"),
        ('[[1]]', False, "single"),
        ('[[]]', False, "empty"),
    ],
    "lc-merge-two-sorted-lists": [
        ('[[1,2,4], [1,3,4]]', False, "basic"),
        ('[[], []]', False, "both empty"),
        ('[[], [0]]', False, "one empty"),
        ('[[1], [2]]', False, "single each"),
        ('[[1,2,3], []]', False, "second empty"),
    ],
    "lc-reorder-list": [
        ('[[1,2,3,4]]', False, "even"),
        ('[[1,2,3,4,5]]', False, "odd"),
        ('[[1]]', False, "single"),
        ('[[1,2]]', False, "two"),
    ],
    "lc-remove-nth-node-from-end-of-list": [
        ('[[1,2,3,4,5], 2]', False, "basic"),
        ('[[1], 1]', False, "single"),
        ('[[1,2], 1]', False, "last"),
        ('[[1,2], 2]', False, "first"),
    ],
    "lc-merge-k-sorted-lists": [
        ('[[[1,4,5],[1,3,4],[2,6]]]', False, "basic"),
        ('[[]]', False, "empty"),
        ('[[[]]]', False, "single empty"),
        ('[[[1],[2],[3]]]', False, "single elements"),
    ],

    # ===== Trees =====
    "lc-invert-binary-tree": [
        ('[[4,2,7,1,3,6,9]]', False, "basic"),
        ('[[2,1,3]]', False, "simple"),
        ('[[]]', False, "empty"),
        ('[[1]]', False, "single"),
        ('[[1,2]]', False, "left only"),
    ],
    "lc-maximum-depth-of-binary-tree": [
        ('[[3,9,20,null,null,15,7]]', False, "basic"),
        ('[[1,null,2]]', False, "right only"),
        ('[[]]', False, "empty"),
        ('[[1]]', False, "single"),
    ],
    "lc-same-tree": [
        ('[[1,2,3], [1,2,3]]', False, "same"),
        ('[[1,2], [1,null,2]]', False, "different structure"),
        ('[[1,2,1], [1,1,2]]', False, "different values"),
        ('[[], []]', False, "both empty"),
        ('[[1], [1]]', False, "single same"),
    ],
    "lc-subtree-of-another-tree": [
        ('[[3,4,5,1,2], [4,1,2]]', False, "is subtree"),
        ('[[3,4,5,1,2,null,null,null,null,0], [4,1,2]]', False, "not subtree"),
        ('[[1,1], [1]]', False, "subtree with same val"),
    ],
    "lc-binary-tree-level-order-traversal": [
        ('[[3,9,20,null,null,15,7]]', False, "basic"),
        ('[[1]]', False, "single"),
        ('[[]]', False, "empty"),
        ('[[1,2,3,4,5]]', False, "complete"),
    ],
    "lc-validate-binary-search-tree": [
        ('[[2,1,3]]', False, "valid"),
        ('[[5,1,4,null,null,3,6]]', False, "invalid"),
        ('[[1]]', False, "single"),
        ('[[]]', False, "empty"),
        ('[[5,4,6,null,null,3,7]]', False, "invalid grandchild"),
    ],
    "lc-kth-smallest-element-in-a-bst": [
        ('[[3,1,4,null,2], 1]', False, "basic"),
        ('[[5,3,6,2,4,null,null,1], 3]', False, "larger tree"),
        ('[[1], 1]', False, "single"),
        ('[[2,1], 2]', False, "two nodes"),
    ],
    "lc-binary-tree-maximum-path-sum": [
        ('[[1,2,3]]', False, "basic"),
        ('[[-10,9,20,null,null,15,7]]', False, "with negative"),
        ('[[-3]]', False, "single negative"),
        ('[[1,-2,3]]', False, "skip negative"),
        ('[[2,-1]]', False, "two nodes"),
    ],
    "lc-binary-tree-right-side-view": [
        ('[[1,2,3,null,5,null,4]]', False, "basic"),
        ('[[1,null,3]]', False, "right only"),
        ('[[]]', False, "empty"),
        ('[[1,2,3,4]]', False, "left deeper"),
    ],

    # ===== Graphs =====
    "lc-number-of-islands": [
        ('[[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]]', False, "one island"),
        ('[[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]]', False, "multiple"),
        ('[[["0","0"],["0","0"]]]', False, "no island"),
        ('[[["1"]]]', False, "single cell"),
    ],
    "lc-clone-graph": [
        ('[[[2,4],[1,3],[2,4],[1,3]]]', False, "basic"),
        ('[[[]]]', False, "single node"),
        ('[[]]', False, "null"),
    ],
    "lc-course-schedule": [
        ('[2, [[1,0]]]', False, "simple"),
        ('[2, [[1,0],[0,1]]]', False, "cycle"),
        ('[3, [[1,0],[2,1]]]', False, "chain"),
        ('[1, []]', False, "no prereqs"),
    ],
    "lc-course-schedule-ii": [
        ('[2, [[1,0]]]', False, "simple"),
        ('[4, [[1,0],[2,0],[3,1],[3,2]]]', False, "diamond"),
        ('[2, [[1,0],[0,1]]]', False, "cycle"),
        ('[1, []]', False, "single"),
    ],
    "lc-pacific-atlantic-water-flow": [
        ('[[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]]', False, "basic"),
        ('[[[1]]]', False, "single cell"),
        ('[[[1,1],[1,1]]]', False, "all same"),
    ],
    "lc-rotting-oranges": [
        ('[[[2,1,1],[1,1,0],[0,1,1]]]', False, "basic"),
        ('[[[2,1,1],[0,1,1],[1,0,1]]]', False, "impossible"),
        ('[[[0,2]]]', False, "no fresh"),
        ('[[[0]]]', False, "empty"),
    ],

    # ===== Dynamic Programming =====
    "lc-climbing-stairs": [
        ('[2]', False, "base"),
        ('[3]', False, "three"),
        ('[1]', False, "one"),
        ('[5]', False, "five"),
        ('[45]', False, "large"),
    ],
    "lc-coin-change": [
        ('[[1,2,5], 11]', False, "basic"),
        ('[[2], 3]', False, "impossible"),
        ('[[1], 0]', False, "zero amount"),
        ('[[1], 1]', False, "single coin"),
        ('[[1,2,5], 100]', False, "larger"),
    ],
    "lc-longest-increasing-subsequence": [
        ('[[10,9,2,5,3,7,101,18]]', False, "basic"),
        ('[[0,1,0,3,2,3]]', False, "with dups"),
        ('[[7,7,7,7,7,7,7]]', False, "all same"),
        ('[[1]]', False, "single"),
        ('[[1,2,3,4,5]]', False, "increasing"),
    ],
    "lc-word-break": [
        ('["leetcode", ["leet","code"]]', False, "basic"),
        ('["applepenapple", ["apple","pen"]]', False, "reuse"),
        ('["catsandog", ["cats","dog","sand","and","cat"]]', False, "impossible"),
        ('["a", ["a"]]', False, "single char"),
    ],
    "lc-house-robber": [
        ('[[1,2,3,1]]', False, "basic"),
        ('[[2,7,9,3,1]]', False, "larger"),
        ('[[2,1,1,2]]', False, "ends same"),
        ('[[1]]', False, "single"),
        ('[[1,2]]', False, "two"),
    ],
    "lc-house-robber-ii": [
        ('[[2,3,2]]', False, "basic"),
        ('[[1,2,3,1]]', False, "longer"),
        ('[[1,2,3]]', False, "three"),
        ('[[1]]', False, "single"),
        ('[[1,2]]', False, "two"),
    ],
    "lc-decode-ways": [
        ('["12"]', False, "basic"),
        ('["226"]', False, "multiple"),
        ('["06"]', False, "leading zero"),
        ('["0"]', False, "just zero"),
        ('["10"]', False, "ten"),
        ('["27"]', False, "27"),
    ],
    "lc-unique-paths": [
        ('[3, 7]', False, "basic"),
        ('[3, 2]', False, "small"),
        ('[1, 1]', False, "corner"),
        ('[7, 3]', False, "reversed"),
    ],
    "lc-unique-paths-ii": [
        ('[[[0,0,0],[0,1,0],[0,0,0]]]', False, "basic"),
        ('[[[0,1],[0,0]]]', False, "small obstacle"),
        ('[[[1,0]]]', False, "blocked start"),
        ('[[[0,0],[0,1]]]', False, "blocked end"),
    ],
    "lc-longest-palindromic-substring": [
        ('["babad"]', False, "odd"),
        ('["cbbd"]', False, "even"),
        ('["a"]', False, "single"),
        ('["ac"]', False, "no palindrome"),
        ('["aaaa"]', False, "all same"),
    ],
    "lc-palindromic-substrings": [
        ('["abc"]', False, "basic"),
        ('["aaa"]', False, "all same"),
        ('["a"]', False, "single"),
        ('["abba"]', False, "even palindrome"),
    ],
    "lc-longest-common-subsequence": [
        ('["abcde", "ace"]', False, "basic"),
        ('["abc", "abc"]', False, "same"),
        ('["abc", "def"]', False, "no common"),
        ('["", "abc"]', False, "empty"),
    ],
    "lc-edit-distance": [
        ('["horse", "ros"]', False, "basic"),
        ('["intention", "execution"]', False, "longer"),
        ('["", "a"]', False, "empty to char"),
        ('["a", "a"]', False, "same"),
    ],
    "lc-target-sum": [
        ('[[1,1,1,1,1], 3]', False, "basic"),
        ('[[1], 1]', False, "single"),
        ('[[1,2,1], 0]', False, "zero target"),
        ('[[1], 2]', False, "impossible"),
    ],
    "lc-partition-equal-subset-sum": [
        ('[[1,5,11,5]]', False, "possible"),
        ('[[1,2,3,5]]', False, "impossible"),
        ('[[1,1]]', False, "simple"),
        ('[[2,2,1,1]]', False, "multiple ways"),
    ],
    "lc-coin-change-ii": [
        ('[5, [1,2,5]]', False, "basic"),
        ('[3, [2]]', False, "impossible"),
        ('[10, [10]]', False, "exact"),
        ('[0, [1,2]]', False, "zero amount"),
    ],

    # ===== Intervals =====
    "lc-insert-interval": [
        ('[[[1,3],[6,9]], [2,5]]', False, "overlap one"),
        ('[[[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]]', False, "overlap many"),
        ('[[], [5,7]]', False, "empty"),
        ('[[[1,5]], [2,3]]', False, "inside"),
        ('[[[1,5]], [0,0]]', False, "before all"),
    ],
    "lc-merge-intervals": [
        ('[[[1,3],[2,6],[8,10],[15,18]]]', False, "basic"),
        ('[[[1,4],[4,5]]]', False, "touching"),
        ('[[[1,4],[0,4]]]', False, "complete overlap"),
        ('[[[1,4]]]', False, "single"),
    ],
    "lc-non-overlapping-intervals": [
        ('[[[1,2],[2,3],[3,4],[1,3]]]', False, "basic"),
        ('[[[1,2],[1,2],[1,2]]]', False, "all same"),
        ('[[[1,2],[2,3]]]', False, "no removal"),
    ],
    "lc-meeting-rooms": [
        ('[[[0,30],[5,10],[15,20]]]', False, "overlapping"),
        ('[[[7,10],[2,4]]]', False, "non-overlapping"),
        ('[[[0,5],[5,10]]]', False, "touching"),
        ('[[]]', False, "empty"),
    ],
    "lc-meeting-rooms-ii": [
        ('[[[0,30],[5,10],[15,20]]]', False, "overlapping"),
        ('[[[7,10],[2,4]]]', False, "sequential"),
        ('[[[0,5],[5,10],[10,15]]]', False, "back to back"),
        ('[[[1,5],[2,6],[3,7]]]', False, "all overlap"),
    ],

    # ===== Backtracking =====
    "lc-subsets": [
        ('[[1,2,3]]', False, "basic"),
        ('[[0]]', False, "single"),
        ('[[]]', False, "empty"),
        ('[[1,2]]', False, "two"),
    ],
    "lc-subsets-ii": [
        ('[[1,2,2]]', False, "with dups"),
        ('[[0]]', False, "single"),
        ('[[4,4,4,1,4]]', False, "many dups"),
    ],
    "lc-permutations": [
        ('[[1,2,3]]', False, "basic"),
        ('[[0,1]]', False, "two"),
        ('[[1]]', False, "single"),
    ],
    "lc-combination-sum": [
        ('[[2,3,6,7], 7]', False, "basic"),
        ('[[2,3,5], 8]', False, "multiple"),
        ('[[2], 1]', False, "impossible"),
        ('[[1], 2]', False, "use multiple"),
    ],
    "lc-combination-sum-ii": [
        ('[[10,1,2,7,6,1,5], 8]', False, "basic"),
        ('[[2,5,2,1,2], 5]', False, "with dups"),
        ('[[1,1,1,1], 2]', False, "all same"),
    ],
    "lc-word-search": [
        ('[[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"]', False, "found"),
        ('[[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "SEE"]', False, "found 2"),
        ('[[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"]', False, "not found"),
        ('[[["a"]], "a"]', False, "single cell"),
    ],
    "lc-palindrome-partitioning": [
        ('["aab"]', False, "basic"),
        ('["a"]', False, "single"),
        ('["aa"]', False, "two same"),
        ('["aaa"]', False, "three same"),
    ],
    "lc-n-queens": [
        ('[4]', False, "basic"),
        ('[1]', False, "trivial"),
        ('[5]', False, "larger"),
    ],

    # ===== Heaps =====
    "lc-top-k-frequent-elements": [
        ('[[1,1,1,2,2,3], 2]', False, "basic"),
        ('[[1], 1]', False, "single"),
        ('[[1,2], 2]', False, "all unique k=all"),
        ('[[4,1,-1,2,-1,2,3], 2]', False, "with negative"),
    ],
    "lc-find-median-from-data-stream": [
        ('[["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"],[[],[1],[2],[],[3],[]]]', False, "basic"),
        ('[["MedianFinder","addNum","findMedian"],[[],[1],[]]]', False, "single"),
    ],
    "lc-kth-largest-element-in-an-array": [
        ('[[3,2,1,5,6,4], 2]', False, "basic"),
        ('[[3,2,3,1,2,4,5,5,6], 4]', False, "with dups"),
        ('[[1], 1]', False, "single"),
    ],
    "lc-task-scheduler": [
        ('[["A","A","A","B","B","B"], 2]', False, "basic"),
        ('[["A","A","A","B","B","B"], 0]', False, "no cooldown"),
        ('[["A","A","A","A","A","A","B","C","D","E","F","G"], 2]', False, "one dominant"),
    ],

    # ===== Tries =====
    "lc-implement-trie-prefix-tree": [
        ('[["Trie","insert","search","search","startsWith","insert","search"],[[],"apple","apple","app","app","app","app"]]', False, "basic"),
        ('[["Trie","insert","search","startsWith"],[[],"a","a","a"]]', False, "single char"),
    ],
    "lc-longest-common-prefix": [
        ('[["flower","flow","flight"]]', False, "common prefix"),
        ('[["dog","racecar","car"]]', False, "no common"),
        ('[["a"]]', False, "single string"),
        ('[["", "a"]]', False, "with empty"),
    ],

    # ===== Design =====
    "lc-lru-cache": [
        ('[["LRUCache","put","put","get","put","get","put","get","get","get"],[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]]', False, "basic"),
        ('[["LRUCache","put","get"],[[1],[2,1],[2]]]', False, "simple"),
    ],
    "lc-subarray-sum-equals-k": [
        ('[[1,1,1], 2]', False, "basic"),
        ('[[1,2,3], 3]', False, "multiple ways"),
        ('[[1,-1,0], 0]', False, "with zeros"),
        ('[[1], 1]', False, "single"),
        ('[[1], 0]', False, "no match"),
        ('[[-1,-1,1], 0]', False, "negative"),
    ],
    "lc-max-area-of-island": [
        ('[[[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]]]', False, "basic"),
        ('[[[0,0,0,0,0,0,0,0]]]', False, "no island"),
        ('[[[1,1],[1,0]]]', False, "simple"),
    ],
    "lc-best-time-to-buy-and-sell-stock-with-cooldown": [
        ('[[1,2,3,0,2]]', False, "basic"),
        ('[[1]]', False, "single"),
        ('[[1,2,4]]', False, "increasing"),
    ],
    "lc-burst-balloons": [
        ('[[3,1,5,8]]', False, "basic"),
        ('[[1,5]]', False, "two"),
        ('[[7,9,8,0,7,1,3,5,5,2,3]]', False, "larger"),
    ],
    "lc-network-delay-time": [
        ('[[[2,1,1],[2,3,1],[3,4,1]], 4, 2]', False, "basic"),
        ('[[[1,2,1]], 2, 1]', False, "simple"),
        ('[[[1,2,1]], 2, 2]', False, "unreachable"),
    ],
    "lc-cheapest-flights-within-k-stops": [
        ('[4, [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], 0, 3, 1]', False, "basic"),
        ('[3, [[0,1,100],[1,2,100],[0,2,500]], 0, 2, 1]', False, "direct vs stop"),
        ('[3, [[0,1,100],[1,2,100],[0,2,500]], 0, 2, 0]', False, "no stops"),
    ],
    "lc-redundant-connection": [
        ('[[[1,2],[1,3],[2,3]]]', False, "basic"),
        ('[[[1,2],[2,3],[3,4],[1,4],[1,5]]]', False, "larger"),
    ],
    "lc-word-ladder": [
        ('["hit", "cog", ["hot","dot","dog","lot","log","cog"]]', False, "basic"),
        ('["hit", "cog", ["hot","dot","dog","lot","log"]]', False, "no path"),
        ('["a", "c", ["a","b","c"]]', False, "short words"),
    ],
    "lc-min-cost-climbing-stairs": [
        ('[[10,15,20]]', False, "basic"),
        ('[[1,100,1,1,1,100,1,1,100,1]]', False, "longer"),
        ('[[0,0,0,1]]', False, "with zeros"),
    ],
    "lc-minimum-path-sum": [
        ('[[[1,3,1],[1,5,1],[4,2,1]]]', False, "basic"),
        ('[[[1,2,3],[4,5,6]]]', False, "rectangular"),
        ('[[[1]]]', False, "single"),
    ],
    "lc-interleaving-string": [
        ('["aabcc", "dbbca", "aadbbcbcac"]', False, "true"),
        ('["aabcc", "dbbca", "aadbbbaccc"]', False, "false"),
        ('["", "", ""]', False, "all empty"),
        ('["a", "", "a"]', False, "one empty"),
    ],
}


def main():
    print("Initializing database...")
    init_db()

    db = get_session()
    total_created = 0

    try:
        for problem_id, test_cases in COMPREHENSIVE_TESTS.items():
            # Get reference
            ref = db.query(ProblemReference).filter(
                ProblemReference.problem_id == problem_id
            ).first()

            if not ref:
                continue

            # Get existing test cases
            existing = db.query(ProblemTestCase).filter(
                ProblemTestCase.problem_id == problem_id
            ).all()
            existing_inputs = {tc.input_text for tc in existing}

            print(f"\n{problem_id} (existing: {len(existing_inputs)})")
            created = 0

            for input_text, is_hidden, desc in test_cases:
                # Skip if already exists
                if input_text in existing_inputs:
                    continue

                # Run reference solution
                expected = run_reference_solution(ref.solution_code, input_text)

                if expected:
                    tc = ProblemTestCase(
                        problem_id=problem_id,
                        input_text=input_text,
                        expected_output=expected,
                        is_hidden=is_hidden,
                        time_limit_ms=2000,
                        slow_limit_ms=4000,
                    )
                    db.add(tc)
                    db.commit()
                    created += 1
                    print(f"  + {desc}")
                else:
                    print(f"  - {desc} (failed)")

                time.sleep(0.3)  # Rate limit

            if created > 0:
                total_created += created
                print(f"  Added {created} new test cases")

        print(f"\n\nTotal new test cases: {total_created}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
