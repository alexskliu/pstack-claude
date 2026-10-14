### Session pickup

**You own the resume point. Read the prior trail, don't redo it.**

1. Read the project checkpoint first using [Resume storage](../references/resume-storage.md). A successful read gives the note and artifacts without requiring a path from the previous session. An unavailable or incomplete checkpoint needs diagnosis rather than a silent fallback. If the pointer is missing, locate the prior trail using the active runtime:
   - On Claude Code, use a local transcript under its per-project directory at `~/.claude/projects/<encoded-cwd>/*.jsonl` (where `<encoded-cwd>` is the workspace cwd with `/` → `-`). Do not glob across other project directories or read unrelated private chats.
   - On Codex, prefer the current conversation or supplied digest, or an authorized task-read tool for the identified task. If local rollout files are needed, first verify their metadata identifies this workspace and intended task before reading conversation content. Do not scan unrelated conversations or use Claude's transcript directories by default. If no authorized source is available, state the gap and recover from the checkpoint artifacts and Git state.
   - On other runtimes, use their documented transcript/task interface scoped to this workspace; do not assume Claude's storage layout. A supplied cloud-agent URL or pushed branch can also provide the prior trail.
   For transcript fallback, read the metadata overview and last messages first, then scan back for the decision points. Parse a long transcript in a subagent and keep the reduced timeline in the main thread (the **principle-guard-the-context-window** skill).
2. Reconstruct operational state. The branch and worktree, what already landed (`git log`, `git diff` against the base), the open todos, the decisions made. Use the prior trail to recover progress. For claims about human rulings, follow [Claims about human decisions](../../why/references/epistemics.md#claims-about-human-decisions). An agent summary is not the original ruling.
3. Diff done vs pending. Compare what shipped against what was planned, name the resume point, do not re-run the prior repro or redo completed work. Recheck claims that affect the remaining work without repeating completed investigations. Read artifacts linked by the resume note, including requested questions or checklists.
4. Route the remaining work to the matching playbook and pick the verdict: continue the execution, ship a finished recommendation, ratify or override a prior conclusion, or postmortem a failed run. The pickup playbook ends here. The routed playbook owns the rest.
5. Verify the inherited claims against the original goal on the real artifact (the **principle-prove-it-works** skill). A passing prior self-report is not the proof.

**Reply:** where the prior agent stopped, what you inherited vs redid (ideally nothing redone), the resume point, and the outcome.
