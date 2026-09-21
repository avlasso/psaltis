# Wayfinding on GitHub Issues

How the map, its tickets, blocking and the frontier are expressed on GitHub through the `gh` CLI. A repository that names another tracker (in `CLAUDE.md` or an `agents/issue-tracker.md`) replaces this file with its own.

- **Map**: a single issue labelled `wayfinder:map`, holding the Destination / Notes / Decisions-so-far / Not-yet-specified / Out-of-scope body. `gh issue create --label wayfinder:map`. Create labels the first time they are needed (`gh label create`).
- **Ticket**: an issue linked to the map as a GitHub **sub-issue** (`gh api --method POST repos/<owner>/<repo>/issues/<map>/sub_issues -F sub_issue_id=<ticket database id>`). Where sub-issues are unavailable, add the ticket to a task list in the map body and put `Part of #<map>` at the top of the ticket body. Label: `wayfinder:<type>` — `research`, `prototype`, `grilling` or `task`.
- **Database id**: `gh api repos/<owner>/<repo>/issues/<n> --jq .id` — the numeric id the dependency and sub-issue endpoints take, not the `#number` or the `node_id`.
- **Blocking**: GitHub's native issue dependencies — `gh api --method POST repos/<owner>/<repo>/issues/<ticket>/dependencies/blocked_by -F issue_id=<blocker database id>`. GitHub reports open blockers in `issue_dependencies_summary.blocked_by`; a ticket is unblocked when that count is zero. Where dependencies are unavailable, fall back to a `Blocked by: #n, #n` line at the top of the ticket body, unblocked when every listed issue is closed.
- **Frontier query**: the map's open children, minus any with an open blocker or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append the ticket's name (linked) and a one-line gist to the map's Decisions-so-far with `gh issue edit <map> --body`.

Infer the repository from `git remote -v`; `gh` does this itself inside a clone.
