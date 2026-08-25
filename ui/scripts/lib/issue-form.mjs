import YAML from 'yaml'

export const FORM_FIELDS = {
  'Ambassador GitHub username': 'github_username',
  'Contribution type': 'contribution_type',
  'Contribution title': 'contribution_title',
  'Completion or publication date': 'completion_date',
  'Evidence URL': 'evidence_url',
  'Contribution summary': 'contribution_summary',
  'Impact or outcome': 'impact',
  'Related submission, if applicable': 'related_submission',
}

export const REQUIRED_FIELDS = Object.values(FORM_FIELDS)
export const METADATA_MARKER = 'ambassador-submission'

function cleanFormValue(value) {
  const cleaned = value.trim()
  if (!cleaned || cleaned === '_No response_') return ''
  return cleaned
}

export function parseIssueForm(body = '') {
  const headings = [...body.matchAll(/^###\s+(.+?)\s*$/gm)]
  const result = {}

  for (let index = 0; index < headings.length; index += 1) {
    const match = headings[index]
    const heading = match[1]
    const key = FORM_FIELDS[heading]
    if (!key) continue
    const start = match.index + match[0].length
    const end = headings[index + 1]?.index ?? body.length
    result[key] = cleanFormValue(body.slice(start, end))
  }

  if (result.contribution_type) {
    result.contribution_type = result.contribution_type.split(/\s+[-—–]\s+/)[0].trim()
  }

  return result
}

export function stripMetadata(body = '') {
  const pattern = new RegExp(`\\n?<!-- ${METADATA_MARKER}\\n[\\s\\S]*?\\n-->\\s*`, 'g')
  return body.replace(pattern, '').trimEnd()
}

export function readMetadata(body = '') {
  const pattern = new RegExp(`<!-- ${METADATA_MARKER}\\n([\\s\\S]*?)\\n-->`)
  const match = body.match(pattern)
  if (!match) return null
  return YAML.parse(match[1])
}

export function writeMetadata(body, metadata) {
  const cleanBody = stripMetadata(body)
  const yaml = YAML.stringify(metadata, { lineWidth: 0 }).trimEnd()
  return `${cleanBody}\n\n<!-- ${METADATA_MARKER}\n${yaml}\n-->`
}
