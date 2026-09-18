#!/usr/bin/env bash
#
# Build and deploy MarineLink's static export to Catalyst Slate.
#
# Slate hosts a directory of files with no server, matches request paths
# exactly, and serves the HTML document with `cache-control: max-age=31536000`.
# Three things follow, and this script handles all three:
#
#   1. `.catalyst/slate-config.toml` lives *inside* the output directory, so a
#      clean build deletes it. It is rewritten on every run.
#   2. A returning visitor can hold a year-old `index.html` referencing
#      `_next/static` chunks a later build no longer emits. Every release's
#      chunks are archived and merged forward so those documents keep working.
#   3. That stale document needs a way to notice it is stale — `version.json` is
#      what the inline bootstrap script in `src/app/layout.tsx` polls.
#
set -euo pipefail
cd "$(dirname "$0")/.."

APP_NAME="marinelink"
ARCHIVE=".slate-static-archive"
RELEASE="$(date -u +%Y%m%d-%H%M%S)"

echo "▸ release ${RELEASE}"

# The document bakes this in; version.json below advertises it.
export NEXT_PUBLIC_RELEASE="${RELEASE}"
# Turns on the deep-link parking that Slate's root-document fallback requires.
export NEXT_PUBLIC_SLATE_FALLBACK="1"

rm -rf out .next
npm run build

# What the stale-document check fetches. The bootstrap script cache-busts it
# with a query string, so it must not be long-cached itself.
printf '{"release":"%s"}\n' "${RELEASE}" > out/version.json

# Recreated every run — the clean build above deletes it.
mkdir -p out/.catalyst
printf 'framework = "static"\ndeployment_name = "default"\n' > out/.catalyst/slate-config.toml

# Merge previously shipped chunks in *without* clobbering this build's files,
# then fold this build's chunks into the archive for the next release.
mkdir -p "${ARCHIVE}"
if [ -n "$(ls -A "${ARCHIVE}" 2>/dev/null)" ]; then
  cp -Rn "${ARCHIVE}/." out/_next/static/ 2>/dev/null || true
  echo "▸ carried forward $(find "${ARCHIVE}" -type f | wc -l | tr -d ' ') archived chunk files"
fi
cp -R out/_next/static/. "${ARCHIVE}/"

echo "▸ uploading $(find out -type f | wc -l | tr -d ' ') files ($(du -sh out | cut -f1))"

# The CLI can report a failed deploy on stdout while still exiting 0, so the
# output is inspected rather than trusted to the exit status.
DEPLOY_LOG="$(mktemp)"
catalyst deploy slate "${APP_NAME}" -m "release ${RELEASE}" -ni 2>&1 | tee "${DEPLOY_LOG}"

if grep -qiE "deploy failed|HTTP Error" "${DEPLOY_LOG}"; then
  echo "▸ deploy FAILED for release ${RELEASE}" >&2
  rm -f "${DEPLOY_LOG}"
  exit 1
fi
rm -f "${DEPLOY_LOG}"

echo "▸ deployed release ${RELEASE}"
