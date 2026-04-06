import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin/tool"

import { switchMode } from "../knowledge/state"

export function createConductorTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: "Conductor internal control tool for mode switches and orchestration.",
    args: {
      action: tool.schema.enum(["switch_mode"]),
      mode: tool.schema.enum(["conductor"]).optional(),
      prompt: tool.schema.string().optional(),
    },
    execute: async (args) => {
      if (args.action === "switch_mode") {
        if (!args.mode) return "Missing mode."
        await switchMode(ctx.worktree, args.mode)
        return `Conductor mode set to ${args.mode}.`
      }
      return "Unsupported action."
    },
  })
}
