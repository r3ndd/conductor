import type { Config } from "@opencode-ai/plugin"

import { runChecks } from "./checks"

function icon(status: "pass" | "warn" | "fail") {
  if (status === "pass") return "PASS"
  if (status === "warn") return "WARN"
  return "FAIL"
}

export async function doctor(root: string, cfg: Config) {
  const checks = await runChecks(root, cfg)
  const lines = ["## Conductor Doctor", ""]
  for (const c of checks) {
    lines.push(`- [${icon(c.status)}] ${c.id}: ${c.detail}`)
    if (c.fix) lines.push(`  fix: ${c.fix}`)
  }
  return lines.join("\n")
}
