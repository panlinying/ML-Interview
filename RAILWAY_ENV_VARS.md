# Railway Environment Variables Setup

## Quick Reference: Copy-Paste These Into Railway

Once you've deployed your backend to Railway, add these environment variables in the **Variables** tab:

---

## 1. Database (Auto-Created by Railway)

When you add PostgreSQL to your Railway project, it automatically creates:

```bash
DATABASE_URL=postgresql://postgres:WMFkwoEeRvrykxHSGeqsWwLJGZZsGWCg@postgres.railway.internal:5432/railway
```

✅ **You don't need to manually set this** - Railway does it automatically!

If it's not set, Railway should have these variables:
- `PGHOST=postgres.railway.internal`
- `PGPORT=5432`
- `PGUSER=postgres`
- `PGPASSWORD=WMFkwoEeRvrykxHSGeqsWwLJGZZsGWCg`
- `PGDATABASE=railway`

---

## 2. Security Secrets (Copy from .env.local)

```bash
JWT_SECRET=7a861f848b7f68af820b1111783709a03e262663dd43115fc67a80ae02b65a5c
ADMIN_SECRET=0c02a84163aa2b04eca4f6ff5650789c8f7cc7426b0d3461b2fbc06ae7dc0d5f
```

---

## 3. OAuth Credentials (Copy from .env.local)

```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Note:** Copy these values from your local `.env.local` file.

---

## 4. URLs (Update After Deployment)

### Step 1: Get Your Railway URL

After deploying, go to **Settings** → **Networking** → **Generate Domain**

You'll get something like: `https://ml-interview-production.up.railway.app`

### Step 2: Set These Variables

```bash
# Your Railway backend URL (from Step 1)
API_URL=https://ml-interview-production.up.railway.app

# Your Vercel frontend URL (you'll get this after deploying to Vercel)
APP_URL=https://ml-interview.vercel.app

# Same as APP_URL (for CORS)
ALLOWED_ORIGINS=https://ml-interview.vercel.app
```

**Note:** You'll need to update `APP_URL` and `ALLOWED_ORIGINS` after you deploy to Vercel.

---

## Summary: All Variables at a Glance

| Variable | Value | When to Set |
|----------|-------|-------------|
| `DATABASE_URL` | Auto-created by Railway | ✅ Automatic |
| `JWT_SECRET` | From .env.local | ⚙️ Now |
| `ADMIN_SECRET` | From .env.local | ⚙️ Now |
| `GITHUB_CLIENT_ID` | From .env.local | ⚙️ Now |
| `GITHUB_CLIENT_SECRET` | From .env.local | ⚙️ Now |
| `GOOGLE_CLIENT_ID` | From .env.local | ⚙️ Now |
| `GOOGLE_CLIENT_SECRET` | From .env.local | ⚙️ Now |
| `API_URL` | Your Railway URL | ⏳ After Railway deploys |
| `APP_URL` | Your Vercel URL | ⏳ After Vercel deploys |
| `ALLOWED_ORIGINS` | Your Vercel URL | ⏳ After Vercel deploys |

---

## Step-by-Step Setup

### 1. Deploy Backend to Railway

1. Go to https://railway.app
2. **"Start a New Project"** → **"Deploy from GitHub repo"**
3. Select: `panlinying/ML-Interview`
4. Wait for initial deployment

### 2. Add PostgreSQL

1. In Railway project, click **"+ New"**
2. **"Database"** → **"Add PostgreSQL"**
3. Railway auto-creates `DATABASE_URL`

### 3. Add Environment Variables

Click **"Variables"** tab and add (copy values from your `.env.local`):

```bash
JWT_SECRET=your_jwt_secret_from_env_local
ADMIN_SECRET=your_admin_secret_from_env_local
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Generate Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://ml-interview-production.up.railway.app`)

### 5. Add URL Variables

Add these to **Variables** tab:

```bash
API_URL=https://your-railway-url.up.railway.app
APP_URL=https://ml-interview.vercel.app
ALLOWED_ORIGINS=https://ml-interview.vercel.app
```

### 6. Verify Deployment

Visit: `https://your-railway-url.up.railway.app/api`

You should see:
```json
{"status": "ok", "message": "ML Interview API"}
```

---

## Database Connection Details

### For Railway Backend (Production)

Railway automatically uses the **internal URL**:
```
postgresql://postgres:WMFkwoEeRvrykxHSGeqsWwLJGZZsGWCg@postgres.railway.internal:5432/railway
```

✅ **Benefits:**
- Faster (no internet roundtrip)
- More secure (stays within Railway network)
- Free (no egress charges)

### For Local Development

Your `.env.local` uses the **public URL**:
```
postgresql://postgres:WMFkwoEeRvrykxHSGeqsWwLJGZZsGWCg@caboose.proxy.rlwy.net:23967/railway
```

This allows your local machine to connect to Railway's database.

---

## Next Steps

1. ✅ Deploy backend to Railway (add variables above)
2. ⏭️ Deploy frontend to Vercel
3. ⏭️ Update OAuth providers with Railway URLs
4. ⏭️ Initialize production database
5. ⏭️ Test OAuth flow

See `DEPLOYMENT_GUIDE.md` for complete instructions.
