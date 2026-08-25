import { appendFile } from 'node:fs/promises'
import process from 'node:process'
import { readJson, readYaml, writeYaml } from './lib/files.mjs'
import { createGitHubClient } from './lib/github.mjs'
import { readMetadata } from './lib/issue-form.mjs'
import { ensureLabels, LABELS } from './lib/labels.mjs'
import {
  canonicalizeEvidenceUrl,
  findActiveAmbassador,
  parseApprovalCommand,
  validateApprovalPoints,
  validateDate,
  validateEvidenceUrl,
} from './lib/validation.mjs'

const event = await readJson(process.env.GITHUB_EVENT_PATH)
const issue = event.issue
const comment = event.comment
if (!issue || !comment || issue.pull_request) throw new Error('Approval commands only work on issue comments.')

const output = async (key, value) => {
  if (!process.env.GITHUB_OUTPUT) return
  const delimiter = `output_${key}_${Date.now()}`
  await appendFile(process.env.GITHUB_OUTPUT, `${key}<<${delimiter}\n${value}\n${delimiter}\n`)
}
const reject = async (message) => {
  await output('approved', 'false')
  await output('comment_body', `<!-- ambassador-approval -->\nApproval was not recorded: ${message}`)
  console.log(message)
  process.exitCode = 0
}

const command = parseApprovalCommand(comment.body)
if (!command) {
  await reject('Use `/approve points=<whole number> note="<approval rationale>"`. An approval note is required.')
} else {
  const reviewers = await readYaml('config/reviewers.yml')
  const authorized = (reviewers.reviewers ?? []).some(
    (reviewer) => reviewer.active && reviewer.github_username.toLowerCase() === comment.user.login.toLowerCase(),
  )
  if (!authorized) {
    await reject(`@${comment.user.login} is not an authorized reviewer.`)
  } else {
    const metadata = readMetadata(issue.body ?? '')
    // The metadata block lives in an editable issue body, so the activity is re-checked here
    // instead of trusting whatever the block claims validation approved.
    const activityProblem = metadata?.activity
      ? validateEvidenceUrl(metadata.activity.evidence_url ?? '') ?? validateDate(String(metadata.activity.date ?? ''))
      : 'The issue does not contain a submitted activity.'
    if (metadata?.validation?.state !== 'valid') {
      await reject('The issue does not contain a current valid submission. Fix the validation errors first.')
    } else if (activityProblem) {
      await reject(`${activityProblem} Edit the issue so validation can run again.`)
    } else {
      const github = createGitHubClient({ token: process.env.GH_TOKEN, repository: process.env.GITHUB_REPOSITORY })
      const registry = await readYaml('ambassadors/ambassadors.yml')
      let account
      try {
        account = await github.resolveUser(metadata.ambassador.github_username)
      } catch {
        await reject('The ambassador GitHub identity can no longer be resolved.')
      }

      if (account) {
        const registration = findActiveAmbassador(registry, account)
        if (registration.error || Number(account.id) !== Number(metadata.ambassador.github_user_id)) {
          await reject(registration.error ?? 'The resolved GitHub user ID no longer matches the validated submission.')
        } else {
          const matrix = await readYaml('config/activity-types.yml')
          const activity = matrix.activity_types?.[metadata.activity.type]
          if (!activity) {
            await reject('The original contribution type is not in the approved contribution matrix.')
          } else {
            const pointsCheck = validateApprovalPoints(activity, command.points)
            if (!pointsCheck.valid) {
              await reject(pointsCheck.message)
            } else {
              const ledger = await readYaml('contributions/contributions.yml')
              const records = ledger.contributions ?? []
              const canonicalEvidence = canonicalizeEvidenceUrl(metadata.activity.evidence_url)
              if (records.some((record) => Number(record.source_issue) === Number(issue.number))) {
                await reject('This issue has already produced a contribution record.')
              } else if (records.some((record) => canonicalizeEvidenceUrl(record.activity.evidence_url) === canonicalEvidence)) {
                await reject('This evidence has already been credited in another contribution record.')
              } else {
                const program = await readYaml('config/program.yml')
                const year = metadata.activity.date.slice(0, 4)
                const id = `${program.program.record_prefix}-${year}-${String(issue.number).padStart(4, '0')}`
                if (records.some((record) => record.id === id)) {
                  await reject(`Contribution record ID ${id} already exists.`)
                } else {
                  await ensureLabels(github, [LABELS['status:pr-open'], LABELS['status:approved'], LABELS['contribution-record']])
                  records.push({
                    id,
                    source_issue: issue.number,
                    ambassador: {
                      github_username: account.login,
                      github_user_id: account.id,
                    },
                    activity: {
                      type: metadata.activity.type,
                      title: metadata.activity.title,
                      date: metadata.activity.date,
                      evidence_url: metadata.activity.evidence_url,
                    },
                    scoring: {
                      points: command.points,
                      reviewer: comment.user.login,
                      rationale: command.note,
                      approved_at: comment.created_at,
                    },
                  })
                  records.sort((a, b) => a.activity.date.localeCompare(b.activity.date) || a.id.localeCompare(b.id))
                  await writeYaml('contributions/contributions.yml', { contributions: records })
                  await output('approved', 'true')
                  await output('record_id', id)
                  await output('issue_number', String(issue.number))
                  await output('branch', `contribution/issue-${issue.number}`)
                  await output('pr_title', `Record ambassador contribution ${id}`)
                  await output('pr_body', `Records the maintainer-approved contribution from #${issue.number}.\n\n- Contribution: ${metadata.activity.title}\n- Ambassador: @${account.login}\n- Reviewer: @${comment.user.login}\n\nCloses #${issue.number}`)
                  await output('comment_body', '')
                  console.log(`Prepared contribution record ${id}.`)
                }
              }
            }
          }
        }
      }
    }
  }
}
