#!/usr/bin/env bash
# Build unsigned debug APK for CI or local smoke testing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build:mobile

cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon

APK="app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK" ]]; then
  echo "Expected APK at android/$APK" >&2
  exit 1
fi

echo "Built android/$APK"
