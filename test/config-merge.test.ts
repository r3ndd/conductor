import { describe, expect, it } from "bun:test"

import type { Config } from "@opencode-ai/plugin"

import { agentPromptIssues } from "../src/agents/prompts"
import { pluginAgents, pluginCommands, pluginMcp } from "../src/config/defaults"
import { mergeConfig } from "../src/config/merge"

describe("mergeConfig", () => {
  it("preserves existing user entries by default", () => {
    const cfg: Config = {
      agent: { build: { description: "user" } },
      command: { build: { template: "user build" } },
      mcp: { context7: { type: "local", command: ["custom"] } },
    }
    const report = mergeConfig(cfg, {
      opt: {},
      agents: pluginAgents,
      commands: pluginCommands,
      mcp: pluginMcp,
    })
    expect(cfg.agent?.build?.description).toBe("user")
    expect(cfg.command?.build?.template).toBe("user build")
    expect((cfg.mcp?.context7 as { command: string[] }).command[0]).toBe("custom")
    expect(report.skipped.agent.includes("build")).toBeTrue()
    expect(report.skipped.command.includes("build")).toBeTrue()
    expect(report.skipped.mcp.includes("context7")).toBeTrue()
  })

  it("supports forced override through plugin options", () => {
    const cfg: Config = {
      agent: { build: { description: "user" } },
      command: { build: { template: "user build" } },
      mcp: { context7: { type: "local", command: ["custom"] } },
    }
    mergeConfig(cfg, {
      opt: { forceAgents: ["build"], forceCommands: ["build"], forceMcp: ["context7"] },
      agents: pluginAgents,
      commands: pluginCommands,
      mcp: pluginMcp,
    })
    expect(cfg.agent?.build?.description).toBe(pluginAgents.build.description)
    expect(cfg.command?.build?.template).toBe(pluginCommands.build.template)
    expect((cfg.mcp?.context7 as { command: string[] }).command[0]).toBe("npx")
  })

  it("loads markdown prompts into agent config", () => {
    expect(agentPromptIssues.length).toBe(0)
    expect(pluginAgents.build.prompt).toContain("You are Conductor's build agent.")
    expect(pluginAgents.plan.prompt).toContain("You are Conductor's plan agent.")
    expect(pluginAgents.reviewer.prompt).toContain("You are the reviewer subagent.")
  })
})
