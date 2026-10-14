import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { deriveSkill, effortSection, loadLeadLines, loadModels } from "../tools/generate.mjs";
import { codexModelNamesSection } from "../tools/runtimes.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const mapping = read("plugins/pstack/skills/poteto-mode/references/codex-tools.md");

describe("Codex dispatch examples", () => {
  test("copyable calls fit the native spawn contract", () => {
    const examples = [...mapping.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
    expect(examples).toHaveLength(2);
    const allowed = new Set(["task_name", "message", "agent_type", "fork_turns", "model", "reasoning_effort"]);
    for (const call of examples) {
      expect(typeof call.task_name).toBe("string");
      expect(typeof call.message).toBe("string");
      expect(Object.keys(call).every((key) => allowed.has(key))).toBe(true);
      if (call.model || call.reasoning_effort) expect(call.fork_turns).toBe("none");
    }
    expect(examples[0].model).toBeUndefined();
    expect(examples[0].reasoning_effort).toBeUndefined();
    expect(examples[1].model).toBeDefined();
    expect(examples[1].fork_turns).toBe("none");
  });

  test("generated effort guidance preserves the override/fork constraint", () => {
    const generated = effortSection(["low", "high"], "session");
    expect(generated).toContain('`fork_turns: "none"`');
    expect(generated).toContain("exposed");
    expect(generated).not.toContain("reasoning_effort` and keep the usual instructions");
  });
});

describe("direct transcript workflow invocation", () => {
  const models = loadModels();
  const leads = loadLeadLines();
  for (const skill of ["recall", "show-me-your-work"]) {
    test(`${skill} receives its Codex gate without going through poteto-mode`, () => {
      const file = `plugins/pstack/skills/${skill}/SKILL.md`;
      const derived = deriveSkill(file, read(file), models, leads);
      expect(derived).toContain("On Codex, read the [platform mapping]");
      expect(deriveSkill(file, derived, models, leads)).toBe(derived);
    });
  }
});

test("Codex panel guidance matches current roles", () => {
  const text = codexModelNamesSection(loadModels());
  const panels = text.split("- Diverse-model panels")[1].split("\n")[0];
  expect(panels).toContain("`arena`");
  expect(panels).toContain("`architect`");
  expect(panels).toContain("`interrogate`");
  expect(panels).not.toContain("`reflect`");
  expect(panels).not.toContain("`how` critics");
});
