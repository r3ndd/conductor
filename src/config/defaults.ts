import type { AgentConfig, McpLocalConfig } from "@opencode-ai/sdk"

import { agentPrompts } from "../agents/prompts"

export const mode = {
  conductor: "conductor",
} as const

export type Mode = (typeof mode)[keyof typeof mode]

export const agentNames = ["conductor", "researcher", "architect", "coder", "reviewer", "debugger", "committer"] as const

export type AgentName = (typeof agentNames)[number]

export type AgentModelOverrides = Partial<Record<AgentName, string>>

function applyModel(agent: AgentConfig, model?: string) {
  if (!model) return agent
  return { ...agent, model }
}

const conductorPermission = {
  edit: "allow",
  bash: "allow",
  webfetch: "allow",
  question: "allow",
  external_directory: "ask",
} as AgentConfig["permission"] & { question: "allow" }

const basePluginAgents: Record<AgentName, AgentConfig> = {
  conductor: {
    mode: "primary",
    description: "Primary Conductor orchestrator agent for command-driven multi-agent workflows.",
    prompt: agentPrompts.conductor,
    maxSteps: 40,
    permission: conductorPermission,
  },
  researcher: {
    mode: "subagent",
    description: "Research-focused specialist for external and codebase discovery.",
    prompt: agentPrompts.researcher,
    permission: {
      edit: "deny",
      bash: "allow",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  architect: {
    mode: "subagent",
    description: "Design specialist that turns requirements into architecture decisions.",
    prompt: agentPrompts.architect,
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  coder: {
    mode: "subagent",
    description: "Implementation specialist for code changes and refactors.",
    prompt: agentPrompts.coder,
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  reviewer: {
    mode: "subagent",
    description: "Quality specialist for review, tests, and requirement validation.",
    prompt: agentPrompts.reviewer,
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  debugger: {
    mode: "subagent",
    description: "Failure-analysis specialist to fix failing tests or runtime issues.",
    prompt: agentPrompts.debugger,
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  committer: {
    mode: "subagent",
    description: "Commit specialist that prepares a safe commit action summary.",
    prompt: agentPrompts.committer,
    permission: {
      edit: "allow",
      bash: {
        git: "allow",
      },
      webfetch: "deny",
      external_directory: "deny",
    },
  },
}

export function buildPluginAgents(models: AgentModelOverrides = {}) {
  return Object.fromEntries(agentNames.map((name) => [name, applyModel(basePluginAgents[name], models[name])])) as Record<
    AgentName,
    AgentConfig
  >
}

export const pluginAgents = buildPluginAgents()

export const pluginCommands = {
  brainstorm: {
    description: "Brainstorm and persist a plan artifact",
    agent: "conductor",
    subtask: false,
    template: "Run Conductor brainstorm workflow. $ARGUMENTS",
  },
  research: {
    description: "Run researcher flow and persist findings",
    agent: "conductor",
    subtask: false,
    template: "Run Conductor research workflow. $ARGUMENTS",
  },
  architect: {
    description: "Run architecture flow and persist design",
    agent: "conductor",
    subtask: false,
    template: "Run Conductor architecture workflow. $ARGUMENTS",
  },
  code: {
    description: "Run code pipeline (coder, reviewer, debugger, committer)",
    agent: "conductor",
    subtask: false,
    template: "Run Conductor code pipeline workflow. $ARGUMENTS",
  },
  "conductor-doctor": {
    description: "Check Conductor setup and integrations",
    agent: "conductor",
    subtask: false,
    template: "Run conductor diagnostics.",
  },
} as const

export type CommandDef = (typeof pluginCommands)[keyof typeof pluginCommands]

export const pluginMcp: Record<string, McpLocalConfig> = {
  context7: {
    type: "local",
    command: ["npx", "-y", "@upstash/context7-mcp@latest"],
  },
  codanna: {
    type: "local",
    command: ["codanna", "--config", ".codanna/settings.toml", "serve", "--watch"],
  },
}
