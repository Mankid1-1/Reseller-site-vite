#!/usr/bin/env sh
set -eu
for i in $(seq 1 120); do
  curl -fsS http://127.0.0.1:8787/api/health >/dev/null 2>&1 && { echo 127.0.0.1; exit 0; }
  curl -fsS http://[::1]:8787/api/health     >/dev/null 2>&1 && { echo [::1]; exit 0; }
  sleep 0.25
done
echo "backend not reachable" >&2
exit 1
