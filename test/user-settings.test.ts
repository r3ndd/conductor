import { describe, expect, it } from "bun:test"

import { buildPluginAgents } from "../src/config/defaults"
import { parseConductorSettings } from "../src/config/user-settings"

describe("conductor user settings", () => {
  it("accepts partial model overrides", () => {
    const parsed = parseConductorSettings({ models: { conductor: "opencode/gpt-5.1-codex", reviewer: "anthropic/claude-sonnet-4-20250514" } })
    expect(parsed.models.conductor).toBe("opencode/gpt-5.1-codex")
    expect(parsed.models.reviewer).toBe("anthropic/claude-sonnet-4-20250514")
    expect(parsed.issues).toHaveLength(0)
  })

  it("rejects invalid model values", () => {
    const parsed = parseConductorSettings({ models: { coder: 123 } })
    expect(parsed.models.coder).toBeUndefined()
    expect(parsed.issues.length).toBeGreaterThan(0)
  })

  it("applies overrides to plugin agents", () => {
    const agents = buildPluginAgents({ architect: "anthropic/claude-haiku-4-20250514" })
    expect(agents.architect.model).toBe("anthropic/claude-haiku-4-20250514")
    expect(agents.coder.model).toBeUndefined()
  })
})
