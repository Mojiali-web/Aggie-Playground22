# Aggie Playground for iPhone

This Expo Router app is the native companion to the website in `../aggie-playground/`. It queries the same Supabase project and schema.

## Run with Expo Go

```sh
npm ci
npm start
```

Scan the terminal QR code using your iPhone camera and open it in Expo Go. The phone and computer need to be on the same Wi-Fi network.

## Included features

- Map with public campus places and live activity pins.
- Discover/search/filter activities; host, join, leave, and cancel.
- Student discussions and topic-based posts.
- AggieLife club event cache and refresh through the website API.
- Opt-in buddy matching, buddy requests, and accept/decline.
- Email magic-link sign-in, profile editing, activity history, and in-app notifications.

The Supabase client uses the same public project URL and publishable key as the website. These client values may be included in an app. Database row-level security is responsible for access control. Add `aggieplayground://auth/callback` and `exp://**/--/auth/callback` to Supabase Auth's redirect URL allowlist for magic-link sign-in. The Expo Go URL uses a changing local address, so use the wildcard only for development; the installed app uses the exact custom-scheme URL.

Club event reading uses the shared `club_events` cache. Refresh calls the deployed website API at `https://aggie-playground22.vercel.app` by default; override it with `EXPO_PUBLIC_API_URL` in an ignored `ios-app/.env.local` file if the website uses a different domain. The website server needs its existing Context.dev and Supabase service credentials. Never put those server secrets in the mobile app.

The matching database schema is in `../aggie-playground/supabase/migrations/0001_init.sql`. Apply the migration to the same Supabase project before expecting live feature data.
