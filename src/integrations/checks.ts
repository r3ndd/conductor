import { access } from "node:fs/promises"

import type { Config } from "@opencode-ai/plugin"

type Check = {
  id: string
  status: "pass" | "warn" | "fail"
  detail: string
  fix?: string
}

async function hasBinary(name: string) {
  const proc = Bun.spawn(["bash", "-lc", `command -v ${name}`], { stdout: "ignore", stderr: "ignore" })
  const code = await proc.exited
  return code === 0
}

async function hasFile(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function mcpShape(cfg: Config): Check {
  const hasContext7 = !!cfg.mcp?.context7
  const hasCodanna = !!cfg.mcp?.codanna
  if (hasContext7 && hasCodanna) {
    return { id: "mcp-shape", status: "pass", detail: "Context7 and Codanna MCP entries are present." }
  }
  return {
    id: "mcp-shape",
    status: "warn",
    detail: "One or more expected MCP entries are missing from runtime config.",
    fix: "Reload OpenCode and verify plugin config hook execution.",
  }
}

export async function runChecks(root: string, cfg: Config): Promise<Check[]> {
  const codanna = await hasBinary("codanna")
  const settings = await hasFile(`${root}/.codanna/settings.toml`)
  const out: Check[] = []
  out.push(mcpShape(cfg))
  out.push(
    codanna
      ? { id: "codanna-bin", status: "pass", detail: "codanna binary is available." }
      : {
          id: "codanna-bin",
          status: "warn",
          detail: "codanna binary is not installed.",
          fix: "Install Codanna, then re-run /conductor-doctor.",
        },
  )
  out.push(
    settings
      ? { id: "codanna-settings", status: "pass", detail: ".codanna/settings.toml exists." }
      : {
          id: "codanna-settings",
          status: "warn",
          detail: "Missing .codanna/settings.toml.",
          fix: "Create .codanna/settings.toml in project root.",
        },
  )
  return out
}
