# planning

A personal planner with Google sign-in and Firestore storage (React + Vite).
Only approved emails can get in, and access is enforced server-side by Firestore security rules.

## Features

- Google sign-in (accounts not on the allowlist see an "Access denied" screen and are signed out automatically)
- Week strip, date picker, daily progress
- Add / edit / delete / check off items (types: Task, Meeting, Deadline, Note)
- Settings: add or remove allowed emails (owner only), export a JSON backup, sign out
- Offline cache (view and edit without a connection; syncs when back online)

## Data model

```
config/access            { emails: ["joon7853@gmail.com", ...] }   <- allowlist
users/{uid}/items/{id}   { title, type, date, time, note, done, createdAt, updatedAt }
```

Each user can only read and write under their own `users/{uid}`.

---

## 1. Firebase setup (one time, about 10 minutes)

1. Go to https://console.firebase.google.com, click **Add project**, name it `planning` (Google Analytics can be off).
2. **Build > Authentication** → Get started → Sign-in method → enable **Google** → pick a support email → Save.
3. **Build > Firestore Database** → Create database.
   - Location: `nam5 (United States)` is a good default.
   - ⚠️ **Start in production mode.** Test mode lets anyone read and write for 30 days.
4. Firestore **Rules** tab → delete everything, paste the contents of `firestore.rules` from this repo → **Publish**.
5. Project settings (gear icon) → General → Your apps → **Add app (Web `</>`)** → name it `planning` (leave Hosting unchecked).
   Note down `apiKey`, `authDomain`, `projectId` and `appId` from the `firebaseConfig` shown.
6. **Authentication > Settings > Authorized domains** → Add domain → `bakhoon.github.io`.
7. Stay on the **Spark (free) plan**. As long as you don't upgrade, nothing can be billed.

## 2. GitHub deploy

1. Repo **Settings > Secrets and variables > Actions > Variables tab** → add these 5 repository variables:

   | Name | Value |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | firebaseConfig.apiKey |
   | `VITE_FIREBASE_AUTH_DOMAIN` | firebaseConfig.authDomain |
   | `VITE_FIREBASE_PROJECT_ID` | firebaseConfig.projectId |
   | `VITE_FIREBASE_APP_ID` | firebaseConfig.appId |
   | `VITE_OWNER_EMAIL` | joon7853@gmail.com |

   (A Firebase `apiKey` is not a secret; it just identifies the project. Security comes from the rules.)

2. Repo **Settings > Pages** → set Source to **GitHub Actions**.
3. Every push to `main` deploys to `https://bakhoon.github.io/planning/`.
   If you added the variables after a push, open the Actions tab and re-run "Deploy to GitHub Pages".

## 3. Check that access is locked down

Firestore **Rules** tab → **Rules Playground**:
- Location `/config/access`, type get, Authenticated on, provider google, email `someone@example.com` → should be **denied**.
- Same settings with email `joon7853@gmail.com` → should be **allowed**.

## 4. Run locally (optional)

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:5173
```

`localhost` is an authorized domain in Firebase by default.

## Changing the owner email

Update both places:
1. The `// OWNER` line in `firestore.rules`, then publish the rules again in the console.
2. The `VITE_OWNER_EMAIL` variable on GitHub, then redeploy.
