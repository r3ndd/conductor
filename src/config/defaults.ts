import type { AgentConfig, McpLocalConfig } from "@opencode-ai/sdk"

export const mode = {
  build: "build",
  plan: "plan",
} as const

export type Mode = (typeof mode)[keyof typeof mode]

export const pluginAgents: Record<string, AgentConfig> = {
  build: {
    mode: "primary",
    description: "Default coding mode with full implementation privileges.",
    maxSteps: 40,
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  plan: {
    mode: "primary",
    description: "Planning mode for decomposition, research, and design before coding.",
    maxSteps: 30,
    permission: {
      edit: "deny",
      bash: "ask",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  researcher: {
    mode: "subagent",
    description: "Research-focused specialist for external and codebase discovery.",
    permission: {
      edit: "deny",
      bash: "ask",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  architect: {
    mode: "subagent",
    description: "Design specialist that turns requirements into architecture decisions.",
    permission: {
      edit: "deny",
      bash: "ask",
      webfetch: "allow",
      external_directory: "ask",
    },
  },
  coder: {
    mode: "subagent",
    description: "Implementation specialist for code changes and refactors.",
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "ask",
      external_directory: "ask",
    },
  },
  reviewer: {
    mode: "subagent",
    description: "Quality specialist for review, tests, and requirement validation.",
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "ask",
      external_directory: "ask",
    },
  },
  debugger: {
    mode: "subagent",
    description: "Failure-analysis specialist to fix failing tests or runtime issues.",
    permission: {
      edit: "allow",
      bash: "allow",
      webfetch: "ask",
      external_directory: "ask",
    },
  },
  committer: {
    mode: "subagent",
    description: "Commit specialist that prepares a safe commit action summary.",
    permission: {
      edit: "allow",
      bash: {
        git: "allow",
      },
      webfetch: "deny",
      external_directory: "ask",
    },
  },
}

export const pluginCommands = {
  build: {
    description: "Switch Conductor mode to build",
    agent: "build",
    template: "Switch to build mode. $ARGUMENTS",
  },
  plan: {
    description: "Switch Conductor mode to plan",
    agent: "plan",
    template: "Switch to plan mode. $ARGUMENTS",
  },
  brainstorm: {
    description: "Brainstorm and persist a plan artifact",
    agent: "plan",
    subtask: false,
    template: "Brainstorm this request and persist a plan artifact: $ARGUMENTS",
  },
  research: {
    description: "Run researcher flow and persist findings",
    agent: "plan",
    subtask: false,
    template: "Run research workflow for: $ARGUMENTS",
  },
  architect: {
    description: "Run architecture flow and persist design",
    agent: "plan",
    subtask: false,
    template: "Run architecture workflow for: $ARGUMENTS",
  },
  code: {
    description: "Run code pipeline (coder, reviewer, debugger, committer)",
    agent: "build",
    subtask: false,
    template: "Run the code pipeline for: $ARGUMENTS",
  },
  "conductor-doctor": {
    description: "Check Conductor setup and integrations",
    agent: "build",
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
