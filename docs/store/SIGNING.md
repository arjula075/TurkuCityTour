# Mobile signing secrets (GitHub Actions)

Never commit keystores, `.p12`, or provisioning profiles. Store them as **GitHub Actions secrets** (Settings → Secrets and variables → Actions).

## Android (Play Store / internal track)

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release `.jks` or `.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | Key password (often same as keystore password) |

Generate a keystore locally (one-time):

```bash
keytool -genkey -v -keystore turkucitytour-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias turkucitytour
base64 -i turkucitytour-release.jks | pbcopy   # paste into ANDROID_KEYSTORE_BASE64
```

Set `ANDROID_SIGNING_ENABLED=true` as a **repository variable** (Settings → Secrets and variables → Actions → Variables) to enable the signed AAB job in `mobile-android.yml`.

## iOS (TestFlight / App Store)

| Secret | Description |
|--------|-------------|
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Distribution `.p12` (base64) |
| `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD` | `.p12` export password |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store or Ad Hoc `.mobileprovision` (base64) |
| `IOS_KEYCHAIN_PASSWORD` | Temporary keychain password for CI (any strong random string) |
| `APPLE_TEAM_ID` | 10-character Team ID |
| `APP_STORE_CONNECT_API_KEY_ID` | For TestFlight upload (optional, Fastlane lane) |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | `.p8` API key (base64) |

CI builds an **unsigned Simulator binary** by default. Full archive + TestFlight upload requires the secrets above and is documented in `TESTFLIGHT_CHECKLIST.md`.

## Vite env for mobile CI builds

Set in workflow `env` (use repository variables or secrets for real Supabase):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key (safe to bundle) |
| `VITE_THUNDERFOREST_API_KEY` | Map tiles |

`build:mobile` sets `VITE_ENABLE_ADMIN=false` and `VITE_MOBILE_BUILD=true` automatically.
