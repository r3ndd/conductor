#!/usr/bin/env bash
set -euo pipefail

mkdir -p "${HOME}/.config/opencode"
mkdir -p "${HOME}/.cache/opencode"

if [ ! -f "${HOME}/.config/opencode/opencode.json" ] || [ "${CONDUCTOR_FORCE_CONFIG_SYNC:-0}" = "1" ]; then
  if [ -f "/workspace/docker/opencode.json" ]; then
    cp -f "/workspace/docker/opencode.json" "${HOME}/.config/opencode/opencode.json"
  fi
fi

if [ -n "${OPENAI_API_KEY:-}" ]; then
  export OPENAI_API_KEY
fi

exec "$@"
