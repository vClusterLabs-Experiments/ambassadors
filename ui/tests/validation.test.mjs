import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalizeEvidenceUrl,
  findActiveAmbassador,
  parseApprovalCommand,
  validateApprovalPoints,
  validateDate,
  validateEvidenceUrl,
} from '../scripts/lib/validation.mjs'

test('validates dates and public HTTPS evidence', () => {
  assert.equal(validateDate('2026-08-20', new Date('2026-08-25T00:00:00Z')), null)
  assert.match(validateDate('2026-08-26', new Date('2026-08-25T00:00:00Z')), /future/)
  assert.equal(validateEvidenceUrl('https://docs.test/tutorial'), null)
  assert.match(validateEvidenceUrl('http://localhost/tutorial'), /HTTPS/)
})

test('canonicalizes evidence for duplicate checks', () => {
  assert.equal(
    canonicalizeEvidenceUrl('https://DOCS.test/tutorial/?utm_source=x#section'),
    'https://docs.test/tutorial',
  )
})

test('ties active registration to immutable GitHub ID', () => {
  const registry = { ambassadors: [{ github_username: 'old-name', github_user_id: 42, status: 'active' }] }
  assert.ok(findActiveAmbassador(registry, { login: 'new-name', id: 42 }).ambassador)
  assert.match(findActiveAmbassador(registry, { login: 'old-name', id: 99 }).error, /different GitHub user ID/)
})

test('accepts an active username before automation backfills its GitHub ID', () => {
  const registry = { ambassadors: [{ github_username: 'test-user', status: 'active' }] }
  assert.ok(findActiveAmbassador(registry, { login: 'test-user', id: 12345678 }).ambassador)
})

test('parses approval commands with a required note', () => {
  assert.deepEqual(parseApprovalCommand('/approve points=20 note="Complete and reproducible"'), { points: 20, note: 'Complete and reproducible' })
  assert.equal(parseApprovalCommand('/approve points=20'), null)
})

test('accepts any positive whole-number score chosen by a maintainer', () => {
  assert.deepEqual(validateApprovalPoints(10), { valid: true })
  assert.deepEqual(validateApprovalPoints(100), { valid: true })
  assert.match(validateApprovalPoints(0).message, /positive whole number/)
  assert.match(validateApprovalPoints(1.5).message, /positive whole number/)
  assert.match(validateApprovalPoints(Number.MAX_SAFE_INTEGER + 1).message, /positive whole number/)
})
