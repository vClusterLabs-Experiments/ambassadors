import assert from 'node:assert/strict'
import test from 'node:test'
import { parseIssueForm, readMetadata, writeMetadata } from '../scripts/lib/issue-form.mjs'

const body = `### Ambassador GitHub username

@test-user

### Contribution type

tutorial - Tutorial

### Contribution title

Designing tenant clusters

### Completion or publication date

2026-08-20

### Evidence URL

https://docs.test/tutorial

### Contribution summary

A complete tutorial.

### Impact or outcome

Readers can reproduce the examples.

### Related submission, if applicable

N/A`

test('parses stable issue form headings and contribution key', () => {
  const form = parseIssueForm(body)
  assert.equal(parseIssueForm(body.replace('tutorial - Tutorial', 'tutorial — Tutorial')).contribution_type, 'tutorial')
  assert.equal(form.github_username, '@test-user')
  assert.equal(form.contribution_type, 'tutorial')
  assert.equal(form.completion_date, '2026-08-20')
  assert.equal(form.related_submission, 'N/A')
})

test('writes and replaces machine-readable identity metadata', () => {
  const metadata = { ambassador: { github_username: 'test-user', github_user_id: 1234 }, validation: { state: 'valid' } }
  const withMetadata = writeMetadata(body, metadata)
  assert.deepEqual(readMetadata(withMetadata), metadata)
  assert.equal((writeMetadata(withMetadata, metadata).match(/ambassador-submission/g) ?? []).length, 1)
})
