## Deploy backend on Render (recommended)

Your app now calls a backend via:

- `EXPO_PUBLIC_API_BASE_URL` + `/api/...`

### 1) Run backend locally (optional)

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_atlas_uri
PORT=3000
```

Start:

```bash
npm run dev
```

Test:

- `GET http://localhost:3000/health` → `{ ok: true }`
- `POST http://localhost:3000/api/auth/register`
- `POST http://localhost:3000/api/auth/login`

### 2) Deploy backend to Render

1. Push this repo to GitHub (or any Git host Render can access).
2. Render dashboard → **New +** → **Web Service** → select the repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Set environment variables on Render:
   - `MONGODB_URI` = your MongoDB Atlas URI

After deploy, Render will give you a URL like:

- `https://milk-accounting-api.onrender.com`

### 3) Point the APK to Render backend

Expo dashboard → **Project → Environment variables**:

- Add `EXPO_PUBLIC_API_BASE_URL = https://<your-render-url>`
- Select the environment you build with (preview + production recommended).

### 4) Build APK

```bash
eas build -p android --profile preview
```

Install the generated APK and login/data will work using Render backend.

