export function planContract(goal: string) {
  return [
    "Conductor planning contract:",
    `- Goal: ${goal || "(none)"}`,
    "- Invoke target subagent visibly",
    "- Run learn extraction via /conductor-learn",
    "- Produce compact handoff summary",
  ].join("\n")
}
