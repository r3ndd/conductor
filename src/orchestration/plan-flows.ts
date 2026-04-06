import type { PluginInput } from "@opencode-ai/plugin"

import { writeArtifact } from "../knowledge/artifacts"
import { appendMemory } from "../knowledge/memory"
import { readState, setLast } from "../knowledge/state"
import { runSubagent } from "./run-subagent"

function topic(args: string, fallback: string) {
  const text = args.trim()
  if (!text) return fallback
  return text.split("\n")[0].slice(0, 80)
}

export async function runResearch(ctx: PluginInput, sessionID: string, args: string) {
  const prompt = args.trim() || "Investigate the project context and produce useful findings."
  const out = await runSubagent(ctx, { sessionID, agent: "researcher", prompt })
  const state = await readState(ctx.worktree)
  const file = await writeArtifact("research", {
    root: ctx.worktree,
    topic: topic(args, "research"),
    text: out,
    mode: state.mode,
    session: sessionID,
    agent: "researcher",
    command: "/research",
  })
  await setLast(ctx.worktree, "research", file.id)
  await appendMemory(ctx.worktree, `Research run saved to ${file.id}.`)
  return `## Research\n\n${out}\n\nSaved artifact: ${file.path}`
}

export async function runArchitect(ctx: PluginInput, sessionID: string, args: string) {
  const prompt = args.trim() || "Create a design proposal based on current project goals."
  const out = await runSubagent(ctx, { sessionID, agent: "architect", prompt })
  const state = await readState(ctx.worktree)
  const file = await writeArtifact("design", {
    root: ctx.worktree,
    topic: topic(args, "design"),
    text: out,
    mode: state.mode,
    session: sessionID,
    agent: "architect",
    command: "/architect",
  })
  await setLast(ctx.worktree, "design", file.id)
  await appendMemory(ctx.worktree, `Design run saved to ${file.id}.`)
  return `## Architecture\n\n${out}\n\nSaved artifact: ${file.path}`
}
