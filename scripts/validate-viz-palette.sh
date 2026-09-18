#!/usr/bin/env bash
#
# Re-checks the chart palette in src/app/globals.css against the surfaces it is
# actually drawn on, using the dataviz skill's validator. Run this after changing
# any --viz-* token; eyeballing colourblind-safety does not work.
#
set -euo pipefail

SKILL="${DATAVIZ_SKILL:-/private/tmp/claude-502/bundled-skills/2.1.270/613b3f4fbb0c4b397b3740ad146f5da0/dataviz}"
VALIDATOR="${SKILL}/scripts/validate_palette.js"

if [ ! -f "${VALIDATOR}" ]; then
  echo "dataviz validator not found at ${VALIDATOR}" >&2
  echo "Set DATAVIZ_SKILL to the skill directory and re-run." >&2
  exit 1
fi

# Card surfaces, converted from the OKLCH tokens in globals.css.
LIGHT_SURFACE="#ffffff"
DARK_SURFACE="#111924"

echo "▸ categorical series, light"
node "${VALIDATOR}" "#2a78d6,#eb6834" --mode light --surface "${LIGHT_SURFACE}"

echo "▸ categorical series, dark"
node "${VALIDATOR}" "#3987e5,#d95926" --mode dark --surface "${DARK_SURFACE}"

echo "▸ ordinal ramp, light"
node "${VALIDATOR}" "#86b6ef,#5598e7,#2a78d6,#1c5cab" --mode light --surface "${LIGHT_SURFACE}" --ordinal

echo "▸ ordinal ramp, dark"
node "${VALIDATOR}" "#b7d3f6,#86b6ef,#3987e5,#184f95" --mode dark --surface "${DARK_SURFACE}" --ordinal
