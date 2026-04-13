const questions = [
  {
    id: 1,
    question: "Which STL container is best for implementing a compiler symbol table with average O(1) lookup?",
    options: { A: "unordered_map", B: "vector", C: "stack", D: "deque" },
    correct: "A",
  },
  {
    id: 2,
    question: "Which STL container is commonly used to store AST children nodes in order?",
    options: { A: "vector", B: "set", C: "unordered_set", D: "queue" },
    correct: "A",
  },
  {
    id: 3,
    question: "Which STL algorithm can sort token streams by position?",
    options: { A: "accumulate", B: "for_each", C: "sort", D: "fill" },
    correct: "C",
  },
  {
    id: 4,
    question: "What does std::stack model well in compiler design?",
    options: { A: "Graph traversal storage", B: "Hash lookups", C: "Lexeme deduplication", D: "Scope tracking" },
    correct: "D",
  },
  {
    id: 5,
    question: "For a control flow graph adjacency list, which STL structure is typical?",
    options: { A: "set<int>", B: "vector<vector<int>>", C: "map<int,int>", D: "queue<int>" },
    correct: "B",
  },
  {
    id: 6,
    question: "Which STL feature helps write generic compiler passes?",
    options: { A: "Macros", B: "Namespaces", C: "Typedef", D: "Templates" },
    correct: "D",
  },
  {
    id: 7,
    question: "Which method gives bounds checking on vector access?",
    options: { A: "operator[]", B: "front()", C: "at()", D: "data()" },
    correct: "C",
  },
  {
    id: 8,
    question: "Which algorithm checks whether a token exists in a range?",
    options: { A: "transform", B: "find", C: "rotate", D: "remove_if" },
    correct: "B",
  },
  {
    id: 9,
    question: "Which container preserves insertion order and allows dynamic growth?",
    options: { A: "unordered_map", B: "priority_queue", C: "set", D: "vector" },
    correct: "D",
  },
  {
    id: 10,
    question: "What is a major reason to prefer STL over handwritten structures in compilers?",
    options: { A: "More assembly code", B: "Larger binaries always", C: "Reliability and optimization", D: "No iterators needed" },
    correct: "C",
  },
  {
    id: 11,
    question: "Which STL container stores unique sorted keys by default?",
    options: { A: "vector", B: "set", C: "unordered_map", D: "list" },
    correct: "B",
  },
  {
    id: 12,
    question: "Which iterator pair commonly defines a full STL range?",
    options: { A: "front() and back()", B: "rbegin() and rend()", C: "begin() and end()", D: "data() and size()" },
    correct: "C",
  },
  {
    id: 13,
    question: "Which operation improves vector reallocation behavior for known sizes?",
    options: { A: "erase()", B: "reserve()", C: "clear()", D: "swap()" },
    correct: "B",
  },
  {
    id: 14,
    question: "Which container gives FIFO behavior for compiler task queues?",
    options: { A: "stack", B: "vector", C: "queue", D: "set" },
    correct: "C",
  },
  {
    id: 15,
    question: "Which STL header generally provides std::unordered_map?",
    options: { A: "<map>", B: "<vector>", C: "<algorithm>", D: "<unordered_map>" },
    correct: "D",
  },
  {
    id: 16,
    question: "Which STL utility helps iterate and apply an action to each token?",
    options: { A: "for_each", B: "lower_bound", C: "stable_sort", D: "binary_search" },
    correct: "A",
  },
  {
    id: 17,
    question: "Which container is better for random access in AST vectors?",
    options: { A: "list", B: "forward_list", C: "stack", D: "vector" },
    correct: "D",
  },
  {
    id: 18,
    question: "Which operation removes all vector elements?",
    options: { A: "erase(begin())", B: "pop_back()", C: "resize(1)", D: "clear()" },
    correct: "D",
  },
  {
    id: 19,
    question: "Which structure is useful for priority-based optimization passes?",
    options: { A: "priority_queue", B: "array", C: "unordered_set", D: "multimap" },
    correct: "A",
  },
  {
    id: 20,
    question: "In STL, what is the key advantage of algorithms + iterators?",
    options: { A: "Direct machine code output", B: "No compile-time checks", C: "Container-independent operations", D: "Fixed data type only" },
    correct: "C",
  },
];

module.exports = questions;
