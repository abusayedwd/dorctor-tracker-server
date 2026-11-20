# Doctor Tracker — API

Express + TypeScript + MongoDB REST API. Full architecture & endpoint list: [root README](../README.md).

## Quick start

```bash
# create .env (MONGODB_URL, two different JWT secrets, admin creds)
npm install
npm run seed            # admin account + demo data (40 doctors / 900 patients)
npm run dev             # http://localhost:5000  (health: /health)
```

Sign in: `admin@doctortracker.com` / `Admin@12345`

## Deploy — VPS

```bash
npm ci && npm run build               # outputs dist/
npm run seed                          # one-time
pm2 start dist/index.js --name doctor-tracker-api
pm2 save && pm2 startup               # enable boot-start
```

Production `.env` essentials: `NODE_ENV=production`, `COOKIE_SECURE=true`,
`COOKIE_SAMESITE=lax`, `CLIENT_URL=<your Vercel URL>`.

Front with Nginx (proxy → `127.0.0.1:5000`) + SSL via `certbot --nginx`.

See the [root README](../README.md#deployment) for the full step-by-step guide.
