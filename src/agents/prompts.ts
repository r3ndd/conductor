import { readFileSync } from "node:fs"

const promptRoot = [
  new URL("../agents/prompts/", import.meta.url),
  new URL("../src/agents/prompts/", import.meta.url),
]

function strip(text: string) {
  const match = text.match(/^---\n[\s\S]*?\n---\n?/)
  if (!match) return text.trim()
  return text.slice(match[0].length).trim()
}

function load(name: string) {
  for (const root of promptRoot) {
    try {
      const file = new URL(`${name}.md`, root)
      return strip(readFileSync(file, "utf8"))
    } catch {
      continue
    }
  }
  return ""
}

export const agentPrompts = {
  build: load("build"),
  plan: load("plan"),
  researcher: load("researcher"),
  architect: load("architect"),
  coder: load("coder"),
  reviewer: load("reviewer"),
  debugger: load("debugger"),
  committer: load("committer"),
} as const
