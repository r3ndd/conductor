import { writeArtifact } from "../knowledge/artifacts"
import { appendMemory } from "../knowledge/memory"
import { readState, setLast } from "../knowledge/state"
import { exists } from "../util/fs"

type Cmd = "build" | "plan" | "brainstorm" | "branstorm" | "research" | "architect"

function normalize(cmd: Cmd) {
  if (cmd === "branstorm") return "brainstorm"
  return cmd
}

function topic(args: string, fallback: string) {
  const text = args.trim()
  if (!text) return fallback
  return text.split("\n")[0].slice(0, 80)
}

export async function buildCommandPrompt(root: string, cmd: string, args: string) {
  const state = await readState(root)
  const name = normalize(cmd as Cmd)
  if (name === "build") {
    return "Conductor mode is now build. Continue with implementation-oriented work."
  }
  if (name === "plan") {
    return "Conductor mode is now plan. Focus on planning, research, and architecture."
  }
  if (name === "brainstorm") {
    const note = `Brainstorm request: ${args.trim() || "(none)"}`
    const file = await writeArtifact("plan", {
      root,
      topic: topic(args, "brainstorm"),
      text: `# Brainstorm\n\n${note}`,
      mode: state.mode,
      session: "command",
      agent: "plan",
      command: "/brainstorm",
    })
    await setLast(root, "plan", file.id)
    await appendMemory(root, `Saved brainstorm artifact ${file.id}.`)
    const ready = await exists(file.path)
    const status = ready
      ? `I saved a brainstorm artifact at ${file.path}.`
      : `The brainstorm artifact target is ${file.path}, but the file is not created yet.`
    return `${status} Continue refining this plan with the user.`
  }
  if (name === "research") {
    return `Run researcher subagent behavior for this request and include results: ${args || "(none)"}.`
  }
  if (name === "architect") {
    return `Run architect subagent behavior for this request and provide a detailed design: ${args || "(none)"}.`
  }
  return null
}
