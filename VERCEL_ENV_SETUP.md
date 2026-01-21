# Vercel Environment Variables Setup

## 🚀 Quick Start (Automated)

### Step 1: Login to Vercel

```bash
npx vercel login
```

Follow the prompts to authenticate.

### Step 2: Run Setup Script

```bash
./setup-vercel-env.sh
```

This script will:
- Link to your Vercel project
- Show current environment variables
- Ask if you want to remove all existing variables
- Add the correct variables for production

**Done!** ✅

---

## 🔧 Manual Setup (Step-by-Step)

If you prefer to do it manually:

### Step 1: Login and Link

```bash
# Login to Vercel
npx vercel login

# Link to your project
npx vercel link
```

### Step 2: List Current Variables

```bash
npx vercel env ls
```

### Step 3: Remove All Existing Variables (Optional)

```bash
# Remove each variable (replace VAR_NAME with actual name)
npx vercel env rm VAR_NAME production --yes
npx vercel env rm VAR_NAME preview --yes
npx vercel env rm VAR_NAME development --yes
```

### Step 4: Add New Variables

```bash
# Add NEXT_PUBLIC_API_URL
echo "https://www.aceinterview.online/api" | npx vercel env add NEXT_PUBLIC_API_URL production

# Add NEXT_STATIC_EXPORT
echo "true" | npx vercel env add NEXT_STATIC_EXPORT production
```

### Step 5: Verify

```bash
npx vercel env ls
```

Should show:
```
NEXT_PUBLIC_API_URL    production    https://www.aceinterview.online/api
NEXT_STATIC_EXPORT     production    true
```

---

## 📊 Environment Variables Reference

| Variable | Value | Environment | Purpose |
|----------|-------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | `https://www.aceinterview.online/api` | production | Frontend calls backend API |
| `NEXT_STATIC_EXPORT` | `true` | production | Enable static site export |

**Note:** These variables are for **Vercel (frontend) only**. Railway (backend) has different variables.

---

## 🎯 Common Commands

### View all environment variables
```bash
npx vercel env ls
```

### Add a variable
```bash
echo "VALUE" | npx vercel env add VAR_NAME production
```

### Remove a variable
```bash
npx vercel env rm VAR_NAME production --yes
```

### Pull environment variables to local
```bash
npx vercel env pull .env.vercel
```

### Deploy to production
```bash
npx vercel --prod
```

---

## 🔍 Troubleshooting

### "Not logged in"
```bash
npx vercel login
```

### "Project not linked"
```bash
npx vercel link
```

### "Variable already exists"
```bash
# Remove it first
npx vercel env rm VAR_NAME production --yes

# Then add it again
echo "NEW_VALUE" | npx vercel env add VAR_NAME production
```

### Check which project you're linked to
```bash
npx vercel whoami
cat .vercel/project.json
```

---

## ⚠️ Important Notes

1. **Environment Scopes:**
   - `production` - Used in production deployments
   - `preview` - Used in preview deployments (PRs)
   - `development` - Used in local development (`vercel dev`)

2. **NEXT_PUBLIC_ Prefix:**
   - Variables with `NEXT_PUBLIC_` are exposed to the browser
   - They're embedded in the static build
   - Never put secrets in `NEXT_PUBLIC_` variables!

3. **Redeploy After Changes:**
   - Changing environment variables requires a redeploy
   - Either push to GitHub (auto-deploy) or run `npx vercel --prod`

---

## 📝 Complete Workflow

```bash
# 1. Login
npx vercel login

# 2. Link project
npx vercel link

# 3. Setup environment variables
./setup-vercel-env.sh

# 4. Deploy
npx vercel --prod

# 5. Verify
curl https://www.aceinterview.online/api
```

---

## 🎉 Success Criteria

After setup, you should have:
- ✅ 2 environment variables in Vercel
- ✅ Both set to `production` scope
- ✅ `NEXT_PUBLIC_API_URL` = `https://www.aceinterview.online/api`
- ✅ `NEXT_STATIC_EXPORT` = `true`

---

**Next:** Deploy your site with `npx vercel --prod` or push to GitHub! 🚀
