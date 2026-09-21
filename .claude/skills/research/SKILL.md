---
name: research
description: Investigate a question against primary sources in a background subagent and capture the findings as a cited Markdown file in the repository. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated so the main context stays clean.
---

Dispatch a **background subagent** (the Agent tool, `run_in_background: true`) to do the research, so the reading happens in its own context window and this one keeps working. Only the subagent's report comes back here; the pages it read do not.

The subagent's job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs, the operator's own files — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source. Findings first, then the evidence; a fresh reader should get the answer from the first paragraph.
3. Save it under `docs/research/<slug>.md` on the **current branch**, or wherever this repository already keeps such notes — match the existing convention. Never a throwaway branch: research a fresh context cannot `ls` its way to is research lost.

Several independent questions are several subagents, fired at once. Give each one question, not a list.

When the subagent reports, read the file it wrote, not the report — the file is the primary source — and carry on. Research feeds the thinking; it does not replace it. The file is material to take into `/grill-me` or `/to-destination`, not a decision.
