import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ROOT } from './lib/files.mjs'

const indexPath = resolve(ROOT, 'ui/dist/index.html')
const dataPath = resolve(ROOT, 'ui/dist/data/dashboard.json')
const index = await readFile(indexPath, 'utf8')
const dashboard = JSON.parse(await readFile(dataPath, 'utf8'))

if (/\b(?:src|href)="\/(?!\/)/.test(index)) {
  throw new Error('GitHub Pages build contains a root-absolute asset URL.')
}
if (!Array.isArray(dashboard.contributions) || !Array.isArray(dashboard.ambassadors)) {
  throw new Error('GitHub Pages dashboard data is missing required collections.')
}

console.log('Verified a repository-subpath-safe GitHub Pages artifact.')
