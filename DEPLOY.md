OCFrontend Deployment (Vercel)

1. Repository: https://github.com/olryceclassics/OCFrontend
2. Framework: Vite / React
3. Build command: npm install && npm run build
4. Output directory: build
5. Environment variables: none required for static build. Configure any runtime envs in your app via Vercel dashboard.
6. Add a `vercel.json` if you need redirects or rewrites. Vercel will detect Vite automatically in most cases.

Notes:
- Ensure `package.json` has a `build` script: `vite build`.
- If you use custom domain, add it in Vercel settings and update DNS.
