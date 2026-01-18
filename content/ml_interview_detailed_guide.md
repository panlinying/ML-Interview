# ML Engineer Interview: Detailed Execution Guide
## Exact Problems, Videos, and Learning Methods

---

# PART 1: CODING PREPARATION

## How to Learn a Pattern Efficiently (The Method)

```
Step 1: Watch the pattern explanation video (15-20 min)
Step 2: Solve the "template" problem with video solution (30 min)
Step 3: Solve 2-3 similar problems applying the pattern (1 hour)
Step 4: Solve 1-2 harder variations without help (45 min)
Step 5: Next day - redo 1 problem from memory (15 min)
```

**Key Principle:** Don't just solve problems. Learn the PATTERN, then apply it repeatedly.

---

## Week 1: Arrays, Strings & Hash Maps

### Day 1-2: Arrays & Two Pointers

**Watch First (Essential):**
- NeetCode: "Two Pointers" pattern → https://www.youtube.com/watch?v=cQ1Oz4ckceM
- NeetCode: "Sliding Window" pattern → https://www.youtube.com/watch?v=p-ss2JNynmw

**Problems in Order:**

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #1 | Two Sum | Easy | Hash Map | https://www.youtube.com/watch?v=KLlXCFG5TnA |
| 2 | LC #121 | Best Time to Buy and Sell Stock | Easy | Sliding Window | https://www.youtube.com/watch?v=1pkOgXD63yU |
| 3 | LC #217 | Contains Duplicate | Easy | Hash Set | https://www.youtube.com/watch?v=3OamzN90kPg |
| 4 | LC #238 | Product of Array Except Self | Medium | Prefix/Suffix | https://www.youtube.com/watch?v=bNvIQI2wAjk |
| 5 | LC #53 | Maximum Subarray | Medium | Kadane's | https://www.youtube.com/watch?v=5WZl3MMT0Eg |
| 6 | LC #152 | Maximum Product Subarray | Medium | DP/Kadane's | https://www.youtube.com/watch?v=lXVy6YWFcRM |
| 7 | LC #153 | Find Minimum in Rotated Sorted Array | Medium | Binary Search | https://www.youtube.com/watch?v=nIVW4P8b1VA |
| 8 | LC #33 | Search in Rotated Sorted Array | Medium | Binary Search | https://www.youtube.com/watch?v=U8XENwh8Oy8 |
| 9 | LC #11 | Container With Most Water | Medium | Two Pointers | https://www.youtube.com/watch?v=UuiTKBwPgAo |
| 10 | LC #15 | 3Sum | Medium | Two Pointers | https://www.youtube.com/watch?v=jzZsG8n2R9A |

**How to solve each:**
```
LC #1 (Two Sum):
1. Brute force: O(n²) - two nested loops
2. Optimal: O(n) - use hash map to store {value: index}
3. One pass: check if (target - num) exists in map

LC #121 (Best Time to Buy/Sell):
1. Track minimum price seen so far
2. At each price, calculate profit = current - min
3. Track maximum profit

LC #11 (Container With Most Water):
1. Two pointers at start and end
2. Calculate area = min(height[l], height[r]) * (r - l)
3. Move the pointer with smaller height inward
```

### Day 3-4: Hash Maps Deep Dive

**Watch First:**
- NeetCode: Hash Map patterns → https://www.youtube.com/watch?v=P6RZZMu_maU

**Problems in Order:**

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #242 | Valid Anagram | Easy | Hash Map Count | https://www.youtube.com/watch?v=9UtInBqnCgA |
| 2 | LC #49 | Group Anagrams | Medium | Hash Map + Sort | https://www.youtube.com/watch?v=vzdNOK2oB2E |
| 3 | LC #347 | Top K Frequent Elements | Medium | Hash Map + Heap | https://www.youtube.com/watch?v=YPTqKIgVk-k |
| 4 | LC #271 | Encode and Decode Strings | Medium | Delimiter | https://www.youtube.com/watch?v=B1k_sxOSgv8 |
| 5 | LC #128 | Longest Consecutive Sequence | Medium | Hash Set | https://www.youtube.com/watch?v=P6RZZMu_maU |
| 6 | LC #146 | LRU Cache | Medium | Hash Map + DLL | https://www.youtube.com/watch?v=7ABFKPK2hD4 |
| 7 | LC #380 | Insert Delete GetRandom O(1) | Medium | Hash Map + Array | https://www.youtube.com/watch?v=j4KwhBziOpg |
| 8 | LC #560 | Subarray Sum Equals K | Medium | Prefix Sum + Map | https://www.youtube.com/watch?v=fFVZt-6sgyo |

**Key Templates:**

```python
# Template: Frequency Count
from collections import Counter
freq = Counter(nums)  # or Counter(s) for strings

# Template: Two Sum Pattern (find pair)
seen = {}
for i, num in enumerate(nums):
    complement = target - num
    if complement in seen:
        return [seen[complement], i]
    seen[num] = i

# Template: Group by Key
from collections import defaultdict
groups = defaultdict(list)
for item in items:
    key = get_key(item)  # e.g., tuple(sorted(item))
    groups[key].append(item)
```

### Day 5-7: Linked Lists

**Watch First:**
- NeetCode: Linked List playlist → https://www.youtube.com/watch?v=G0_I-ZF0S38

**Problems in Order:**

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #206 | Reverse Linked List | Easy | Iterative/Recursive | https://www.youtube.com/watch?v=G0_I-ZF0S38 |
| 2 | LC #21 | Merge Two Sorted Lists | Easy | Two Pointers | https://www.youtube.com/watch?v=XIdigk956u0 |
| 3 | LC #141 | Linked List Cycle | Easy | Fast/Slow Pointer | https://www.youtube.com/watch?v=gBTe7lFR3vc |
| 4 | LC #142 | Linked List Cycle II | Medium | Floyd's Algorithm | https://www.youtube.com/watch?v=wjYnzkAhcNk |
| 5 | LC #143 | Reorder List | Medium | Multiple Techniques | https://www.youtube.com/watch?v=S5bfdUTrKLM |
| 6 | LC #19 | Remove Nth Node From End | Medium | Two Pointers | https://www.youtube.com/watch?v=XVuQxVej6y8 |
| 7 | LC #23 | Merge K Sorted Lists | Hard | Heap/Divide Conquer | https://www.youtube.com/watch?v=q5a5OiGbT6Q |

**Key Templates:**

```python
# Template: Reverse Linked List
def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

# Template: Fast/Slow Pointer (find middle)
def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

# Template: Dummy Node (for edge cases)
dummy = ListNode(0)
dummy.next = head
# ... operations
return dummy.next
```

---

## Week 2: Binary Trees & Graphs

### Day 1-3: Binary Trees

**Watch First (CRITICAL):**
- NeetCode: Binary Tree playlist → https://www.youtube.com/watch?v=OnSn2XEQ4MY
- Abdul Bari: Tree Traversals → https://www.youtube.com/watch?v=BHB0B1jFKQc

**Problems in Order:**

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #226 | Invert Binary Tree | Easy | DFS Recursive | https://www.youtube.com/watch?v=OnSn2XEQ4MY |
| 2 | LC #104 | Maximum Depth of Binary Tree | Easy | DFS | https://www.youtube.com/watch?v=hTM3phVI6YQ |
| 3 | LC #100 | Same Tree | Easy | DFS Compare | https://www.youtube.com/watch?v=vRbbcKXCxOw |
| 4 | LC #572 | Subtree of Another Tree | Easy | DFS + Same Tree | https://www.youtube.com/watch?v=E36O5SWp-LE |
| 5 | LC #102 | Binary Tree Level Order Traversal | Medium | BFS | https://www.youtube.com/watch?v=6ZnyEApgFYg |
| 6 | LC #199 | Binary Tree Right Side View | Medium | BFS | https://www.youtube.com/watch?v=d4zLyf32e3I |
| 7 | LC #98 | Validate Binary Search Tree | Medium | DFS + Range | https://www.youtube.com/watch?v=s6ATEkipzow |
| 8 | LC #230 | Kth Smallest Element in BST | Medium | Inorder | https://www.youtube.com/watch?v=5LUXSvjmGCw |
| 9 | LC #235 | Lowest Common Ancestor of BST | Medium | BST Property | https://www.youtube.com/watch?v=gs2LMfuOR9k |
| 10 | LC #236 | Lowest Common Ancestor of BT | Medium | DFS | https://www.youtube.com/watch?v=py3R23aAPCA |
| 11 | LC #297 | Serialize and Deserialize BT | Hard | BFS/DFS | https://www.youtube.com/watch?v=u4JAi2JJhI8 |
| 12 | LC #124 | Binary Tree Maximum Path Sum | Hard | DFS + Global Max | https://www.youtube.com/watch?v=Hr5cWUld4vU |

**Key Templates:**

```python
# Template: DFS Recursive
def dfs(node):
    if not node:
        return base_case
    left = dfs(node.left)
    right = dfs(node.right)
    return combine(left, right, node.val)

# Template: BFS Level Order
from collections import deque
def bfs(root):
    if not root:
        return []
    queue = deque([root])
    result = []
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result

# Template: Validate BST
def isValidBST(root, min_val=float('-inf'), max_val=float('inf')):
    if not root:
        return True
    if not (min_val < root.val < max_val):
        return False
    return (isValidBST(root.left, min_val, root.val) and 
            isValidBST(root.right, root.val, max_val))
```

### Day 4-6: Graphs BFS/DFS

**Watch First (CRITICAL):**
- NeetCode: Graph playlist → https://www.youtube.com/watch?v=EgI5nU9etnU
- William Fiset: Graph Theory playlist → https://www.youtube.com/watch?v=DgXR2OWQnLc&list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P

**Problems in Order:**

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #200 | Number of Islands | Medium | DFS/BFS Grid | https://www.youtube.com/watch?v=pV2kpPD66nE |
| 2 | LC #695 | Max Area of Island | Medium | DFS Grid | https://www.youtube.com/watch?v=iJGr1OtmH0c |
| 3 | LC #133 | Clone Graph | Medium | DFS + HashMap | https://www.youtube.com/watch?v=mQeF6bN8hMk |
| 4 | LC #417 | Pacific Atlantic Water Flow | Medium | Multi-source DFS | https://www.youtube.com/watch?v=s-VkcjHqkGI |
| 5 | LC #207 | Course Schedule | Medium | Topological Sort | https://www.youtube.com/watch?v=EgI5nU9etnU |
| 6 | LC #210 | Course Schedule II | Medium | Topological Sort | https://www.youtube.com/watch?v=Akt3glAwyfY |
| 7 | LC #994 | Rotting Oranges | Medium | Multi-source BFS | https://www.youtube.com/watch?v=y704fEOx0s0 |
| 8 | LC #286 | Walls and Gates | Medium | Multi-source BFS | https://www.youtube.com/watch?v=e69C6xhiSQE |

**Key Templates:**

```python
# Template: DFS on Grid
def numIslands(grid):
    def dfs(i, j):
        if i < 0 or i >= len(grid) or j < 0 or j >= len(grid[0]):
            return
        if grid[i][j] != '1':
            return
        grid[i][j] = '#'  # mark visited
        dfs(i+1, j)
        dfs(i-1, j)
        dfs(i, j+1)
        dfs(i, j-1)
    
    count = 0
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j] == '1':
                dfs(i, j)
                count += 1
    return count

# Template: Topological Sort (DFS)
def canFinish(numCourses, prerequisites):
    graph = defaultdict(list)
    for crs, pre in prerequisites:
        graph[crs].append(pre)
    
    UNVISITED, VISITING, VISITED = 0, 1, 2
    states = [UNVISITED] * numCourses
    
    def dfs(crs):
        if states[crs] == VISITING:
            return False  # cycle detected
        if states[crs] == VISITED:
            return True
        
        states[crs] = VISITING
        for pre in graph[crs]:
            if not dfs(pre):
                return False
        states[crs] = VISITED
        return True
    
    return all(dfs(crs) for crs in range(numCourses))

# Template: BFS on Grid
from collections import deque
def bfs_grid(grid, start_i, start_j):
    queue = deque([(start_i, start_j, 0)])  # (row, col, distance)
    visited = {(start_i, start_j)}
    directions = [(0,1), (0,-1), (1,0), (-1,0)]
    
    while queue:
        i, j, dist = queue.popleft()
        for di, dj in directions:
            ni, nj = i + di, j + dj
            if 0 <= ni < len(grid) and 0 <= nj < len(grid[0]):
                if (ni, nj) not in visited and grid[ni][nj] != '#':
                    visited.add((ni, nj))
                    queue.append((ni, nj, dist + 1))
```

### Day 7: Review + LeetCode Weekly Contest

- Sign up: https://leetcode.com/contest/
- Contests are Saturday 7:30 PM PST or Sunday 2:30 AM PST
- Do virtual contests if you miss live ones

---

## Week 3: Dynamic Programming

**Watch First (CRITICAL - spend 2 hours here):**
- NeetCode DP playlist: https://www.youtube.com/watch?v=mBNrRy2_hVs&list=PLot-Xpze53lcvx_tjrr_m2lgD2NsRHlNO
- Abdul Bari DP: https://www.youtube.com/watch?v=5dRGRueKU3M

**DP Learning Method:**
```
1. Identify if it's DP (optimal substructure + overlapping subproblems)
2. Define state: dp[i] = what does this represent?
3. Find recurrence: dp[i] = f(dp[i-1], dp[i-2], ...)
4. Determine base cases
5. Determine traversal order
6. Optimize space if possible
```

### Day 1-2: 1D Dynamic Programming

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #70 | Climbing Stairs | Easy | Fibonacci-style | https://www.youtube.com/watch?v=Y0lT9Fck7qI |
| 2 | LC #746 | Min Cost Climbing Stairs | Easy | Min path | https://www.youtube.com/watch?v=ktmzAZWkEZ0 |
| 3 | LC #198 | House Robber | Medium | Skip pattern | https://www.youtube.com/watch?v=73r3KWiEvyk |
| 4 | LC #213 | House Robber II | Medium | Circular array | https://www.youtube.com/watch?v=rWAJCfYYOvM |
| 5 | LC #5 | Longest Palindromic Substring | Medium | Expand center | https://www.youtube.com/watch?v=XYQecbcd6_c |
| 6 | LC #647 | Palindromic Substrings | Medium | Expand center | https://www.youtube.com/watch?v=4RACzI5-du8 |
| 7 | LC #91 | Decode Ways | Medium | Count paths | https://www.youtube.com/watch?v=6aEyTjOwlJU |

**Template: 1D DP**
```python
# House Robber Pattern
def rob(nums):
    if len(nums) <= 2:
        return max(nums) if nums else 0
    
    dp = [0] * len(nums)
    dp[0] = nums[0]
    dp[1] = max(nums[0], nums[1])
    
    for i in range(2, len(nums)):
        dp[i] = max(dp[i-1], dp[i-2] + nums[i])
    
    return dp[-1]

# Space optimized
def rob_optimized(nums):
    prev2, prev1 = 0, 0
    for num in nums:
        curr = max(prev1, prev2 + num)
        prev2 = prev1
        prev1 = curr
    return prev1
```

### Day 3-4: 2D Dynamic Programming

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #62 | Unique Paths | Medium | Grid DP | https://www.youtube.com/watch?v=IlEsdxuD4lY |
| 2 | LC #63 | Unique Paths II | Medium | Grid DP + obstacles | https://www.youtube.com/watch?v=d3UOz7zdE4I |
| 3 | LC #64 | Minimum Path Sum | Medium | Grid DP | https://www.youtube.com/watch?v=pGMsrvt0fpk |
| 4 | LC #72 | Edit Distance | Medium | String DP | https://www.youtube.com/watch?v=XYi2-LPrwm4 |
| 5 | LC #1143 | Longest Common Subsequence | Medium | String DP | https://www.youtube.com/watch?v=Ua0GhsJSlWM |
| 6 | LC #97 | Interleaving String | Medium | String DP | https://www.youtube.com/watch?v=3Rw3p9LrgvE |

**Template: 2D DP**
```python
# Longest Common Subsequence
def longestCommonSubsequence(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    
    return dp[m][n]

# Edit Distance
def minDistance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i-1] == word2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j],    # delete
                                   dp[i][j-1],    # insert
                                   dp[i-1][j-1])  # replace
    
    return dp[m][n]
```

### Day 5-6: Classic DP Problems

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #322 | Coin Change | Medium | Unbounded knapsack | https://www.youtube.com/watch?v=H9bfqozjoqs |
| 2 | LC #518 | Coin Change II | Medium | Count combinations | https://www.youtube.com/watch?v=Mjy4hd2xgrs |
| 3 | LC #300 | Longest Increasing Subsequence | Medium | LIS | https://www.youtube.com/watch?v=cjWnW0hdF1Y |
| 4 | LC #139 | Word Break | Medium | String DP | https://www.youtube.com/watch?v=Sx9NNgInc3A |
| 5 | LC #416 | Partition Equal Subset Sum | Medium | 0/1 Knapsack | https://www.youtube.com/watch?v=IsvocB5BJhw |
| 6 | LC #494 | Target Sum | Medium | 0/1 Knapsack | https://www.youtube.com/watch?v=g0npyaQtAQM |

**Template: Knapsack**
```python
# 0/1 Knapsack (Partition Equal Subset Sum)
def canPartition(nums):
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    
    dp = [False] * (target + 1)
    dp[0] = True
    
    for num in nums:
        for j in range(target, num - 1, -1):  # reverse!
            dp[j] = dp[j] or dp[j - num]
    
    return dp[target]

# Unbounded Knapsack (Coin Change)
def coinChange(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for coin in coins:
        for j in range(coin, amount + 1):  # forward!
            dp[j] = min(dp[j], dp[j - coin] + 1)
    
    return dp[amount] if dp[amount] != float('inf') else -1
```

### Day 7: DP Review + Hard Problems

| # | LeetCode | Problem Name | Difficulty | Video Solution |
|---|----------|--------------|------------|----------------|
| 1 | LC #152 | Maximum Product Subarray | Medium | https://www.youtube.com/watch?v=lXVy6YWFcRM |
| 2 | LC #309 | Best Time Buy Sell with Cooldown | Medium | https://www.youtube.com/watch?v=I7j0F7AHpb8 |
| 3 | LC #312 | Burst Balloons | Hard | https://www.youtube.com/watch?v=VFskby7lUbw |

---

## Week 4: Advanced Graph + Heap

### Day 1-2: Advanced Graph Algorithms

**Watch First:**
- William Fiset: Dijkstra's → https://www.youtube.com/watch?v=pSqmAO-m7Lk
- NeetCode: Union Find → https://www.youtube.com/watch?v=ibjEGG7ylHk

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #743 | Network Delay Time | Medium | Dijkstra | https://www.youtube.com/watch?v=EaphyqKU4PQ |
| 2 | LC #787 | Cheapest Flights Within K Stops | Medium | Bellman-Ford | https://www.youtube.com/watch?v=5eIK3zUdYmE |
| 3 | LC #684 | Redundant Connection | Medium | Union Find | https://www.youtube.com/watch?v=FXWRE67PLL0 |
| 4 | LC #323 | Number of Connected Components | Medium | Union Find | https://www.youtube.com/watch?v=8f1XPm4WOUc |
| 5 | LC #261 | Graph Valid Tree | Medium | Union Find | https://www.youtube.com/watch?v=bXsUuownnoQ |
| 6 | LC #127 | Word Ladder | Hard | BFS | https://www.youtube.com/watch?v=h9iTnkgv05E |

**Template: Dijkstra's**
```python
import heapq
def networkDelayTime(times, n, k):
    graph = defaultdict(list)
    for u, v, w in times:
        graph[u].append((v, w))
    
    dist = {k: 0}
    heap = [(0, k)]  # (distance, node)
    
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float('inf')):
            continue
        for v, w in graph[u]:
            if d + w < dist.get(v, float('inf')):
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    
    return max(dist.values()) if len(dist) == n else -1
```

**Template: Union Find**
```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]
    
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False  # already connected
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True
```

### Day 3-4: Heap / Priority Queue

**Watch First:**
- NeetCode: Heap pattern → https://www.youtube.com/watch?v=t0Cq6tVNRBA

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #703 | Kth Largest Element in Stream | Easy | Min Heap | https://www.youtube.com/watch?v=hOjcdrqMoQ8 |
| 2 | LC #215 | Kth Largest Element in Array | Medium | Quick Select/Heap | https://www.youtube.com/watch?v=XEmy13g1Qxc |
| 3 | LC #621 | Task Scheduler | Medium | Max Heap + Cooldown | https://www.youtube.com/watch?v=s8p8ukTyA2I |
| 4 | LC #355 | Design Twitter | Medium | Merge K + Heap | https://www.youtube.com/watch?v=pNichitDD2E |
| 5 | LC #295 | Find Median from Data Stream | Hard | Two Heaps | https://www.youtube.com/watch?v=itmhHWaHupI |
| 6 | LC #23 | Merge K Sorted Lists | Hard | Min Heap | https://www.youtube.com/watch?v=q5a5OiGbT6Q |

**Template: Two Heaps (Median)**
```python
import heapq
class MedianFinder:
    def __init__(self):
        self.small = []  # max heap (negated)
        self.large = []  # min heap
    
    def addNum(self, num):
        heapq.heappush(self.small, -num)
        
        # Ensure small's max <= large's min
        if self.small and self.large and -self.small[0] > self.large[0]:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        
        # Balance sizes
        if len(self.small) > len(self.large) + 1:
            heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small) + 1:
            heapq.heappush(self.small, -heapq.heappop(self.large))
    
    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        if len(self.large) > len(self.small):
            return self.large[0]
        return (-self.small[0] + self.large[0]) / 2
```

### Day 5-6: Trie

**Watch First:**
- NeetCode: Trie → https://www.youtube.com/watch?v=oobqoCJlHA0

| # | LeetCode | Problem Name | Difficulty | Video Solution |
|---|----------|--------------|------------|----------------|
| 1 | LC #208 | Implement Trie | Medium | https://www.youtube.com/watch?v=oobqoCJlHA0 |
| 2 | LC #211 | Design Add and Search Words | Medium | https://www.youtube.com/watch?v=BTf05gs_8iU |
| 3 | LC #212 | Word Search II | Hard | https://www.youtube.com/watch?v=asbcE9mZz_U |
| 4 | LC #14 | Longest Common Prefix | Easy | https://www.youtube.com/watch?v=0sWShKIJoo4 |

**Template: Trie**
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True
    
    def search(self, word):
        node = self._find(word)
        return node is not None and node.is_end
    
    def startsWith(self, prefix):
        return self._find(prefix) is not None
    
    def _find(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node.children:
                return None
            node = node.children[c]
        return node
```

### Day 7: Binary Search Mastery

**Watch First:**
- NeetCode: Binary Search patterns → https://www.youtube.com/watch?v=W9QJ8HaRvJQ

| # | LeetCode | Problem Name | Difficulty | Pattern | Video Solution |
|---|----------|--------------|------------|---------|----------------|
| 1 | LC #704 | Binary Search | Easy | Standard | https://www.youtube.com/watch?v=s4DPM8ct1pI |
| 2 | LC #74 | Search a 2D Matrix | Medium | 2D → 1D | https://www.youtube.com/watch?v=Ber2pi2C0j0 |
| 3 | LC #875 | Koko Eating Bananas | Medium | Search on Answer | https://www.youtube.com/watch?v=U2SozAs9RzA |
| 4 | LC #153 | Find Min in Rotated Array | Medium | Modified BS | https://www.youtube.com/watch?v=nIVW4P8b1VA |
| 5 | LC #33 | Search in Rotated Array | Medium | Modified BS | https://www.youtube.com/watch?v=U8XENwh8Oy8 |
| 6 | LC #4 | Median of Two Sorted Arrays | Hard | Binary Search | https://www.youtube.com/watch?v=q6IEA26hvXc |

**Template: Binary Search on Answer**
```python
def minEatingSpeed(piles, h):
    def canFinish(k):
        return sum((p + k - 1) // k for p in piles) <= h
    
    left, right = 1, max(piles)
    while left < right:
        mid = (left + right) // 2
        if canFinish(mid):
            right = mid
        else:
            left = mid + 1
    return left
```

---

## Weeks 5-6: Stack, Intervals, Backtracking

### Stack & Monotonic Stack

| # | LeetCode | Problem Name | Difficulty | Video Solution |
|---|----------|--------------|------------|----------------|
| 1 | LC #20 | Valid Parentheses | Easy | https://www.youtube.com/watch?v=WTzjTskDFMg |
| 2 | LC #155 | Min Stack | Medium | https://www.youtube.com/watch?v=qkLl7nAwDPo |
| 3 | LC #150 | Evaluate Reverse Polish Notation | Medium | https://www.youtube.com/watch?v=iu0082c4HDE |
| 4 | LC #739 | Daily Temperatures | Medium | https://www.youtube.com/watch?v=cTBiBSnjO3c |
| 5 | LC #853 | Car Fleet | Medium | https://www.youtube.com/watch?v=Pr6T-3yB9RM |
| 6 | LC #84 | Largest Rectangle in Histogram | Hard | https://www.youtube.com/watch?v=zx5Sw9130L0 |

### Intervals

| # | LeetCode | Problem Name | Difficulty | Video Solution |
|---|----------|--------------|------------|----------------|
| 1 | LC #57 | Insert Interval | Medium | https://www.youtube.com/watch?v=A8NUOmlwOlM |
| 2 | LC #56 | Merge Intervals | Medium | https://www.youtube.com/watch?v=44H3cEC2fFM |
| 3 | LC #435 | Non-overlapping Intervals | Medium | https://www.youtube.com/watch?v=nONCGxWoUfM |
| 4 | LC #252 | Meeting Rooms | Easy | https://www.youtube.com/watch?v=PaJxqZVPhbg |
| 5 | LC #253 | Meeting Rooms II | Medium | https://www.youtube.com/watch?v=FdzJmTCVyJU |

### Backtracking

**Watch First:**
- NeetCode: Backtracking → https://www.youtube.com/watch?v=pfiQ_PS1g8E

| # | LeetCode | Problem Name | Difficulty | Video Solution |
|---|----------|--------------|------------|----------------|
| 1 | LC #78 | Subsets | Medium | https://www.youtube.com/watch?v=REOH22Xwdkk |
| 2 | LC #90 | Subsets II | Medium | https://www.youtube.com/watch?v=Vn2v6ajA7U0 |
| 3 | LC #46 | Permutations | Medium | https://www.youtube.com/watch?v=s7AvT7cGdSo |
| 4 | LC #39 | Combination Sum | Medium | https://www.youtube.com/watch?v=GBKI9VSKdGg |
| 5 | LC #40 | Combination Sum II | Medium | https://www.youtube.com/watch?v=rSA3t6BDDwg |
| 6 | LC #79 | Word Search | Medium | https://www.youtube.com/watch?v=pfiQ_PS1g8E |
| 7 | LC #131 | Palindrome Partitioning | Medium | https://www.youtube.com/watch?v=3jvWodd7ht0 |
| 8 | LC #51 | N-Queens | Hard | https://www.youtube.com/watch?v=Ph95IHmRp5M |

**Template: Backtracking**
```python
def subsets(nums):
    result = []
    
    def backtrack(start, path):
        result.append(path[:])  # add copy
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()
    
    backtrack(0, [])
    return result

def permute(nums):
    result = []
    
    def backtrack(path, used):
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            backtrack(path, used)
            path.pop()
            used[i] = False
    
    backtrack([], [False] * len(nums))
    return result
```

---

# PART 2: ML FUNDAMENTALS

## Week 1-2: Math Foundations + Classical ML

### Math Resources (Watch in Order)

**Linear Algebra (Week 1, 3-4 hours total):**
1. 3Blue1Brown: Essence of Linear Algebra
   - Full playlist: https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab
   - MUST WATCH: Vectors (Ep 1), Linear combinations (Ep 2), Matrix multiplication (Ep 4)

**Probability & Statistics (Week 1, 3-4 hours total):**
1. StatQuest: Probability Fundamentals
   - Bayes Theorem: https://www.youtube.com/watch?v=9wCnvr7Xw4E
   - Distributions: https://www.youtube.com/watch?v=rzFX5NWojp0
   - Maximum Likelihood: https://www.youtube.com/watch?v=XepXtl9YKwc

**Calculus for ML (Week 1, 2 hours):**
1. 3Blue1Brown: Essence of Calculus
   - Chain Rule: https://www.youtube.com/watch?v=YG15m2VwSjA
   - Partial Derivatives: https://www.youtube.com/watch?v=GkB4vW16QHI

### Classical ML (Week 2)

**Linear Regression:**
- StatQuest: https://www.youtube.com/watch?v=nk2CQITm_eo
- Gradient Descent: https://www.youtube.com/watch?v=sDv4f4s2SB8

**Logistic Regression:**
- StatQuest: https://www.youtube.com/watch?v=yIYKR4sgzI8
- Cross-entropy: https://www.youtube.com/watch?v=6ArSys5qHAU

**Regularization:**
- L1/L2: https://www.youtube.com/watch?v=Q81RR3yKn30

**Decision Trees & Ensemble:**
- Decision Trees: https://www.youtube.com/watch?v=_L39rN6gz7Y
- Random Forest: https://www.youtube.com/watch?v=J4Wdy0Wc_xQ
- XGBoost: https://www.youtube.com/watch?v=OtD8wVaFm6E

**SVM:**
- StatQuest SVM: https://www.youtube.com/watch?v=efR1C6CvhmE

**Evaluation Metrics:**
- Confusion Matrix: https://www.youtube.com/watch?v=Kdsp6soqA7o
- ROC/AUC: https://www.youtube.com/watch?v=4jRBRDbJemM
- Precision/Recall: https://www.youtube.com/watch?v=j-EB6RqqjGI

### Hands-On Implementation

**Do these in Jupyter notebooks:**

```python
# 1. Linear Regression from Scratch
import numpy as np

class LinearRegression:
    def __init__(self, lr=0.01, n_iters=1000):
        self.lr = lr
        self.n_iters = n_iters
        self.weights = None
        self.bias = None
    
    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for _ in range(self.n_iters):
            y_pred = np.dot(X, self.weights) + self.bias
            
            dw = (1/n_samples) * np.dot(X.T, (y_pred - y))
            db = (1/n_samples) * np.sum(y_pred - y)
            
            self.weights -= self.lr * dw
            self.bias -= self.lr * db
    
    def predict(self, X):
        return np.dot(X, self.weights) + self.bias

# 2. Logistic Regression from Scratch
class LogisticRegression:
    def __init__(self, lr=0.01, n_iters=1000):
        self.lr = lr
        self.n_iters = n_iters
        self.weights = None
        self.bias = None
    
    def sigmoid(self, z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))
    
    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for _ in range(self.n_iters):
            z = np.dot(X, self.weights) + self.bias
            y_pred = self.sigmoid(z)
            
            dw = (1/n_samples) * np.dot(X.T, (y_pred - y))
            db = (1/n_samples) * np.sum(y_pred - y)
            
            self.weights -= self.lr * dw
            self.bias -= self.lr * db
    
    def predict(self, X):
        z = np.dot(X, self.weights) + self.bias
        return (self.sigmoid(z) >= 0.5).astype(int)
```

---

## Week 3-4: Deep Learning Foundations

### Neural Network Fundamentals

**Watch in Order:**
1. 3Blue1Brown: Neural Networks
   - Full playlist: https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi
   - MUST WATCH: All 4 videos (What is NN, Gradient descent, Backprop, Backprop calculus)

2. Andrew Ng Deep Learning Specialization (free audit on Coursera)
   - Course 1: Neural Networks and Deep Learning
   - https://www.coursera.org/specializations/deep-learning

**Key Concepts to Master:**
- Forward propagation
- Backpropagation (derive by hand!)
- Activation functions: ReLU, sigmoid, tanh, softmax
- Loss functions: MSE, binary cross-entropy, categorical cross-entropy
- Weight initialization: Xavier, He
- Optimization: SGD, momentum, Adam

### Hands-On: Neural Network from Scratch

```python
# 2-Layer Neural Network from Scratch (NumPy)
import numpy as np

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # He initialization
        self.W1 = np.random.randn(input_size, hidden_size) * np.sqrt(2/input_size)
        self.b1 = np.zeros((1, hidden_size))
        self.W2 = np.random.randn(hidden_size, output_size) * np.sqrt(2/hidden_size)
        self.b2 = np.zeros((1, output_size))
    
    def relu(self, z):
        return np.maximum(0, z)
    
    def relu_derivative(self, z):
        return (z > 0).astype(float)
    
    def softmax(self, z):
        exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))
        return exp_z / np.sum(exp_z, axis=1, keepdims=True)
    
    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = self.relu(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self.softmax(self.z2)
        return self.a2
    
    def backward(self, X, y, lr=0.01):
        m = X.shape[0]
        
        # Output layer gradient
        dz2 = self.a2 - y  # softmax + cross-entropy derivative
        dW2 = (1/m) * np.dot(self.a1.T, dz2)
        db2 = (1/m) * np.sum(dz2, axis=0, keepdims=True)
        
        # Hidden layer gradient
        dz1 = np.dot(dz2, self.W2.T) * self.relu_derivative(self.z1)
        dW1 = (1/m) * np.dot(X.T, dz1)
        db1 = (1/m) * np.sum(dz1, axis=0, keepdims=True)
        
        # Update weights
        self.W2 -= lr * dW2
        self.b2 -= lr * db2
        self.W1 -= lr * dW1
        self.b1 -= lr * db1
    
    def train(self, X, y, epochs=100, lr=0.01):
        for epoch in range(epochs):
            output = self.forward(X)
            self.backward(X, y, lr)
            if epoch % 10 == 0:
                loss = -np.mean(y * np.log(output + 1e-8))
                print(f"Epoch {epoch}, Loss: {loss:.4f}")
```

---

## Week 5-6: CNNs, RNNs, Transformers

### CNNs

**Watch:**
1. Stanford CS231n: CNNs for Visual Recognition
   - Lecture 5 (CNNs): https://www.youtube.com/watch?v=bNb2fEVKeEo
   - Lecture 9 (Architectures): https://www.youtube.com/watch?v=DAOcjicFr1Y

2. StatQuest: Neural Network series
   - CNNs: https://www.youtube.com/watch?v=HGwBXDKFk9I

**Key Architectures to Know:**
- LeNet-5 (basic)
- AlexNet (ReLU, dropout)
- VGG (small filters)
- ResNet (skip connections) ← MOST IMPORTANT
- Inception (parallel branches)

### RNNs & LSTMs

**Watch:**
1. StatQuest: RNN/LSTM
   - RNN: https://www.youtube.com/watch?v=AsNTP8Kwu80
   - LSTM: https://www.youtube.com/watch?v=YCzL96nL7j0

2. Andrew Ng: Sequence Models (Coursera Course 5)

### Transformers (CRITICAL for Meta/Google)

**Watch (in order):**
1. Illustrated Transformer (blog + video)
   - Blog: https://jalammar.github.io/illustrated-transformer/
   - Video: https://www.youtube.com/watch?v=4Bdc55j80l8

2. StatQuest: Transformer
   - Attention: https://www.youtube.com/watch?v=PSs6nxngL6k
   - Transformer: https://www.youtube.com/watch?v=zxQyTK8quyY

3. Andrej Karpathy: Let's build GPT
   - https://www.youtube.com/watch?v=kCc8FmEb1nY

**Must Implement:**
```python
# Self-Attention from Scratch
import numpy as np

def self_attention(Q, K, V):
    """
    Q, K, V: (seq_len, d_model)
    """
    d_k = K.shape[-1]
    
    # Attention scores
    scores = np.dot(Q, K.T) / np.sqrt(d_k)  # (seq_len, seq_len)
    
    # Softmax
    attention_weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True)
    
    # Weighted sum
    output = np.dot(attention_weights, V)  # (seq_len, d_model)
    
    return output, attention_weights

# Multi-Head Attention
def multi_head_attention(X, num_heads, d_model):
    d_k = d_model // num_heads
    heads = []
    
    for _ in range(num_heads):
        W_q = np.random.randn(d_model, d_k)
        W_k = np.random.randn(d_model, d_k)
        W_v = np.random.randn(d_model, d_k)
        
        Q = np.dot(X, W_q)
        K = np.dot(X, W_k)
        V = np.dot(X, W_v)
        
        head, _ = self_attention(Q, K, V)
        heads.append(head)
    
    # Concatenate heads
    concat = np.concatenate(heads, axis=-1)
    
    # Final linear projection
    W_o = np.random.randn(d_model, d_model)
    output = np.dot(concat, W_o)
    
    return output
```

---

## PyTorch Practice

**Primary Resource:**
- Daniel Bourke's PyTorch Bootcamp: https://www.youtube.com/watch?v=Z_ikDlimN6A

**Practice Projects (in order):**

1. **MNIST with CNN** (Week 5)
```python
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms

class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.25)
    
    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = x.view(-1, 64 * 7 * 7)
        x = self.dropout(self.relu(self.fc1(x)))
        x = self.fc2(x)
        return x
```

2. **CIFAR-10 with ResNet** (Week 5)
3. **Sentiment Analysis with LSTM** (Week 6)
4. **Text Classification with Transformer** (Week 6)

---

# PART 3: ML SYSTEM DESIGN

## Framework (Memorize This)

```
1. CLARIFY (5 min)
   - What's the business goal?
   - What are the constraints? (latency, scale, cost)
   - What data is available?

2. METRICS (5 min)
   - Offline: Precision, Recall, AUC, NDCG
   - Online: CTR, conversion, engagement, revenue

3. DATA & FEATURES (10 min)
   - Data sources
   - Feature engineering
   - Feature stores

4. MODEL (10 min)
   - Model selection
   - Architecture
   - Training strategy

5. SERVING (10 min)
   - Inference pipeline
   - Latency optimization
   - Scaling

6. MONITORING (5 min)
   - Data drift
   - Model degradation
   - A/B testing
```

## Must-Study Systems

### 1. Recommendation System (Netflix/YouTube)

**Video:** https://www.youtube.com/watch?v=n3RKsY2H-NE

**Key Components:**
- Candidate generation (recall)
- Ranking (precision)
- Two-tower model
- User/item embeddings

### 2. Feed Ranking (Facebook/Twitter)

**Video:** https://www.youtube.com/watch?v=hKoJgLf5sj0

**Key Components:**
- Multi-stage ranking
- Real-time features
- Personalization
- Diversity/freshness

### 3. Ads Click Prediction

**Video:** https://www.youtube.com/watch?v=RZJBOo9HW-M

**Key Components:**
- CTR prediction
- Wide & Deep model
- Feature crosses
- Calibration

### 4. Search Ranking

**Key Components:**
- Query understanding
- Document retrieval
- Learning to rank
- BERT for search

## Book

**"Designing Machine Learning Systems" by Chip Huyen**
- Buy: https://www.amazon.com/Designing-Machine-Learning-Systems-Production-Ready/dp/1098107969
- This is the gold standard for ML system design

---

# PART 4: WEEKLY CHECKLIST

## Week 1 Checklist
- [ ] LC #1, #121, #217, #238, #53 (Arrays)
- [ ] LC #242, #49, #347, #128, #146 (Hash Maps)
- [ ] LC #206, #21, #141, #143 (Linked Lists)
- [ ] Watch 3Blue1Brown Linear Algebra (Ep 1-4)
- [ ] Watch StatQuest Bayes + Distributions
- [ ] Total: 25 problems

## Week 2 Checklist
- [ ] LC #226, #104, #102, #98, #235, #236 (Trees)
- [ ] LC #200, #133, #207, #210, #994 (Graphs)
- [ ] Watch CS231n Lecture 2 (Linear Classifiers)
- [ ] Implement Linear Regression from scratch
- [ ] Implement Logistic Regression from scratch
- [ ] Total: 50 problems

## Week 3 Checklist
- [ ] LC #70, #198, #213, #5, #91 (1D DP)
- [ ] LC #62, #72, #1143 (2D DP)
- [ ] LC #322, #300, #139, #416 (Classic DP)
- [ ] Watch StatQuest Decision Trees + Random Forest
- [ ] Implement Decision Tree from scratch
- [ ] Total: 75 problems

## Week 4 Checklist
- [ ] LC #743, #684, #127 (Advanced Graph)
- [ ] LC #215, #295, #23 (Heap)
- [ ] LC #208, #211, #212 (Trie)
- [ ] Watch 3Blue1Brown Neural Networks (all 4)
- [ ] Implement 2-layer NN from scratch
- [ ] Total: 100 problems

## Week 5 Checklist
- [ ] LC #704, #74, #875, #4 (Binary Search)
- [ ] LC #20, #739, #84 (Stack)
- [ ] Watch CS231n CNNs
- [ ] Build CNN on MNIST (PyTorch)
- [ ] Total: 125 problems

## Week 6 Checklist
- [ ] LC #78, #46, #39, #79 (Backtracking)
- [ ] LC #56, #57, #253 (Intervals)
- [ ] Watch Illustrated Transformer + Karpathy GPT
- [ ] Implement self-attention from scratch
- [ ] Total: 150 problems

## Week 7-8 Checklist
- [ ] Study 4 ML system designs (Rec, Feed, Ads, Search)
- [ ] Read Chip Huyen book (Ch 1-6)
- [ ] 2 mock system design interviews
- [ ] Total: 170 problems

## Week 9-10 Checklist
- [ ] Company-specific LeetCode (Meta/Google tags)
- [ ] 4 full mock interviews
- [ ] Behavioral stories prepared
- [ ] Total: 200 problems

---

# QUICK REFERENCE LINKS

## LeetCode Lists
- NeetCode 150: https://neetcode.io/practice
- Grind 75: https://www.techinterviewhandbook.org/grind75
- Meta Tagged: https://leetcode.com/company/facebook/
- Google Tagged: https://leetcode.com/company/google/

## Video Playlists
- NeetCode (All patterns): https://www.youtube.com/@NeetCode/playlists
- William Fiset (Graphs): https://www.youtube.com/@WilliamFiset-videos
- StatQuest (ML): https://www.youtube.com/@statquest
- 3Blue1Brown (Math): https://www.youtube.com/@3blue1brown

## ML Courses
- Andrew Ng ML: https://www.coursera.org/specializations/machine-learning-introduction
- Andrew Ng Deep Learning: https://www.coursera.org/specializations/deep-learning
- Stanford CS231n: https://www.youtube.com/playlist?list=PL3FW7Lu3i5JvHM8ljYj-zLfQRF3EO8sYv

## System Design
- ML System Design Course: https://www.educative.io/courses/machine-learning-system-design
- Chip Huyen Blog: https://huyenchip.com/blog/

## Mock Interviews
- Pramp (free): https://www.pramp.com/
- interviewing.io: https://interviewing.io/

---

*Last updated: January 2026*
*Print this out. Check boxes daily. You've got this!*
