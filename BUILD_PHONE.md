## Phone build with working backend (Render)

Your APK should talk to a **Node/Express backend** deployed on Render, not Expo Hosting API routes (Workers runtime cannot reliably run `mongoose` + MongoDB).

The app is configured to use:

- `EXPO_PUBLIC_API_BASE_URL` (example: `https://your-render-service.onrender.com`)

### One-time setup

1. Install EAS CLI:

```bash
npm i -g eas-cli
eas login 
```

2. Deploy backend to Render

- Backend code lives in `backend/`
- On Render set env var: `MONGODB_URI`
- Render will give you a public URL, e.g. `https://milk-accounting-api.onrender.com`

3. Configure app API base URL for EAS builds

In Expo dashboard go to **Project → Environment variables** and set:

- `EXPO_PUBLIC_API_BASE_URL = https://<your-render-url>`

Make sure it’s available for the environment you build (preview/production).

### Build APK (internal / preview)

```bash
eas build -p android --profile preview
```

Install the resulting APK on your phone. The app will call:
`EXPO_PUBLIC_API_BASE_URL + /api/...`

### Production (AAB)

```bash
eas build -p android --profile production
```

### Notes

- If you set `EXPO_PUBLIC_API_BASE_URL`, native builds will use it; web can keep using relative paths.
- **`.env` in Git:** The `.env` file is gitignored and may show as **deleted (D)** in red in the file explorer because it was untracked for security. That is expected.

