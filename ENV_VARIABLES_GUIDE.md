# Environment Variables Guide

## 📁 File Structure

```
.env.local              ← Your local development (NOT in git)
.env.example            ← Template for .env.local (IN git)
ENV_VARIABLES_GUIDE.md  ← This file (IN git)
```

**Important:**
- ✅ `.env.local` - Your actual secrets (gitignored, never commit)
- ✅ `.env.example` - Template without real values (committed to git)
- ✅ This guide - Documentation (committed to git)

---

## 🎯 Environment Variables by Service

### 1. Local Development (`.env.local`)

Create this file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in your actual values:

```bash
# Database - Railway PostgreSQL Public URL
DATABASE_URL=postgresql://postgres:WMFkwoEeRvrykxHSGeqsWwLJGZZsGWCg@caboose.proxy.rlwy.net:23967/railway

# Local URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Security Secrets
JWT_SECRET=7a861f848b7f68af820b1111783709a03e262663dd43115fc67a80ae02b65a5c
ADMIN_SECRET=0c02a84163aa2b04eca4f6ff5650789c8f7cc7426b0d3461b2fbc06ae7dc0d5f

# OAuth Credentials (copy from your .env.local)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Usage:** Run `./start-dev.sh` - it automatically loads `.env.local`

---

### 2. Railway Production (Backend)

**Where to set:** Railway Dashboard → Your Project → Variables tab

**Click "New Variable" and add each:**

```bash
# Database - Auto-created by Railway when you add PostgreSQL
# Usually you don't need to set this manually
DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway

# Production URLs (Single Domain Setup)
APP_URL=https://www.aceinterview.online
API_URL=https://www.aceinterview.online/api
ALLOWED_ORIGINS=https://www.aceinterview.online

# Security Secrets (SAME as .env.local)
JWT_SECRET=7a861f848b7f68af820b1111783709a03e262663dd43115fc67a80ae02b65a5c
ADMIN_SECRET=0c02a84163aa2b04eca4f6ff5650789c8f7cc7426b0d3461b2fbc06ae7dc0d5f

# OAuth Credentials (copy from your .env.local)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**How to add:**
1. Go to https://railway.app
2. Open your project
3. Click on your service (backend)
4. Go to **"Variables"** tab
5. Click **"New Variable"**
6. Paste name and value
7. Click **"Add"**
8. Repeat for each variable

---

### 3. Vercel Production (Frontend)

**Where to set:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

```bash
# API URL (Single Domain Setup)
NEXT_PUBLIC_API_URL=https://www.aceinterview.online/api

# Enable static export
NEXT_STATIC_EXPORT=true
```

**How to add:**
1. Go to https://vercel.com
2. Open your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Enter variable name
5. Enter value
6. Select environment: **Production**, **Preview**, **Development** (check all)
7. Click **"Save"**
8. Repeat for each variable

---

## 📊 Quick Reference Table

| Variable | Local (.env.local) | Railway (Production) | Vercel (Production) |
|----------|-------------------|---------------------|---------------------|
| `DATABASE_URL` | Public Railway URL | Internal Railway URL | ❌ Not needed |
| `APP_URL` | `http://localhost:3000` | `https://www.aceinterview.online` | ❌ Not needed |
| `API_URL` | `http://localhost:8000` | `https://www.aceinterview.online/api` | ❌ Not needed |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | ❌ Not needed | `https://www.aceinterview.online/api` |
| `ALLOWED_ORIGINS` | `localhost:3000,localhost:8000` | `https://www.aceinterview.online` | ❌ Not needed |
| `JWT_SECRET` | Your secret | Same as local | ❌ Not needed |
| `ADMIN_SECRET` | Your secret | Same as local | ❌ Not needed |
| `GITHUB_CLIENT_ID` | Your ID | Same as local | ❌ Not needed |
| `GITHUB_CLIENT_SECRET` | Your secret | Same as local | ❌ Not needed |
| `GOOGLE_CLIENT_ID` | Your ID | Same as local | ❌ Not needed |
| `GOOGLE_CLIENT_SECRET` | Your secret | Same as local | ❌ Not needed |
| `NEXT_STATIC_EXPORT` | ❌ Not needed | ❌ Not needed | `true` |

---

## 🔑 Variable Explanations

### Database

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |

**Local:** Use Railway's **public URL** (`.proxy.rlwy.net`) so your laptop can connect  
**Production:** Railway auto-creates with **internal URL** (`postgres.railway.internal`)

### URLs

| Variable | Purpose | Used By |
|----------|---------|---------|
| `APP_URL` | Frontend URL (for redirects after OAuth) | Backend |
| `API_URL` | Backend URL (for OAuth callbacks) | Backend |
| `NEXT_PUBLIC_API_URL` | Backend URL (for API calls from browser) | Frontend |
| `ALLOWED_ORIGINS` | CORS allowed origins | Backend |

**Local:** Use `localhost` URLs  
**Production:** Use `www.aceinterview.online` (single domain setup)

### Security

| Variable | Purpose | Generate With |
|----------|---------|---------------|
| `JWT_SECRET` | Sign JWT tokens | `openssl rand -hex 32` |
| `ADMIN_SECRET` | Protect admin endpoints | `openssl rand -hex 32` |

**Important:** Use the **same values** in local and production!

### OAuth

| Variable | Purpose | Get From |
|----------|---------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app ID | https://github.com/settings/developers |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret | GitHub OAuth app settings |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console |

**Important:** Use the **same values** in local and production!

### Build

| Variable | Purpose | Value |
|----------|---------|-------|
| `NEXT_STATIC_EXPORT` | Enable Next.js static export | `true` |

**Only needed in Vercel production** - tells Next.js to build as static site

---

## 🚀 Setup Workflow

### Step 1: Local Development

```bash
# 1. Copy example file
cp .env.example .env.local

# 2. Edit .env.local with your actual values
# (Use your text editor)

# 3. Start development
./start-dev.sh
```

### Step 2: Railway Production

```bash
# 1. Deploy to Railway
# (Follow SINGLE_DOMAIN_SETUP.md)

# 2. Add PostgreSQL database
# (Railway auto-creates DATABASE_URL)

# 3. Add environment variables
# (Copy from your .env.local, but change URLs to production)
```

### Step 3: Vercel Production

```bash
# 1. Deploy to Vercel
# (Follow SINGLE_DOMAIN_SETUP.md)

# 2. Add environment variables
# (Only NEXT_PUBLIC_API_URL and NEXT_STATIC_EXPORT)

# 3. Configure custom domain
# (www.aceinterview.online)
```

---

## ⚠️ Security Best Practices

### ✅ DO

- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use different secrets for different environments (if possible)
- ✅ Rotate secrets regularly
- ✅ Use environment variables in Railway/Vercel dashboards
- ✅ Keep `.env.example` updated (without real values)

### ❌ DON'T

- ❌ Commit `.env.local` to git
- ❌ Share secrets in chat/email
- ❌ Use production secrets in local development
- ❌ Hardcode secrets in code
- ❌ Expose secrets in client-side code

---

## 🔍 Troubleshooting

### Issue: "Environment variable not found"

**Check:**
1. Is the variable in `.env.local`? (for local dev)
2. Is the variable in Railway/Vercel dashboard? (for production)
3. Did you restart the server after adding it?
4. Is the variable name spelled correctly?

### Issue: "CORS error"

**Check:**
1. `ALLOWED_ORIGINS` in Railway matches your frontend URL
2. No trailing slashes in URLs
3. Protocol matches (http vs https)

### Issue: "Database connection failed"

**Check:**
1. Local: Using **public** Railway URL (`.proxy.rlwy.net`)
2. Production: Using **internal** Railway URL (`postgres.railway.internal`)
3. Railway PostgreSQL is running
4. Credentials are correct

### Issue: "OAuth redirect_uri_mismatch"

**Check:**
1. `API_URL` in Railway matches OAuth callback domain
2. OAuth provider has correct callback URLs
3. No trailing slashes

---

## 📝 Cheat Sheet

### Generate Secrets

```bash
# JWT Secret
openssl rand -hex 32

# Admin Secret
openssl rand -hex 32
```

### Check Current Environment

```bash
# Local development
cat .env.local | grep -v "^#" | grep -v "^$"

# Railway (in Railway dashboard)
# Go to Variables tab

# Vercel (in Vercel dashboard)
# Go to Settings → Environment Variables
```

### Copy Production Values to Local

```bash
# Don't do this! Use different values for security
# But if you must for testing:

# 1. Get values from Railway/Vercel dashboards
# 2. Update .env.local
# 3. Change URLs to localhost
```

---

## 📚 Related Documentation

- **`SINGLE_DOMAIN_SETUP.md`** - Single domain deployment guide
- **`DEPLOYMENT_GUIDE.md`** - General deployment guide
- **`RAILWAY_ENV_VARS.md`** - Railway-specific variables
- **`DEVELOPMENT.md`** - Local development setup

---

## 🆘 Need Help?

1. Check if `.env.local` exists and has correct values
2. Verify Railway/Vercel dashboards have variables set
3. Check this guide for correct variable names
4. See troubleshooting section above
5. Check deployment documentation

---

**Remember:** 
- `.env.local` = Your secrets (never commit)
- `.env.example` = Template (safe to commit)
- Railway/Vercel dashboards = Production secrets (never commit)
