import type { Config } from "@opencode-ai/plugin"
import type { AgentConfig, McpLocalConfig, McpRemoteConfig } from "@opencode-ai/sdk"

import type { CommandDef } from "./defaults"
import type { ConductorOptions } from "./options"

type Input = {
  opt: ConductorOptions
  agents: Record<string, AgentConfig>
  commands: Record<string, CommandDef>
  mcp: Record<string, McpLocalConfig | McpRemoteConfig>
}

export type MergeReport = {
  skipped: {
    agent: string[]
    command: string[]
    mcp: string[]
  }
}

function mergeAgents(cfg: Config, next: Record<string, AgentConfig>) {
  const skipped: string[] = []
  cfg.agent = { ...cfg.agent }
  for (const [k, v] of Object.entries(next)) {
    if (cfg.agent[k]) {
      skipped.push(k)
      continue
    }
    cfg.agent[k] = v
  }
  return skipped
}

function mergeCommands(cfg: Config, next: Record<string, CommandDef>) {
  const skipped: string[] = []
  cfg.command = { ...cfg.command }
  for (const [k, v] of Object.entries(next)) {
    if (cfg.command[k]) {
      skipped.push(k)
      continue
    }
    cfg.command[k] = v
  }
  return skipped
}

function mergeMcp(cfg: Config, next: Record<string, McpLocalConfig | McpRemoteConfig>) {
  const skipped: string[] = []
  cfg.mcp = { ...cfg.mcp }
  for (const [k, v] of Object.entries(next)) {
    if (cfg.mcp[k]) {
      skipped.push(k)
      continue
    }
    cfg.mcp[k] = v
  }
  return skipped
}

export function mergeConfig(cfg: Config, input: Input): MergeReport {
  const forceA = new Set(input.opt.forceAgents ?? [])
  const forceC = new Set(input.opt.forceCommands ?? [])
  const forceM = new Set(input.opt.forceMcp ?? [])
  if (forceA.size > 0) {
    cfg.agent = { ...cfg.agent }
    for (const [k, v] of Object.entries(input.agents)) {
      if (forceA.has(k)) {
        cfg.agent[k] = v
      }
    }
  }
  if (forceC.size > 0) {
    cfg.command = { ...cfg.command }
    for (const [k, v] of Object.entries(input.commands)) {
      if (forceC.has(k)) {
        cfg.command[k] = v
      }
    }
  }
  if (forceM.size > 0) {
    cfg.mcp = { ...cfg.mcp }
    for (const [k, v] of Object.entries(input.mcp)) {
      if (forceM.has(k)) {
        cfg.mcp[k] = v
      }
    }
  }
  const skippedAgent = mergeAgents(cfg, input.agents)
  const skippedCommand = mergeCommands(cfg, input.commands)
  const skippedMcp = mergeMcp(cfg, input.mcp)
  const mode = input.opt.defaultMode ?? "conductor"
  if (cfg.agent?.[mode]) {
    cfg.agent[mode] = {
      ...cfg.agent[mode],
      mode: "primary",
    }
  }
  const next = cfg as Config & { default_agent?: string }
  if (!next.default_agent) {
    next.default_agent = mode
  }
  return {
    skipped: {
      agent: skippedAgent,
      command: skippedCommand,
      mcp: skippedMcp,
    },
  }
}
