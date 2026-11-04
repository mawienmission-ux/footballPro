# Firebase + live scores setup

This project is already prepared to use Firebase as the primary backend and to hydrate live fixtures from a football data provider when the environment variables are present.

## 1. Create the Firebase project

1. Go to the Firebase Console and create a new project.
2. Register a web app and copy the configuration values into your local environment file.
3. Keep the values in `.env.local` or `.env` and do not commit real secrets.

Required values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_ADMIN_EMAILS`

## 2. Enable Firebase services

1. In Firebase Console, enable Authentication.
2. Set the sign-in method to Email/Password.
3. Create a Firestore database in production mode.
4. Deploy the rules in [firestore.rules](../firestore.rules) to allow public reads and admin writes.

Example deploy:

```sh
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

## 3. Seed the database

Use the provided seed script in [scripts/seed-firestore.mjs](../scripts/seed-firestore.mjs) after generating a Firebase service account JSON.

```sh
export GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
node scripts/seed-firestore.mjs
```

Or set the equivalent path in the environment:

```sh
export FIREBASE_SERVICE_ACCOUNT_PATH="./service-account.json"
```

## 4. Configure the live scores provider

The app reads live fixtures from the environment variables used in [src/lib/football-api.ts](../src/lib/football-api.ts):

- `VITE_FOOTBALL_API_KEY`
- `VITE_FOOTBALL_API_HOST`
- `VITE_FOOTBALL_API_URL`

Use a provider such as RapidAPI and fill in the real values in `.env.local`.

Example:

```env
VITE_FOOTBALL_API_KEY=your_rapidapi_key
VITE_FOOTBALL_API_HOST=api-football-v1.p.rapidapi.com
VITE_FOOTBALL_API_URL=https://api-football-v1.p.rapidapi.com/v3
```

When the values are missing, the app automatically falls back to the local seeded data so the app still runs.

## 5. Verify the sync flow

Run the project and confirm the following:

1. Admin login works with the configured email in `VITE_ADMIN_EMAILS`.
2. Groups, fixtures, and standings render from Firebase data.
3. Live score cards pull data from the provider when the API key is present.
4. Previous-match archive and standings update with the same source data.

```sh
npm install
npm run dev
```

Open the app and verify the public site and admin dashboard both reflect the same source-of-truth data.
