import process from 'node:process'
import { readJson, readYaml } from './lib/files.mjs'
import { createGitHubClient } from './lib/github.mjs'
import { LABELS, contributionLabel, ensureLabels, nextLabels } from './lib/labels.mjs'
import { parseIssueForm, REQUIRED_FIELDS, readMetadata, stripMetadata, writeMetadata } from './lib/issue-form.mjs'
import {
  canonicalizeEvidenceUrl,
  findActiveAmbassador,
  normalizeUsername,
  validateDate,
  validateEvidenceUrl,
  validateUsername,
} from './lib/validation.mjs'

const COMMENT_MARKER = '<!-- ambassador-validation -->'
const event = await readJson(process.env.GITHUB_EVENT_PATH)
const issue = event.issue
if (!issue) throw new Error('This script must run for a GitHub issue event.')

const github = createGitHubClient({
  token: process.env.GH_TOKEN,
  repository: process.env.GITHUB_REPOSITORY,
})
const activityConfig = await readYaml('config/activity-types.yml')
const registry = await readYaml('ambassadors/ambassadors.yml')
const ledger = await readYaml('contributions/contributions.yml')

const form = parseIssueForm(issue.body ?? '', activityConfig.activity_types)
const problems = []
for (const key of REQUIRED_FIELDS) {
  if (!form[key]) problems.push(`${key.replaceAll('_', ' ')} is required.`)
}

form.github_username = normalizeUsername(form.github_username ?? '')
let usernameUsable = Boolean(form.github_username)
if (form.github_username) {
  const error = validateUsername(form.github_username)
  if (error) {
    problems.push(error)
    usernameUsable = false
  }
}
if (form.completion_date) {
  const error = validateDate(form.completion_date)
  if (error) problems.push(error)
}
if (form.evidence_url) {
  const error = validateEvidenceUrl(form.evidence_url)
  if (error) problems.push(error)
}
if (form.contribution_title?.includes('-->')) {
  problems.push('Contribution title contains unsupported markup.')
}

const activity = activityConfig.activity_types?.[form.contribution_type]
if (form.contribution_type && !activity) {
  problems.push('Contribution type is not in the approved contribution matrix.')
}

let account
if (usernameUsable) {
  try {
    account = await github.resolveUser(form.github_username)
    const registration = findActiveAmbassador(registry, account)
    if (registration.error) problems.push(registration.error)
  } catch (error) {
    problems.push(error.status === 404
      ? 'The submitted GitHub username could not be resolved.'
      : 'GitHub identity could not be verified right now. Edit the issue to retry.')
  }
}

let canonicalEvidence
let duplicate = false
if (!problems.some((problem) => problem.startsWith('Evidence URL')) && form.evidence_url) {
  canonicalEvidence = canonicalizeEvidenceUrl(form.evidence_url)
  duplicate = (ledger.contributions ?? []).some(
    (record) => canonicalizeEvidenceUrl(record.activity.evidence_url) === canonicalEvidence,
  )

  if (!duplicate) {
    const otherIssues = await github.listIssues()
    duplicate = otherIssues.some((candidate) => {
      if (candidate.number === issue.number || candidate.pull_request) return false
      const metadata = readMetadata(candidate.body ?? '')
      return metadata?.validation?.canonical_evidence_url === canonicalEvidence
    })
  }
}

const valid = problems.length === 0
const status = valid ? 'status:needs-review' : 'status:needs-information'
const definitions = [LABELS['submission:ambassador'], LABELS[status]]
if (valid) definitions.push(contributionLabel(form.contribution_type, activity))
if (duplicate) definitions.push(LABELS['possible-duplicate'])
await ensureLabels(github, definitions)

let body = stripMetadata(issue.body ?? '')
if (valid) {
  body = writeMetadata(body, {
    version: 1,
    ambassador: {
      github_username: account.login,
      github_user_id: account.id,
    },
    activity: {
      type: form.contribution_type,
      title: form.contribution_title,
      date: form.completion_date,
      evidence_url: form.evidence_url,
    },
    validation: {
      state: 'valid',
      checked_at: new Date().toISOString(),
      canonical_evidence_url: canonicalEvidence,
      possible_duplicate: duplicate,
    },
  })
}

await github.updateIssue(issue.number, {
  body,
  labels: nextLabels(issue.labels ?? [], {
    status,
    contributionType: valid ? form.contribution_type : null,
    duplicate,
  }),
})

const commentBody = valid
  ? `${COMMENT_MARKER}\nSubmission validated and queued for human review.${duplicate ? '\n\n⚠️ This evidence may match another submission. A maintainer will verify it before approval.' : ''}\n\nOnly an authorized maintainer can decide and approve points.`
  : `${COMMENT_MARKER}\nThis submission needs information before it can be reviewed:\n\n${problems.map((problem) => `- ${problem}`).join('\n')}\n\nPlease edit the issue with the requested information. Validation will run again automatically.`

const comments = await github.listIssueComments(issue.number)
const previous = comments.find((comment) => comment.user?.type === 'Bot' && comment.body?.includes(COMMENT_MARKER))
if (previous) await github.updateIssueComment(previous.id, commentBody)
else await github.createIssueComment(issue.number, commentBody)

console.log(valid ? 'Submission is valid and needs human review.' : `Submission needs information (${problems.length} problem(s)).`)
