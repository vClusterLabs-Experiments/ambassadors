const API = 'https://api.github.com'

export function createGitHubClient({ token, repository }) {
  if (!token) throw new Error('GH_TOKEN is required')
  if (!repository?.includes('/')) throw new Error('GITHUB_REPOSITORY must be owner/repository')

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'vcluster-ambassador-automation',
        ...options.headers,
      },
    })
    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    if (!response.ok) {
      const error = new Error(data?.message || `GitHub API request failed (${response.status})`)
      error.status = response.status
      throw error
    }
    return data
  }

  const repoPath = `/repos/${repository}`
  // Duplicate detection has to read every submission, so this pages past the first 100 issues.
  const listAllIssues = async () => {
    const all = []
    for (let page = 1; page <= 20; page += 1) {
      const batch = await request(`${repoPath}/issues?state=all&per_page=100&page=${page}&sort=created&direction=desc`)
      all.push(...batch)
      if (batch.length < 100) break
    }
    return all
  }

  return {
    request,
    resolveUser: (username) => request(`/users/${encodeURIComponent(username)}`),
    resolveUserId: (id) => request(`/user/${encodeURIComponent(id)}`),
    updateIssue: (number, body) => request(`${repoPath}/issues/${number}`, { method: 'PATCH', body: JSON.stringify(body) }),
    listLabels: () => request(`${repoPath}/labels?per_page=100`),
    createLabel: (label) => request(`${repoPath}/labels`, { method: 'POST', body: JSON.stringify(label) }),
    listIssueComments: (number) => request(`${repoPath}/issues/${number}/comments?per_page=100`),
    createIssueComment: (number, body) => request(`${repoPath}/issues/${number}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    updateIssueComment: (commentId, body) => request(`${repoPath}/issues/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
    listIssues: listAllIssues,
  }
}
