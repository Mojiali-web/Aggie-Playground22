# Aggie Playground

This repository is the source of truth for the WoCow campus app. It includes the Next.js website and backend in `aggie-playground/`, plus a native Expo iPhone app in `ios-app/`.

## Native iPhone app

Install Expo Go on your iPhone, then run:

```sh
cd ios-app
npm ci
npm start
```

Scan the QR code with your iPhone camera and open it in Expo Go. The app uses the same public Supabase project configuration as the website. Supabase publishable keys are intended for client apps; row-level security protects database access. Never put a Supabase secret/service-role key or `CONTEXT_DEV_API_KEY` in the mobile app.

The app includes a live campus map, searchable activities, host/edit/join/leave/cancel actions, student discussions, campus club events, buddy matching, profiles, and in-app notifications. Add `aggieplayground://auth/callback` and `exp://**/--/auth/callback` to the Supabase Auth redirect URL allowlist in Project Settings → Authentication → URL Configuration (the second pattern supports Expo Go testing).

Club refresh uses the deployed API at `https://aggie-playground22.vercel.app` by default. Override it with `EXPO_PUBLIC_API_URL` in `ios-app/.env.local` if needed. The server must have `CONTEXT_DEV_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the other variables documented in `aggie-playground/README.md`. Those server credentials stay on the server.

## Website and server

See [`aggie-playground/README.md`](aggie-playground/README.md) for the web app, database migration, required server environment variables, and deployment steps. Deploy the website with `aggie-playground/` as the Vercel root directory.
