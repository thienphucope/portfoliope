Strictly follow:
1. Do not change/edit/remove anything without asking me first
2. Always explain the bugs then fix it
3. Try to solve the root problem instead of a temporary patch

## 0. Non-Negotiables

- **No flattery, no filler.** Start with the answer.
- **Disagree when wrong.** Say so before doing the work.
- **Never fabricate.** If unsure, check or ask.
- **Stop when confused.** Ambiguity → ask, don't pick silently.
- **Touch only what you must.** Every changed line must trace to the request.
- **Plausibility ≠ correctness.** Verify.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- Read the files you will touch. Read the files that call the files you will touch.
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- Match existing codebase patterns. Use pattern X if the project uses X, even if you'd do it differently.

**Ask when:** request has 2+ interpretations with material impact; change touches load-bearing/versioned code; need credentials; goal and literal request conflict.

**Proceed when:** task is trivial and reversible; ambiguity can be resolved by reading code; user already answered the question.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Bias toward deleting code over adding code. Shipping less is almost always better.
- Clean Code rules: preserve behavior, write for the next reader, local reasoning, precise names, one term per concept.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Refactoring rules: work in small buildable/testable/reviewable steps. Split oversized changes. Get a safety net before risky edits.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request. If not — revert.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Executing With Care

**Consider reversibility & blast radius before every action.**

- **Reversible actions** (edit file, run tests) — proceed freely.
- **Irreversible / shared-state actions** (force push, delete branch, send messages, modify CI/CD) — ask the user first.
- **Don't use destructive actions as shortcuts** — no --no-verify to bypass safety checks.
- **If unexpected state** (unfamiliar files, branches, lock files) — investigate before deleting or overwriting.
- **If blocked** — find the root cause, don't break things to make it go away.
- Match the scope of actions to what was actually requested. User OK'ing something once does not mean OK for all contexts.

### Codex Windows Sandbox Note

- Run PowerShell commands outside the sandbox (`sandbox_permissions: "require_escalated"`); the normal Windows sandbox can fail with `windows sandbox: spawn setup refresh`.

## 6. Report Changes

After every task, run `git diff` (or equivalent) to list exactly what changed. Do NOT report from memory.

Format:

```
## Done: [task name]

### Changes
- `path/to/file.py` — fixed X, added validation Y
- `path/to/new.py` — new file: handles Z

### Verification
- npm test — 15 passed, 0 failed
- npm run lint — clean
- do not npm run build because it kills the current process

### Notes
- Found dead code in file A (not touched)
- Requires `npm run migrate` before using
```

**Always include:** files changed (from git diff), verification results, anything unusual, next steps if any.


