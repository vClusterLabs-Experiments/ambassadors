import { readYamlDocument, writeYamlDocument } from './lib/files.mjs'
import { createGitHubClient } from './lib/github.mjs'

const github = createGitHubClient({ token: process.env.GH_TOKEN, repository: process.env.GITHUB_REPOSITORY })
const registry = await readYamlDocument('ambassadors/ambassadors.yml')
const ambassadors = registry.toJS().ambassadors ?? []
let changes = 0
let failures = 0
const missingOnly = process.argv.includes('--missing-only')
const strict = process.argv.includes('--strict')

for (const [index, ambassador] of ambassadors.entries()) {
  if (missingOnly && ambassador.github_user_id != null) continue
  try {
    let account
    let changed = false
    if (ambassador.github_user_id == null) {
      account = await github.resolveUser(ambassador.github_username)
      if (!Number.isSafeInteger(account.id) || account.id <= 0) {
        throw new Error('GitHub returned an invalid user ID')
      }
      registry.setIn(['ambassadors', index, 'github_user_id'], account.id)
      console.log(`Resolved @${account.login} to GitHub user ID ${account.id}.`)
      changed = true
    } else {
      account = await github.resolveUserId(ambassador.github_user_id)
    }

    const profileUrl = `https://github.com/${account.login}`
    changed ||= ambassador.github_username !== account.login || ambassador.socials?.github !== profileUrl
    if (account.login !== ambassador.github_username) {
      console.log(`GitHub user ID ${account.id}: ${ambassador.github_username} -> ${account.login}`)
      registry.setIn(['ambassadors', index, 'github_username'], account.login)
    }
    registry.setIn(['ambassadors', index, 'socials', 'github'], profileUrl)
    if (changed) changes += 1
  } catch (error) {
    failures += 1
    console.warn(`Could not refresh @${ambassador.github_username} (GitHub user ID ${ambassador.github_user_id}): ${error.message}`)
  }
}

if (changes > 0) await writeYamlDocument('ambassadors/ambassadors.yml', registry)
console.log(`Identity sync completed with ${changes} ambassador profile update(s).`)
if (strict && failures > 0) process.exitCode = 1
