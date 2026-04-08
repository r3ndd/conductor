import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const names = ["conductor", "researcher", "architect", "coder", "reviewer", "debugger", "consolidator", "committer"] as const

type PromptName = (typeof names)[number]

export type PromptIssue = {
  agent: PromptName
  reason: "missing" | "empty"
  tried: string[]
}

export function resolvePromptRoots(cwd = process.cwd(), metaUrl = import.meta.url) {
  const file = fileURLToPath(metaUrl)
  const dir = dirname(file)
  return [...new Set([resolve(dir, "../agents/prompts"), resolve(dir, "../src/agents/prompts"), join(cwd, "src/agents/prompts"), join(cwd, "dist/agents/prompts")])]
}

function strip(text: string) {
  const match = text.match(/^---\n[\s\S]*?\n---\n?/)
  if (!match) return text.trim()
  return text.slice(match[0].length).trim()
}

export function loadAgentPrompt(name: PromptName, roots = resolvePromptRoots()) {
  const tried: string[] = []
  for (const root of roots) {
    const file = join(root, `${name}.md`)
    tried.push(file)
    if (!existsSync(file)) continue
    const text = strip(readFileSync(file, "utf8"))
    if (!text) {
      return { text: "", issue: { agent: name, reason: "empty", tried } as PromptIssue }
    }
    return { text, issue: null }
  }
  return { text: "", issue: { agent: name, reason: "missing", tried } as PromptIssue }
}

const loaded = names.map((name) => [name, loadAgentPrompt(name)] as const)

export const agentPrompts = Object.fromEntries(loaded.map(([name, out]) => [name, out.text])) as Record<PromptName, string>

export const agentPromptIssues = loaded.flatMap(([, out]) => (out.issue ? [out.issue] : []))
