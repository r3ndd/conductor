import { describe, expect, it } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { doctor } from "../src/integrations/doctor"

async function withTmp<T>(fn: (root: string) => Promise<T>) {
  const root = await mkdtemp(join(tmpdir(), "conductor-doctor-"))
  try {
    return await fn(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

describe("doctor", () => {
  it("returns structured diagnostic report", async () => {
    await withTmp(async (root) => {
      const out = await doctor(root, {
        mcp: {
          context7: { type: "local", command: ["npx", "-y", "@upstash/context7-mcp@latest"] },
          codanna: { type: "local", command: ["codanna", "--config", ".codanna/settings.toml", "serve", "--watch"] },
        },
      })
      expect(out.includes("Conductor Doctor")).toBeTrue()
      expect(out.includes("mcp-shape")).toBeTrue()
      expect(out.includes("codanna-bin")).toBeTrue()
      expect(out.includes("codanna-settings")).toBeTrue()
    })
  })
})
