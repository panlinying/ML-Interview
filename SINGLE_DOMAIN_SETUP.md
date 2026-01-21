# Single Domain Setup: www.aceinterview.online

## Architecture

```
User Browser
    │
    └─► https://www.aceinterview.online/
            │
            ├─► /           → Vercel (Frontend - Static Site)
            ├─► /docs/*     → Vercel (Frontend - Static Pages)
            └─► /api/*      → Railway (Backend - FastAPI)
                              ↓
                          Vercel Rewrite
                              ↓
                    https://your-railway-app.up.railway.app/api/*
```

## How It Works

1. **User visits:** `https://www.aceinterview.online/`
   - Served by: Vercel (static HTML/CSS/JS)

2. **User clicks "Continue with GitHub":**
   - Frontend calls: `https://www.aceinterview.online/api/auth/github`
   - Vercel rewrites to: `https://your-railway-app.up.railway.app/api/auth/github`
   - Railway handles OAuth

3. **OAuth callback:**
   - GitHub redirects to: `https://www.aceinterview.online/api/auth/github/callback`
   - Vercel rewrites to Railway
   - Railway processes and redirects user back to frontend

**Benefits:**
- ✅ Single domain - cleaner URLs
- ✅ No CORS issues - same origin
- ✅ Simpler OAuth configuration
- ✅ Better SEO

---

## Configuration Steps

### Step 1: Update vercel.json

Already done! The `vercel.json` now includes:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-railway-app.up.railway.app/api/:path*"
    }
  ]
}
```

**Important:** Replace `your-railway-app.up.railway.app` with your actual Railway URL after deployment.

---

### Step 2: Configure Custom Domain in Vercel

1. Go to your Vercel project
2. Click **"Settings"** → **"Domains"**
3. Add domain: `www.aceinterview.online`
4. Vercel will provide DNS records to add

#### DNS Configuration

Add these records to your domain registrar:

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For root domain (optional):**
```
Type: A
Name: @
Value: 76.76.21.21
```

Wait 5-10 minutes for DNS propagation.

---

### Step 3: Update Railway Environment Variables

In Railway dashboard, set these variables:

```bash
# URLs - Using same domain
APP_URL=https://www.aceinterview.online
API_URL=https://www.aceinterview.online/api
ALLOWED_ORIGINS=https://www.aceinterview.online

# Database (auto-created by Railway)
DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway

# Security Secrets (from your .env.local)
JWT_SECRET=your_jwt_secret
ADMIN_SECRET=your_admin_secret

# OAuth Credentials (from your .env.local)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

### Step 4: Update Vercel Environment Variables

In Vercel dashboard, set:

```bash
NEXT_PUBLIC_API_URL=https://www.aceinterview.online/api
NEXT_STATIC_EXPORT=true
```

**Note:** The API URL now points to the same domain with `/api` path!

---

### Step 5: Update OAuth Provider Callback URLs

#### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click on your OAuth app
3. Update **Authorization callback URL:**

```
https://www.aceinterview.online/api/auth/github/callback
http://localhost:8000/api/auth/github/callback
```

#### Google OAuth App

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Update **Authorized redirect URIs:**

```
https://www.aceinterview.online/api/auth/google/callback
http://localhost:8000/api/auth/google/callback
```

---

### Step 6: Update vercel.json with Actual Railway URL

After deploying to Railway, get your Railway URL and update `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ml-interview-production.up.railway.app/api/:path*"
    }
  ]
}
```

Commit and push:

```bash
git add vercel.json
git commit -m "feat: configure Vercel rewrites for single domain setup"
git push
```

Vercel will automatically redeploy with the new configuration.

---

## Testing

### Test Frontend

Visit: `https://www.aceinterview.online/`

Should see: Your ML Interview homepage ✅

### Test Backend API (via Vercel Rewrite)

Visit: `https://www.aceinterview.online/api`

Should see: `{"status": "ok", "message": "ML Interview API"}` ✅

### Test OAuth Flow

1. Click **"Continue with GitHub"**
2. Should redirect to GitHub
3. Authorize
4. Should redirect back to `https://www.aceinterview.online/` and be logged in ✅

---

## Local Development

Your local setup remains unchanged:

```bash
# .env.local
DATABASE_URL=postgresql://postgres:PASSWORD@caboose.proxy.rlwy.net:23967/railway
API_URL=http://localhost:8000
APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

Run:
```bash
./start-dev.sh
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- OAuth callbacks go to localhost:8000

---

## Environment Variables Summary

### Production

| Service | Variable | Value |
|---------|----------|-------|
| **Railway** | `APP_URL` | `https://www.aceinterview.online` |
| **Railway** | `API_URL` | `https://www.aceinterview.online/api` |
| **Railway** | `ALLOWED_ORIGINS` | `https://www.aceinterview.online` |
| **Vercel** | `NEXT_PUBLIC_API_URL` | `https://www.aceinterview.online/api` |

### Local Development

| Variable | Value |
|----------|-------|
| `APP_URL` | `http://localhost:3000` |
| `API_URL` | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:8000` |

---

## OAuth Callback URLs

### Production

| Provider | Callback URL |
|----------|--------------|
| **GitHub** | `https://www.aceinterview.online/api/auth/github/callback` |
| **Google** | `https://www.aceinterview.online/api/auth/google/callback` |

### Local Development

| Provider | Callback URL |
|----------|--------------|
| **GitHub** | `http://localhost:8000/api/auth/github/callback` |
| **Google** | `http://localhost:8000/api/auth/google/callback` |

---

## Troubleshooting

### Issue: 404 on /api requests

**Cause:** Vercel rewrite not configured or Railway URL is wrong

**Fix:**
1. Check `vercel.json` has correct Railway URL
2. Verify Railway app is deployed and accessible
3. Check Vercel deployment logs

### Issue: CORS errors

**Cause:** `ALLOWED_ORIGINS` in Railway doesn't match your domain

**Fix:**
1. In Railway, set `ALLOWED_ORIGINS=https://www.aceinterview.online`
2. No trailing slash
3. Must match exactly

### Issue: OAuth redirect_uri_mismatch

**Cause:** OAuth provider callback URL doesn't match

**Fix:**
1. Verify GitHub/Google OAuth apps have: `https://www.aceinterview.online/api/auth/[provider]/callback`
2. Check `API_URL` in Railway is: `https://www.aceinterview.online/api`
3. No trailing slashes

### Issue: Vercel rewrite not working

**Cause:** Vercel hasn't redeployed with new config

**Fix:**
1. Push changes to GitHub
2. Wait for Vercel to redeploy
3. Check Vercel deployment logs
4. Try clearing browser cache

---

## Advantages of Single Domain Setup

✅ **No CORS issues** - Same origin for frontend and backend  
✅ **Cleaner URLs** - All under `www.aceinterview.online`  
✅ **Simpler OAuth** - Single domain in callback URLs  
✅ **Better SEO** - All content under one domain  
✅ **Professional** - Looks more polished  

---

## How Vercel Rewrites Work

```
User Request: https://www.aceinterview.online/api/auth/github
                                    ↓
                            Vercel receives request
                                    ↓
                    Checks vercel.json rewrites rules
                                    ↓
                    Matches: /api/:path* → Railway
                                    ↓
            Proxies to: https://railway-app.up.railway.app/api/auth/github
                                    ↓
                        Railway processes request
                                    ↓
                    Returns response to Vercel
                                    ↓
                Vercel returns response to user
                                    ↓
        User sees response from www.aceinterview.online/api/auth/github
```

The user never sees the Railway URL - it's all transparent!

---

## Next Steps

1. ✅ `vercel.json` updated with rewrites (already done)
2. ⏭️ Deploy to Railway (get Railway URL)
3. ⏭️ Update `vercel.json` with actual Railway URL
4. ⏭️ Deploy to Vercel
5. ⏭️ Configure custom domain in Vercel
6. ⏭️ Update DNS records
7. ⏭️ Update OAuth providers
8. ⏭️ Test everything

**Ready to deploy!** 🚀
