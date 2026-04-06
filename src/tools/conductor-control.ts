import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin/tool"

import { switchMode } from "../knowledge/state"
import { runCodePipeline } from "../orchestration/pipeline"

export function createConductorTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: "Conductor internal control tool for mode switches and orchestration.",
    args: {
      action: tool.schema.enum(["switch_mode", "run_code_pipeline"]),
      mode: tool.schema.enum(["build", "plan"]).optional(),
      prompt: tool.schema.string().optional(),
    },
    execute: async (args, input) => {
      if (args.action === "switch_mode") {
        if (!args.mode) return "Missing mode."
        await switchMode(ctx.worktree, args.mode)
        return `Conductor mode set to ${args.mode}.`
      }
      if (!args.prompt) return "Missing prompt for pipeline."
      return runCodePipeline(ctx, input.sessionID, args.prompt)
    },
  })
}
