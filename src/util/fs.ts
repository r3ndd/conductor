import { mkdir, readFile, writeFile } from "node:fs/promises"

export async function ensureDir(path: string) {
  await mkdir(path, { recursive: true })
}

export async function readText(path: string) {
  return readFile(path, "utf8")
}

export async function readTextOr(path: string, fallback: string) {
  try {
    return await readText(path)
  } catch {
    return fallback
  }
}

export async function writeText(path: string, text: string) {
  await writeFile(path, text, "utf8")
}

export async function writeJson(path: string, value: unknown) {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

export async function readJsonOr<T>(path: string, fallback: T): Promise<T> {
  try {
    const text = await readText(path)
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}
