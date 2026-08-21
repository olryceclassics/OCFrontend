OCFrontend

This repository contains the frontend application (React/Vite).

Quick start:

1. Install dependencies

```bash
cd OCFrontend
npm ci
```

2. Run development server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

Deploy on Vercel:
- Create a Vercel project from this repo.
- Build command: `npm install && npm run build`
- Output directory: `build`

Notes:
- If you plan to serve static files from the backend, copy `build/` into the backend and set `FRONTEND_BUILD_DIR=frontend/build` in the backend environment.
