# TestFlight beta and v1.0 submission checklist

Manual steps after CI produces installable builds. See `SIGNING.md` for secrets.

## TestFlight beta (5–10 walkers in Turku)

1. Configure iOS signing secrets in GitHub (or archive locally in Xcode with your team).
2. Build release: `npm run build:mobile` → Xcode → Product → Archive.
3. Upload to App Store Connect → TestFlight.
4. Add internal testers (team) then external group "Turku Walkers".
5. Share `docs/MOBILE_WALK_TEST.md` with testers; collect feedback in a shared doc.
6. Fix GPS edge cases before production submission.

## Play internal track

1. Upload signed AAB from CI artifact or `./scripts/mobile-build-android.sh` + manual sign.
2. Play Console → Internal testing → add tester emails.
3. Same walk test checklist as iOS.

## v1.0.0 scope

**In scope (mobile app):**

- Login / register (if enabled for your deployment)
- Map gameplay, hints, arrival, questions
- Game completion gallery
- Privacy policy (`/privacy`)

**Out of scope (web only):**

- Admin panel (`/admin`)
- Results dashboard (`/results`)

## Pre-submission checklist

- [ ] Privacy policy URL live and linked from login
- [ ] App Store / Play privacy labels match `app-store-metadata.md` and `play-store-metadata.md`
- [ ] Location permission strings in `Info.plist` and Android manifest
- [ ] Review demo account assigned to a test game
- [ ] Screenshots for required device sizes
- [ ] Version `1.0.0` / `versionCode 1` in native projects
- [ ] Walk test sign-off (`docs/MOBILE_WALK_TEST.md`)

## App Review reply template

> TurkuCityTour is a walking tour game. Location is required to show the player on the map and detect arrival at stops within 50 metres. Please log in with the provided test account and tap "Start Game" on the map screen.
