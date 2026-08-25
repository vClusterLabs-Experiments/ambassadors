import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export async function readYaml(relativePath) {
  const text = await readFile(resolve(ROOT, relativePath), 'utf8')
  return YAML.parse(text)
}

export async function writeYaml(relativePath, value) {
  const text = YAML.stringify(value, { lineWidth: 0, sortMapEntries: false })
  await writeFile(resolve(ROOT, relativePath), text, 'utf8')
}

// Editing through a Document keeps the maintainer comments that explain which fields
// automation owns. Plain readYaml/writeYaml would drop every comment in the file.
export async function readYamlDocument(relativePath) {
  const text = await readFile(resolve(ROOT, relativePath), 'utf8')
  return YAML.parseDocument(text)
}

export async function writeYamlDocument(relativePath, document) {
  await writeFile(resolve(ROOT, relativePath), document.toString({ lineWidth: 0 }), 'utf8')
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}
