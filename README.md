# timetrack

Time tracking app built with React + TypeScript + Vite.

## Connection status (GitHub / Firebase)

- Local repository is initialized with Git.
- `origin` remote is connected to `https://github.com/yuki2737/timetrack.git`.
- Firebase project is configured as `my-app-3bc93`.
- Hosting target `timetrack` points to site `timetrack48367`.

## Auto deploy (GitHub Actions -> Firebase Hosting)

This repository includes `.github/workflows/deploy-firebase-hosting.yml`.

- Trigger: push to `main` (and manual `workflow_dispatch`)
- Build: `npm ci` + `npm run build`
- Deploy target: Firebase Hosting `live` channel

### Required GitHub Secrets

Set the following repository secret before auto deploy works:

- `FIREBASE_SERVICE_ACCOUNT_MY_APP_3BC93`

Create it from Firebase service account JSON (for project `my-app-3bc93`) and store the entire JSON content as the secret value.

## Local development

```bash
npm install
npm run dev
```

## Manual deploy (local)

```bash
npm run build
npm run deploy:hosting
```
