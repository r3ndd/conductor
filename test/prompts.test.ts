import { describe, expect, it } from "bun:test"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { loadAgentPrompt, resolvePromptRoots } from "../src/agents/prompts"

async function withTmp<T>(fn: (root: string) => Promise<T>) {
  const root = await mkdtemp(join(tmpdir(), "conductor-prompts-"))
  try {
    return await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

describe("agent prompts", () => {
  it("prefers cwd src prompt root before cwd dist", async () => {
    await withTmp(async (root) => {
      const src = join(root, "src/agents/prompts")
      const dist = join(root, "dist/agents/prompts")
      await mkdir(src, { recursive: true })
      await mkdir(dist, { recursive: true })
      await writeFile(join(src, "coder.md"), "---\nmode: subagent\n---\nFrom SRC")
      await writeFile(join(dist, "coder.md"), "---\nmode: subagent\n---\nFrom DIST")

      const roots = resolvePromptRoots(root, "file:///virtual/dist/index.js")
      const out = loadAgentPrompt("coder", roots)
      expect(out.issue).toBeNull()
      expect(out.text).toBe("From SRC")
    })
  })

  it("falls back to cwd dist prompt root", async () => {
    await withTmp(async (root) => {
      const dist = join(root, "dist/agents/prompts")
      await mkdir(dist, { recursive: true })
      await writeFile(join(dist, "reviewer.md"), "---\nmode: subagent\n---\nFrom DIST")

      const roots = resolvePromptRoots(root, "file:///virtual/dist/index.js")
      const out = loadAgentPrompt("reviewer", roots)
      expect(out.issue).toBeNull()
      expect(out.text).toBe("From DIST")
    })
  })

  it("reports empty prompt after frontmatter strip", async () => {
    await withTmp(async (root) => {
      const src = join(root, "src/agents/prompts")
      await mkdir(src, { recursive: true })
      await writeFile(join(src, "architect.md"), "---\nmode: subagent\n---\n")

      const roots = [src]
      const out = loadAgentPrompt("architect", roots)
      expect(out.issue?.reason).toBe("empty")
    })
  })
})
