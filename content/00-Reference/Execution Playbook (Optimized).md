# Execution Playbook (Optimized)

## The 5-step loop (use this for every pattern)
1. **Watch** one short pattern video (10–20 min)
2. **Do the template problem** (with hints/video, but type the code yourself)
3. **Do 2–3 similar problems** (same pattern, speed > perfection)
4. **Do 1 harder variation** (no hints for 15–20 min first)
5. **Next day: redo 1 problem from memory** (write code without looking)

---

## The IOI Way: Derive the Invariant from Constraints + Structure

When you read an array problem, do this in order:

### Step 1: Target complexity (from constraints)
| n size | Target complexity |
|--------|-------------------|
| n ≤ 20 | O(2^n) or O(n!) - brute force/backtrack |
| n ≤ 100 | O(n³) |
| n ≤ 1000 | O(n²) |
| n ≤ 10⁵ | O(n) or O(n log n) |
| n ≤ 10⁶+ | O(n) or O(log n) |

### Step 2: Ask - what can be decided locally while scanning?
If yes → a 1-pass invariant exists.

### Step 3: Try the 5 Classic Invariant Families

| Family | When to use | Example |
|--------|-------------|---------|
| **Best-so-far / best-ending-here** | Max subarray, best profit | Kadane, Stock |
| **Min/Max prefix** | Need best previous value | Stock buy/sell |
| **Two pointers** | Sorted, palindrome, compaction | Two Sum II, Valid Palindrome |
| **Prefix/Suffix decomposition** | Need left AND right context | Product Except Self |
| **Seen-set** | Duplicates, existence check | Contains Duplicate, Two Sum |

> **You don't memorize solutions; you memorize these derivation routes.**

---

## The Real "IOI Gold" Trick: Make the Solution Inevitable

For each problem, ask:
1. **What is the exact meaning of my state?** (one sentence)
2. **Given that meaning, what update is forced?**
3. **What does each pointer/variable represent in the invariant?**

If you do that, you can re-derive these even if you forget everything.

---

## Watch First (CRITICAL)
Use these as "pattern primers" before the first day of a topic.
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
  - need "seen before" → hash set/map
  - need min/max so far → rolling min/max
  - need contiguous subarray → sliding window or prefix sum
  - need "next greater" → monotonic stack
  - need shortest steps on unweighted graph → BFS
  - need combinations/permutations → backtracking
  - sorted + search → binary search
- Choose the **pattern**, then write the **template** first (skeleton), then fill details
- **Test** quickly with 2 small cases + 1 edge case

---

## Problem Aha Chains (Invariant-First Thinking)

### 53. Maximum Subarray
**Key observation:** The best subarray ending at i is either:
- start fresh at i, or
- extend the best ending at i-1

**Invariant:** `cur` = max subarray sum that MUST end at i

**Move rule:**
```python
cur = max(nums[i], cur + nums[i])
best = max(best, cur)
```
> Pattern: "dp meaning first → transition is forced"

---

### 238. Product of Array Except Self
**Key observation:** Answer at i needs everything left of i × everything right of i.

**Invariant (left pass):** `res[i]` = product(nums[0..i-1])
**Invariant (right pass):** `suffix` = product(nums[i+1..n-1]), then multiply in

**Move rule:**
```python
# Left pass
prefix = 1
for i in range(n):
    res[i] = prefix
    prefix *= nums[i]
# Right pass
suffix = 1
for i in range(n-1, -1, -1):
    res[i] *= suffix
    suffix *= nums[i]
```
> Pattern: "decompose dependency graph (left/right) → two passes"

---

### 217. Contains Duplicate
**Key observation:** You only care whether you've seen a value before.

**Invariant:** After processing first k items, `seen` contains exactly them.

**Move rule:**
```python
if x in seen: return True
seen.add(x)
```
> Pattern: "existence detection → hashing state"

---

### 121. Best Time to Buy and Sell Stock
**Key observation:** Profit at day i is `price[i] - min(previous prices)`.

**Invariant:** `min_price` = min(prices[0..i]), `best` = best profit so far

**Move rule:**
```python
best = max(best, price - min_price)
min_price = min(min_price, price)
```
> Pattern: "opt over all previous → maintain prefix extreme"

---

### 283. Move Zeroes
**Key observation:** You need stable order of non-zeros, in-place. That screams "compaction."

**Invariant:** `nums[0..slow-1]` are the non-zeros seen so far, in correct order.

**Move rule:**
```python
if nums[fast] != 0:
    nums[slow], nums[fast] = nums[fast], nums[slow]
    slow += 1
```
> Pattern: "stable partition → two-pointer compaction"

---

### 167. Two Sum II (sorted)
**Key observation:** Sorted means sum moves monotonically with pointers.

**Invariant:** If a solution exists, it lies within [l, r].
- sum too small → increase l (only way to raise sum)
- sum too large → decrease r (only way to lower sum)

**Move rule:**
```python
if nums[l] + nums[r] < target: l += 1
elif nums[l] + nums[r] > target: r -= 1
else: return [l+1, r+1]
```
> Pattern: "monotonic response → two pointers + elimination"

---

### 125. Valid Palindrome
**Key observation:** Only alphanumeric matter; compare from both ends.

**Invariant:** Everything outside [l, r] has already been matched correctly.

**Move rule:**
```python
while l < r:
    while l < r and not s[l].isalnum(): l += 1
    while l < r and not s[r].isalnum(): r -= 1
    if s[l].lower() != s[r].lower(): return False
    l += 1; r -= 1
```
> Pattern: "symmetry + ignore irrelevant symbols → two pointers"

---

### 1266. Minimum Time Visiting All Points
**Key observation:** Each step can change (x, y) by at most 1 in each coordinate (diagonal allowed).

**Invariant/Fact:** min steps from A to B = `max(|dx|, |dy|)`
- Diagonal moves reduce both |dx| and |dy| simultaneously
- Lower bound = upper bound → achievable

**Move rule:**
```python
total += max(abs(x2-x1), abs(y2-y1))
```
> Pattern: "lower bound + constructive matching upper bound"

---

## Instant Recall Note Format

For each problem, keep only:
- **Pattern:** (two pointers / prefix-suffix / best-ending-here / set)
- **Invariant:** (one sentence)
- **Move rule:** (2 lines)

**Example (121 Stock):**
```
Pattern: min prefix + best
Invariant: min_price=min so far, best=max profit so far
Move: best = max(best, price-min_price); min_price = min(min_price, price)
```

That's enough to rebuild full code quickly.

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
