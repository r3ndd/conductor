import { readFileSync } from "node:fs"

const promptRoot = [
  new URL("../agents/prompts/", import.meta.url),
  new URL("../src/agents/prompts/", import.meta.url),
]

const names = ["conductor", "researcher", "architect", "coder", "reviewer", "debugger", "committer"] as const

type PromptName = (typeof names)[number]

export type PromptIssue = {
  agent: PromptName
  reason: "missing" | "empty"
  tried: string[]
}

function strip(text: string) {
  const match = text.match(/^---\n[\s\S]*?\n---\n?/)
  if (!match) return text.trim()
  return text.slice(match[0].length).trim()
}

function load(name: PromptName) {
  const tried: string[] = []
  for (const root of promptRoot) {
    try {
      const file = new URL(`${name}.md`, root)
      tried.push(file.pathname)
      const text = strip(readFileSync(file, "utf8"))
      if (!text) {
        return { text: "", issue: { agent: name, reason: "empty", tried } as PromptIssue }
      }
      return { text, issue: null }
    } catch {
      continue
    }
  }
  return { text: "", issue: { agent: name, reason: "missing", tried } as PromptIssue }
}

const loaded = names.map((name) => [name, load(name)] as const)

export const agentPrompts = Object.fromEntries(loaded.map(([name, out]) => [name, out.text])) as Record<PromptName, string>

export const agentPromptIssues = loaded.flatMap(([, out]) => (out.issue ? [out.issue] : []))
