# Ambassador onboarding

Welcome to the vCluster Ambassador Program. This guide explains how to add your profile to the ambassador directory and how to submit completed activities for credit.

## Add yourself to the ambassador directory

Program membership is approved by a vCluster program maintainer. Adding a profile through a pull request does not grant membership by itself, so confirm that you have been accepted before submitting your profile.

1. Fork this repository and create a branch for your profile.
2. Add a new entry under `ambassadors` in [`ambassadors/ambassadors.yml`](ambassadors/ambassadors.yml).
3. Set `github_user_id` to `null`. After the profile is merged, automation resolves the immutable numeric ID from your username. Do not enter the ID manually.
4. Open a pull request with your profile change. A maintainer will review the membership and profile before it is merged.

Use this profile template and replace every example value with your information:

```yaml
  - name: Your Name
    github_username: your-github-username
    github_user_id: null # Managed by automation
    status: active
    joined_at: 2026-09-02 # YYYY-MM-DD
    role: Your role or title
    location: City, Country
    timezone: Region/City
    pronouns: null
    bio: A short public biography.
    interests:
      - Kubernetes
      - Platform engineering
    languages:
      - English
    socials:
      github: https://github.com/your-github-username
      linkedin: null
      x: null
      bluesky: null
      website: null
      credly: null
      sessionize: null
```

The required profile fields are `name`, `github_username`, `github_user_id`, `status`, `joined_at`, and the `socials` object. New profiles must include `github_user_id: null`; automation replaces it with the resolved numeric ID after registration. Use `null` for another optional value you do not want to provide and `[]` for an empty list. All profile information is public on the ambassador dashboard, so include only details you are comfortable sharing.

Do not change `github_user_id` after registration; automation owns that field. Membership status changes (`active`, `inactive`, or `alumni`) also require maintainer approval.

## Submit an activity

You must be registered as an active ambassador before submitting an activity. Submit only completed or published work, and create one issue per activity.

1. Open the [Ambassador contribution form](https://github.com/vClusterLabs-Experiments/ambassadors/issues/new?template=contribution.yml).
2. Enter your registered GitHub username without the `@` symbol.
3. Choose the contribution type that best matches the work.
4. Enter the completion or publication date in `YYYY-MM-DD` format.
5. Add a public HTTPS evidence URL that a reviewer can open.
6. Summarize what you completed, who it was for, and how it helped the community.
7. Review the details and submit the issue.

Good evidence should clearly show what was delivered and when. Do not expose private conversations or personal information. For work done in a private community, provide a reviewer-accessible link or a privacy-safe artifact that demonstrates the activity.

Available contribution types and reviewer guidance are listed in [`config/activity-types.yml`](config/activity-types.yml). Do not request or calculate points in your submission; an authorized maintainer reviews the evidence and decides the approved point value.

Do not edit [`contributions/contributions.yml`](contributions/contributions.yml) yourself. After a maintainer approves the issue, automation opens a contribution-record pull request. Once that pull request is merged, the activity appears in the central record and on the dashboard.

### Track your submission

| Issue status | What it means | What you need to do |
| --- | --- | --- |
| `status:needs-information` | Information is missing or invalid. | Read the validation comment and edit the original issue. |
| `status:needs-review` | Automated validation passed. | Wait for a maintainer to review the activity. |
| `status:pr-open` | The activity was approved and its record pull request is open. | No action is normally required. |
| `status:credited` | The record pull request was merged. | The activity is finalized and credited. |

If validation flags a possible duplicate, a maintainer will check it. Evidence that has already been credited cannot be used for another activity record.

For questions about registration, eligibility, or evidence, contact a program maintainer or comment on the relevant contribution issue.
