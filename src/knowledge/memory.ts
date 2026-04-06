import { createHash } from "node:crypto"

import { readTextOr, writeText } from "../util/fs"
import { agentsPath } from "./paths"

function hash(text: string) {
  return createHash("sha1").update(text).digest("hex").slice(0, 10)
}

function block(note: string) {
  const id = hash(note)
  return `\n- [memory:${id}] ${note.trim()}\n`
}

export async function appendMemory(root: string, note: string) {
  const file = agentsPath(root)
  const text = await readTextOr(file, "# Conductor Memories\n")
  const id = `memory:${hash(note)}`
  if (text.includes(id)) return false
  await writeText(file, `${text.trimEnd()}${block(note)}`)
  return true
}
