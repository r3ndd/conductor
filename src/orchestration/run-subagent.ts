import type { PluginInput } from "@opencode-ai/plugin"

export async function runSubagent(ctx: PluginInput, input: {
  sessionID: string
  agent: string
  prompt: string
}) {
  const child = await ctx.client.session.create({
    body: {
      parentID: input.sessionID,
      title: `conductor-${input.agent}`,
    },
  })
  const id = child.data?.id
  if (!id) return "Failed to create subagent session."
  const reply = await ctx.client.session.prompt({
    path: { id },
    body: {
      agent: input.agent,
      parts: [{ type: "text", text: input.prompt }],
    },
  })
  const part = (reply.data?.parts ?? []).find((x) => x.type === "text")
  if (!part) return "Subagent completed with no text response."
  if (!("text" in part)) return "Subagent completed with non-text response."
  return part.text
}
