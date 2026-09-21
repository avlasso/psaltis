# Living Document Format

Decisions are recorded as **living documents**: one document per topic, with an intentional title, describing the *current* position. When thinking changes, edit the document in place — git history is the archive. Never create a numbered "superseding" record.

They live in `docs/decisions/`, or wherever this repository already keeps them — match the existing convention before inventing one. Create the directory lazily, when the first document is needed.

## Naming

The filename is a kebab-case version of the title, and the title names the topic, not the event: `membership-and-vouching.md`, not `0003-decided-membership-rules.md`. If the subject of a document drifts, retitle it — the title is part of the content.

## Template

```md
# {Intentional title naming the topic}

{1-3 sentences: where we currently stand, and why.}
```

That's it. A document can be a single paragraph. The value is recording *where we stand* and *why* — not filling out sections.

## Optional sections

Only include these when they add genuine value. Most documents won't need them.

- **Open questions** — what would change the current position
- **Considered options** — only when the rejected alternatives are worth remembering (they stop the same suggestion resurfacing in six months)
- **Consequences** — only when non-obvious downstream effects need to be called out

## Updating vs. creating

Before creating a new document, check whether an existing one already owns the topic — if so, update it in place, retitling if the subject has drifted. A set of living documents stays small and current; a pile of overlapping documents is just ADRs with worse names.

## When to offer a document

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it — you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.
