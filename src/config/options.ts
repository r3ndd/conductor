export type ConductorOptions = {
  defaultMode?: "build" | "plan"
  forceAgents?: string[]
  forceCommands?: string[]
  forceMcp?: string[]
}

export function parseOptions(input?: Record<string, unknown>): ConductorOptions {
  const out: ConductorOptions = {}
  if (!input) return out
  if (input.defaultMode === "build" || input.defaultMode === "plan") {
    out.defaultMode = input.defaultMode
  }
  if (Array.isArray(input.forceAgents)) {
    out.forceAgents = input.forceAgents.filter((x): x is string => typeof x === "string")
  }
  if (Array.isArray(input.forceCommands)) {
    out.forceCommands = input.forceCommands.filter((x): x is string => typeof x === "string")
  }
  if (Array.isArray(input.forceMcp)) {
    out.forceMcp = input.forceMcp.filter((x): x is string => typeof x === "string")
  }
  return out
}
