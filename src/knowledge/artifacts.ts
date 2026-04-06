import { basename, join } from "node:path"

import type { Mode } from "../config/defaults"
import { ensureDir, writeText } from "../util/fs"
import { designsDir, plansDir, researchDir } from "./paths"

type ArtifactType = "plan" | "research" | "design"

type Input = {
  root: string
  topic: string
  text: string
  mode: Mode
  session: string
  agent: string
  command: string
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

function dir(root: string, type: ArtifactType) {
  if (type === "plan") return plansDir(root)
  if (type === "research") return researchDir(root)
  return designsDir(root)
}

function body(type: ArtifactType, input: Input, now: Date) {
  const meta = [
    "---",
    `type: ${type}`,
    `mode: ${input.mode}`,
    `session_id: ${input.session}`,
    `agent: ${input.agent}`,
    `source_command: ${input.command}`,
    `created_at: ${now.toISOString()}`,
    "---",
    "",
  ].join("\n")
  return `${meta}${input.text.trim()}\n`
}

export async function writeArtifact(type: ArtifactType, input: Input) {
  const now = new Date()
  const name = `${stamp(now)}-${slug(input.topic)}-${type}.md`
  const folder = dir(input.root, type)
  const file = join(folder, name)
  await ensureDir(folder)
  await writeText(file, body(type, input, now))
  return { path: file, id: basename(file) }
}
