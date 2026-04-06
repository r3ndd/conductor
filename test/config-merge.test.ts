import { describe, expect, it } from "bun:test"

import type { Config } from "@opencode-ai/plugin"

import { agentPromptIssues } from "../src/agents/prompts"
import { pluginAgents, pluginCommands, pluginMcp } from "../src/config/defaults"
import { mergeConfig } from "../src/config/merge"

describe("mergeConfig", () => {
  it("preserves existing user entries by default", () => {
    const cfg: Config = {
      agent: { conductor: { description: "user" } },
      command: { conductor: { template: "user conductor" } },
      mcp: { context7: { type: "local", command: ["custom"] } },
    }
    const report = mergeConfig(cfg, {
      opt: {},
      agents: pluginAgents,
      commands: pluginCommands,
      mcp: pluginMcp,
    })
    expect(cfg.agent?.conductor?.description).toBe("user")
    expect(cfg.command?.conductor?.template).toBe("user conductor")
    expect((cfg.mcp?.context7 as { command: string[] }).command[0]).toBe("custom")
    expect(report.skipped.agent.includes("conductor")).toBeTrue()
    expect(report.skipped.command.includes("conductor")).toBeTrue()
    expect(report.skipped.mcp.includes("context7")).toBeTrue()
  })

  it("supports forced override through plugin options", () => {
    const cfg: Config = {
      agent: { conductor: { description: "user" } },
      command: { conductor: { template: "user conductor" } },
      mcp: { context7: { type: "local", command: ["custom"] } },
    }
    mergeConfig(cfg, {
      opt: { forceAgents: ["conductor"], forceCommands: ["conductor"], forceMcp: ["context7"] },
      agents: pluginAgents,
      commands: pluginCommands,
      mcp: pluginMcp,
    })
    expect(cfg.agent?.conductor?.description).toBe(pluginAgents.conductor.description)
    expect(cfg.command?.conductor?.template).toBe(pluginCommands.conductor.template)
    expect((cfg.mcp?.context7 as { command: string[] }).command[0]).toBe("npx")
  })

  it("loads markdown prompts into agent config", () => {
    expect(agentPromptIssues.length).toBe(0)
    expect(pluginAgents.conductor.prompt).toContain("You are the Conductor primary agent.")
    expect(pluginAgents.reviewer.prompt).toContain("You are the reviewer subagent.")
  })
})
