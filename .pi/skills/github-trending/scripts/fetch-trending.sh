#!/usr/bin/env bash
# Fetch GitHub trending repos via Search API
set -euo pipefail

PERIOD="${1:-weekly}"
case "$PERIOD" in
  daily|weekly|monthly) ;;
  *) PERIOD="weekly" ;;
esac

DIR="$(cd "$(dirname "$0")" && pwd)"
exec py -3 "$DIR/fetch-trending.py" "$PERIOD"
