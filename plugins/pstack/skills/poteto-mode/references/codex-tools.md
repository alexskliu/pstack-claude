# Codex tool mapping for pstack

pstack shares its Claude Code skill text across runtimes. On Codex, apply this adapter before the shared instructions: tool calls, paths, delegation, and authorization follow the current host. Read the exposed tool schemas; availability differs between Codex CLI, desktop, and hosted sessions. The names below are examples, not a reason to call an absent tool. Other runtimes use their own mapping.

Host policy and the user's instructions take precedence over workflow defaults. A skill cannot authorize external messages or unrelated account changes. Preserve authorization the user already gave for the task; do not add another approval gate merely because shared prose says "always pause" or "the operator clicks merge". Required verification and independent review still apply.

## Tool actions

| pstack / Claude action | Codex equivalent |
|------------------------|------------------|
| Read a file | The exposed file reader or `exec_command` with `cat`/`sed` |
| Create / edit / delete a file | `apply_patch` |
| Run a shell command | `exec_command` or the host's shell tool; use `write_stdin` for a running session |
| Search file contents / find files | `rg` or `rg --files` through the shell tool |
| Fetch a URL / search the web | An exposed web/docs tool, or an authorized CLI fetch; follow the host's source rules |
| Invoke a skill (the `Skill` tool, `/command`) | Skills load natively. Follow the instructions presented. |
| Dispatch a subagent (the `Agent`/`Task` tool) | `spawn_agent` |
| Dispatch N parallel subagents in one turn | N `spawn_agent` calls in one response |
| Wait for a subagent result / `TaskOutput` | `wait_agent` and delivered agent messages; some wait tools signal an update without returning its text |
| Message / continue a native subagent | `send_message` for a running agent; `followup_task` or the exposed resume action when a new turn is needed |
| Inspect / interrupt a subagent | `list_agents` / `interrupt_agent`, when exposed; interruption is not deletion or guaranteed slot release |
| Free a finished subagent slot | `close_agent` only if exposed; otherwise obey the host's lifecycle and capacity limits |
| Track tasks (`TaskCreate`, `TaskUpdate`, `TodoWrite`) | `update_plan` if exposed; otherwise poteto-mode's local checklist. Do not create a goal unless the user requested one |
| Ask the human (`AskUserQuestion`) | `request_user_input_async` when suitable; `request_user_input` only in a mode that permits it; otherwise one concise chat question |

When the host uses `functions.exec`, compose the tools it exposes there. Call `collaboration.*` directly when the host requires it; do not invent `tools.spawn_agent` inside that wrapper. Native subagents are different from desktop chat tools such as `create_thread`: create or message user-owned chats only when the user authorizes that action.

An asynchronous input request returns before the answer. Keep a required question pending and continue only independent work until the answer arrives. Silence, a preselected option, and elapsed time are not consent. Use question tools only for their supported purpose, not as a substitute for a permission tool.

Use subagents when their tools are exposed. Some CLI configurations require `features.multi_agent = true`, but do not change configuration merely because a tool is absent on another host. Exploration may degrade to a clearly labeled sequential pass. A required independent review does not degrade to self-review; keep that gate blocked as [Subagents](../SKILL.md#subagents) specifies.

A capacity rejection is not a model error. Stop the fan-out after the first capacity rejection, drain existing work, and retry only when the host reports capacity. Do not change models or assume an interruption freed a slot. Reuse a finished independent reviewer through the host's follow-up action only under poteto-mode's reviewer-reuse exception.

## Subagent policy

poteto-mode's Subagents section sets Claude-specific defaults (`subagent_type: "pstack:poteto-agent"`, `run_in_background: true`). On Codex:

- Use the actual `spawn_agent` schema. Common Codex fields are `task_name`, `message`, and optional `agent_type`, `model`, `reasoning_effort`, and `fork_turns`. Do not pass Claude-only `subagent_type`, `run_in_background`, or `readonly` fields when the schema does not accept them.
- The shared `poteto-agent` is not a built-in Codex role; neither `pstack:poteto-agent` nor `pstack:effort-<level>` is a native role name. Use an available native role or the default agent and give it the relevant pstack instructions by absolute file path.
- Map shared `general-purpose` to the default native agent. Match a specialized role's permissions to its assignment, not its name: native `architect` or `explore` roles may be read-only. Arena/swarm candidates that must write artifacts need a write-capable default/executor role. A read-only candidate may return its design for the parent to save when the brief permits that; never ask it to override its role restrictions.
- Native spawns already run concurrently. Give read-only reviewers an explicit no-edit scope; use a read-only sandbox if the host supports one. Prompt scope alone is not a filesystem permission boundary.
- For `inherit-parent`/`auto` and `default effort: session`, omit model and effort overrides. Validate explicit values against the live schema/model catalog. If the schema distinguishes full-history forks from fresh agents, model or effort overrides require `fork_turns: "none"`; supply a self-contained brief, relevant constraints, and source paths because the child will not inherit the conversation. Never combine overrides with an inherited full-history fork.
- There is no `comment-sicko` subagent type either. The **no-comments** skill spawns it on Claude Code; on Codex dispatch a `spawn_agent` whose instructions tell it to read `poteto-mode/references/agents/comment-sicko.md` in full first.
- There are no `thermo-nuclear-review-subagent` or `thermo-nuclear-code-quality-review-subagent` types. The **thermos** skill spawns both on Claude Code; on Codex dispatch two `spawn_agent` calls whose instructions tell each to read the `thermo-nuclear-review` or `thermo-nuclear-code-quality-review` skill in full first and review only the diff and file contents in its prompt.
- Codex agents may share the same filesystem and checkout. A new chat, task name, or branch name alone does not isolate writes. Give concurrent writers separate worktrees or disjoint owned paths and name them in each brief.
- Interpret completion and interruption using the host's returned status. Do not carry over the shared Claude claim that `completed` means only a notification. Confirm an abandoned writer has stopped before assigning its files again; never claim a nonexistent close/stop tool ran.
- Review delegated changes yourself. Preserve independent review gates and the applicable runtime's messaging authorization rules.

## Dispatch examples

These examples use the common `spawn_agent` schema. Adjust to the exposed schema and use a valid configured model in the second call. Inherit the current model and context:

```json
{"task_name":"inspect_routes","message":"Read /workspace/src/routes.js and explain its callers. Do not edit files."}
```

Use a model override with a self-contained brief:

```json
{"task_name":"review_routes","fork_turns":"none","model":"<available-model>","message":"Review /workspace/src/routes.js against /workspace/spec.md. Read-only; report concrete defects with source references. Do not send messages or modify external state."}
```

## Paths and session evidence

`<codex-home>` means `$CODEX_HOME` when set, otherwise `~/.codex`. Read applicable `AGENTS.md` files. Preserve an existing skill's location; for new project skills use the project's existing supported discovery root, normally `.agents/skills/`. Use the available native skill-creation guidance for user-level installation rather than copying `.claude/skills` paths.

For `recall`, `reflect`, `automate-me`, `show-me-your-work`, and session pickup, use the current conversation or authorized native task-read tools first. If file access is needed, identify the exact Codex rollout from task/workspace metadata before reading messages; native sessions may live under `<codex-home>/sessions` or `archived_sessions`. Do not scan unrelated messages or use `~/.claude/projects` as a Codex fallback. If source access is unavailable, use a clearly labeled session digest and distinguish it from a complete transcript. The supplied Claude transcript finder rejects Codex rollouts; do not feed it those files.

Runtime-neutral durable storage is a separate contract. Reuse an existing checkpoint/orchestration store through its helper, even if its legacy path contains `.claude`; do not silently relocate it. Hook environment variables are also contracts: the shipped Codex hook uses `CLAUDE_PLUGIN_ROOT`, so its spelling alone is not a bug.

## Model names

Skills name Claude defaults (a single-role default for code/prose/judgment plus a diverse-model panel for diverse-model panels; each model-consuming skill lists its own in a Models section). These slugs do not resolve on Codex. Substitute your configured Codex models:

- Single-model roles: your primary Codex model (for example `gpt-6-sol`).
- Roles that default to the strongest Claude model (`bug-fix`, `perf-issue`, `hillclimb`, `strongest judgment`): your strongest Codex model (for example `gpt-6-astra`).
- Diverse-model panels (`arena`, `architect`, `interrogate`): the adversarial signal comes from model diversity, so use the distinct Codex models available to you. A good default panel on ChatGPT is `gpt-6-astra`, `gpt-6-sol`, `gpt-6-luna`. If only one model family is reachable, vary reasoning effort and note in the verdict that diversity was reduced.

`/setup-pstack` writes the configured model list. On Codex, preserve live model IDs and the user's `inherit-parent`/`auto` choices; never pass Claude aliases. `how` and `reflect` use their named role rows rather than an implicit diverse panel. Apply the Subagent policy above when a role overrides model or effort.

## Session routing hook

The native pstack plugin bundles the same `SessionStart` routing instruction as the Claude Code plugin, through `session-start.sh` on macOS and Linux and `session-start.ps1` on Windows. Codex runs the hook on startup, resume, clear, and compact after the user trusts the hook through `/hooks`. The hook reads `session hook` from the Codex sheet, at the path in [setup-pstack's runtime table](../../setup-pstack/SKILL.md#other-runtimes); `session hook: off` disables injection.

A skills-only installation does not include plugin hooks. Request `poteto-mode` explicitly or add a standing instruction to `AGENTS.md` in that case.

## Driver and bundled skills pstack references

The [driver policy](../SKILL.md#non-negotiables) selects the app driver. For skills and drivers named by these workflows, use these Codex equivalents:

| Skill or driver named in pstack | On Codex |
|---------------------------------|----------|
| `run` (drive a CLI/TUI to see a change work) | Run the app through the exposed shell tool and observe the real output. |
| Project UI driver | Drive the UI with whatever automation you have, or hand the user a concrete manual check. Do not claim done without observing the artifact. |
| `plugin-dev:skill-development` (Claude's SKILL.md authoring guidance) | Use the exposed native authoring skill, commonly `skill-creator`; keep portable frontmatter and progressive disclosure. Do not assume a `writing-skills` skill exists. |
| `loop` (recurring/self-paced re-invocation, used by `babysit`) | Use bounded checks during the active task. For user-requested future monitoring, use an exposed automation/scheduling tool; do not invent a loop tool or silently create a recurring job. |

## Per-skill notes

Affected skill entry points and the optional Codex slash stubs point here. Most skills need only the tables above. These need one more mapping:

| Skill | On Codex |
|-------|----------|
| `interrogate` | Use the native spawn fields and read-only scope above, not Claude dispatch arguments. Apply valid model/fork overrides and keep the reviewer panel model-diverse. |
| `setup-pstack` | The skill's Other runtimes table names the Codex sheet path and how it loads; the slugs are your Codex models (see Model names above). The role rows are identical. |
| `no-comments` | There is no `comment-sicko` subagent type; see Subagent policy above. |
| `thermos` | There are no thermo-nuclear subagent types; see Subagent policy above. |
| `teach` | Running `how` and `why` in parallel maps to `spawn_agent` fan-out; image generation uses the configured Codex equivalent. |
| `create-verification-skill` | Discover existing Codex project skills first; create `verify` in the supported project skill root, normally `.agents/skills/verify/`. Use native authoring guidance. The app-driving harness is platform-neutral. |
| `maintain-verification-skill` | The parallel per-feature source readers map to `spawn_agent` fan-out; the project-local skill lives under Codex's skills location, not `.claude/skills/`. |
| `babysit` | `loop` and `AskUserQuestion` resolve through the tables above. |
| `automate-me` | Discover/update personal modes in Codex-supported skill roots; preserve an existing location. Use native authoring guidance and the scoped session evidence policy above instead of Claude skill/transcript paths. |
| `architect` | The runner panel goes through the **arena** skill, so its `spawn_agent` fan-out and model substitution apply here too. |
| `arena` | The parallel candidates and the cross-judge map to `spawn_agent`; substitute your configured Codex models for the runners and the cross-judge pool (see Model names above). |
| `how` | The parallel explorers and the explainer map to `spawn_agent` fan-out; substitute your configured Codex models. |
| `reflect` | Use native subagents and scoped session evidence or a labeled digest. Reviewer briefs must recognize observed native reads and actual installed skill paths; mere catalog visibility does not establish skill use. |
| `recall` | Use scoped Codex session evidence and the available project sources. Do not search Claude transcripts by default or state that missing accessible history never existed. |
| `show-me-your-work` | Keep the decision trail in the requested/project location. Audit against scoped Codex evidence or a labeled digest; choose any comparison reviewer from available Codex models. |
| `swarm` | Each worker is a `spawn_agent` call on your configured Codex model, and those calls already run concurrently; give each writing worker its own worktree or output directory (see Subagent policy above). |
| `why` | The parallel investigators and the synthesizer map to `spawn_agent`; substitute your configured Codex models. List MCP servers from the tools Codex exposes to the session, not from `.mcp.json` or `claude mcp list`. |

## Vendored scripts

`skills/poteto-mode/scripts/` ships the `watch-pr` PR watcher, the `orch` store CLI, and `worktree-audit.mjs`. The `watch-pr/ship-pr` command owns pending-merge inspection and cancellation; `resume.mjs` owns the shared checkpoint locator described in [Resume storage](resume-storage.md). These scripts use bun and Node.js and run the same on Codex; invoke them through `shell`. They need `bun`, `gh`, and (for stack work) `gt`. Run `worktree-audit.mjs` with `node`, as its shebang does. The audit follows each link in a worktree's ancestor directories with `stat` and matches it by the directory it lands on, under bun and node alike. A worktree whose own path bun cannot resolve loses its last chat and lands in `review`. A dangling or looping link is ignored. Any other link that `stat` cannot follow puts every worktree under the link's directory in `review`, with a warning that names the link. `worktree-audit.mjs` scans Codex sessions under `$CODEX_HOME/sessions` and `$CODEX_HOME/archived_sessions` (default `~/.codex`), along with any Claude Code or Pi transcript directory that exists. It imports the transcript walker from `skills/reflect/scripts/find-transcript.mjs`, so keep the `reflect` skill installed beside `poteto-mode`.

## Instructions file

Where a pstack skill says "your instructions file", on Codex that is `AGENTS.md` (project root, plus `<codex-home>/AGENTS.md` globally). On Claude Code it is `CLAUDE.md`. Existing user delivery and permission rules remain controlling.
