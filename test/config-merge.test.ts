import { describe, expect, it } from "bun:test"

import type { Config } from "@opencode-ai/plugin"

import { agentPromptIssues } from "../src/agents/prompts"
import { pluginAgents, pluginCommands, pluginMcp } from "../src/config/defaults"
import { mergeConfig } from "../src/config/merge"

describe("mergeConfig", () => {
  it("preserves existing user entries by default", () => {
    const cfg: Config = {
      agent: { conductor: { description: "user" } },
      command: { brainstorm: { template: "user brainstorm" } },
      mcp: { context7: { type: "local", command: ["custom"] } },
    }
    const report = mergeConfig(cfg, {
      opt: {},
      agents: pluginAgents,
      commands: pluginCommands,
      mcp: pluginMcp,
    })
    expect(cfg.agent?.conductor?.description).toBe("user")
    expect(cfg.command?.brainstorm?.template).toBe("user brainstorm")
    expect((cfg.mcp?.context7 as { command: string[] }).command[0]).toBe("custom")
    expect(report.skipped.agent.includes("conductor")).toBeTrue()
    expect(report.skipped.command.includes("brainstorm")).toBeTrue()
    expect(report.skipped.mcp.includes("context7")).toBeTrue()
  })

  it("supports forced override through plugin options", () => {
    const cfg: Config = {
      agent: { conductor: { description: "user" } },
      command: { brainstorm: { template: "user brainstorm" } },
      mcp: { context7: { type: "local", command: ["custom"] } },
    }
    mergeConfig(cfg, {
      opt: { forceAgents: ["conductor"], forceCommands: ["brainstorm"], forceMcp: ["context7"] },
      agents: pluginAgents,
      commands: pluginCommands,
      mcp: pluginMcp,
    })
    expect(cfg.agent?.conductor?.description).toBe(pluginAgents.conductor.description)
    expect(cfg.command?.brainstorm?.template).toBe(pluginCommands.brainstorm.template)
    expect((cfg.mcp?.context7 as { command: string[] }).command[0]).toBe("npx")
  })

  it("loads markdown prompts into agent config", () => {
    expect(agentPromptIssues.length).toBe(0)
    expect(pluginAgents.conductor.prompt).toContain("You are the Conductor primary agent.")
    expect(pluginAgents.reviewer.prompt).toContain("You are the reviewer subagent.")
  })

  it("allows the question tool for the conductor agent", () => {
    expect((pluginAgents.conductor.permission as { question?: string }).question).toBe("allow")
  })
})
