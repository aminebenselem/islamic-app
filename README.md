# Hayat Muslim

Ionic Angular app with Supabase backend for Quran memorization and moon-phase utilities.

## Prerequisites
- Node.js 18+
- Ionic CLI (`npm i -g @ionic/cli`) and Angular CLI (`npm i -g @angular/cli`) for local dev
- Capacitor toolchain if building native (Android SDK/Studio installed, JAVA_HOME set)

## Setup
1. Install dependencies: `npm install`
2. (Optional) Install platform tooling for Android: `npm run build && npx cap add android`
3. Configure API keys in Angular environments (`src/environments/environment*.ts`). See Environment section below.

## Development
- Web dev server: `npm start` then open http://localhost:4200
- Lint: `npm run lint`
- Unit tests: `npm test`

## Build
- Web build: `npm run build` (outputs to `www/` via Angular build)
- Capacitor sync (after build): `npx cap sync`
- Android run: `npx cap open android` then build/run from Android Studio

## Supabase setup
- Run database schema: see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) and `supabase-setup.sql`.
- Fix/verify RLS policies if needed: `fix-rls.sql`, `fix-supabase.sql`, `fix-moon-duplicates.sql` contain helper scripts.

## Moon phase cache
- Supabase table `moon_phase` stores daily data keyed by `date` + `country_name` (see logic in `src/app/services/supabase.ts`). Upserts avoid duplicates.

## Environment
- Keys are read from `src/environments/environment.ts` and `environment.prod.ts`:
	- `supabaseUrl`
	- `supabaseAnonKey`
	- `moonApiKey`
- For local overrides, edit `environment.ts`; for builds, set `environment.prod.ts`.
- Do not commit production secrets; rotate keys regularly in Supabase.

## Notes
- Do not ship production builds with hard-coded service keys. Use environment variables or build-time configs instead.
