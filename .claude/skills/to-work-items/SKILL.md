---
name: to-work-items
description: Break a destination, plan, or settled conversation into small independently executable work items.
disable-model-invocation: true
---

Turn a destination document, plan, or sufficiently settled conversation into **work items**: units small enough that a fresh context can pick one up, do it, and verify it.

Read the source material first — the destination document, the plan, the conversation, and whatever they reference. Decompose from what is settled; a part still under discussion is not ready to become an item, so name it as unsettled and leave it out.

## Sizing

One item is one **vertical slice**: a narrow path through the whole thing that works end to end, rather than a horizontal layer that works for nothing until its siblings land. Each slice is independently verifiable — done means demonstrably done, not done-pending-the-next-three-items.

Size each item to a fresh context. An item that needs the conversation that produced it is too big or under-specified; fix it by splitting the item or by writing down the constraint it was leaning on.

Record a dependency only where one item genuinely blocks another. Most do not, and a dependency that exists only in the order you happened to write them makes the set look more sequential than it is.

**Wide refactors are the exception to vertical slicing.** A wide refactor is one mechanical change — rename a column, retype a shared symbol — whose blast radius fans across the whole codebase, so a single edit breaks every call site at once and no vertical slice can land green. Sequence it as **expand–contract** instead. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites in batches sized by blast radius (per package, per directory), each batch its own item blocked by the expand, staying green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in an item blocked by every migrate batch.

## Contents

Each item carries what an executing agent genuinely needs:

- **Outcome** — what is true when this item is done.
- **Acceptance criteria** — how that gets verified.
- **Blockers** — the items that must land first, where any do.
- **HITL / AFK** — whether this one wants the operator in the loop, where that is not obvious.
- **Constraints** — the non-obvious ones a fresh agent would otherwise rediscover or guess at.

Leave out a heading with nothing under it.

## Storage

Two backends. Propose one, let the operator confirm, then publish.

**GitHub Issues** — the default when the repository has a GitHub remote. One issue per item, created blockers-first so each can reference real numbers; blockers become native issue dependencies (`gh api --method POST repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by -F issue_id=<blocker database id>`, where the id is `gh api repos/<owner>/<repo>/issues/<blocker> --jq .id`) and fall back to a `Blocked by: #n` line at the top of the body where dependencies are unavailable. Label each item `ready-for-agent`, or `ready-for-human` where it is HITL. Where the repository keeps its own tracker conventions (an `agents/issue-tracker.md` or the like), those win. Issues carry state — open, closed, blocked — which a file cannot; that is why they are the default when a tracker is there.

**Markdown in the repository** — when there is no remote, or the operator prefers it. One file for a small set, one file per item under `docs/work-items/` for a large one, each item's blockers named in its body. A Markdown set has no state of its own: mark items done in the file as they land, or the set silently drifts from the git log.

The destination document stays in the repository either way. It is the standing understanding; the items are the work left to do.

Whichever backend holds them, the contents above are the whole contract: the result is a list of work, and tracking it is ordinary Git and ordinary judgement.
