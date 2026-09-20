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

## Contents

Each item carries what an executing agent genuinely needs:

- **Outcome** — what is true when this item is done.
- **Acceptance criteria** — how that gets verified.
- **Blockers** — the items that must land first, where any do.
- **HITL / AFK** — whether this one wants the operator in the loop, where that is not obvious.
- **Constraints** — the non-obvious ones a fresh agent would otherwise rediscover or guess at.

Leave out a heading with nothing under it.

## Storage

Ask the operator where the items should live. Default to Markdown in the working repository — one file for a small set, one file per item for a large one. Offer GitHub Issues or another tracker when this project already runs on one, or when blocking relationships and a long-lived backlog are real here.

Whichever backend holds them, the contents above are the whole contract: the result is a list of work, and tracking it is ordinary Git and ordinary judgement.
