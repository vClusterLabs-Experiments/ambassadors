import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import YAML from 'yaml'

test('stores the contribution point references and program record prefix', async () => {
  const matrix = YAML.parse(await readFile('../config/activity-types.yml', 'utf8')).activity_types
  assert.equal(Object.keys(matrix).length, 13)
  assert.deepEqual(matrix.social_thread.points, { type: 'fixed', value: 5 })
  assert.deepEqual(matrix.community_help.points, { type: 'range', minimum: 5, maximum: 15 })
  assert.deepEqual(matrix.project_contribution.points, { type: 'range', minimum: 5, maximum: 50 })
  const program = YAML.parse(await readFile('../config/program.yml', 'utf8')).program
  assert.equal(program.record_prefix, 'vc')
  assert.equal(program.monthly_baseline_points, undefined)
  assert.equal(program.quarterly_baseline_points, undefined)
})

test('stores ambassador profiles separately with automation-managed GitHub IDs', async () => {
  const registry = YAML.parse(await readFile('../ambassadors/ambassadors.yml', 'utf8')).ambassadors
  assert.ok(registry.length > 0)
  for (const ambassador of registry) {
    assert.ok(ambassador.name)
    assert.ok(ambassador.github_username)
    assert.ok(ambassador.github_user_id == null || Number.isInteger(ambassador.github_user_id))
    assert.match(ambassador.joined_at, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(typeof ambassador.socials, 'object')
  }
})

test('submission validation contains no scoring decisions', async () => {
  const source = await readFile('scripts/validate-submission.mjs', 'utf8')
  assert.doesNotMatch(source, /validateApprovalPoints|recommended points|suggested points/i)
})
