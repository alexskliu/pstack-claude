# Codex compatibility verification

Version 0.9.85 was checked on macOS in native Codex with the startup routing hook disabled. Shared skills resolve host-specific operations through [the Codex adapter](../plugins/pstack/skills/poteto-mode/references/codex-tools.md). Claude, Pi, and Copilot keep their own mappings.

## Automated checks

Use the repository's CI-pinned Bun 1.3.14. An older system Bun can lack `Bun.YAML`; that is a toolchain mismatch, not a skill failure. No new project dependency is required.

```sh
bun install --frozen-lockfile
bun tools/generate.mjs --check
bun test tests/
```

In `plugins/pstack/skills/poteto-mode/scripts`:

```sh
bun install --frozen-lockfile
bun run typecheck
bun test orch watch-pr check-plan.test.ts
```

Observed results: 1,203 repository tests passed, 40 environment-dependent checks skipped, and 247 helper tests passed. The helper typecheck, generated-file checks, fork registry dry run, and Markdown lint passed. The new adapter regression suite first failed all five checks against the previous guidance, then passed after the fixes.

The cancellation fixture originally reached its 250 ms deadline before starting its child on this host. Its deadline is now one second; it still asserts completion below 1.5 seconds and verifies that the child was killed before its two-second operation could complete.

## Native workflow forward tests

Each test used an isolated fixture, the candidate plugin by absolute path, and the host's native tools. Fixture writers had disjoint directories. User configuration and real repositories were outside their write scope.

| Workflow | Fixture and observed result |
| --- | --- |
| `how` | Explained a one-based pagination function through its single-explainer workflow. Native execution checked the first, partial, beyond-end, and invalid-argument cases. Source remained unchanged. |
| `tdd` | Implemented pagination from a stub with built-in Node tests. Four tests failed before implementation and passed afterward. Separate acceptance checks verified invalid inputs, bounds, and no input mutation. |
| `setup-pstack` | Refreshed an isolated model sheet and bounded AGENTS block twice. The second run changed neither file. Model/panel choices, `session hook: off`, and unrelated instructions were preserved. |
| `recall` | Reconstructed a decision from an explicitly incomplete supplied digest. It qualified the evidence and did not invent a chat UUID, deployment, performance result, or implementation status. |
| `architect` through `arena` | Compared array, linked-list, and ring-buffer designs on three configured Codex models, then used an independent judge. The clean run wrote disjoint candidate artifacts with no model or role failures and produced a design-only synthesis. |
| `interrogate` | Three configured native reviewers independently found a seeded quantity-multiplication regression. Lead execution confirmed the incorrect result. Review remained read-only. |

The first architecture run exposed a native role mismatch: read-only `architect` agents could not write candidate artifacts. The adapter now requires write-capable candidate roles. A fresh run using those instructions passed. Both architecture and review exercised explicit model overrides with fresh-history forks; the explanation workflow exercised inherited delegation.

These are representative workflow checks, not proof that every workflow or provider works in every host. Structured question selection was checked against the available tool contract without sending test questions to the user. No live deployment, PR merge, external message, or private transcript crawl was performed. Windows hook execution and installed/live Pi checks were not available on this host. Do not use `watch-pr/live-merge-safety.mjs` as an offline test: it mutates a real GitHub repository.
