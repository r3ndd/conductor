import { access } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

import { agentNames, type AgentModelOverrides } from "./defaults"

export type ConductorUserSettings = {
  models?: Partial<Record<string, string>>
}

export type LoadedConductorSettings = {
  path: string
  models: AgentModelOverrides
  issues: string[]
}

function settingsPath() {
  return join(homedir(), ".config", "opencode", "conductor.json")
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function parseConductorSettings(raw: unknown): { models: AgentModelOverrides; issues: string[] } {
  const issues: string[] = []
  const models: AgentModelOverrides = {}
  const input = raw && typeof raw === "object" ? (raw as ConductorUserSettings).models : undefined
  if (input && typeof input !== "object") {
    issues.push("Invalid models section; expected an object.")
    return { models, issues }
  }
  for (const name of agentNames) {
    const value = input?.[name]
    if (isString(value)) {
      models[name] = value
    } else if (value !== undefined) {
      issues.push(`Invalid model override for ${name}; expected a non-empty string.`)
    }
  }
  return { models, issues }
}

export async function loadConductorSettings(): Promise<LoadedConductorSettings> {
  const path = settingsPath()
  const issues: string[] = []
  try {
    await access(path)
  } catch {
    return { path, models: {}, issues }
  }
  try {
    const text = await Bun.file(path).text()
    const raw = JSON.parse(text) as ConductorUserSettings
    const parsed = parseConductorSettings(raw)
    return { path, models: parsed.models, issues: parsed.issues }
  } catch (error) {
    issues.push(`Failed to read conductor settings at ${path}`)
    issues.push(error instanceof Error ? error.message : String(error))
    return { path, models: {}, issues }
  }
}
