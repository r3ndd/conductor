import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { writeArtifact } from "../src/knowledge/artifacts"
import { buildCommandPrompt } from "../src/commands/runtime"
import { appendMemory } from "../src/knowledge/memory"
import { buildCompactionContext } from "../src/knowledge/compact"
import { readState, setStage, switchMode } from "../src/knowledge/state"

async function withTmp<T>(fn: (root: string) => Promise<T>) {
  const root = await mkdtemp(join(tmpdir(), "conductor-test-"))
  try {
    return await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

describe("state, artifacts, and memory", () => {
  it("persists mode and stage in state file", async () => {
    await withTmp(async (root) => {
      await switchMode(root, "plan")
      await setStage(root, "reviewer")
      const state = await readState(root)
      expect(state.mode).toBe("plan")
      expect(state.stage).toBe("reviewer")
    })
  })

  it("writes typed artifact with metadata", async () => {
    await withTmp(async (root) => {
      await mkdir(join(root, ".conductor"), { recursive: true })
      const out = await writeArtifact("plan", {
        root,
        topic: "Add API cache",
        text: "# Plan\n\nShip caching.",
        mode: "plan",
        session: "s1",
        agent: "plan",
        command: "/brainstorm",
      })
      const text = await Bun.file(out.path).text()
      expect(text.includes("type: plan")).toBeTrue()
      expect(text.includes("source_command: /brainstorm")).toBeTrue()
    })
  })

  it("deduplicates AGENTS memory entries", async () => {
    await withTmp(async (root) => {
      const first = await appendMemory(root, "Use codanna only for diagnostics in v1.")
      const second = await appendMemory(root, "Use codanna only for diagnostics in v1.")
      const text = await Bun.file(join(root, "AGENTS.md")).text()
      expect(first).toBeTrue()
      expect(second).toBeFalse()
      expect(text.match(/memory:/g)?.length).toBe(1)
    })
  })

  it("injects conductor continuation context", async () => {
    await withTmp(async (root) => {
      await switchMode(root, "plan")
      await setStage(root, "coder")
      const text = await buildCompactionContext(root)
      expect(text.includes("active_mode: plan")).toBeTrue()
      expect(text.includes("current_stage: coder")).toBeTrue()
    })
  })

  it("creates brainstorm artifact before returning path", async () => {
    await withTmp(async (root) => {
      const out = await buildCommandPrompt(root, "brainstorm", "Idea: tighten agent prompts")
      expect(out?.includes("I saved a brainstorm artifact at")).toBeTrue()
      const state = await readState(root)
      expect(state.last.plan).toBeTruthy()
      const file = join(root, ".conductor", "plans", state.last.plan as string)
      expect(await Bun.file(file).exists()).toBeTrue()
    })
  })

  it("supports /branstorm typo alias", async () => {
    await withTmp(async (root) => {
      const out = await buildCommandPrompt(root, "branstorm", "Idea: typo alias")
      expect(out?.includes("I saved a brainstorm artifact at")).toBeTrue()
      const state = await readState(root)
      expect(state.last.plan).toBeTruthy()
    })
  })
})
