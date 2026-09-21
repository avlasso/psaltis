---
name: to-destination
description: Synthesise an aligned conversation into one compact destination document.
disable-model-invocation: true
---

Turn what this conversation has already settled into a single **destination** document: a compact statement of the end state, small enough to be the whole of what a fresh context needs.

Synthesis, not a second interview. The material is in the conversation already — read back over it and write it down. Where a question is genuinely open, record it as open rather than asking it now.

When the conversation has not settled enough to synthesise — the shape of the end state is still being invented — say so and call the Skill tool with "grilling" instead.

## Writing it

Include a part when it carries weight and leave out the rest; this is a document, not a form. The parts that usually earn their place:

- **End state** — what is true once this is done, concrete enough to recognise.
- **Boundaries** — what sits deliberately outside this, especially where the conversation considered something and set it aside.
- **Constraints** — the non-obvious ones: what the operator ruled in or out, and why.
- **Acceptance** — how the operator will know it worked, where that is checkable.
- **Seams** — in a codebase, where the work will be tested: the interfaces a test drives to prove the end state. Prefer seams that already exist, the highest one that still exercises the behaviour, and as few as possible — the ideal number is one. A new seam is a design decision, so name it and check it with the operator before writing it down. Work items and `/tdd` build at these seams; leaving them unsettled here means each fresh context picks its own.
- **Open decisions** — every question the conversation left genuinely unresolved, stated as a question with the options as understood. This is the section that must be complete: a silently-assumed answer is the failure this document exists to prevent.

Compact is the point — a fresh agent should read the whole thing and be oriented. Favour the sentence over the section, and let existing artifacts carry their own weight: reference a spec, decision document, commit, or file by path rather than restating it.

## Finishing

Propose a path in the working repository, let the operator confirm it, and write the file.

Then stop. The document is the deliverable, and its value is that the operator reads it and disagrees with the parts you got wrong. Breaking it into work items is `/to-work-items`, when the operator asks for it.
