export function pipelineContract(goal: string) {
  return [
    "Conductor pipeline contract:",
    `- Goal: ${goal || "(none)"}`,
    "- Stage order: coder -> reviewer -> debugger(if needed) -> consolidator -> committer",
    "- Each stage must do learn extraction via /conductor-learn",
    "- Each stage must provide compact handoff summary for next stage",
  ].join("\n")
}
