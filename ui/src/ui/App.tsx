import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityStat, AmbassadorStat, Contribution, DashboardData } from '../types'
import { ActivityIcon, ArrowUpRight, CalendarIcon, CheckIcon, ChevronDown, ClockIcon, GithubIcon, GridIcon, LinkIcon, MapPinIcon, SearchIcon, UsersIcon } from './icons'

type View = 'overview' | 'ambassadors'
type Period = 'all' | string
type ScoreWindow = 'monthly' | 'quarterly' | 'yearly'

const number = new Intl.NumberFormat('en-US')
const compactDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const VCLUSTER_LOGO_URL = 'https://cdn.prod.website-files.com/68994d4ecac027f80ff70510/6949ddcb39ae0f3463132a2a_vCluster.png'

function initials(username: string) {
  return username.split(/[-_.]/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(date: string) {
  return compactDate.format(new Date(`${date}T00:00:00Z`))
}

function sameUsername(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'accent' }) === 0
}

function isInScoreWindow(date: string, window: ScoreWindow, now = new Date()) {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7)) - 1
  if (year !== now.getUTCFullYear()) return false
  if (window === 'yearly') return true
  if (window === 'monthly') return month === now.getUTCMonth()
  return Math.floor(month / 3) === Math.floor(now.getUTCMonth() / 3)
}

function scoreWindowLabel(window: ScoreWindow) {
  if (window === 'monthly') return 'This month'
  if (window === 'quarterly') return 'This quarter'
  return 'This year'
}

function avatarUrl(username: string) {
  return `https://github.com/${encodeURIComponent(username)}.png?size=96`
}

function Avatar({ username, size = 'medium' }: { username: string; size?: 'small' | 'medium' | 'large' }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {!failed ? <img src={avatarUrl(username)} alt="" onError={() => setFailed(true)} /> : <span>{initials(username)}</span>}
    </span>
  )
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src={VCLUSTER_LOGO_URL} alt="" />
    </span>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><span><ActivityIcon size={22} /></span><h3>{title}</h3><p>{body}</p></div>
}

function KpiCard({ tone, icon, label, value, hint }: { tone: string; icon: React.ReactNode; label: string; value: number; hint: string }) {
  return (
    <article className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__top"><span className="kpi-icon">{icon}</span></div>
      <p>{label}</p>
      <strong>{number.format(value)}</strong>
      <div className="kpi-card__footer"><small>{hint}</small></div>
    </article>
  )
}

const SOCIAL_LABELS: Array<[keyof AmbassadorStat['socials'], string]> = [
  ['github', 'GitHub'],
  ['linkedin', 'LinkedIn'],
  ['x', 'X'],
  ['bluesky', 'Bluesky'],
  ['website', 'Website'],
  ['credly', 'Credly'],
  ['sessionize', 'Sessionize'],
]

function ProfileCard({ ambassador }: { ambassador: AmbassadorStat }) {
  const facts = [
    ambassador.role,
    ambassador.location,
    ambassador.timezone,
    ambassador.pronouns,
    ambassador.joined_at ? `Joined ${formatDate(ambassador.joined_at)}` : null,
  ].filter(Boolean) as string[]
  const links = SOCIAL_LABELS.filter(([key]) => ambassador.socials?.[key])
  const tags = [...ambassador.interests, ...ambassador.languages]
  if (facts.length === 0 && links.length === 0 && tags.length === 0 && !ambassador.bio) return null

  return (
    <div className="profile-card">
      {facts.length > 0 && (
        <ul className="profile-facts">
          {ambassador.role && <li><UsersIcon size={13} />{ambassador.role}</li>}
          {ambassador.location && <li><MapPinIcon size={13} />{ambassador.location}</li>}
          {ambassador.timezone && <li><ClockIcon size={13} />{ambassador.timezone}</li>}
          {ambassador.pronouns && <li>{ambassador.pronouns}</li>}
          {ambassador.joined_at && <li><CalendarIcon size={13} />Joined {formatDate(ambassador.joined_at)}</li>}
        </ul>
      )}
      {ambassador.bio && <p className="profile-bio">{ambassador.bio}</p>}
      {tags.length > 0 && <ul className="profile-tags">{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
      {links.length > 0 && (
        <ul className="profile-links">
          {links.map(([key, label]) => (
            <li key={key}>
              <a href={ambassador.socials[key] as string} target="_blank" rel="noreferrer">
                {key === 'github' ? <GithubIcon size={13} /> : <LinkIcon size={13} />}{label}<ArrowUpRight size={12} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ActivityDistribution({ activities, onSelect }: { activities: ActivityStat[]; onSelect: (activity: ActivityStat) => void }) {
  const max = Math.max(...activities.map((item) => item.contribution_count), 1)
  return (
    <section className="panel activity-panel">
      <div className="panel-heading"><div><span className="eyebrow">Contribution mix</span><h2>Activity by type</h2></div><span className="sort-note">Sorted by activity</span></div>
      <div className="activity-list">
        {activities.map((activity, index) => (
          <button type="button" className="activity-row" key={activity.type} onClick={() => onSelect(activity)} aria-label={`Show all ${activity.label} activities`}>
            <span className="activity-rank">{String(index + 1).padStart(2, '0')}</span>
            <div className="activity-name"><strong>{activity.label}</strong><span>{activity.contribution_count} {activity.contribution_count === 1 ? 'activity' : 'activities'}</span></div>
            <div className="activity-bar"><i style={{ width: `${(activity.contribution_count / max) * 100}%` }} /></div>
            <strong className="activity-points">{activity.approved_points}<small> pts</small><ArrowUpRight size={12} /></strong>
          </button>
        ))}
      </div>
    </section>
  )
}

function MomentumChart({ data }: { data: DashboardData['monthly_activity'] }) {
  const today = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + index, 1))
    const key = date.toISOString().slice(0, 7)
    const match = data.find((item) => item.month === key)
    return { key, date, value: match?.contribution_count ?? 0 }
  })
  const max = Math.max(...months.map((item) => item.value), 1)
  const points = months.map((item, index) => {
    const x = 14 + index * (272 / Math.max(months.length - 1, 1))
    const y = 90 - (item.value / max) * 62
    return `${x},${y}`
  }).join(' ')
  return (
    <section className="panel momentum-panel">
      <div className="panel-heading"><div><span className="eyebrow">Last 6 months</span><h2>Community momentum</h2></div><span className="live-pill"><i /> Approved</span></div>
      <div className="momentum-total"><strong>{months.reduce((sum, item) => sum + item.value, 0)}</strong><span>contributions recorded</span></div>
      <svg className="line-chart" viewBox="0 0 300 108" preserveAspectRatio="none" aria-label="Contribution volume for the last six months" role="img">
        <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6600" stopOpacity=".24"/><stop offset="1" stopColor="#ff6600" stopOpacity="0"/></linearGradient></defs>
        <path d={`M14,96 L${points.replaceAll(' ', ' L')} L286,102 L14,102 Z`} fill="url(#chart-fill)" />
        <polyline points={points} fill="none" stroke="#ff6600" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        {months.map((item, index) => {
          const [cx, cy] = points.split(' ')[index].split(',')
          return <circle key={item.key} cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#ff6600" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        })}
      </svg>
      <div className="chart-labels">{months.map((item) => <span key={item.key}>{monthLabel.format(item.date)}</span>)}</div>
    </section>
  )
}

function ContributionList({ contributions, repository }: { contributions: Contribution[]; repository: string }) {
  return (
    <section className="panel recent-panel">
      <div className="panel-heading"><div><span className="eyebrow">Ledger</span><h2>Recent contributions</h2></div><span className="record-count">{contributions.length} records</span></div>
      {contributions.length === 0 ? <EmptyState title="No matching contributions" body="Try another filter or submit a completed ambassador activity." /> : (
        <div className="contribution-list">
          {contributions.slice(0, 8).map((contribution) => (
            <article className="contribution-row" key={contribution.id}>
              <Avatar username={contribution.ambassador.current_github_username} />
              <div className="contribution-copy">
                <div><strong>{contribution.activity.title}</strong><a href={contribution.activity.evidence_url} target="_blank" rel="noreferrer" aria-label={`Open evidence for ${contribution.activity.title}`}><ArrowUpRight size={15} /></a></div>
                <p><span>@{contribution.ambassador.current_github_username}</span><i />{contribution.activity.label}<i />{formatDate(contribution.activity.date)}</p>
              </div>
              <span className="approved-badge"><CheckIcon size={14} /> Approved</span>
              <strong className="row-points">+{contribution.scoring.points}<small> pts</small></strong>
              {repository && <a className="issue-link" href={`https://github.com/${repository}/issues/${contribution.source_issue}`} target="_blank" rel="noreferrer">#{contribution.source_issue}</a>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function AmbassadorSpotlight({ ambassadors, selected, onSelect, onInspect, contributions }: { ambassadors: AmbassadorStat[]; selected: string; onSelect: (value: string) => void; onInspect: (username: string) => void; contributions: Contribution[] }) {
  const ambassador = ambassadors.find((item) => sameUsername(item.github_username, selected)) ?? ambassadors[0]
  if (!ambassador) return <section className="panel spotlight-panel"><EmptyState title="No ambassadors yet" body="Add active ambassadors to ambassadors/ambassadors.yml." /></section>
  const history = contributions.filter((item) => sameUsername(item.ambassador.current_github_username, ambassador.github_username))
  return (
    <section className="panel spotlight-panel">
      <div className="panel-heading"><div><span className="eyebrow">Member detail</span><h2>Ambassador spotlight</h2></div><label className="select-wrap compact-select"><span className="sr-only">Select ambassador</span><select value={ambassador.github_username} onChange={(event) => onSelect(event.target.value)}>{ambassadors.map((item) => <option key={item.github_username.toLowerCase()} value={item.github_username}>@{item.github_username}</option>)}</select><ChevronDown size={15} /></label></div>
      <div className="profile-head"><Avatar username={ambassador.github_username} size="large" /><div><h3>{ambassador.name || `@${ambassador.github_username}`}</h3><p><GithubIcon size={14} /> @{ambassador.github_username}</p></div><span className={`status-dot status-dot--${ambassador.status}`}><i />{ambassador.status}</span></div>
      <div className="profile-metrics"><div><span>Approved activity</span><strong>{ambassador.contribution_count}</strong></div><div><span>Approved points</span><strong>{ambassador.approved_points}</strong></div><div><span>Types</span><strong>{ambassador.activity_types.length}</strong></div></div>
      <ProfileCard ambassador={ambassador} />
      <div className="mini-history"><span>Latest history</span>{history.slice(0, 3).map((item) => <div key={item.id}><i /><p><strong>{item.activity.label}</strong><small>{formatDate(item.activity.date)}</small></p><b>+{item.scoring.points}</b></div>)}{history.length === 0 && <small>No approved contributions yet.</small>}<button type="button" className="spotlight-view" onClick={() => onInspect(ambassador.github_username)}>View all activity <ArrowUpRight size={13} /></button></div>
    </section>
  )
}

function DetailContributionList({ contributions, repository }: { contributions: Contribution[]; repository: string }) {
  if (contributions.length === 0) return <EmptyState title="No approved activity yet" body="Approved contributions will appear here after their record pull requests are merged." />
  return <div className="detail-contributions">{contributions.map((contribution) => (
    <article key={contribution.id}>
      <div className="detail-contribution__icon"><ActivityIcon size={17} /></div>
      <div><span>{contribution.activity.label} · {formatDate(contribution.activity.date)}</span><h3>{contribution.activity.title}</h3><p>by <strong>@{contribution.ambassador.current_github_username}</strong> · reviewed by @{contribution.scoring.reviewer}</p><small>{contribution.scoring.rationale}</small></div>
      <strong className="detail-score">+{contribution.scoring.points}<small> pts</small></strong>
      <div className="detail-links"><a href={contribution.activity.evidence_url} target="_blank" rel="noreferrer">Evidence <ArrowUpRight size={14} /></a>{repository && <a href={`https://github.com/${repository}/issues/${contribution.source_issue}`} target="_blank" rel="noreferrer">Issue #{contribution.source_issue}</a>}</div>
    </article>
  ))}</div>
}

function DetailDrawer({ title, eyebrow, description, meta, profile, contributions, repository, onClose }: { title: string; eyebrow: string; description: string; meta: React.ReactNode; profile?: AmbassadorStat; contributions: Contribution[]; repository: string; onClose: () => void }) {
  const drawer = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    drawer.current?.focus()
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title} ref={drawer} tabIndex={-1}>
      <header><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><button type="button" onClick={onClose} aria-label="Close details">×</button></header>
      <div className="drawer-meta">{meta}</div>
      {profile && <div className="drawer-profile"><ProfileCard ambassador={profile} /></div>}
      <div className="drawer-section-heading"><span>Complete activity history</span><strong>{contributions.length} {contributions.length === 1 ? 'record' : 'records'}</strong></div>
      <DetailContributionList contributions={contributions} repository={repository} />
    </aside>
  </div>
}

function AmbassadorDirectory({ ambassadors, contributions, onSelect }: { ambassadors: AmbassadorStat[]; contributions: Contribution[]; onSelect: (username: string) => void }) {
  const [query, setQuery] = useState('')
  const [scoreWindow, setScoreWindow] = useState<ScoreWindow>('monthly')
  const ranked = ambassadors
    .map((ambassador) => {
      const history = contributions.filter((item) => sameUsername(item.ambassador.current_github_username, ambassador.github_username))
      const periodHistory = history.filter((item) => isInScoreWindow(item.activity.date, scoreWindow))
      return {
        ...ambassador,
        history,
        periodContributionCount: periodHistory.length,
        periodScore: periodHistory.reduce((sum, item) => sum + item.scoring.points, 0),
      }
    })
    .filter((item) => `${item.name} ${item.github_username}`.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => right.periodScore - left.periodScore || right.periodContributionCount - left.periodContributionCount || left.github_username.localeCompare(right.github_username))

  return (
    <div className="directory-view">
      <div className="directory-heading"><div><span className="eyebrow">Community directory</span><h1>Every ambassador, one clear history.</h1><p>Scores and complete activity histories are grouped by each ambassador’s current GitHub username.</p></div><div className="directory-tools"><label className="search-field"><SearchIcon size={18} /><span className="sr-only">Search ambassadors</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ambassadors" /></label><div className="score-window" aria-label="Sort ambassadors by score period">{(['monthly', 'quarterly', 'yearly'] as ScoreWindow[]).map((window) => <button type="button" className={scoreWindow === window ? 'active' : ''} onClick={() => setScoreWindow(window)} key={window}>{window[0].toUpperCase() + window.slice(1)}</button>)}</div></div></div>
      <div className="directory-sort-caption"><span>Ranked by approved score</span><strong>{scoreWindowLabel(scoreWindow)}</strong></div>
      <div className="directory-grid">
        {ranked.map((ambassador, index) => {
          const latest = ambassador.history[0]
          return <article className="member-card" key={ambassador.github_username.toLowerCase()} role="button" tabIndex={0} onClick={() => onSelect(ambassador.github_username)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(ambassador.github_username) } }}><span className="member-rank">{String(index + 1).padStart(2, '0')}</span><Avatar username={ambassador.github_username} size="large" /><h2>{ambassador.name || `@${ambassador.github_username}`}</h2><p><span className={`status-dot status-dot--${ambassador.status}`}><i />{ambassador.status}</span> · @{ambassador.github_username}</p>{(ambassador.role || ambassador.location) && <p className="member-role">{[ambassador.role, ambassador.location].filter(Boolean).join(' · ')}</p>}<div className="member-stats"><span><strong>{ambassador.periodContributionCount}</strong> {scoreWindowLabel(scoreWindow).toLowerCase()} activities</span><span><strong>{ambassador.periodScore}</strong> approved points</span></div><footer>{latest ? <><span>Latest</span><strong>{latest.activity.label}</strong><small>{formatDate(latest.activity.date)}</small></> : <small>Ready for a first contribution</small>}<b>View all <ArrowUpRight size={13} /></b></footer></article>
        })}
      </div>
      {ranked.length === 0 && <EmptyState title="No ambassador found" body="Try searching with another GitHub username." />}
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('overview')
  const [period, setPeriod] = useState<Period>('all')
  const [selectedAmbassador, setSelectedAmbassador] = useState('')
  const [detailAmbassador, setDetailAmbassador] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<ActivityStat | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/dashboard.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Dashboard data could not be loaded.')
        return response.json()
      })
      .then((payload: DashboardData) => {
        setData(payload)
        setSelectedAmbassador(payload.ambassadors[0]?.github_username ?? '')
      })
      .catch((reason: Error) => setError(reason.message))
  }, [])

  const years = useMemo(() => data ? [...new Set(data.contributions.map((item) => item.activity.date.slice(0, 4)))].sort().reverse() : [], [data])
  const contributions = useMemo(() => {
    if (!data) return []
    return period === 'all' ? data.contributions : data.contributions.filter((item) => item.activity.date.startsWith(period))
  }, [data, period])

  const activityStats = useMemo(() => {
    if (!data || period === 'all') return data?.activity_types ?? []
    return data.activity_types.map((activity) => {
      const matching = contributions.filter((item) => item.activity.type === activity.type)
      return { ...activity, contribution_count: matching.length, approved_points: matching.reduce((sum, item) => sum + item.scoring.points, 0) }
    }).sort((a, b) => b.contribution_count - a.contribution_count || b.approved_points - a.approved_points || a.label.localeCompare(b.label))
  }, [data, contributions, period])

  if (error) return <main className="load-screen"><BrandMark /><h1>Dashboard unavailable</h1><p>{error}</p></main>
  if (!data) return <main className="load-screen"><BrandMark /><div className="loader" /><p>Loading community activity…</p></main>

  const approvedPoints = contributions.reduce((sum, item) => sum + item.scoring.points, 0)
  const contributorCount = new Set(contributions.map((item) => item.ambassador.current_github_username.toLowerCase())).size
  const issueUrl = data.repository ? `https://github.com/${data.repository}/issues/new?template=contribution.yml` : 'https://github.com/'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><BrandMark /><span><strong>vCluster</strong><small>ambassadors</small></span></div>
        <nav aria-label="Dashboard navigation">
          <span className="nav-label">Workspace</span>
          <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}><GridIcon />Overview</button>
          <button className={view === 'ambassadors' ? 'active' : ''} onClick={() => setView('ambassadors')}><UsersIcon />Ambassadors<span>{data.ambassadors.length}</span></button>
          <a href={issueUrl} target="_blank" rel="noreferrer"><ActivityIcon />Submit activity<ArrowUpRight size={15} /></a>
        </nav>
        <div className="sidebar-pulse"><span><i />Program pulse</span><strong>{data.summary.contribution_count}</strong><p>approved activities in the central ledger</p><small>{number.format(data.summary.approved_points)} approved points</small></div>
        <footer><a href="https://www.vcluster.com/" target="_blank" rel="noreferrer">vcluster.com <ArrowUpRight size={14} /></a><span>Community edition</span></footer>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-brand" onClick={() => setView('overview')} aria-label="Go to overview"><BrandMark /></button><div className="breadcrumb"><span>Community</span><i>/</i><strong>{view === 'overview' ? 'Overview' : 'Ambassadors'}</strong></div><div className="topbar-actions"><span className="sync-status"><i /><span>Ledger synced</span></span><a className="github-button" href={data.repository ? `https://github.com/${data.repository}` : 'https://github.com/'} target="_blank" rel="noreferrer"><GithubIcon size={18} /><span>View source</span></a></div></header>

        {view === 'overview' ? <>
          <div className="hero-row"><div><span className="eyebrow">Community intelligence</span><h1>Ambassador pulse<span>.</span></h1><p>A clear view of verified, maintainer-approved community impact.</p></div><div className="hero-actions"><label className="select-wrap"><CalendarIcon size={17} /><span className="sr-only">Filter by year</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">All time</option>{years.map((year) => <option value={year} key={year}>{year}</option>)}</select><ChevronDown size={16} /></label><a className="primary-button" href={issueUrl} target="_blank" rel="noreferrer">Submit activity <ArrowUpRight size={17} /></a></div></div>

          <section className="kpi-grid">
            <KpiCard tone="lime" icon={<ActivityIcon />} label="Total activity" value={contributions.length} hint="Maintainer-approved records" />
            <KpiCard tone="mint" icon={<UsersIcon />} label="Contributors" value={contributorCount} hint={`${data.summary.active_ambassadors} active in registry`} />
            <KpiCard tone="lavender" icon={<CheckIcon />} label="Approved points" value={approvedPoints} hint="Human-assigned values only" />
            <KpiCard tone="orange" icon={<GridIcon />} label="Activity types" value={activityStats.filter((item) => item.contribution_count > 0).length} hint={`${activityStats.length} approved types`} />
          </section>

          <div className="dashboard-grid"><ActivityDistribution activities={activityStats} onSelect={setSelectedActivity} /><MomentumChart data={data.monthly_activity} /><ContributionList contributions={contributions} repository={data.repository} /><AmbassadorSpotlight ambassadors={data.ambassadors} selected={selectedAmbassador} onSelect={setSelectedAmbassador} onInspect={setDetailAmbassador} contributions={contributions} /></div>
        </> : <AmbassadorDirectory ambassadors={data.ambassadors} contributions={data.contributions} onSelect={setDetailAmbassador} />}

        <footer className="page-footer"><span>Updated {new Date(data.generated_at).toLocaleString()}</span><span>Activity grouped by current GitHub username</span></footer>
      </main>

      {selectedActivity && <DetailDrawer
        eyebrow="Activity type"
        title={selectedActivity.label}
        description="Every approved contribution recorded for this activity type."
        meta={<><span><strong>{data.contributions.filter((item) => item.activity.type === selectedActivity.type).length}</strong> activities</span><span><strong>{data.contributions.filter((item) => item.activity.type === selectedActivity.type).reduce((sum, item) => sum + item.scoring.points, 0)}</strong> approved points</span></>}
        contributions={data.contributions.filter((item) => item.activity.type === selectedActivity.type)}
        repository={data.repository}
        onClose={() => setSelectedActivity(null)}
      />}

      {detailAmbassador && <DetailDrawer
        eyebrow="Ambassador activity"
        title={`@${detailAmbassador}`}
        description="Complete approved contribution history for this GitHub username."
        meta={<><span><strong>{data.contributions.filter((item) => sameUsername(item.ambassador.current_github_username, detailAmbassador)).length}</strong> activities</span><span><strong>{data.contributions.filter((item) => sameUsername(item.ambassador.current_github_username, detailAmbassador)).reduce((sum, item) => sum + item.scoring.points, 0)}</strong> approved points</span></>}
        profile={data.ambassadors.find((item) => sameUsername(item.github_username, detailAmbassador))}
        contributions={data.contributions.filter((item) => sameUsername(item.ambassador.current_github_username, detailAmbassador))}
        repository={data.repository}
        onClose={() => setDetailAmbassador('')}
      />}
    </div>
  )
}
