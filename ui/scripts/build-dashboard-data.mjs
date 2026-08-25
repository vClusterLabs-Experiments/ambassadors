import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readYaml, ROOT } from './lib/files.mjs'

const matrix = await readYaml('config/activity-types.yml')
const registry = await readYaml('ambassadors/ambassadors.yml')
const ledger = await readYaml('contributions/contributions.yml')

const records = ledger.contributions ?? []
const ambassadors = registry.ambassadors ?? []
const registryById = new Map(ambassadors.filter((item) => item.github_user_id != null).map((item) => [String(item.github_user_id), item]))
// Registered ambassadors keep one card even before identity sync backfills their numeric ID.
const registryByUsername = new Map(ambassadors.map((item) => [item.github_username.toLowerCase(), item]))
const activities = matrix.activity_types ?? {}

const contributions = records
  .map((record) => {
    const registryEntry = registryById.get(String(record.ambassador.github_user_id))
      ?? registryByUsername.get(String(record.ambassador.github_username).toLowerCase())
    return {
      ...record,
      ambassador: {
        ...record.ambassador,
        current_github_username: registryEntry?.github_username ?? record.ambassador.github_username,
      },
      activity: {
        ...record.activity,
        label: activities[record.activity.type]?.label ?? record.activity.type,
      },
    }
  })
  .sort((a, b) => b.activity.date.localeCompare(a.activity.date) || b.id.localeCompare(a.id))

const grouped = new Map()
for (const ambassador of ambassadors) {
  const key = ambassador.github_username.toLowerCase()
  grouped.set(key, {
    name: ambassador.name,
    github_username: ambassador.github_username,
    status: ambassador.status,
    joined_at: ambassador.joined_at,
    role: ambassador.role,
    location: ambassador.location,
    timezone: ambassador.timezone,
    pronouns: ambassador.pronouns,
    bio: ambassador.bio,
    interests: ambassador.interests ?? [],
    languages: ambassador.languages ?? [],
    socials: ambassador.socials ?? {},
    contributions: [],
  })
}
for (const contribution of contributions) {
  const key = contribution.ambassador.current_github_username.toLowerCase()
  if (!grouped.has(key)) {
    grouped.set(key, {
      name: contribution.ambassador.current_github_username,
      github_username: contribution.ambassador.current_github_username,
      status: 'historical',
      interests: [],
      languages: [],
      socials: {},
      contributions: [],
    })
  }
  grouped.get(key).contributions.push(contribution)
}

const ambassadorStats = [...grouped.values()]
  .map((ambassador) => ({
    name: ambassador.name,
    github_username: ambassador.github_username,
    status: ambassador.status,
    joined_at: ambassador.joined_at,
    role: ambassador.role,
    location: ambassador.location,
    timezone: ambassador.timezone,
    pronouns: ambassador.pronouns,
    bio: ambassador.bio,
    interests: ambassador.interests,
    languages: ambassador.languages,
    socials: ambassador.socials,
    contribution_count: ambassador.contributions.length,
    approved_points: ambassador.contributions.reduce((sum, item) => sum + item.scoring.points, 0),
    latest_activity_date: ambassador.contributions[0]?.activity.date ?? null,
    activity_types: Object.entries(
      ambassador.contributions.reduce((counts, item) => {
        counts[item.activity.type] = (counts[item.activity.type] ?? 0) + 1
        return counts
      }, {}),
    ).map(([type, count]) => ({ type, label: activities[type]?.label ?? type, count })),
  }))
  .sort((a, b) => b.approved_points - a.approved_points || b.contribution_count - a.contribution_count || a.github_username.localeCompare(b.github_username))

const activityStats = Object.entries(activities)
  .map(([type, activity]) => {
    const matching = contributions.filter((item) => item.activity.type === type)
    return {
      type,
      label: activity.label,
      contribution_count: matching.length,
      approved_points: matching.reduce((sum, item) => sum + item.scoring.points, 0),
    }
  })
  .sort((a, b) => b.contribution_count - a.contribution_count || b.approved_points - a.approved_points || a.label.localeCompare(b.label))

const monthly = new Map()
for (const contribution of contributions) {
  const month = contribution.activity.date.slice(0, 7)
  const existing = monthly.get(month) ?? { month, contribution_count: 0, approved_points: 0 }
  existing.contribution_count += 1
  existing.approved_points += contribution.scoring.points
  monthly.set(month, existing)
}

const payload = {
  generated_at: new Date().toISOString(),
  repository: process.env.GITHUB_REPOSITORY ?? 'vClusterLabs-Experiments/ambassadors',
  summary: {
    contribution_count: contributions.length,
    approved_points: contributions.reduce((sum, item) => sum + item.scoring.points, 0),
    active_ambassadors: ambassadors.filter((item) => item.status === 'active').length,
    activity_type_count: new Set(contributions.map((item) => item.activity.type)).size,
  },
  ambassadors: ambassadorStats,
  activity_types: activityStats,
  monthly_activity: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month)),
  contributions,
}

const outputDirectory = resolve(ROOT, 'ui/public/data')
await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'dashboard.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Built dashboard data with ${contributions.length} approved contribution(s).`)
