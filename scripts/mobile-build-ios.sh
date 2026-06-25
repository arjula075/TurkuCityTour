#!/usr/bin/env bash
# Build iOS app for Simulator (no code signing) — used in CI on macos-latest.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build:mobile

cd ios/App

xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  build

echo "iOS Simulator build succeeded (derived data: ios/App/build)"
