# TurkuCityTour — Mobile (Capacitor)

Native Android/iOS builds wrap the Vite `dist/` output in a Capacitor WebView. The web app and Supabase backend stay unchanged.

## Build commands

```bash
npm run build:mobile    # VITE_ENABLE_ADMIN=false, VITE_MOBILE_BUILD=true, cap sync
npm run cap:ios         # Open Xcode
npm run cap:android     # Open Android Studio
npm run test:e2e:mobile # Playwright Pixel 7 smoke (web, pre-native)
```

Live reload against the Vite dev server:

```bash
npm run dev -- --host 0.0.0.0
# In capacitor.config.ts, uncomment server.url to your LAN IP, then:
npx cap run ios --livereload --external
```

## Environment flags

| Variable | Default | Mobile build |
|----------|---------|--------------|
| `VITE_ENABLE_ADMIN` | `true` | `false` — drops `/admin` and `/results` routes and lazy-loads no admin code |
| `VITE_MOBILE_BUILD` | `false` | `true` — switches to `HashRouter` for Capacitor deep links |

## Required native permissions

### iOS (`ios/App/App/Info.plist`)

| Key | Purpose |
|-----|---------|
| `NSLocationWhenInUseUsageDescription` | GPS for map gameplay and proximity triggers (≤50 m) |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | Only if background location is added in Phase 2+ |

Suggested copy (English): *TurkuCityTour uses your location to show your position on the map and detect when you arrive at tour stops.*

Suggested copy (Finnish): *TurkuCityTour käyttää sijaintiasi näyttääkseen sijaintisi kartalla ja havaitakseen saapumisesi kierroksen kohteisiin.*

Optional (Phase 2+):

| Key | Purpose |
|-----|---------|
| `NSCameraUsageDescription` | Profile photos via `@capacitor/camera` |
| `NSPhotoLibraryUsageDescription` | Pick existing photos |

### Android (`android/app/src/main/AndroidManifest.xml`)

| Permission | Purpose |
|------------|---------|
| `ACCESS_FINE_LOCATION` | GPS for map and arrival detection |
| `ACCESS_COARSE_LOCATION` | Fallback when fine location unavailable |
| `INTERNET` | Supabase API and map tiles (added by Capacitor) |

Optional foreground service permission only if background location is implemented later.

## Mobile UI (Phase 0)

- Viewport: `viewport-fit=cover` for notched devices
- Safe areas: `env(safe-area-inset-*)` via `.page-safe-area` and `.map-mobile-height` (`dvh`-based map height)
- Baseline tested at **390×844** (iPhone 14 / similar) in Playwright `mobile-chrome`

## Store compliance (Phase 5)

- Declare **location when in use** in App Store privacy labels and Play Data safety
- In-app privacy policy at `/privacy` (link from login)
- Store copy templates: `docs/store/app-store-metadata.md`, `docs/store/play-store-metadata.md`
- TestFlight / release checklist: `docs/store/TESTFLIGHT_CHECKLIST.md`
- Signing secrets: `docs/store/SIGNING.md`

## Roadmap

| Phase | Status |
|-------|--------|
| 0–1 | Capacitor shell, HashRouter, admin flag, safe-area CSS |
| 2 | `@capacitor/geolocation`, lifecycle plugins, native permissions |
| 3 | Map gesture lock, asset prefetch, offline banner, walk-test doc |
| 4 | `mobile-android.yml`, `mobile-ios.yml`, build scripts |
| 5 | Privacy page, store metadata templates, submission checklist |
| 6+ | Offline cache, push, deep links (post-launch) |

### CI workflows

| Workflow | Artifact |
|----------|----------|
| `mobile-android.yml` | Debug APK; signed AAB when `ANDROID_SIGNING_ENABLED=true` |
| `mobile-ios.yml` | Unsigned Simulator `.app` |

### App icons (Phase 1)

Default Capacitor launcher icons ship with `ios/` and `android/`. To replace them, add `resources/icon.png` (1024×1024) and `resources/splash.png`, then run:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
npm run build:mobile
```
