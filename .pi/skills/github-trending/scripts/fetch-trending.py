#!/usr/bin/env python3
"""Fetch GitHub trending repos via Search API."""

import json, sys, os, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import URLError

API = "https://api.github.com/search/repositories?q=created:>={date}&sort=stars&order=desc&per_page=30"

def fetch(period="weekly"):
    days = {"daily": 1, "weekly": 7, "monthly": 30}
    since = (datetime.utcnow() - timedelta(days=days.get(period, 7))).strftime("%Y-%m-%d")
    url = API.format(date=since)
    req = Request(url, headers={"Accept": "application/vnd.github.v3+json", "User-Agent": "github-trending-skill"})
    try:
        data = json.loads(urlopen(req).read())
    except URLError as e:
        print(f"Error: {e}")
        sys.exit(1)
    return data.get("items", [])

def main():
    period = sys.argv[1] if len(sys.argv) > 1 else "weekly"
    repos = fetch(period)
    total = len(repos)
    print(f"# GitHub Trending — This {period.capitalize()}\n")
    print(f"_{total} repos since {datetime.utcnow().strftime('%Y-%m-%d')}_\n")
    for i, r in enumerate(repos[:30], 1):
        name = r["full_name"]
        stars = r["stargazers_count"]
        desc = (r.get("description") or "").strip()
        lang = r.get("language") or ""
        fork = " 🔀" if r.get("fork") else ""
        print(f"{i}. **{name}** ⭐{stars}{fork}")
        if lang:
            print(f"   🛠 {lang}")
        if desc:
            print(f"   {desc}")
        print()

if __name__ == "__main__":
    main()
