# TurkuCityTour — GPS walk test checklist (Phase 3)

Manual verification in Turku city centre before store submission. Run on a **physical device** with the mobile build (`npm run build:mobile` → Xcode / Android Studio).

## Setup

1. Assign yourself to a test game with 2–3 stops near Turku Cathedral / Market Square.
2. Install the debug build on iPhone and one Android phone.
3. Enable location permission **While Using the App**.
4. Disable Wi‑Fi; use cellular to mimic tourist conditions.

## Scenarios

| # | Action | Expected |
|---|--------|----------|
| 1 | Open app → login → map | Blue dot near your real position within ~20 m |
| 2 | Start game, read hints | Map does not zoom when scrolling hints |
| 3 | Walk toward stop (≤50 m) | Arrival detected; question appears |
| 4 | Answer question → next stop | Progress saved (check after force-quit and reopen) |
| 5 | Toggle airplane mode mid-game | Offline banner appears; no crash |
| 6 | Restore network, submit answer | Answer saves successfully |
| 7 | Background app 30 s, return | GPS refreshes; distance updates |
| 8 | Kill app on `/map`, reopen | Hash route resumes map (logged in) |

## Edge cases

- **Urban canyon** (tall buildings): note if distance jumps &gt;100 m; retry after 10 s.
- **Denied location**: app shows Turku fallback; gameplay should prompt to enable GPS in Settings.
- **Low battery / power saving**: confirm polling still updates within 15 s while game active.

## Sign-off

| Tester | Device | Date | Pass / issues |
|--------|--------|------|---------------|
| | | | |
