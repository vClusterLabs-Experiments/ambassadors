import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import YAML from 'yaml'
import { parseIssueForm, readMetadata, writeMetadata } from '../scripts/lib/issue-form.mjs'

const body = `### Ambassador GitHub username

@test-user

### Contribution type

tutorial - Tutorial

### Completion or publication date

2026-08-20

### Evidence URL

https://docs.test/tutorial

### Contribution summary

A complete tutorial.`

const activityTypes = {
  tutorial: { label: 'Tutorial' },
}

test('parses stable issue form headings and contribution key', () => {
  const form = parseIssueForm(body)
  assert.equal(parseIssueForm(body.replace('tutorial - Tutorial', 'tutorial — Tutorial')).contribution_type, 'tutorial')
  assert.equal(form.github_username, '@test-user')
  assert.equal(form.contribution_type, 'tutorial')
  assert.equal(form.completion_date, '2026-08-20')
  assert.equal(form.contribution_summary, 'A complete tutorial.')
})

test('maps a human-readable contribution label to its stable key', () => {
  const form = parseIssueForm(body.replace('tutorial - Tutorial', 'Tutorial'), activityTypes)
  assert.equal(form.contribution_type, 'tutorial')
})

test('keeps submission labels and contribution options in sync with program configuration', async () => {
  const issueForm = YAML.parse(await readFile('../.github/ISSUE_TEMPLATE/contribution.yml', 'utf8'))
  const matrix = YAML.parse(await readFile('../config/activity-types.yml', 'utf8')).activity_types
  const dropdown = issueForm.body.find((field) => field.id === 'contribution_type')
  assert.deepEqual(issueForm.labels, ['submission:ambassador', 'status:needs-review'])
  assert.deepEqual(dropdown.attributes.options, Object.values(matrix).map((activity) => activity.label))
})

test('writes and replaces machine-readable identity metadata', () => {
  const metadata = { ambassador: { github_username: 'test-user', github_user_id: 1234 }, validation: { state: 'valid' } }
  const withMetadata = writeMetadata(body, metadata)
  assert.deepEqual(readMetadata(withMetadata), metadata)
  assert.equal((writeMetadata(withMetadata, metadata).match(/ambassador-submission/g) ?? []).length, 1)
})
