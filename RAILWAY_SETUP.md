# 🚂 Railway Setup Guide - BB-Bounce

**Quick reference for deploying BB-Bounce to Railway**

---

## 📋 Pre-Setup Checklist

- [x] Project committed to Git
- [ ] GitHub repository created (public or private)
- [ ] Railway account logged in
- [ ] Umami website ID obtained (for analytics)

---

## 🚀 Step-by-Step Railway Setup

### Step 1: Push to GitHub

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/bb-bounce.git
git push -u origin main
```

---

### Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"+ New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **`bb-bounce`** repository
5. Railway will auto-detect Node.js and start building ✅

**Project Name**: `bb-bounce-game` (or your preference)

---

### Step 3: Add PostgreSQL Database

**Option A: New PostgreSQL Instance** (Simplest)

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Done! Railway auto-creates `DATABASE_URL` variable ✅

**Option B: Share Umami's PostgreSQL** (Cost-Effective)

1. In Umami's PostgreSQL service, create new database:
   ```bash
   # Connect to Umami's Postgres
   railway connect Postgres  # (in umami project directory)

   # In psql shell:
   CREATE DATABASE bb_bounce;
   \q
   ```

2. In BB-Bounce Railway project:
   - Add reference to Umami's database
   - Manually change database name in URL to `bb_bounce`

**Recommended**: Option A for simplicity (Option B saves ~$7/month)

---

### Step 4: Configure Environment Variables

Click on your **bb-bounce service** → **"Variables"** tab → **"RAW Editor"**

**Copy-paste this entire block:**

```env
# ============================================
# BB-BOUNCE RAILWAY ENVIRONMENT VARIABLES
# ============================================

# Database (auto-configured by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Configuration
NODE_ENV=production
PORT=3000

# Security - DO NOT CHANGE (matches frontend)
SCORE_SECRET=b3481ca0fc3799ed1e124e795eb34420d58281677a4ffa60dfd306b4c7f3fefd

# Rate Limiting (1 submission per 30 seconds)
RATE_LIMIT_WINDOW_MS=30000
RATE_LIMIT_MAX_REQUESTS=1

# CORS - Update after adding custom domain
CORS_ORIGIN=*

# Cloudflare IP Header (for rate limiting behind proxy)
CLIENT_IP_HEADER=CF-Connecting-IP
```

**Click "Save"** (or press Cmd/Ctrl+S)

---

### Step 5: Deploy & Watch Build

Railway will automatically deploy after saving variables.

**Monitor deployment**:
1. Click on latest deployment in "Deployments" tab
2. Watch build logs
3. Wait for "Deployment successful" ✅

**Build time**: ~2-3 minutes (first deploy)

---

### Step 6: Run Database Migrations

After deployment succeeds, initialize the database:

**Via Railway Dashboard**:
1. Click on bb-bounce service
2. Click **"..."** → **"Run a Command"**
3. Enter: `npm run db:migrate`
4. Click "Run"

**Expected output**:
```
🔧 Running database migrations...
✅ Migrations completed successfully!
✅ Table "high_scores" verified
📊 Current scores in database: 0
```

**Optional - Add Sample Data**:
```bash
# Run in Railway command terminal:
npm run db:seed
```

---

### Step 7: Verify Deployment

**Get your Railway URL**:
- In service settings, find "Domains" section
- Default URL: `bb-bounce-production.up.railway.app`

**Test health endpoint**:
```bash
curl https://bb-bounce-production.up.railway.app/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-11T...",
  "uptime": 123.45
}
```

**Test in browser**:
- Visit: `https://bb-bounce-production.up.railway.app`
- Game should load ✅
- Leaderboard should show (empty or sample data)

---

### Step 8: Add Custom Domain

#### 8a. Configure in Railway

1. In bb-bounce service → **"Settings"** → **"Networking"**
2. Under "Custom Domains", click **"+ Custom Domain"**
3. Enter: `brickbreaker.cjunker.dev`
4. **Copy the CNAME target** (e.g., `bb-bounce-production.up.railway.app`)

#### 8b. Add DNS Record in Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select domain: `cjunker.dev`
3. Go to **DNS** → **Records**
4. Click **"+ Add record"**
5. Configure:
   ```
   Type: CNAME
   Name: brickbreaker
   Target: bb-bounce-production.up.railway.app
   Proxy status: Proxied ☁️ (orange cloud - ENABLE)
   TTL: Auto
   ```
6. Click **"Save"**

**Wait 1-5 minutes** for DNS propagation.

#### 8c. Update CORS_ORIGIN

Back in Railway variables, update:

```env
CORS_ORIGIN=https://brickbreaker.cjunker.dev
```

This restricts API access to your domain only.

**Save and redeploy** (Railway auto-redeploys on variable change)

---

### Step 9: Configure Umami Tracking

#### 9a. Create Website in Umami

1. Go to `https://umami.cjunker.dev`
2. Login
3. **Settings** → **"Websites"** → **"+ Add website"**
4. Configure:
   - **Name**: BB-Bounce Game
   - **Domain**: brickbreaker.cjunker.dev
   - **Enable Share URL**: Yes (optional)
5. Click **"Save"**
6. **Copy the Website ID** (looks like: `abc123def456...`)

#### 9b. Update Frontend with Website ID

**You'll need to update the code**:

Edit `public/index.html` line 10:
```html
<script defer src="https://umami.cjunker.dev/script.js"
        data-website-id="YOUR_ACTUAL_WEBSITE_ID"></script>
```

Replace `REPLACE_WITH_YOUR_WEBSITE_ID` with your actual ID.

**Commit and push**:
```bash
git add public/index.html
git commit -m "feat: Add Umami website ID"
git push origin main
```

Railway will auto-redeploy ✅

---

### Step 10: Final Verification

**Test everything**:

1. **Visit game**: `https://brickbreaker.cjunker.dev`
2. **Play and submit score**: Enter name, submit
3. **Check leaderboard**: Score should appear
4. **Verify Umami**: Check analytics dashboard for pageview
5. **Test rate limiting**: Try submitting again (should block for 30s)

**Check logs** (if issues):
```bash
# Via Railway dashboard:
# Service → Deployments → Latest → View Logs

# Or via Railway CLI:
railway logs --tail 100
```

---

## 📊 Environment Variables Summary

**Copy this block into Railway "Variables" tab (RAW Editor)**:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3000
SCORE_SECRET=b3481ca0fc3799ed1e124e795eb34420d58281677a4ffa60dfd306b4c7f3fefd
RATE_LIMIT_WINDOW_MS=30000
RATE_LIMIT_MAX_REQUESTS=1
CORS_ORIGIN=https://brickbreaker.cjunker.dev
CLIENT_IP_HEADER=CF-Connecting-IP
```

**After adding custom domain**, update:
- `CORS_ORIGIN` to your domain

---

## 🐛 Troubleshooting

### Build Fails

**Check**:
- `package.json` and `package-lock.json` committed?
- Node version compatible? (Railway uses Node 18+)

**View logs**: Deployments → Latest → View Logs

### Database Connection Error

**Check**:
- PostgreSQL service added?
- `DATABASE_URL` variable present?
- Run migrations: `npm run db:migrate`

### Health Check Returns 503

**Run migrations**:
```bash
railway run npm run db:migrate
```

### Score Submission Returns 401

**Verify** `SCORE_SECRET` in Railway **exactly matches** the one in `public/index.html`

### Domain Not Working

**Check**:
- DNS propagated? `dig brickbreaker.cjunker.dev +short`
- CNAME pointing to Railway URL?
- SSL certificate active? (may take 5-10 min)

---

## 💰 Cost Estimate

**Monthly cost** (separate PostgreSQL):
- BB-Bounce service: ~730 hrs × $0.01 = $7.30
- PostgreSQL: ~730 hrs × $0.01 = $7.30
- **Total**: ~$14.60/month

**With Railway Hobby Plan** ($20/month):
- Includes 500 hours
- ~230 hours overage = ~$2.30
- **Effective cost**: $22.30/month (both Umami + BB-Bounce)

---

## ✅ Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] Railway project created from GitHub
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Deployment successful (check logs)
- [ ] Database migrations run
- [ ] Custom domain added in Railway
- [ ] Cloudflare DNS record created
- [ ] CORS_ORIGIN updated to custom domain
- [ ] Umami website created
- [ ] Umami website ID added to frontend
- [ ] Game loads at custom domain
- [ ] Score submission works
- [ ] Leaderboard displays correctly
- [ ] Umami tracking verified

---

## 🎯 Quick Commands

```bash
# Push code
git push origin main

# View logs
railway logs --tail 50

# Run migrations
railway run npm run db:migrate

# Seed sample data
railway run npm run db:seed

# Connect to database
railway connect Postgres

# Check deployment status
railway status
```

---

**Need help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

**Status**: 🟢 Ready to deploy!
