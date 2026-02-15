---
description: Periodic architecture and reliability audit for the full Expo + WatermelonDB codebase
---

Use this workflow for deep, periodic audits of the entire repository.

## Objective
Find systemic risks that can cause data integrity issues, reactive bugs, offline failures, or long-term architectural drift.

## Audit scope
- Architecture boundaries and dependency direction.
- WatermelonDB read/write ownership and observable lifecycle.
- State duplication across DB, hooks, contexts, and component state.
- Performance under large local datasets and long-lived sessions.
- Failure handling for background/resume and partial corruption scenarios.

## Method
1. Build a mental model of critical flows:
   - onboarding
   - account management
   - journal entry/list/details
   - reports and net worth
   - import/export and recovery
2. Trace data paths end-to-end (query -> transform -> subscribe -> render -> mutate).
3. Flag anything that breaks source-of-truth guarantees or feature boundaries.
4. Prioritize fixes that reduce correctness risk and architecture entropy.

## Output format
1. Executive verdict (overall risk level + top 1-2 systemic risks).
2. Findings by severity:
   - Critical
   - High
   - Medium
   - Low
3. For each finding:
   - Files
   - Problem pattern
   - Why it is dangerous in this app
   - Failure mode (when it breaks)
   - Recommended fix and tradeoff
4. Remediation plan:
   - Immediate actions
   - Near-term actions
   - Deferred actions

## Review posture
- Be direct and specific.
- Prefer correctness over convenience.
- Do not praise or pad output.
- Call out ambiguity explicitly.

