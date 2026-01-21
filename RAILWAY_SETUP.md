# 🚂 Railway Setup Guide

Complete step-by-step guide to deploy your backend to Railway.

---

## 📋 What You'll Need

From your `.env.local` file, copy these values:
- `JWT_SECRET`
- `ADMIN_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 🚀 Step 1: Create Railway Project (5 min)

### 1.1 Deploy from GitHub

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `panlinying/ML-Interview`
5. Railway will automatically detect Python and start building

### 1.2 Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL instance
   - Set the `DATABASE_URL` environment variable
   - Link it to your backend service

---

## ⚙️ Step 2: Configure Environment Variables (5 min)

### 2.1 Open Variables Tab

1. Click on your **backend service** (not the database)
2. Go to the **"Variables"** tab

### 2.2 Add These Variables

Click **"+ New Variable"** for each:

```bash
# Security Secrets (copy from your .env.local)
JWT_SECRET=your_jwt_secret_here
ADMIN_SECRET=your_admin_secret_here

# GitHub OAuth (copy from your .env.local)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Google OAuth (copy from your .env.local)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Production URLs (use these exact values)
APP_URL=https://www.aceinterview.online
API_URL=https://www.aceinterview.online/api
ALLOWED_ORIGINS=https://www.aceinterview.online
```

### 2.3 Verify DATABASE_URL

Railway should have automatically set:
```bash
DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
```

If not, copy it from the PostgreSQL service's "Connect" tab.

---

## 🌐 Step 3: Generate Public Domain (2 min)

### 3.1 Create Railway Domain

1. Click on your **backend service**
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `ml-interview-production.up.railway.app`)

### 3.2 Update Vercel Rewrite

Edit `vercel.json` in your project:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd site && npm install && npm run build",
  "outputDirectory": "site/out",
  "installCommand": "echo 'Skipping root install'",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RAILWAY-URL.up.railway.app/api/:path*"
    }
  ]
}
```

Replace `YOUR-RAILWAY-URL` with your actual Railway domain.

Commit and push:
```bash
git add vercel.json
git commit -m "Update Railway URL in Vercel rewrite"
git push
```

---

## 🗄️ Step 4: Initialize Database (2 min)

### 4.1 Wait for Deployment

1. Go to the **"Deployments"** tab
2. Wait for the latest deployment to show **"Success"** ✅

### 4.2 Initialize Tables

Open your browser and visit:
```
https://YOUR-RAILWAY-URL.up.railway.app/api/init-db?admin_secret=YOUR_ADMIN_SECRET
```

Replace:
- `YOUR-RAILWAY-URL` with your Railway domain
- `YOUR_ADMIN_SECRET` with the value from your `.env.local`

You should see:
```json
{"message": "Database initialized successfully"}
```

---

## ✅ Step 5: Verify Deployment (2 min)

### 5.1 Test API Docs

Visit:
```
https://YOUR-RAILWAY-URL.up.railway.app/docs
```

You should see the FastAPI interactive documentation.

### 5.2 Test Health Endpoint

Visit:
```
https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

You should see:
```json
{"status": "healthy"}
```

---

## 🔐 Step 6: Update OAuth Providers (5 min)

### 6.1 GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click on your OAuth App
3. **Add** this callback URL:
   ```
   https://www.aceinterview.online/api/auth/github/callback
   ```

### 6.2 Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, **add**:
   ```
   https://www.aceinterview.online/api/auth/google/callback
   ```
4. Click **"Save"**

---

## 🎉 Done!

Your backend is now live on Railway with:
- ✅ PostgreSQL database
- ✅ Environment variables configured
- ✅ Database tables initialized
- ✅ OAuth providers updated
- ✅ Automatic deployments on `git push`

---

## 🧪 Test OAuth Flow

1. Go to https://www.aceinterview.online
2. Click **"Continue with GitHub"** or **"Continue with Google"**
3. You should be redirected to the OAuth provider
4. After authorization, you should be redirected back with a JWT token

---

## 🐛 Troubleshooting

### "500 Internal Server Error" on OAuth

**Cause:** Database not initialized or environment variables missing.

**Fix:**
1. Check Railway logs: Click "Deployments" → Latest deployment → "View Logs"
2. Verify all environment variables are set (Step 2)
3. Re-run database initialization (Step 4)

### "redirect_uri_mismatch" Error

**Cause:** OAuth callback URL not added to provider.

**Fix:**
1. For GitHub: Add `https://www.aceinterview.online/api/auth/github/callback`
2. For Google: Add `https://www.aceinterview.online/api/auth/google/callback`

### Database Connection Error

**Cause:** `DATABASE_URL` not set or incorrect.

**Fix:**
1. Go to PostgreSQL service in Railway
2. Click "Connect" tab
3. Copy the "Public URL"
4. Add it as `DATABASE_URL` in your backend service variables

### Build Fails

**Cause:** Missing dependencies or incorrect Python version.

**Fix:**
1. Check `pyproject.toml` has all dependencies
2. Railway uses Python 3.11+ by default (compatible with your project)
3. Check build logs for specific errors

---

## 📚 Related Files

- `Procfile` - Tells Railway how to run the backend
- `railway.toml` - Railway configuration
- `pyproject.toml` - Python dependencies
- `api/index.py` - FastAPI application entry point
- `api/auth.py` - OAuth implementation

---

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- PostgreSQL Management: Use Railway's built-in database UI or connect with your favorite client

---

**Need help?** Check the Railway logs first - they usually show the exact error.
