# Execution Playbook (Optimized)

## The 5-step loop (use this for every pattern)
1. **Watch** one short pattern video (10–20 min)
2. **Do the template problem** (with hints/video, but type the code yourself)
3. **Do 2–3 similar problems** (same pattern, speed > perfection)
4. **Do 1 harder variation** (no hints for 15–20 min first)
5. **Next day: redo 1 problem from memory** (write code without looking)

---

## Watch First (CRITICAL)
Use these as “pattern primers” before the first day of a topic.
- Two Pointers: https://www.youtube.com/watch?v=cQ1Oz4ckceM
- Sliding Window: https://www.youtube.com/watch?v=p-ss2JNynmw
- Hash Map patterns: https://www.youtube.com/watch?v=P6RZZMu_maU
- Linked List playlist: https://www.youtube.com/watch?v=G0_I-ZF0S38
- Binary Trees playlist: https://www.youtube.com/watch?v=OnSn2XEQ4MY
- Graphs playlist: https://www.youtube.com/watch?v=EgI5nU9etnU

---

## How to solve each problem (fast interview workflow)
When you open a new LeetCode problem:
- **Restate** inputs/outputs + edge cases (empty, 1 element, duplicates, negatives)
- Write a **brute force** idea in 1 sentence (to show correctness)
- Ask: **What structure makes this faster?**
  - need “seen before” → hash set/map
  - need min/max so far → rolling min/max
  - need contiguous subarray → sliding window or prefix sum
  - need “next greater” → monotonic stack
  - need shortest steps on unweighted graph → BFS
  - need combinations/permutations → backtracking
  - sorted + search → binary search
- Choose the **pattern**, then write the **template** first (skeleton), then fill details
- **Test** quickly with 2 small cases + 1 edge case

---

## Key templates (copy/paste skeletons)

### Hash map counting
```python
from collections import Counter, defaultdict
freq = Counter(nums)

mp = defaultdict(int)
for x in nums:
    mp[x] += 1
```

### Two pointers (shrink from both ends)
```python
l, r = 0, len(nums) - 1
while l < r:
    # update answer
    if condition:
        l += 1
    else:
        r -= 1
```

### Sliding window (grow + shrink)
```python
l = 0
for r in range(len(nums)):
    add(nums[r])
    while window_invalid():
        remove(nums[l])
        l += 1
    update_answer()
```

### Prefix sum + map (subarray)
```python
mp = {0: 1}
prefix = 0
for x in nums:
    prefix += x
    # use prefix - k
    mp[prefix] = mp.get(prefix, 0) + 1
```

### Monotonic stack (next greater)
```python
stack = []  # store indices
for i, x in enumerate(nums):
    while stack and nums[stack[-1]] < x:
        j = stack.pop()
        # j's answer uses i
    stack.append(i)
```

### Binary search
```python
l, r = 0, len(nums) - 1
while l <= r:
    m = (l + r) // 2
    if nums[m] == target:
        return m
    if nums[m] < target:
        l = m + 1
    else:
        r = m - 1
return -1
```

### BFS (queue)
```python
from collections import deque
q = deque([start])
seen = {start}
steps = 0
while q:
    for _ in range(len(q)):
        node = q.popleft()
        if node == goal:
            return steps
        for nei in neighbors(node):
            if nei not in seen:
                seen.add(nei)
                q.append(nei)
    steps += 1
```

### DFS (recursive)
```python
def dfs(node):
    if node is None:
        return
    for nei in neighbors(node):
        dfs(nei)
```

### Backtracking
```python
res = []
path = []

def backtrack(i):
    if done_condition:
        res.append(path.copy())
        return
    for choice in choices(i):
        path.append(choice)
        backtrack(next_i)
        path.pop()
```
