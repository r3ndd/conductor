import { join } from "node:path"

export function conductorDir(root: string) {
  // return join(root, ".conductor")
  return "./.conductor"
}

export function statePath(root: string) {
  return join(conductorDir(root), "state.json")
}

export function plansDir(root: string) {
  return join(conductorDir(root), "plans")
}

export function researchDir(root: string) {
  return join(conductorDir(root), "research")
}

export function designsDir(root: string) {
  return join(conductorDir(root), "designs")
}
