import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const seedPath = resolve(__dirname, '../firebase/seed-data.json');
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH to your Firebase service-account.json file before running this script.');
}

const app = initializeApp({
  credential: cert(serviceAccountPath),
});

const db = getFirestore(app);
const seed = JSON.parse(await readFile(seedPath, 'utf8'));

const collections = ['admins', 'leagues', 'clubs', 'matches', 'news'];

for (const collectionName of collections) {
  const rows = Array.isArray(seed[collectionName]) ? seed[collectionName] : [];

  for (const row of rows) {
    const id = row.id ?? crypto.randomUUID();
    const { id: _ignoredId, ...payload } = row;
    await db.collection(collectionName).doc(id).set(payload, { merge: true });
  }

  console.log(`Seeded ${collectionName}: ${rows.length} documents`);
}

console.log('Firestore seed complete.');
