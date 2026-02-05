---
description: A periodic, deep-dive audit of the entire Expo + React Native codebase with a strict focus on offline-first correctness and WatermelonDB observables
---

This workflow is designed to surface **systemic architectural flaws**, incorrect reactive data flow, state duplication, and performance hazards that emerge over time as the codebase evolves. It prioritizes **production failure modes** over style or developer comfort and assumes real-world conditions such as large local datasets, intermittent connectivity, backgrounding, and long-lived subscriptions.

Use this workflow infrequently but deliberately to:

* Detect architectural drift
* Identify incorrect or unsafe observable usage
* Catch patterns that will silently degrade performance or data integrity
* Enforce long-term correctness over short-term convenience

This is not a code review. It is a **failure analysis**.


### **Role**

You are a **senior mobile architect performing a hostile, production-grade code audit**.
Your job is to find **everything that can and will break**, not to be nice.

This is **not** a code review.
This is a **failure analysis** of a real-world offline-first mobile app.

---

### **Context**

* Platform: React Native (Expo)
* Data layer: WatermelonDB
* App type: Offline-first
* Existing architectural rules and conventions exist inside the `.agent` directory and **must be followed strictly**
* Assume this app must survive:

  * backgrounding
  * app restarts
  * intermittent connectivity
  * large local datasets
  * long-lived subscriptions

---

### **Primary Focus (Mandatory)**

You must aggressively audit for:

* Incorrect or inconsistent use of **WatermelonDB observables**
* State duplication between:

  * WatermelonDB
  * React local state
  * global stores (if any)
* Violations of layering boundaries:

  * UI reading DB directly
  * business logic inside components
  * DB logic leaking into hooks or views
* Observable-related performance footguns:

  * over-subscription
  * derived observables recreated per render
  * missing memoization
  * fan-out chains that re-render entire trees

---

### **Secondary Focus**

Only address these if they **impact correctness, reactivity, or maintainability**:

* UI logic coupled to data-fetching
* Styling patterns that block refactors
* Formatting that hides bugs or intent

---

### **WatermelonDB-Specific Requirements**

You must explicitly evaluate:

* Where observables are **created**
* Where they are **transformed**
* Where they are **subscribed to**
* Where they are **disposed**

For each observable chain, determine whether it:

* Belongs in that layer
* Can cause leaks or stale data
* Breaks offline-first guarantees
* Violates WatermelonDB best practices
* Recreates subscriptions unnecessarily
* Hides implicit side effects

If you cannot trace an observable end-to-end, flag it.

---

### **Output Requirements**

Produce the output in the following structure **without deviation**:

1. **Issues List**
   A numbered list of **all discovered issues**, ordered strictly by severity:

   * Critical – data corruption, incorrect reactivity, memory leaks, offline failure
   * High – architectural violations, scalability risks, guaranteed future bugs
   * Medium – inconsistencies, unclear ownership, pattern drift
   * Low – cleanup-level issues worth fixing

2. **Per-Issue Breakdown**
   For **every** issue include:

   * File(s) involved
   * Exact pattern or construct causing the issue
   * Why this is dangerous in an offline-first app
   * What will break (now or later) and under what conditions

3. **Fix Strategies**
   After listing all issues:

   * Propose one or more fix approaches per issue
   * Explicitly describe tradeoffs
   * Call out when a fix improves correctness but increases complexity
   * Prefer long-term architectural soundness over short-term convenience

---

### **Audit Rules**

* If something is ambiguous, **call it out explicitly**
* If a pattern looks intentional but wrong, **still flag it**
* Do not assume missing context is correct
* Do not praise the code
* Prefer correctness over politeness
* Prefer explicit reasoning over general advice
