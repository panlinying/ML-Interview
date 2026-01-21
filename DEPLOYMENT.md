# Deployment Guide

This guide covers deploying the ML Interview app to production with OAuth support.

## Architecture

- **Frontend (Next.js)**: Deploy to GitHub Pages (static site)
- **Backend (FastAPI)**: Deploy to Railway/Render/Fly.io (with database)
- **Database**: Neon PostgreSQL (already configured)

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"**

### 1.2 Deploy from GitHub

1. Click **"Deploy from GitHub repo"**
2. Select your `ML-Interview` repository
3. Railway will auto-detect Python and use `railway.json` config

### 1.3 Add Environment Variables

In Railway project settings, add these environment variables:

```bash
# Database (use your existing Neon database connection string)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# OAuth Credentials (use your own from GitHub/Google Cloud Console)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URLs (IMPORTANT: Update these after deployment)
APP_URL=https://www.aceinterview.online
API_URL=https://your-app.railway.app  # Railway will provide this URL
ALLOWED_ORIGINS=https://www.aceinterview.online,https://your-app.railway.app

# Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here
ADMIN_SECRET=your_admin_secret_here
```

### 1.4 Get Your Backend URL

After deployment, Railway will give you a URL like:
```
https://ml-interview-production.up.railway.app
```

**Copy this URL** - you'll need it for the next steps.

### 1.5 Update API_URL Environment Variable

Go back to Railway settings and update:
```bash
API_URL=https://ml-interview-production.up.railway.app
```

Then redeploy.

---

## Step 2: Update OAuth App Settings

### 2.1 Update GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Find your OAuth App
3. Update **"Authorization callback URL"**:
   ```
   https://ml-interview-production.up.railway.app/api/auth/github/callback
   ```
4. Click **"Update application"**

### 2.2 Update Google OAuth App

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add to **"Authorized redirect URIs"**:
   ```
   https://ml-interview-production.up.railway.app/api/auth/google/callback
   ```
4. Click **"Save"**

---

## Step 3: Update Frontend (Vercel/GitHub Pages)

### Option A: Deploy to Vercel (Recommended for OAuth)

Vercel can proxy API requests, making OAuth easier.

#### 3.1 Create `vercel.json`

Already configured! Just update environment variables in Vercel dashboard.

#### 3.2 Deploy to Vercel

```bash
npm install -g vercel
cd site
vercel
```

#### 3.3 Add Environment Variables in Vercel

In Vercel dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://ml-interview-production.up.railway.app
NEXT_PUBLIC_BASE_PATH=  # Leave empty for root domain
```

#### 3.4 Redeploy

```bash
vercel --prod
```

### Option B: Keep GitHub Pages (Static Only)

If you want to keep GitHub Pages, OAuth buttons will remain hidden (as designed). Users can still read all content.

To enable OAuth on GitHub Pages, you'd need to:
1. Add back the Next.js API proxy routes (we removed them for static export)
2. Remove `output: 'export'` from `next.config.js`
3. Deploy to Vercel instead (GitHub Pages doesn't support API routes)

---

## Step 4: Initialize Production Database

After backend is deployed, initialize the database:

```bash
curl -X POST https://ml-interview-production.up.railway.app/api/init-db \
  -H "X-Admin-Secret: your_admin_secret_here"
```

You should see:
```json
{"message": "Database initialized successfully"}
```

---

## Step 5: Test Production OAuth

1. Go to your production site (e.g., https://www.aceinterview.online)
2. Click **"Continue with GitHub"** or **"Continue with Google"**
3. Authorize the app
4. You should be redirected back and logged in! ✅

---

## Alternative: Deploy Backend to Render

Render is another free option:

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `uv sync`
   - **Start Command**: `uv run uvicorn api.index:app --host 0.0.0.0 --port $PORT`
5. Add the same environment variables as Railway
6. Deploy!

---

## Alternative: Deploy Backend to Fly.io

Fly.io offers free tier with better performance:

### Create `fly.toml`

```toml
app = "ml-interview"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### Deploy

```bash
flyctl launch
flyctl secrets set DATABASE_URL="..." GITHUB_CLIENT_ID="..." # etc
flyctl deploy
```

---

## Environment Variables Summary

### Backend (Railway/Render/Fly.io)

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | `your_client_id` | GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | `your_client_secret` | GitHub OAuth Client Secret |
| `GOOGLE_CLIENT_ID` | `your_client_id` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `your_client_secret` | Google OAuth Client Secret |
| `APP_URL` | `https://www.aceinterview.online` | Frontend URL |
| `API_URL` | `https://your-app.railway.app` | Backend URL (self-reference) |
| `ALLOWED_ORIGINS` | `https://www.aceinterview.online,...` | CORS allowed origins |
| `JWT_SECRET` | `your_secret` | JWT signing secret (generate with openssl) |
| `ADMIN_SECRET` | `your_secret` | Admin API secret (generate with openssl) |

### Frontend (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-app.railway.app` | Backend API URL |
| `NEXT_PUBLIC_BASE_PATH` | `` (empty) | Base path for routing |

---

## Troubleshooting

### OAuth Redirect Mismatch

**Error**: `redirect_uri_mismatch`

**Fix**: Make sure OAuth app settings have the correct callback URL:
- GitHub: `https://your-backend.railway.app/api/auth/github/callback`
- Google: `https://your-backend.railway.app/api/auth/google/callback`

### CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Fix**: Add your frontend URL to `ALLOWED_ORIGINS` in backend environment variables:
```bash
ALLOWED_ORIGINS=https://www.aceinterview.online,https://your-backend.railway.app
```

### Database Connection Errors

**Error**: `could not connect to server`

**Fix**: Make sure `DATABASE_URL` is set correctly and includes `?sslmode=require`

### OAuth Buttons Not Showing

**Error**: Buttons are hidden on production site

**Fix**: Make sure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables and redeploy.

---

## Security Checklist

Before going to production:

- [ ] Regenerate `JWT_SECRET` and `ADMIN_SECRET` (use `openssl rand -hex 32`)
- [ ] Update OAuth app redirect URIs to production URLs only
- [ ] Set `ALLOWED_ORIGINS` to only include your production domains
- [ ] Enable HTTPS on all services (Railway/Render do this automatically)
- [ ] Review GitHub/Google OAuth app permissions
- [ ] Set up database backups (Neon has automatic backups)
- [ ] Monitor API logs for errors (Railway/Render dashboards)

---

## Cost Estimate

- **Frontend (GitHub Pages)**: Free
- **Backend (Railway)**: Free tier (500 hours/month)
- **Database (Neon)**: Free tier (0.5 GB storage, 1 compute unit)
- **Total**: $0/month for small projects! 🎉

If you exceed free tiers:
- Railway: ~$5/month
- Neon: ~$19/month for Pro tier

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Update OAuth app settings
3. ✅ Add environment variables to Vercel
4. ✅ Initialize production database
5. ✅ Test OAuth flow
6. 🚀 You're live!

For questions or issues, check the [DEVELOPMENT.md](./DEVELOPMENT.md) guide or open an issue on GitHub.
