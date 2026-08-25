export type Contribution = {
  id: string
  source_issue: number
  ambassador: {
    github_username: string
    github_user_id: number
    current_github_username: string
  }
  activity: {
    type: string
    label: string
    title: string
    date: string
    evidence_url: string
  }
  scoring: {
    points: number
    reviewer: string
    rationale: string
    approved_at: string
  }
}

export type AmbassadorStat = {
  name: string
  github_username: string
  status: string
  joined_at?: string
  role?: string
  location?: string
  timezone?: string
  pronouns?: string | null
  bio?: string
  interests: string[]
  languages: string[]
  socials: {
    github?: string | null
    linkedin?: string | null
    x?: string | null
    bluesky?: string | null
    website?: string | null
    credly?: string | null
    sessionize?: string | null
  }
  contribution_count: number
  approved_points: number
  latest_activity_date: string | null
  activity_types: Array<{ type: string; label: string; count: number }>
}

export type ActivityStat = {
  type: string
  label: string
  contribution_count: number
  approved_points: number
}

export type DashboardData = {
  generated_at: string
  repository: string
  summary: {
    contribution_count: number
    approved_points: number
    active_ambassadors: number
    activity_type_count: number
  }
  ambassadors: AmbassadorStat[]
  activity_types: ActivityStat[]
  monthly_activity: Array<{ month: string; contribution_count: number; approved_points: number }>
  contributions: Contribution[]
}
