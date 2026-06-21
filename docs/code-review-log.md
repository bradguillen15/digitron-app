---
description: Living journal of code reviews. Each entry is anchored to a commit SHA so future reviews can diff against a known baseline and track SOLID compliance trends over time.
alwaysApply: false
---

# Code Review Log

## Purpose

This file is the project's **code-review memory**. Every time a meaningful review is run (agent or human), an entry is added here so that:

- There is a clear "before" snapshot to compare against on the next review.
- SOLID compliance trends are visible across time.
- Recurring patterns and open action items are never lost between sessions.

> Agents: when you run `/code-review` or `/code-auditing`, append a new entry at the **top** of the [Review Entries](#review-entries) section using the [entry template](#entry-template). Update the [Architecture Baseline](#architecture-baseline) and [SOLID Matrix](#solid-compliance-matrix) only when the structure meaningfully changes.

---

## Architecture Baseline

_Last updated: 2026-06-20 @ `0f454c5`_

### Frontend (React + TanStack Router + Vite)

| Layer | Path | Responsibility |
|---|---|---|
| Routes | `src/routes/` | Page-level components; each route owns its queries and mutations |
| Components | `src/components/` | Shared UI components (dialogs, forms, tables) |
| Hooks | `src/hooks/` | Reusable data-fetching hooks (`use-auth`, `use-technicians`, `use-clients-min`) |
| Repositories | `src/lib/repositories/` | **Single Supabase access layer** — only file allowed to import from `@/integrations/supabase/client` (besides `auth.service.ts`) |
| Auth service | `src/lib/auth.service.ts` | Wraps `supabase.auth.*`; the only non-repository supabase importer |
| Server functions | `src/lib/orders.functions.ts`, `src/lib/users.functions.ts` | Receive supabase via middleware context; explicitly excluded from the repository pattern |
| State machine | `src/lib/state-machine.ts` | Service-order stage transition logic |

### Key architectural constraints (in force as of baseline)

- Zero direct supabase imports outside `src/lib/repositories/` and `src/lib/auth.service.ts` (enforced by grep check in CI).
- Routes use TanStack Query for all data-fetching; no local `useState` for remote data.
- Login page uses `react-hook-form` + `zod` + `useMutation` (no raw `useState` form).
- E2E tests run against a local Supabase instance (Docker); no mock adapters.

---

## SOLID Compliance Matrix

Rated per area: ✅ Strong · ⚠️ Partial · ❌ Violation · — Not applicable

| Principle | Repositories | Routes | Hooks | Components | Notes |
|---|---|---|---|---|---|
| **S** — Single Responsibility | ✅ | ⚠️ | ✅ | ⚠️ | Large route files (`$orderId.tsx`) mix queries, mutations, and UI |
| **O** — Open / Closed | ⚠️ | ⚠️ | — | — | Repositories are closed to query-shape changes but open to new methods |
| **L** — Liskov Substitution | — | — | — | — | No inheritance in use; N/A for current patterns |
| **I** — Interface Segregation | ✅ | ✅ | ✅ | ✅ | Repository methods are narrowly scoped per consumer |
| **D** — Dependency Inversion | ⚠️ | ⚠️ | ⚠️ | — | Routes/hooks depend on concrete repository objects, not interfaces; acceptable for this scale |

_Last updated: 2026-06-20 @ `0f454c5`_

---

## Entry Template

Copy this block and paste it **above** the previous most-recent entry:

```markdown
---

## Review #N — YYYY-MM-DD @ `<commit-sha>`

**Scope:** [whole project / module / feature / files]
**Triggered by:** [agent: code-review | agent: code-auditing | human | pre-PR | scheduled]
**Reviewer:** [Claude Sonnet 4.6 | human | ...]

### Summary

One paragraph describing the overall health and the most important finding.

### Findings

| # | File / Area | Severity | SOLID principle violated | Description |
|---|---|---|---|---|
| 1 | `path/to/file.ts` | High / Medium / Low | S / O / L / I / D / — | Short description |

### Patterns Observed

- **Recurring**: list patterns seen in multiple files
- **New since last review**: patterns that appeared after `<previous-commit-sha>`
- **Resolved since last review**: issues from the previous entry that are now fixed

### Architecture Changes Since Last Review

_Diff from `<previous-commit-sha>` to `<this-commit-sha>`._

- [ ] Change 1
- [ ] Change 2

### Action Items

| Priority | Task | Owner | Linked issue |
|---|---|---|---|
| High | ... | dev / agent | — |

---
```

---

## Review Entries

_No reviews logged yet. Run `/code-review` or `/code-auditing` to generate the first entry._

---
