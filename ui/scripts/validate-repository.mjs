import { readYaml } from './lib/files.mjs'
import { canonicalizeEvidenceUrl, validateApprovalPoints, validateDate, validateEvidenceUrl } from './lib/validation.mjs'

const matrix = await readYaml('config/activity-types.yml')
const program = await readYaml('config/program.yml')
const registry = await readYaml('ambassadors/ambassadors.yml')
const reviewers = await readYaml('config/reviewers.yml')
const ledger = await readYaml('contributions/contributions.yml')
const errors = []
// Reviewers may be deactivated or retired later, so historical records only require a
// reviewer the program still recognises. Only record-approval.mjs checks `active`.
const knownReviewers = new Set(
  (reviewers.reviewers ?? []).map((reviewer) => reviewer.github_username.toLowerCase()),
)
const recordPrefix = program.program?.record_prefix
if (!recordPrefix) errors.push('config/program.yml must define program.record_prefix.')

const ids = new Set()
const issues = new Set()
const evidence = new Set()
for (const record of ledger.contributions ?? []) {
  if (ids.has(record.id)) errors.push(`Duplicate contribution ID: ${record.id}`)
  ids.add(record.id)
  if (recordPrefix && !String(record.id).startsWith(`${recordPrefix}-`)) {
    errors.push(`${record.id}: contribution ID must start with the configured ${recordPrefix}- prefix.`)
  }
  if (issues.has(record.source_issue)) errors.push(`Issue #${record.source_issue} has multiple records.`)
  issues.add(record.source_issue)

  const urlError = validateEvidenceUrl(record.activity?.evidence_url ?? '')
  if (urlError) errors.push(`${record.id}: ${urlError}`)
  else {
    const canonical = canonicalizeEvidenceUrl(record.activity.evidence_url)
    if (evidence.has(canonical)) errors.push(`${record.id}: evidence URL is credited more than once.`)
    evidence.add(canonical)
  }
  const dateError = validateDate(record.activity?.date ?? '')
  if (dateError) errors.push(`${record.id}: ${dateError}`)
  const activity = matrix.activity_types?.[record.activity?.type]
  if (!activity) errors.push(`${record.id}: unknown contribution type ${record.activity?.type}.`)
  else {
    const points = validateApprovalPoints(record.scoring?.points)
    if (!points.valid) errors.push(`${record.id}: ${points.message}`)
  }
  if (!record.scoring?.reviewer || !record.scoring?.rationale || !record.scoring?.approved_at) {
    errors.push(`${record.id}: scoring reviewer, rationale, and approved_at are required.`)
  }
  if (record.scoring?.reviewer && !knownReviewers.has(record.scoring.reviewer.toLowerCase())) {
    errors.push(`${record.id}: reviewer @${record.scoring.reviewer} is not listed in config/reviewers.yml.`)
  }
  if (!record.ambassador?.github_username || !Number.isInteger(record.ambassador?.github_user_id)) {
    errors.push(`${record.id}: ambassador username and numeric GitHub user ID are required.`)
  }
}

const ambassadorUsernames = new Set()
const ambassadorUserIds = new Set()
for (const ambassador of registry.ambassadors ?? []) {
  if (!ambassador.name?.trim()) errors.push('Every ambassador requires a name.')
  if (!ambassador.github_username) errors.push('Every ambassador requires github_username.')
  const normalizedUsername = ambassador.github_username?.toLowerCase()
  if (normalizedUsername && ambassadorUsernames.has(normalizedUsername)) {
    errors.push(`Duplicate ambassador GitHub username: @${ambassador.github_username}.`)
  }
  if (normalizedUsername) ambassadorUsernames.add(normalizedUsername)
  if (!Number.isSafeInteger(ambassador.github_user_id) || ambassador.github_user_id <= 0) {
    errors.push(`@${ambassador.github_username ?? 'unknown'}: github_user_id must be a positive integer resolved by a maintainer.`)
  } else if (ambassadorUserIds.has(ambassador.github_user_id)) {
    errors.push(`Duplicate ambassador GitHub user ID: ${ambassador.github_user_id}.`)
  } else {
    ambassadorUserIds.add(ambassador.github_user_id)
  }
  if (!['active', 'inactive', 'alumni'].includes(ambassador.status)) {
    errors.push(`@${ambassador.github_username ?? 'unknown'}: status must be active, inactive, or alumni.`)
  }
  if (!ambassador.joined_at || validateDate(String(ambassador.joined_at))) {
    errors.push(`@${ambassador.github_username ?? 'unknown'}: joined_at must be a real, non-future YYYY-MM-DD date.`)
  }
  if (!ambassador.socials || typeof ambassador.socials !== 'object') {
    errors.push(`@${ambassador.github_username ?? 'unknown'}: socials must be an object.`)
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}
console.log(`Validated ${ids.size} contribution record(s) and ${Object.keys(matrix.activity_types ?? {}).length} activity types.`)
