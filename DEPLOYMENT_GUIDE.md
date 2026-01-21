# Deployment Guide: Vercel (Frontend) + Railway (Backend)

## Architecture

```
GitHub Repository (panlinying/ML-Interview)
    │
    ├─── git push ───┐
    │                │
    ├─ Vercel ───────┴──► Auto-deploys Frontend (site/)
    │                     - Builds Next.js static site
    │                     - Deploys to Vercel CDN
    │                     - URL: https://ml-interview.vercel.app
    │
    └─ Railway ──────────► Auto-deploys Backend (api/)
                          - Runs FastAPI with Uvicorn
                          - Connects to Neon PostgreSQL
                          - URL: https://ml-interview-production.up.railway.app
```

## Prerequisites

- GitHub repository: `panlinying/ML-Interview`
- Neon PostgreSQL database (already configured)
- GitHub OAuth app credentials
- Google OAuth app credentials

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"Start a New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose repository: **`panlinying/ML-Interview`**
6. Railway will automatically:
   - Detect Python project
   - Install dependencies from `pyproject.toml`
   - Use `Procfile` to start the app
   - Deploy to a temporary URL

### Step 2: Generate Public Domain

1. In Railway dashboard, go to your project
2. Click on the **service** (should show "ml-interview")
3. Go to **Settings** tab
4. Scroll to **Networking** section
5. Click **"Generate Domain"**
6. Copy the generated URL (e.g., `https://ml-interview-production.up.railway.app`)

### Step 3: Add Environment Variables

1. In Railway dashboard, go to **Variables** tab
2. Click **"New Variable"** and add each of these:

```bash
# Database (from Neon - copy from your .env.local)
DATABASE_URL=your_neon_database_url_here

# Security Secrets (copy from your .env.local)
JWT_SECRET=your_jwt_secret_here
ADMIN_SECRET=your_admin_secret_here

# OAuth Credentials (copy from your .env.local)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URLs (update with your actual URLs)
API_URL=https://your-railway-domain.up.railway.app
APP_URL=https://ml-interview.vercel.app
ALLOWED_ORIGINS=https://ml-interview.vercel.app
```

**Note:** Copy all the secret values from your local `.env.local` file.

**Note:** Update `API_URL` with your actual Railway domain from Step 2.

### Step 4: Verify Backend Deployment

1. Visit: `https://your-railway-domain.up.railway.app/api`
2. You should see: `{"status": "ok", "message": "ML Interview API"}`
3. Visit: `https://your-railway-domain.up.railway.app/docs`
4. You should see the FastAPI Swagger documentation

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Click **"Import"** next to `panlinying/ML-Interview`
5. Vercel will automatically:
   - Detect Next.js project
   - Use `vercel.json` configuration
   - Build from `site/` directory

### Step 2: Configure Build Settings

Vercel should auto-detect the settings from `vercel.json`, but verify:

- **Framework Preset:** Next.js
- **Build Command:** `cd site && npm install && npm run build`
- **Output Directory:** `site/out`
- **Install Command:** (leave default or use the one from vercel.json)

### Step 3: Add Environment Variables

1. Before deploying, click **"Environment Variables"**
2. Add these variables:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
NEXT_STATIC_EXPORT=true
```

**Note:** Replace `your-railway-domain.up.railway.app` with your actual Railway URL from Part 1.

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a URL (e.g., `https://ml-interview.vercel.app`)

### Step 5: Update Railway with Vercel URL

1. Go back to Railway dashboard
2. Go to **Variables** tab
3. Update these variables with your Vercel URL:
   ```bash
   APP_URL=https://ml-interview.vercel.app
   ALLOWED_ORIGINS=https://ml-interview.vercel.app
   ```
4. Railway will automatically redeploy

---

## Part 3: Configure OAuth Providers

### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click on your OAuth App: `Ov23liQiT05ln5mWIi5f`
3. Update **Authorization callback URL** to include:
   ```
   http://localhost:8000/api/auth/github/callback
   https://your-railway-domain.up.railway.app/api/auth/github/callback
   ```
4. Click **"Update application"**

### Google OAuth App

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:8000/api/auth/google/callback
   https://your-railway-domain.up.railway.app/api/auth/google/callback
   ```
4. Click **"Save"**

---

## Part 4: Initialize Production Database

Run this command to create database tables:

```bash
curl -X POST https://your-railway-domain.up.railway.app/api/init-db \
  -H "X-Admin-Secret: 0c02a84163aa2b04eca4f6ff5650789c8f7cc7426b0d3461b2fbc06ae7dc0d5f"
```

You should see:
```json
{"status": "ok", "message": "Database initialized"}
```

---

## Part 5: Test Production Deployment

### Test Frontend

1. Visit: `https://ml-interview.vercel.app`
2. You should see the homepage with documentation
3. OAuth buttons should be visible (not hidden)

### Test Backend API

1. Visit: `https://your-railway-domain.up.railway.app/api`
2. You should see: `{"status": "ok", "message": "ML Interview API"}`

### Test OAuth Flow

1. On your Vercel site, click **"Continue with GitHub"**
2. You should be redirected to GitHub
3. Authorize the app
4. You should be redirected back to your site and logged in
5. Repeat for Google OAuth

---

## Automatic Deployments

### How It Works

After setup, every `git push` triggers:

1. **Railway Auto-Deploy:**
   - Detects changes in `api/` folder or `pyproject.toml`
   - Rebuilds and redeploys backend
   - Takes ~2-3 minutes

2. **Vercel Auto-Deploy:**
   - Detects changes in `site/` folder or `vercel.json`
   - Rebuilds and redeploys frontend
   - Takes ~2-3 minutes

### Deployment Workflow

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push

# Railway and Vercel both auto-deploy
# Check deployment status:
# - Railway: https://railway.app/dashboard
# - Vercel: https://vercel.com/dashboard
```

---

## Environment Variables Summary

### Railway (Backend)

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Neon PostgreSQL URL | Database connection |
| `JWT_SECRET` | Random 64-char hex | JWT signing |
| `ADMIN_SECRET` | Random 64-char hex | Admin endpoints |
| `GITHUB_CLIENT_ID` | From GitHub OAuth app | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | From GitHub OAuth app | GitHub OAuth |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | Google OAuth |
| `API_URL` | Railway domain | OAuth callbacks |
| `APP_URL` | Vercel domain | Post-OAuth redirects |
| `ALLOWED_ORIGINS` | Vercel domain | CORS |

### Vercel (Frontend)

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Railway domain | API calls from browser |
| `NEXT_STATIC_EXPORT` | `true` | Enable static export |

### Local Development (.env.local)

Keep these for local development:
```bash
API_URL=http://localhost:8000
APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

---

## Troubleshooting

### Backend Issues

**Problem:** Railway deployment fails
- Check **Logs** tab in Railway dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct

**Problem:** OAuth callbacks fail
- Verify `API_URL` matches your Railway domain
- Check OAuth provider redirect URIs are correct
- Check Railway logs for errors

### Frontend Issues

**Problem:** Vercel build fails
- Check build logs in Vercel dashboard
- Verify `NEXT_STATIC_EXPORT=true` is set
- Ensure `vercel.json` is correct

**Problem:** API calls fail (CORS errors)
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check `ALLOWED_ORIGINS` in Railway includes Vercel domain
- Check browser console for exact error

### OAuth Issues

**Problem:** "redirect_uri_mismatch" error
- Verify OAuth provider has Railway callback URL
- Check `API_URL` in Railway matches the domain
- Ensure no trailing slashes in URLs

---

## Monitoring

### Railway

- **Logs:** Real-time logs in Railway dashboard
- **Metrics:** CPU, memory, network usage
- **Deployments:** History of all deployments

### Vercel

- **Deployments:** History and logs for each deployment
- **Analytics:** Page views, performance metrics
- **Logs:** Runtime logs for serverless functions (not used in static export)

---

## Cost Estimates

### Railway Free Tier

- $5 credit per month
- ~500 hours of execution time
- Enough for hobby projects

### Vercel Free Tier

- 100 GB bandwidth per month
- Unlimited static sites
- Perfect for documentation sites

### Neon Free Tier

- 0.5 GB storage
- 1 project
- Enough for small user base

**Total Cost:** $0/month for small-scale usage

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Configure OAuth providers
4. ✅ Initialize production database
5. ✅ Test OAuth flow
6. 📊 Set up monitoring and alerts
7. 🔒 Review security settings
8. 📈 Monitor usage and scale as needed
