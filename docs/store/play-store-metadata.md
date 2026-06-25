# Google Play Store metadata (TurkuCityTour)

Use in Play Console. Replace placeholders before submission.

## Store listing

| Field | English | Finnish (fi-FI) |
|-------|---------|-----------------|
| App name | TurkuCityTour | TurkuCityTour |
| Short description (80 chars) | GPS walking tour game — hints, map, quizzes in Turku. | GPS-kävelykierrospeli — vihjeet, kartta ja kysymykset Turussa. |
| Full description | See below | See below |

### Full description (English)

TurkuCityTour turns a walk through Turku into a game. Your organiser assigns you a tour; open the app, follow hints on the map, and walk to each landmark. When you get close, answer a question to continue.

• Live map with GPS position  
• Hints and automatic arrival detection (~50 m)  
• Progress saved to your account  
• Optional photo gallery at the end  

Location is used only while the app is open for gameplay. No ads. No data sold.

### Full description (Finnish)

TurkuCityTour muuttaa kävelyn Turussa peliksi. Järjestäjä liittää sinut kierrokseen; avaa sovellus, seuraa vihjeitä kartalla ja kävele jokaiseen kohteeseen. Kun olet lähellä, vastaa kysymykseen jatkaaksesi.

• Live-kartta ja GPS-sijainti  
• Vihjeet ja automaattinen saapumisen tunnistus (~50 m)  
• Edistyminen tallentuu tilillesi  
• Valinnainen valokuvagalleria lopussa  

Sijaintia käytetään vain sovelluksen ollessa auki pelin aikana. Ei mainoksia. Tietoja ei myydä.

## Graphics

| Asset | Size | File |
|-------|------|------|
| App icon | 512 × 512 PNG | Use `resources/icon.png` after `@capacitor/assets` |
| Feature graphic | 1024 × 500 PNG | `docs/store/assets/feature-graphic.png` (create before upload) |
| Phone screenshots | min 2 | Map, hints, question screens |

## Content rating

Complete the IARC questionnaire:

- Violence: None  
- Location: Yes — shared for gameplay (not for ads)  
- User-generated content: Optional photos (moderated by organiser)  
- Target age: Everyone / 3+ (adjust per organiser policy)

## Data safety

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Precise location | Yes | No | Gameplay — arrival detection |
| Email | Yes | No | Account |
| Photos | Optional | No | End-of-game gallery |
| App activity (game progress) | Yes | No | Core functionality |

Privacy policy URL: same as App Store (`https://YOUR_DOMAIN/privacy`).

## Release

- **Package:** `fi.turkucitytour.app`  
- **Initial version:** 1.0.0 (versionCode 1)  
- **Track:** Internal testing → closed test (Turku walkers) → production  

Upload signed AAB from `mobile-android.yml` when signing secrets are configured (see `SIGNING.md`).
