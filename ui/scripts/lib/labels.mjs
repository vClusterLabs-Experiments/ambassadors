export const LABELS = {
  'submission:ambassador': { name: 'submission:ambassador', color: '5DDBC4', description: 'Ambassador activity submission' },
  'status:needs-review': { name: 'status:needs-review', color: 'F6C85F', description: 'Waiting for human review' },
  'status:needs-information': { name: 'status:needs-information', color: 'E05D44', description: 'Submitter action is required' },
  'status:pr-open': { name: 'status:pr-open', color: '7C5CFC', description: 'Approved contribution pull request is open' },
  'status:approved': { name: 'status:approved', color: '5DDBC4', description: 'Contribution approved by an authorized reviewer' },
  'status:credited': { name: 'status:credited', color: 'B7F34A', description: 'Contribution record merged into the central ledger' },
  'contribution-record': { name: 'contribution-record', color: 'B7F34A', description: 'Pull request adds an approved contribution record' },
  'possible-duplicate': { name: 'possible-duplicate', color: 'F08B5D', description: 'Evidence may duplicate another submission' },
}

export function contributionLabel(type, activity) {
  return {
    name: `contribution:${type}`,
    color: 'B7F34A',
    description: activity?.label ? `Contribution: ${activity.label}`.slice(0, 100) : `Contribution: ${type}`,
  }
}

export async function ensureLabels(github, definitions) {
  const existing = new Set((await github.listLabels()).map((label) => label.name))
  for (const definition of definitions) {
    if (!existing.has(definition.name)) await github.createLabel(definition)
  }
}

export function nextLabels(current, { status, contributionType, duplicate }) {
  const preserved = current
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter((name) => !name.startsWith('status:') && !name.startsWith('contribution:') && name !== 'possible-duplicate')
  if (contributionType) preserved.push(`contribution:${contributionType}`)
  preserved.push(status)
  if (duplicate) preserved.push('possible-duplicate')
  return [...new Set(preserved)]
}
