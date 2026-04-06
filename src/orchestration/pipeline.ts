import type { PluginInput } from "@opencode-ai/plugin"

import { appendMemory } from "../knowledge/memory"
import { setPending, setStage } from "../knowledge/state"
import { runSubagent } from "./run-subagent"

type Stage = "coder" | "reviewer" | "debugger" | "committer"

async function runStage(ctx: PluginInput, sessionID: string, stage: Stage, prompt: string) {
  await setStage(ctx.worktree, stage)
  return runSubagent(ctx, { sessionID, agent: stage, prompt })
}

function needDebug(reply: string) {
  const text = reply.toLowerCase()
  return text.includes("test") && (text.includes("fail") || text.includes("failing") || text.includes("error"))
}

export async function runCodePipeline(ctx: PluginInput, sessionID: string, prompt: string) {
  await setPending(ctx.worktree, ["coder", "reviewer", "committer"])
  const coder = await runStage(ctx, sessionID, "coder", prompt)
  const reviewer = await runStage(ctx, sessionID, "reviewer", `Review and test this work:\n\n${coder}`)
  let debuggerOut = "Skipped: reviewer did not report failing tests."
  if (needDebug(reviewer)) {
    await setPending(ctx.worktree, ["debugger", "committer"])
    debuggerOut = await runStage(ctx, sessionID, "debugger", `Fix failures from review:\n\n${reviewer}`)
  }
  await setPending(ctx.worktree, ["committer"])
  const committer = await runStage(
    ctx,
    sessionID,
    "committer",
    `Prepare commit summary and next action from these results:\n\n${coder}\n\n${reviewer}\n\n${debuggerOut}`,
  )
  await setStage(ctx.worktree, "idle")
  await setPending(ctx.worktree, [])
  await appendMemory(ctx.worktree, `Pipeline completed for session ${sessionID}. Reviewer branch used debugger: ${needDebug(reviewer)}.`)
  return [
    "## Code Pipeline",
    "",
    `### coder\n${coder}`,
    "",
    `### reviewer\n${reviewer}`,
    "",
    `### debugger\n${debuggerOut}`,
    "",
    `### committer\n${committer}`,
  ].join("\n")
}
