---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

A handoff is one of five moves available at a phase boundary — continue, `/clear`, `/handoff`, a subagent, `/compact` — and the narrow one: it buys portability, for a new harness, a new directory, a colleague, or a side task forked mid-phase. When the operator reaches for it with nothing travelling, say so and point at [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md), which orders the five.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, decision documents, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
