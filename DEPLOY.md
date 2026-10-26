OCFrontend Deployment (Vercel)

1. Repository: https://github.com/olryceclassics/OCFrontend
2. Framework: Vite / React
3. Build command: npm install && npm run build
4. Output directory: `build`
5. Environment variables: none required. API calls use same-origin `/api/...` paths.
6. `vercel.json` proxies `/api/...` to the Render backend and routes other paths to `index.html`.

Notes:
- Ensure `package.json` has a `build` script: `vite build`.
- The API proxy target is `https://ocbackend.onrender.com`; update `vercel.json` if the Render hostname changes.
- If you use custom domain, add it in Vercel settings and update DNS.
