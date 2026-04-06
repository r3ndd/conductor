import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { writeArtifact } from "../src/knowledge/artifacts"
import { buildCommandPrompt } from "../src/commands/runtime"
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

describe("state and runtime prompts", () => {
  it("persists mode and stage in state file", async () => {
    await withTmp(async (root) => {
      await switchMode(root, "conductor")
      await setStage(root, "reviewer")
      const state = await readState(root)
      expect(state.mode).toBe("conductor")
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
        mode: "conductor",
        session: "s1",
        agent: "conductor",
        command: "/brainstorm",
      })
      const text = await Bun.file(out.path).text()
      expect(text.includes("type: plan")).toBeTrue()
      expect(text.includes("source_command: /brainstorm")).toBeTrue()
    })
  })

  it("injects conductor continuation context", async () => {
    await withTmp(async (root) => {
      await switchMode(root, "conductor")
      await setStage(root, "coder")
      const text = await buildCompactionContext(root)
      expect(text.includes("active_mode: conductor")).toBeTrue()
      expect(text.includes("current_stage: coder")).toBeTrue()
    })
  })

  it("builds brainstorm orchestration prompt with explicit artifact path", async () => {
    await withTmp(async (root) => {
      const out = await buildCommandPrompt(root, "brainstorm", "Idea: tighten agent prompts")
      expect(out?.includes("Write the brainstorm artifact to:")).toBeTrue()
      expect(out?.includes("@src/commands/learn.md")).toBeTrue()
      const state = await readState(root)
      expect(state.last.plan).toBeTruthy()
    })
  })

  it("supports /branstorm typo alias", async () => {
    await withTmp(async (root) => {
      const out = await buildCommandPrompt(root, "branstorm", "Idea: typo alias")
      expect(out?.includes("Write the brainstorm artifact to:")).toBeTrue()
      const state = await readState(root)
      expect(state.last.plan).toBeTruthy()
    })
  })
})
