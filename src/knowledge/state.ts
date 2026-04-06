import { ensureDir, readJsonOr, writeJson } from "../util/fs"
import type { Mode } from "../config/defaults"
import { conductorDir, statePath } from "./paths"

export type PipelineStage = "idle" | "coder" | "reviewer" | "debugger" | "committer"

export type ConductorState = {
  mode: Mode
  stage: PipelineStage
  pending: string[]
  last: {
    plan?: string
    research?: string
    design?: string
  }
}

const initial: ConductorState = {
  mode: "conductor",
  stage: "idle",
  pending: [],
  last: {},
}

export async function readState(root: string): Promise<ConductorState> {
  await ensureDir(conductorDir(root))
  return readJsonOr(statePath(root), initial)
}

export async function writeState(root: string, state: ConductorState) {
  await ensureDir(conductorDir(root))
  await writeJson(statePath(root), state)
}

export async function switchMode(root: string, mode: Mode) {
  const state = await readState(root)
  await writeState(root, { ...state, mode })
}

export async function setStage(root: string, stage: PipelineStage) {
  const state = await readState(root)
  await writeState(root, { ...state, stage })
}

export async function setPending(root: string, pending: string[]) {
  const state = await readState(root)
  await writeState(root, { ...state, pending })
}

export async function setLast(root: string, key: keyof ConductorState["last"], value: string) {
  const state = await readState(root)
  await writeState(root, {
    ...state,
    last: {
      ...state.last,
      [key]: value,
    },
  })
}
