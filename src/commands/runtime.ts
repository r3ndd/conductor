import { join } from "node:path"

import { plansDir, researchDir, designsDir } from "../knowledge/paths"
import { readState, setLast } from "../knowledge/state"
import { ensureDir, exists } from "../util/fs"

type Cmd = "brainstorm" | "research" | "architect" | "code" | "consolidate"

function normalize(cmd: string): Cmd | null {
  if (cmd === "brainstorm" || cmd === "research" || cmd === "architect" || cmd === "code" || cmd === "consolidate") return cmd
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
    "Run a visible subagent pipeline in this exact order: coder -> reviewer -> debugger (only if reviewer reports failures) -> consolidator -> committer.",
    "",
    "For each stage:",
    "1. Invoke that subagent with a task-specific goal and the final summary from the previous subagent (except the consolidator).",
    "2. Be sure to tell it to provide a compact handoff summary (except the consolidator) in markdown with sections:",
    "   - Outcome",
    "   - Files touched",
    "   - Commands run",
    "   - Next-stage briefing",
    "3. Also tell it to run the /conductor-learn skill (except for consolidator and Committer) and follow its instructions when it is finishd with its work.", 
    "4. Use the handoff summary as explicit context for the next subagent stage (except consolidator).",
    "",
    "Important:",
    "Make sure the coder and reviewer are given the paths to any relevant design or research artifacts, and make sure they read them.",
    "- The coder should not run, test, or debug its code. It only writes code.",
    "- The reviewer does not debug code. It only reads the code and makes changes as needed. When it is done it runs any tests and tells you if the Debugger agent is needed or should be skipped.",
    "- The consolidator's sole purpose is to consolidate and organize knowledge/memories across AGENTS.md files in project directories. It does not need any context as it will be automatically prompted with what to do and it consolidates both old and new knowledge.",
    "",
    `Pipeline goal: ${goal}`,
    "",
    "Return a final orchestration report with each stage result and handoff summary.",
  ].join("\n")
}

function consolidatePrompt(args: string) {
  return [
    "Invoke the consolidator subagent.",
    "The consolidator's sole purpose is to consolidate and organize knowledge/memories across AGENTS.md files in project directories.",
    "It does not need any context as it will be automatically prompted with what to do and it consolidates both old and new knowledge.",
    "",
    "Return a concise completion note with the consolidation summary from the subagent.",
  ].join("\n")
}

function researchPrompt(args: string, file: string) {
  const goal = args.trim() || "Investigate the project context and produce useful findings."
  return [
    "Invoke the researcher subagent and manage a full handoff cycle.",
    `Tell it to write the final research artifact to: ${file}`,
    "Also tell it to provide a compact final summary suitable for future handoff.",
    "Also tell it to run the /conductor-learn skill and follow its instructions when it is finishd with its work.", 
    "",
    `Research goal: ${goal}`,
    "",
    "",
    "Return a concise completion note including the research artifact path.",
  ].join("\n")
}

function architectPrompt(args: string, file: string) {
  const goal = args.trim() || "Create a design proposal based on project goals."
  return [
    "Invoke the architect subagent and manage a full handoff cycle.",
    `Tell it to write the final design artifact to: ${file}`,
    "Be sure to pass it any relevant brainstorm artifact file paths and make sure it reads them.",
    "",
    `Architecture goal: ${goal}`,
    "",
    "Return a concise completion note including the design artifact path the subagent gives you.",
  ].join("\n")
}

function brainstormPrompt(args: string, file: string) {
  const goal = args.trim() || "Brainstorm implementation options and tradeoffs."
  return [
    "Run a brainstorming flow and persist the result.",
    "Work with the user directly and do not invoke any subagents.",
    "Use the `question` tool to ask brainstorming questions to the user.",
    "",
    `Brainstorm goal: ${goal}`,
    `Write the brainstorm artifact to: ${file}`,
    "",
    "Return a concise completion note including the artifact path.",
  ].join("\n")
}

export async function buildCommandPrompt(root: string, cmd: string, args: string) {
  const state = await readState(root)
  const name = normalize(cmd)
  if (!name) return null
  if (name === "brainstorm") {
    const file = await planPath(root, args)
    await remember(root, "plan", file)
    const ready = await exists(file)
    const note = ready ? "" : "The artifact file may not exist yet; create it as part of your response.\n"
    return `${note}${brainstormPrompt(args, file)}`
  }
  if (name === "research") {
    const file = await researchPath(root, args)
    await remember(root, "research", file)
    return `${researchPrompt(args, file)}`
  }
  if (name === "architect") {
    const file = await designPath(root, args)
    await remember(root, "design", file)
    return `${architectPrompt(args, file)}`
  }
  if (name === "code") {
    return `${pipelinePrompt(args)}\n\nCurrent Conductor state mode: ${state.mode}`
  }
  if (name === "consolidate") {
    return consolidatePrompt(args)
  }
  return null
}
