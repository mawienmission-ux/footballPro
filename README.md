<<<<<<< HEAD
# M.MissionFootball

A football-focused web application for South Sudan clubs, leagues, fixtures, news, and administration. The app includes a modern dark/light UI, a secure admin dashboard, and a Firebase-powered data layer with a local fallback for development when no credentials are configured.

## Features

- Modern football-inspired landing page with dark/light mode support
- Match centre, league browser, club data, and news feed
- Secure admin dashboard with role checks for administrators
- Firebase integration for authentication, data, and sessions
- Local fallback backend for offline/development environments
- Responsive layout for desktop and mobile browsers
- API-ready server routes for clubs, matches, leagues, and news

## Tech stack

- React + TypeScript
- TanStack Start + Router
- Vite
- Tailwind CSS
- Firebase
- Vitest

## Local setup

1. Install dependencies:

```sh
npm install
```

2. Create a local environment file from the example template:

```sh
copy .env.example .env.local
```

3. Fill in the Firebase values, admin email, and live scores API key in `.env.local`.

4. In Firebase Console, enable Authentication (Email/Password), create a Firestore database, and deploy the rules in [firestore.rules](firestore.rules).

5. Start the app:

```sh
npm run dev
```

5. Open the app in your browser at:

```text
http://localhost:8081/
```

## Admin access

- Visit `/admin` to sign in or create an admin account.
- The first valid admin account is the default site administrator.
- Administrator-only pages and actions are protected by Firebase admin checks.
- Keep all secret credentials in server-side environment variables and never commit real keys to source control.
- To connect the live production data, add your Firebase web config and the RapidAPI key to `.env.local` before running the app.

## Firebase + live scores setup

For the full production sync flow:

1. Create a Firebase project and register a web app.
2. Copy the Firebase web config into `.env.local`.
3. Enable Firestore and Authentication.
4. Deploy the security rules from [firestore.rules](firestore.rules).
5. Add your live football API key and host values for the provider used by [src/lib/football-api.ts](src/lib/football-api.ts).
6. Seed the Firestore database with the project’s starter content using the service-account script in [scripts/seed-firestore.mjs](scripts/seed-firestore.mjs).

See [docs/firebase-live-sync.md](docs/firebase-live-sync.md) for the exact commands and required project settings.

## Testing

Run the automated checks:

```sh
npm run test -- --run src/test/supabase-client.test.ts
npm run build
```

## Security notes

- Store API keys and admin secrets in environment variables only.
- Never embed real credentials in the frontend or app bundle.
- Use Firebase Security Rules and server-side admin logic.
- Keep HTTPS enabled in production and avoid exposing admin credentials in any client app.

## Deployment

### Web deployment

Build the project for production:

```sh
npm run build
```

Use a static hosting or Node-compatible host, such as Vercel, Netlify, Cloudflare Pages, or a managed Node server.

### App store packaging

Because this project is a web app, native app store publishing requires a wrapper such as Capacitor or Cordova. The recommended flow is:

1. Deploy the web app to HTTPS.
2. Wrap it in a native shell using Capacitor.
3. Configure icons, splash screens, permissions, and app metadata.
4. Sign with Google Play and Apple Developer credentials.
5. Submit to Google Play Store and Apple App Store for review.

Do not include admin credentials or secret keys in the mobile package.

## Production data model

The application is designed for:

- Users and administrators
- News articles
- Football teams and clubs
- Leagues and competitions
- Matches and results
- Transfers, comments, notifications, ads, and preferences

This is backed by Firebase collections and the app’s local fallback ensures development still works when database credentials are not yet supplied.
=======
# footballPro
>>>>>>> a6ab8ec0cefd2510571091de6e5193aac098707b
