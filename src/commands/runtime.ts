import { join } from "node:path"

import { plansDir, researchDir, designsDir } from "../knowledge/paths"
import { readState, setLast } from "../knowledge/state"
import { ensureDir, exists } from "../util/fs"

type Cmd = "conductor" | "brainstorm" | "branstorm" | "research" | "architect" | "code"

const learn = "@src/commands/learn.md"

function normalize(cmd: string): Cmd | null {
  if (cmd === "branstorm") return "brainstorm"
  if (cmd === "conductor" || cmd === "brainstorm" || cmd === "research" || cmd === "architect" || cmd === "code") return cmd
  return null
}

function topic(args: string, fallback: string) {
  const text = args.trim()
  if (!text) return fallback
  return text.split("\n")[0].slice(0, 80)
}

function stamp(now = new Date()) {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, "0")
  const d = String(now.getUTCDate()).padStart(2, "0")
  const hh = String(now.getUTCHours()).padStart(2, "0")
  const mm = String(now.getUTCMinutes()).padStart(2, "0")
  return `${y}-${m}-${d}-${hh}${mm}`
}

function slug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 48) || "untitled"
}

async function planPath(root: string, args: string) {
  const name = `${stamp()}-${slug(topic(args, "brainstorm"))}-plan.md`
  const dir = plansDir(root)
  await ensureDir(dir)
  return join(dir, name)
}

async function researchPath(root: string, args: string) {
  const name = `${stamp()}-${slug(topic(args, "research"))}-research.md`
  const dir = researchDir(root)
  await ensureDir(dir)
  return join(dir, name)
}

async function designPath(root: string, args: string) {
  const name = `${stamp()}-${slug(topic(args, "design"))}-design.md`
  const dir = designsDir(root)
  await ensureDir(dir)
  return join(dir, name)
}

async function remember(root: string, key: "plan" | "research" | "design", path: string) {
  await setLast(root, key, path.split("/").at(-1) ?? path)
}

function pipelinePrompt(args: string) {
  const goal = args.trim() || "No additional detail provided."
  return [
    "You are the Conductor primary orchestrator.",
    "Run a visible subagent pipeline in this exact order: coder -> reviewer -> debugger (only if reviewer reports failures) -> committer.",
    "Do not run hidden background sessions yourself. Use native subagent invocation so the UI shows each stage.",
    "",
    "For each stage:",
    "1. Invoke that subagent with a task-specific goal.",
    "2. After the subagent finishes, invoke a learn step using this prompt file reference:",
    `   ${learn}`,
    "3. Then ask the same subagent for a compact handoff summary in markdown with sections:",
    "   - Outcome",
    "   - Files touched",
    "   - Tests/validation",
    "   - Risks/open issues",
    "   - Next-stage briefing",
    "4. Use the handoff summary as explicit context for the next stage.",
    "",
    `Pipeline goal: ${goal}`,
    "",
    "Return a final orchestration report with each stage result and handoff summary.",
  ].join("\n")
}

function researchPrompt(args: string, file: string) {
  const goal = args.trim() || "Investigate the project context and produce useful findings."
  return [
    "You are the Conductor primary orchestrator.",
    "Invoke the researcher subagent and manage a full handoff cycle.",
    "",
    `Research goal: ${goal}`,
    "",
    "After researcher output:",
    "- Run the learn step using:",
    `  ${learn}`,
    "- Ask researcher for a compact final summary suitable for future handoff.",
    `- Write the final research artifact to: ${file}`,
    "",
    "Return a concise completion note including the artifact path.",
  ].join("\n")
}

function architectPrompt(args: string, file: string) {
  const goal = args.trim() || "Create a design proposal based on project goals."
  return [
    "You are the Conductor primary orchestrator.",
    "Invoke the architect subagent and manage a full handoff cycle.",
    "",
    `Architecture goal: ${goal}`,
    "",
    "After architect output:",
    "- Run the learn step using:",
    `  ${learn}`,
    "- Ask architect for a compact final summary suitable for future handoff.",
    `- Write the final design artifact to: ${file}`,
    "",
    "Return a concise completion note including the artifact path.",
  ].join("\n")
}

function brainstormPrompt(args: string, file: string) {
  const goal = args.trim() || "Brainstorm implementation options and tradeoffs."
  return [
    "You are the Conductor primary orchestrator.",
    "Run a brainstorming flow and persist the result.",
    "",
    `Brainstorm goal: ${goal}`,
    `Write the brainstorm artifact to: ${file}`,
    "",
    "Then run the learn step using:",
    learn,
    "",
    "Return a concise completion note including the artifact path.",
  ].join("\n")
}

export async function buildCommandPrompt(root: string, cmd: string, args: string) {
  const state = await readState(root)
  const name = normalize(cmd)
  if (!name) return null
  if (name === "conductor") {
    return "Conductor is now active as your primary orchestrator. Use /brainstorm, /research, /architect, or /code to run structured workflows."
  }
  if (name === "brainstorm") {
    const file = await planPath(root, args)
    await remember(root, "plan", file)
    const ready = await exists(file)
    const note = ready ? "" : "The artifact file may not exist yet; create it as part of your response.\n"
    return `${note}${brainstormPrompt(args, file)}\n\nCurrent Conductor state mode: ${state.mode}`
  }
  if (name === "research") {
    const file = await researchPath(root, args)
    await remember(root, "research", file)
    return `${researchPrompt(args, file)}\n\nCurrent Conductor state mode: ${state.mode}`
  }
  if (name === "architect") {
    const file = await designPath(root, args)
    await remember(root, "design", file)
    return `${architectPrompt(args, file)}\n\nCurrent Conductor state mode: ${state.mode}`
  }
  if (name === "code") {
    return `${pipelinePrompt(args)}\n\nCurrent Conductor state mode: ${state.mode}`
  }
  return null
}
