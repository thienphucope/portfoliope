---
name: github-trending
description: Fetch GitHub trending repositories for daily, weekly, or monthly periods. Shows top 30 repos by stars with language and description.
---

# GitHub Trending

Fetch trending repos from GitHub.

## Usage

```bash
cd .pi/skills/github-trending  # from project root
./scripts/fetch-trending.sh          # weekly (default)
./scripts/fetch-trending.sh daily    # today
./scripts/fetch-trending.sh monthly  # this month
```

## Output

Markdown list of trending repos ⭐ + language + description.

## Register as Command

Add to `.pi/settings.json`:
```json
{
  "enableSkillCommands": true
}
```

Then use `/skill:github-trending weekly`.
