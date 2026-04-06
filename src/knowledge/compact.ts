import { readState } from "./state"

export async function buildCompactionContext(root: string) {
  const state = await readState(root)
  const pending = state.pending.length > 0 ? state.pending.map((x) => `- ${x}`).join("\n") : "- (none)"
  return [
    "## Conductor Continuation",
    `- active_mode: ${state.mode}`,
    `- current_stage: ${state.stage}`,
    "- pending_tasks:",
    pending,
    "- memory_extraction_directive: Capture non-obvious durable learnings in AGENTS.md.",
  ].join("\n")
}
