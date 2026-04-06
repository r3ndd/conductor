import type { Config, Plugin, PluginModule } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

import { agents } from "./agents/index"
import { agentPromptIssues } from "./agents/prompts"
import { commands } from "./commands/index"
import { buildCommandPrompt } from "./commands/runtime"
import { mergeConfig } from "./config/merge"
import { parseOptions } from "./config/options"
import { buildCompactionContext } from "./knowledge/compact"
import { readState, switchMode } from "./knowledge/state"
import { buildMcpDefaults } from "./integrations/mcp"
import { doctor } from "./integrations/doctor"
import { runCodePipeline } from "./orchestration/pipeline"
import { runArchitect, runResearch } from "./orchestration/plan-flows"
import { createConductorTool } from "./tools/conductor-control"
import { log } from "./util/log"

function cmdName(raw: string) {
  if (raw.startsWith("/")) return raw.slice(1)
  return raw
}

function textPart(text: string): Part {
  return { type: "text", text } as unknown as Part
}

async function logConfig(ctx: Parameters<typeof log>[0], cfg: Config) {
  await log(ctx, "info", "Conductor config merged", {
    agent: Object.keys(cfg.agent ?? {}).length,
    command: Object.keys(cfg.command ?? {}).length,
    mcp: Object.keys(cfg.mcp ?? {}).length,
  })
}

async function logPromptIssues(ctx: Parameters<typeof log>[0]) {
  for (const issue of agentPromptIssues) {
    await log(ctx, "warn", "Conductor agent prompt markdown issue", {
      agent: issue.agent,
      reason: issue.reason,
      tried: issue.tried,
      fix: `Add or fix src/agents/prompts/${issue.agent}.md to include non-empty prompt body after frontmatter.`,
    })
  }
}

async function logCollisions(ctx: Parameters<typeof log>[0], report: { skipped: { agent: string[]; command: string[]; mcp: string[] } }) {
  const entries = [
    ["agent", report.skipped.agent],
    ["command", report.skipped.command],
    ["mcp", report.skipped.mcp],
  ]
  for (const [kind, keys] of entries) {
    if (keys.length === 0) continue
    await log(ctx, "warn", `Conductor skipped ${kind} collisions`, {
      kind,
      keys,
      fix: "Use plugin options forceAgents/forceCommands/forceMcp to override specific keys.",
    })
  }
}

const server: Plugin = async (ctx, raw) => {
  const opt = parseOptions(raw)
  const state = await readState(ctx.worktree)
  let runtime: Config = {}
  await log(ctx, "info", "Conductor plugin initialized", {
    directory: ctx.directory,
    mode: state.mode,
    defaultMode: opt.defaultMode ?? "build",
  })
  await logPromptIssues(ctx)

  return {
    tool: {
      conductor_control: createConductorTool(ctx),
    },
    config: async (cfg) => {
      const report = mergeConfig(cfg, {
        opt,
        agents,
        commands,
        mcp: buildMcpDefaults(),
      })
      runtime = {
        ...runtime,
        ...cfg,
        agent: { ...cfg.agent },
        command: { ...cfg.command },
        mcp: { ...cfg.mcp },
      }
      await logCollisions(ctx, report)
      await logConfig(ctx, cfg)
    },
    "command.execute.before": async (input, output) => {
      const name = cmdName(input.command)
      if (name === "build") {
        await switchMode(ctx.worktree, "build")
      }
      if (name === "plan") {
        await switchMode(ctx.worktree, "plan")
      }
      if (name === "code") {
        output.parts = [textPart(await runCodePipeline(ctx, input.sessionID, input.arguments))]
        return
      }
      if (name === "conductor-doctor") {
        output.parts = [textPart(await doctor(ctx.worktree, runtime))]
        return
      }
      if (name === "research") {
        output.parts = [textPart(await runResearch(ctx, input.sessionID, input.arguments))]
        return
      }
      if (name === "architect") {
        output.parts = [textPart(await runArchitect(ctx, input.sessionID, input.arguments))]
        return
      }
      const text = await buildCommandPrompt(ctx.worktree, name, input.arguments)
      if (!text) return
      output.parts = [textPart(text)]
    },
    "experimental.session.compacting": async (_input, output) => {
      output.context.push(await buildCompactionContext(ctx.worktree))
    },
  }
}

export default {
  id: "opencode-conductor",
  server,
} satisfies PluginModule
