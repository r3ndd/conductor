import type { PluginInput } from "@opencode-ai/plugin"

type Level = "debug" | "info" | "warn" | "error"

export async function log(ctx: PluginInput, level: Level, message: string, extra?: Record<string, unknown>) {
  await ctx.client.app.log({
    body: {
      service: "conductor",
      level,
      message,
      extra,
    },
  })
}
