# Deployment Guide

Complete guide for deploying to production with single domain setup.

---

## 🎯 Architecture

```
www.aceinterview.online
    ├── /          → Vercel (Frontend - Static Site)
    ├── /docs/*    → Vercel (Frontend - Static Pages)
    └── /api/*     → Railway (Backend - FastAPI via Vercel rewrite)
                     └── PostgreSQL (Railway Database)
```

**One domain, two services, automatic deployments on `git push`.**

---

## 📋 Prerequisites

- GitHub repository: `panlinying/ML-Interview`
- Railway account
- Vercel account
- Domain: `www.aceinterview.online`

---

## 🚀 Quick Start (30 minutes)

### Step 1: Deploy Backend to Railway (10 min)

1. Go to https://railway.app
2. **"New Project"** → **"Deploy from GitHub"** → Select your repo
3. **Add PostgreSQL:** Click **"+ New"** → **"Database"** → **"PostgreSQL"**
4. **Add variables** (click "Variables" tab):
   ```bash
   JWT_SECRET=copy_from_your_env_local
   ADMIN_SECRET=copy_from_your_env_local
   GITHUB_CLIENT_ID=copy_from_your_env_local
   GITHUB_CLIENT_SECRET=copy_from_your_env_local
   GOOGLE_CLIENT_ID=copy_from_your_env_local
   GOOGLE_CLIENT_SECRET=copy_from_your_env_local
   APP_URL=https://www.aceinterview.online
   API_URL=https://www.aceinterview.online/api
   ALLOWED_ORIGINS=https://www.aceinterview.online
   ```
5. **Generate domain:** Settings → Networking → **"Generate Domain"**
6. **Copy Railway URL** (e.g., `ml-interview-production.up.railway.app`)

### Step 2: Update Vercel Rewrite (2 min)

Edit `vercel.json` and replace the Railway URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RAILWAY-URL.up.railway.app/api/:path*"
    }
  ]
}
```

Commit and push:
```bash
git add vercel.json
git commit -m "Update Railway URL in Vercel rewrite"
git push
```

### Step 3: Deploy Frontend to Vercel (5 min)

1. Go to https://vercel.com
2. **"Add New Project"** → Import your GitHub repo
3. **Add variables** (Settings → Environment Variables):
   ```bash
   NEXT_PUBLIC_API_URL=https://www.aceinterview.online/api
   NEXT_STATIC_EXPORT=true
   ```
4. **Deploy**
5. **Add custom domain:** Settings → Domains → Add `www.aceinterview.online`
6. **Update DNS** (at your domain registrar):
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Step 4: Update OAuth Providers (5 min)

**GitHub:**
1. https://github.com/settings/developers
2. Add callback: `https://www.aceinterview.online/api/auth/github/callback`

**Google:**
1. https://console.cloud.google.com/apis/credentials
2. Add redirect URI: `https://www.aceinterview.online/api/auth/google/callback`

### Step 5: Initialize Database (1 min)

```bash
curl -X POST https://www.aceinterview.online/api/init-db \
  -H "X-Admin-Secret: your_admin_secret_from_env_local"
```

### Step 6: Test (2 min)

1. Visit https://www.aceinterview.online
2. Click "Continue with GitHub" → Should work ✅
3. Click "Continue with Google" → Should work ✅

**Done!** 🎉

---

## 📁 Environment Variables

### Local Development (`.env.local`)

Create from template:
```bash
cp .env.example .env.local
```

Fill in your values:
```bash
# Database - Railway PostgreSQL Public URL
DATABASE_URL=postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway

# Local URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_secret

# OAuth (from GitHub/Google dashboards)
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

Run local dev:
```bash
./start-dev.sh
```

### Railway Production (Backend)

Set in Railway Dashboard → Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-created by Railway PostgreSQL |
| `APP_URL` | `https://www.aceinterview.online` |
| `API_URL` | `https://www.aceinterview.online/api` |
| `ALLOWED_ORIGINS` | `https://www.aceinterview.online` |
| `JWT_SECRET` | Copy from `.env.local` |
| `ADMIN_SECRET` | Copy from `.env.local` |
| `GITHUB_CLIENT_ID` | Copy from `.env.local` |
| `GITHUB_CLIENT_SECRET` | Copy from `.env.local` |
| `GOOGLE_CLIENT_ID` | Copy from `.env.local` |
| `GOOGLE_CLIENT_SECRET` | Copy from `.env.local` |

### Vercel Production (Frontend)

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://www.aceinterview.online/api` |
| `NEXT_STATIC_EXPORT` | `true` |

---

## 🔧 How It Works

### Single Domain with Vercel Rewrites

```
User Request: www.aceinterview.online/api/auth/github
                        ↓
                Vercel receives request
                        ↓
            Checks vercel.json rewrites
                        ↓
        Proxies to Railway backend
                        ↓
            Railway processes OAuth
                        ↓
        Returns response via Vercel
                        ↓
    User sees: www.aceinterview.online/api/...
```

**Benefits:**
- ✅ No CORS issues (same domain)
- ✅ Clean URLs
- ✅ Simple OAuth setup

### Automatic Deployments

```bash
git push
    ├─► Railway auto-deploys backend
    └─► Vercel auto-deploys frontend
```

---

## 🆘 Troubleshooting

### 404 on /api requests

**Fix:** Check `vercel.json` has correct Railway URL
```bash
# Verify Railway URL
curl https://your-railway-url.up.railway.app/api
# Should return: {"status": "ok", "message": "ML Interview API"}
```

### CORS errors

**Fix:** Check `ALLOWED_ORIGINS` in Railway
```bash
# Must be exactly:
ALLOWED_ORIGINS=https://www.aceinterview.online
# No trailing slash!
```

### OAuth redirect_uri_mismatch

**Fix:** Verify OAuth callback URLs
- GitHub: `https://www.aceinterview.online/api/auth/github/callback`
- Google: `https://www.aceinterview.online/api/auth/google/callback`
- Check `API_URL` in Railway: `https://www.aceinterview.online/api`

### Database connection failed

**Local:** Use Railway **public** URL (`.proxy.rlwy.net`)  
**Production:** Railway auto-uses **internal** URL (`postgres.railway.internal`)

---

## 📚 File Structure

```
.env.local              ← Your secrets (gitignored)
.env.example            ← Template (in git)
vercel.json             ← Vercel config with rewrites
railway.toml            ← Railway config
Procfile                ← Railway start command
DEPLOYMENT.md           ← This file
```

---

## 💡 Tips

- **Secrets:** Use same JWT_SECRET and ADMIN_SECRET in local and production
- **Database:** Railway auto-creates `DATABASE_URL` when you add PostgreSQL
- **URLs:** No trailing slashes in any URL variables
- **Testing:** Test locally first with `./start-dev.sh`
- **Monitoring:** Check Railway logs for backend, Vercel logs for frontend

---

## 🔒 Security Checklist

- ✅ `.env.local` in `.gitignore`
- ✅ Secrets only in Railway/Vercel dashboards
- ✅ OAuth credentials from official providers
- ✅ HTTPS only in production
- ✅ CORS restricted to your domain

---

## 📖 Additional Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com

---

**Questions?** Check the troubleshooting section or review your Railway/Vercel logs.
