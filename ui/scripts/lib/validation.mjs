const USERNAME_PATTERN = /^(?!-)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i
const PRIVATE_IPV4 = /^(?:10\.|127\.|169\.254\.|192\.168\.|0\.|(?:172\.(?:1[6-9]|2\d|3[01])\.))/
const TRACKING_PARAMETERS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid'])

export function normalizeUsername(value = '') {
  return value.trim().replace(/^@/, '')
}

export function validateUsername(username) {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Ambassador GitHub username is not a valid GitHub username.'
  }
  return null
}

export function validateDate(value, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Completion or publication date must use YYYY-MM-DD.'
  }
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    return 'Completion or publication date is not a real calendar date.'
  }
  const todayUtc = today.toISOString().slice(0, 10)
  if (value > todayUtc) {
    return 'Completion or publication date cannot be in the future.'
  }
  return null
}

export function canonicalizeEvidenceUrl(value) {
  const url = new URL(value)
  url.protocol = url.protocol.toLowerCase()
  url.hostname = url.hostname.toLowerCase()
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key)
    }
  }
  url.searchParams.sort()
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')
  return url.toString()
}

export function validateEvidenceUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return 'Evidence URL must be a complete, valid URL.'
  }
  if (url.protocol !== 'https:') return 'Evidence URL must use HTTPS.'
  if (url.username || url.password) return 'Evidence URL cannot contain credentials.'
  const host = url.hostname.toLowerCase()
  if (!host || host === 'localhost' || host.endsWith('.local') || PRIVATE_IPV4.test(host) || host === '::1') {
    return 'Evidence URL must point to a public host.'
  }
  return null
}

export function findActiveAmbassador(registry, account) {
  const ambassadors = registry.ambassadors ?? []
  const byId = ambassadors.find((item) => Number(item.github_user_id) === Number(account.id))
  if (byId) {
    return byId.status === 'active'
      ? { ambassador: byId }
      : { error: 'This GitHub account is registered, but is not an active ambassador.' }
  }

  const byUsername = ambassadors.find(
    (item) => item.github_username.toLowerCase() === account.login.toLowerCase(),
  )
  if (byUsername) {
    if (byUsername.github_user_id == null) {
      return byUsername.status === 'active'
        ? { ambassador: byUsername }
        : { error: 'This GitHub account is registered, but is not an active ambassador.' }
    }
    return {
      error: 'The submitted username resolves to a different GitHub user ID than the ambassador registry. A maintainer must update the registry before this submission can proceed.',
    }
  }

  return { error: 'This GitHub account is not registered as an active ambassador.' }
}

export function validateApprovalPoints(activity, points) {
  if (!Number.isInteger(points) || points < 0) {
    return { valid: false, message: 'Points must be a whole number.' }
  }
  if (activity.points.type === 'fixed') {
    const allowed = activity.points.value
    return points === allowed
      ? { valid: true }
      : { valid: false, message: `This fixed activity requires exactly ${allowed} points.` }
  }
  const minimum = activity.points.minimum
  const maximum = activity.points.maximum
  return points >= minimum && points <= maximum
    ? { valid: true }
    : { valid: false, message: `This ranged activity allows ${minimum}–${maximum} points.` }
}

export function parseApprovalCommand(body = '') {
  const match = body.trim().match(/^\/approve\s+points=(\d+)\s+note="([\s\S]+)"$/)
  if (!match) return null
  const note = match[2].trim()
  if (!note) return null
  return { points: Number(match[1]), note }
}
