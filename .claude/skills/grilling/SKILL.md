---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Each round, ask **one** question from the frontier — the one whose answer reshapes the most of what remains — give your recommended answer, and wait. Never present the whole frontier at once: given a batch, the user answers the first and loses the rest, and a correction to a premise cannot land before it has propagated into the questions asked in the same breath.

Each question should be formatted like so:

```
❓ **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each answer reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them, and can invalidate questions you were about to ask. Recompute the frontier after every answer before choosing the next question. A question whose answer depends on another still-open question belongs to a _later_ round, not this one.

A choice that is genuinely mechanical, with one obvious default, does not earn a round: state it as an assumption the user can correct, and move on.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask from the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
