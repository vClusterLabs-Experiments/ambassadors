<p align="center">
  <a href="https://www.vcluster.com/">
    <img src="https://cdn.prod.website-files.com/68994d4ecac027f80ff70510/6949ddcb39ae0f3463132a2a_vCluster.png" alt="vCluster" width="180">
  </a>
</p>

<h1 align="center">vCluster Ambassador Program</h1>

<p align="center">
  A community of practitioners who teach, build, organize, and help others succeed with tenant clusters and cloud-native platforms.
</p>

## Welcome, ambassadors

The vCluster Ambassador Program recognizes meaningful community work: sharing technical knowledge, helping other practitioners, speaking and teaching, organizing events, and contributing to projects.

This repository is the home of the ambassador directory and the approved activity record. Active ambassadors use the GitHub Issue Form to submit completed work for review. Every submission is checked for completeness and identity, then reviewed by an authorized maintainer.

> Automation never calculates, estimates, suggests, or recommends contribution points. Only an authorized maintainer can review the evidence and approve points.

The values and ranges in [config/activity-types.yml](config/activity-types.yml) are reference guidance only. A maintainer may approve a different positive whole-number value, and the value in the `/approve` command is the source of truth.

## Submit an activity

1. Open the [Ambassador contribution form](https://github.com/vClusterLabs-Experiments/ambassadors/issues/new?template=contribution.yml).
2. Enter your current GitHub username without the `@` symbol.
3. Select the contribution type that best describes the completed work.
4. Add the completion or publication date in `YYYY-MM-DD` format.
5. Provide a public HTTPS evidence URL that a reviewer can open.
6. Summarize the contribution and who it was for.
7. Review the information and submit the issue.

Submit one completed activity per issue. Good evidence should let a reviewer understand what was delivered, when it was completed, and how it benefited the community.

### What you will need

- Your registered GitHub username
- Contribution type
- Completion or publication date
- Public evidence URL
- Contribution summary

The available contribution types include social threads, community help, blog posts, technical videos, tutorials, meetup and conference talks, podcast appearances, livestreams, meetup organization, workshops, courses, and project contributions. The approved program policy is maintained in [config/activity-types.yml](config/activity-types.yml).

## What happens after submission

```text
Issue submission
      ↓
Required fields, GitHub identity, evidence, date, and duplicates validated
      ↓
status:needs-review
      ↓
Human review and maintainer approval
      ↓
Automatic contribution pull request
      ↓
Merge into the central YAML record
      ↓
GitHub Pages dashboard rebuild
```

If information is missing or invalid, the issue receives `status:needs-information` and a comment explaining what to update. Edit the original issue; validation runs again automatically.

A possible duplicate is flagged for a maintainer to review. Evidence that has already been credited cannot create another contribution record.

## GitHub identity: username in, registered ID matched automatically

You only provide your GitHub username. You do **not** enter a numeric GitHub user ID.

When an activity is submitted, automation resolves the username through the GitHub API and matches it to the ID already stored in the ambassador registry. Approved contribution records store both:

- the current `github_username`, used to group and display ambassador activity; and
- the immutable numeric `github_user_id`, used internally to verify identity and safely follow username changes.

When registering an ambassador, a maintainer resolves and records the numeric ID once. Registry validation requires a positive integer and rejects duplicate usernames or IDs; no scheduled workflow rewrites ambassador identities.

## Review statuses

| Status | Meaning |
| --- | --- |
| `status:needs-information` | Required or valid information is missing; edit the issue to continue. |
| `status:needs-review` | Validation passed and the submission is waiting for a human reviewer. |
| `status:pr-open` | A maintainer approved the activity and its record pull request is open. |
| `status:credited` | The record pull request merged and the contribution is final in the central record. |

The record pull request itself carries `contribution-record` and `status:approved`, and a submission whose evidence may already be credited also carries `possible-duplicate` for a maintainer to check.

## Ambassador directory

Registered ambassador profiles live in [ambassadors/ambassadors.yml](ambassadors/ambassadors.yml). A profile can contain:

- display name and current GitHub username;
- maintainer-resolved GitHub user ID;
- program status and joining date;
- role, location, timezone, pronouns, and short bio;
- interests and languages; and
- GitHub, LinkedIn, X, Bluesky, and website links.

Ambassadors may propose updates to their public profile details through a pull request. The immutable `github_user_id` should only change when a maintainer corrects a registration error. New program membership and status changes require maintainer approval.

## Dashboard

The [Ambassador activity dashboard](https://vclusterlabs-experiments.github.io/ambassadors/) shows merged, maintainer-approved activity only. It includes:

- total ambassador activity;
- activity grouped by contribution type;
- complete activity history for each type;
- ambassador profiles, including role, location, timezone, pronouns, bio, interests, languages, and public links; and
- monthly, quarterly, and yearly ambassador rankings based on approved records.

The dashboard groups history by the ambassador's current GitHub username and displays that username publicly.

## Frequently asked questions

### Do I choose or request points?

No. Submit accurate activity details and evidence only. An authorized maintainer makes the scoring decision after reviewing the submission.

### Do I need to find my numeric GitHub ID?

No. Enter only your current GitHub username. Submission validation resolves it and checks it against the immutable numeric ID already registered by a maintainer.

### Can I submit work that is still in progress?

Submit after the activity is completed or published and evidence is available.

### Can one evidence URL be credited more than once?

No. The workflow checks the central record and other validated issues for duplicate evidence.

### What if I change my GitHub username?

Ask a program maintainer to update your username and GitHub profile link in the registry. Your immutable GitHub user ID stays the same, keeping your activity history together.

### Why is my submission asking for more information?

Read the validation comment, edit the original issue with the requested details, and save it. You do not need to open another issue.

## For program maintainers

Maintainers register ambassadors in [ambassadors/ambassadors.yml](ambassadors/ambassadors.yml), authorize reviewers in [config/reviewers.yml](config/reviewers.yml), and manage program policy in [config](config). To add an ambassador, resolve their GitHub account through the GitHub API and enter the returned positive integer as `github_user_id`. This is a one-time registration step; do not leave the field `null`.

An authorized reviewer approves a validated issue with:

```text
/approve points=20 note="Published a complete technical tutorial with reproducible examples"
```

The workflow verifies the reviewer, identity, contribution type, approved value, note, source issue, evidence, and date before it can open a contribution record pull request. The contribution type always comes from the original issue submission, and the prepared record is validated in the same workflow run, because pull requests opened by automation do not start a separate check.

Approved records are stored in [contributions/contributions.yml](contributions/contributions.yml), then GitHub Actions rebuilds the dashboard for GitHub Pages. Point values and ranges in [config/activity-types.yml](config/activity-types.yml) are reviewer references, not enforced limits; the authorized maintainer's `/approve` command determines the recorded score. The program has no monthly or quarterly point baseline.

## Community conduct

Be accurate, respectful, and transparent in every submission. Do not expose private community conversations or personal information as evidence. When evidence comes from a private community, provide a reviewer-accessible link or a privacy-safe artifact that demonstrates the contribution.

Questions about eligibility, evidence, or an existing submission should be discussed on the relevant GitHub issue with the program maintainers.

---

The dashboard and workflow source are available in this repository under the [Apache License 2.0](LICENSE).
