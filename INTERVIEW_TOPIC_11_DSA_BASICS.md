# Topic 11: DSA Basics — Interview साठी Enough
> Junior level — Big O, arrays, strings, HashMap, two pointer, binary search, basic sorting

---

## 11.1 Big O Notation — Time Complexity

Time complexity = how does execution time grow as input size (n) grows?

```
O(1)       — Constant    — HashMap lookup, array[0]
O(log n)   — Logarithmic — Binary search, B-Tree index
O(n)       — Linear      — Loop through array once
O(n log n) — Linearithmic— Merge Sort, Quick Sort (average)
O(n²)      — Quadratic   — Nested loops (bubble sort)
O(2ⁿ)      — Exponential — Recursive fibonacci (naive)
```

```
Performance: O(1) > O(log n) > O(n) > O(n log n) > O(n²) > O(2ⁿ)
Best ────────────────────────────────────────────────────────── Worst
```

### Quick Examples
```js
// O(1) — constant, doesn't matter how big array is
function getFirst(arr) { return arr[0]; }
function hashLookup(map, key) { return map.get(key); }

// O(n) — one loop = linear
function findMax(arr) {
  let max = arr[0];
  for (const n of arr) if (n > max) max = n;  // one pass
  return max;
}

// O(n²) — nested loops = quadratic
function hasDuplicate_slow(arr) {
  for (let i = 0; i < arr.length; i++)       // O(n)
    for (let j = i + 1; j < arr.length; j++) // O(n) inside
      if (arr[i] === arr[j]) return true;     // n * n = O(n²)
  return false;
}

// O(n) — HashMap fix
function hasDuplicate_fast(arr) {
  const seen = new Set();
  for (const n of arr) {    // O(n) one loop
    if (seen.has(n)) return true;  // O(1) set lookup
    seen.add(n);
  }
  return false;
}
```

---

## 11.2 Data Structures — Quick Reference

```js
// Array — O(1) access, O(n) search, O(n) insert middle
const arr = [1, 2, 3, 4, 5];
arr[2];                          // O(1) access
arr.push(6);                     // O(1) append
arr.unshift(0);                  // O(n) prepend (shifts all)
arr.indexOf(3);                  // O(n) search

// HashMap (JS: Map or plain object) — O(1) all operations
const map = new Map();
map.set('key', 'value');         // O(1)
map.get('key');                  // O(1)
map.has('key');                  // O(1)
map.delete('key');               // O(1)

// Set — unique values, O(1) operations
const set = new Set([1, 2, 3]);
set.add(4);                      // O(1)
set.has(3);                      // O(1)
set.delete(2);                   // O(1)

// Stack — LIFO (Last In First Out)
const stack = [];
stack.push(1);    // push to top
stack.pop();      // remove from top

// Queue — FIFO (First In First Out)
const queue = [];
queue.push(1);    // enqueue
queue.shift();    // dequeue (O(n) — use deque for O(1))
```

---

## 11.3 Two Sum — Classic Problem

**Problem:** Array of numbers, return indices of two numbers that add up to `target`.
```
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]  (nums[0] + nums[1] = 2 + 7 = 9)
```

```js
// Brute Force — O(n²): check every pair
function twoSum_slow(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
}

// Optimal — O(n): HashMap (complement lookup)
function twoSum(nums, target) {
  const seen = new Map();  // value → index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];  // what we need
    if (seen.has(complement)) {
      return [seen.get(complement), i];   // found it!
    }
    seen.set(nums[i], i);  // store current for future lookup
  }
}

// Walk-through for [2, 7, 11, 15], target=9:
// i=0: complement = 9-2 = 7. seen={} → no. seen={2:0}
// i=1: complement = 9-7 = 2. seen={2:0} → YES! return [0, 1]
```

---

## 11.4 String Problems

### Reverse a String
```js
function reverse(s) {
  return s.split('').reverse().join('');
  // Or: two-pointer
}

// Two-pointer approach
function reverse_tp(s) {
  const arr = s.split('');
  let l = 0, r = arr.length - 1;
  while (l < r) {
    [arr[l], arr[r]] = [arr[r], arr[l]]; // swap
    l++; r--;
  }
  return arr.join('');
}
```

### Check Palindrome
```js
function isPalindrome(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '');  // clean
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}
// "racecar" → true, "hello" → false
```

### Valid Anagram
```js
// Two words are anagrams if they have same characters with same frequency
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (const ch of s) count[ch] = (count[ch] || 0) + 1;
  for (const ch of t) {
    if (!count[ch]) return false;
    count[ch]--;
  }
  return true;
}
// "listen" and "silent" → true
```

---

## 11.5 Two Pointer Pattern

Efficient for sorted arrays and string problems. Start pointers at two ends.

```js
// Find if array has pair summing to target (SORTED array)
function hasPairSum(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l < r) {
    const sum = arr[l] + arr[r];
    if (sum === target) return true;
    else if (sum < target) l++;  // need bigger number
    else r--;                     // need smaller number
  }
  return false;
}

// Remove duplicates from sorted array (in-place)
function removeDuplicates(nums) {
  let write = 1;  // write pointer
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[read - 1]) {
      nums[write++] = nums[read];
    }
  }
  return write; // new length
}
// [1,1,2,3,3] → [1,2,3,...], returns 3
```

---

## 11.6 Binary Search

Search sorted array in O(log n) instead of O(n).

```js
function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;       // found!
    else if (nums[mid] < target) lo = mid + 1; // go right
    else hi = mid - 1;                          // go left
  }
  return -1; // not found
}

// Walk-through: [1,3,5,7,9], target=7
// lo=0, hi=4, mid=2: nums[2]=5 < 7 → lo=3
// lo=3, hi=4, mid=3: nums[3]=7 === 7 → return 3 ✅
```

**Why Binary Search is O(log n):**
- n=1000: 10 steps (log₂1000 ≈ 10)
- n=1M: 20 steps (log₂1000000 ≈ 20)
- Each step eliminates HALF the remaining candidates

---

## 11.7 Sorting Algorithms

### Bubble Sort — O(n²) — Don't use in production, but know the concept
```js
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; // swap
      }
    }
  }
  return arr;
}
```

### JavaScript Built-in Sort — O(n log n) — Use this!
```js
// Numbers — MUST provide comparator (default sorts as strings!)
[10, 1, 21, 2].sort();              // WRONG: [1, 10, 2, 21]
[10, 1, 21, 2].sort((a, b) => a - b); // CORRECT: [1, 2, 10, 21] ascending
[10, 1, 21, 2].sort((a, b) => b - a); // [21, 10, 2, 1] descending

// Objects
const pujaris = [{ name: 'A', rating: 4.5 }, { name: 'B', rating: 4.8 }];
pujaris.sort((a, b) => b.rating - a.rating); // by rating, high to low
```

### Merge Sort — O(n log n) — Stable, know the concept
```
Divide: Split array in half recursively
Conquer: Sort each half
Merge: Merge two sorted halves

[38, 27, 43, 3]
→ [38, 27] + [43, 3]
→ [38]+[27] + [43]+[3]
← [27, 38] + [3, 43]
← [3, 27, 38, 43]
```

---

## 11.8 Common LeetCode Problems — Practice These

### Easy (Must Know)
```
1.  Two Sum (HashMap)
9.  Palindrome Number
20. Valid Parentheses (Stack)
21. Merge Two Sorted Lists
53. Maximum Subarray (Kadane's Algorithm)
121. Best Time to Buy and Sell Stock
125. Valid Palindrome
206. Reverse Linked List
217. Contains Duplicate (HashSet)
242. Valid Anagram
```

### Must-Know Patterns
```
HashMap/HashSet  → Two Sum, Contains Duplicate, Anagram
Two Pointer      → Palindrome, Pair Sum on sorted, Remove Duplicates
Binary Search    → Search in sorted array, First/Last position
Sliding Window   → Max subarray, Longest substring without repeats
Stack            → Valid parentheses, Min stack
```

---

## 11.9 Problem-Solving Strategy

```
1. CLARIFY (2 min)
   - Input/output examples?
   - Edge cases? (empty array, single element, all same)
   - Constraints? (sorted? unique? size range?)

2. BRUTE FORCE first (2 min)
   - Explain naive O(n²) solution
   - "I can see this works but it's O(n²), let me optimize"

3. OPTIMIZE (5 min)
   - Can I use HashMap to avoid nested loop?
   - Can I sort first then use two-pointer?
   - Can I use binary search?

4. CODE (10 min)
   - Write clean code, talk while coding
   - Name variables meaningfully

5. TEST (3 min)
   - Walk through with given example
   - Edge cases: empty, one element, all same

6. COMPLEXITY (1 min)
   - State time + space complexity
```

---

## Interview Q&A

**Q: Array vs HashMap — कधी काय?**
> Array: Ordered sequence, index-based access O(1), search O(n). HashMap: Key-value lookup O(1). If you're searching/looking up by value → HashMap. If order matters or index access → Array.

**Q: Big O notation explain करा**
> How execution time or space grows as input grows. O(1) = constant, doesn't grow. O(n) = doubles when input doubles. O(n²) = 4x when input doubles. Real importance: Database indexes use O(log n) B-Tree. Linear scan O(n). This is why MySQL index adds huge performance.

**Q: Two Sum explain करा — how did you optimize?**
> Brute force: Nested loops O(n²) — check every pair. Optimization: HashMap — as we iterate, store complement needed. If found → done. Single pass O(n) with O(n) extra space.

**Q: Binary Search कुठे practically वापरतो?**
> Sorted array search. Database B-Tree indexes (O(log n) lookup vs O(n) full scan). Git bisect bug finding. Load balancer consistent hashing. Anywhere you have sorted data and need fast search.

---

## Summary Table

| Concept | Time Complexity | Use Case |
|---------|----------------|----------|
| Array access | O(1) | Index-based lookup |
| Array search | O(n) | Unsorted list scan |
| HashMap get/set | O(1) | Key-value lookup |
| Binary search | O(log n) | Sorted array |
| Bubble sort | O(n²) | Never — educational only |
| Merge/Quick sort | O(n log n) | Production sorting |
| Two Pointer | O(n) | Sorted array pair problems |
| Two Sum (HashMap) | O(n) time, O(n) space | Classic interview |
| Set has/add | O(1) | Duplicate check |

---

## LeetCode 10-Problem Starter List

```
Week 1 (Arrays + HashMap):
  LeetCode 1    — Two Sum
  LeetCode 217  — Contains Duplicate
  LeetCode 242  — Valid Anagram
  LeetCode 121  — Best Time to Buy Stock

Week 2 (Strings + Two Pointer):
  LeetCode 125  — Valid Palindrome
  LeetCode 344  — Reverse String
  LeetCode 167  — Two Sum II (sorted)
  LeetCode 26   — Remove Duplicates

Week 3 (Stack + Binary Search):
  LeetCode 20   — Valid Parentheses
  LeetCode 704  — Binary Search
```

**After 10 problems, patterns click. After 30, you'll be comfortable. Quality > quantity.**
