# Carbon Intelligence (MSME)

Monorepo containing:

- Web app (React) in `/src` (root `package.json`)
- Backend API (Node/Express) in `/backend`
- Mobile app (React Native) in `/mobile`

## Quick start (local dev)

### Prerequisites

- Node.js 18+ (recommended: latest LTS)
- MongoDB running locally (or a remote MongoDB URI)
- For Android: Android Studio + SDK
- For iOS: Xcode + CocoaPods (macOS only)

### 1) Backend API

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Defaults to `http://localhost:5000`.

### 2) Web app (React)

```bash
npm install
cp .env.example .env
npm start
```

Defaults to `http://localhost:3000` and calls the backend via `REACT_APP_API_URL`.

### 3) Mobile (React Native CLI)

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Then in another terminal:

```bash
cd mobile
npm run android
# or: npm run ios
```

## Common scripts

### Web (root)

- `npm test`
- `npm run lint`

### Backend (`/backend`)

- `npm test`
- `npm run lint`

### Mobile RN CLI (`/mobile`)

- `npm test`
- `npm run build:android` (release APK via Gradle)

## Configuration / secrets

- Local config is done via `.env` files (see `.env.example` templates).
- Do not commit real credentials. This repo now ignores `.env` and `.env.*` (except `.env.example`).

## Documentation

- `docs/README.md` (entry point)
- `docs/root/API_DOCUMENTATION.md`
- `docs/mobile/README.md`
