# 🚀 Railway Deployment Guide - BB-Bounce

**Complete guide to deploying BB-Bounce on Railway with PostgreSQL and custom domain integration.**

---

## 📋 Pre-Deployment Checklist

- [x] GitHub repository ready
- [ ] Railway account created ([railway.app](https://railway.app))
- [ ] Custom domain configured (optional: `brickbreaker.cjunker.dev`)
- [ ] Secrets generated (see below)

---

## 🔐 Step 1: Generate Secrets

**CRITICAL**: Generate a secure secret token to prevent score manipulation.

```bash
# Generate SCORE_SECRET
openssl rand -hex 32
```

**Save this value** - you'll need it in Railway environment variables AND in your frontend code.

---

## 🚂 Step 2: Create Railway Project

### Option A: GitHub Integration (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"+ New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose this repository (`bb-bounce`)
5. Railway will auto-detect the Node.js project ✅

### Option B: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to GitHub
railway link
```

---

## 🗄️ Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically:
   - Creates PostgreSQL 16 instance
   - Generates `DATABASE_URL` variable
   - Links to your BB-Bounce service ✅

**No manual configuration needed!**

---

## ⚙️ Step 4: Configure Environment Variables

### Via Railway Dashboard

1. Click on your **BB-Bounce service** (not the database)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** or **"RAW Editor"**
4. Add the following:

```env
# Database (auto-configured by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Configuration
NODE_ENV=production
PORT=3000

# Security - REPLACE with your generated secret from Step 1
SCORE_SECRET=your-generated-secret-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=30000
RATE_LIMIT_MAX_REQUESTS=1

# CORS (adjust for your domain)
CORS_ORIGIN=https://brickbreaker.cjunker.dev,https://cjunker.dev
# Or allow all origins (dev only): CORS_ORIGIN=*

# Cloudflare IP Header (if using Cloudflare proxy)
CLIENT_IP_HEADER=CF-Connecting-IP
```

5. Click **"Save"**

### Via Railway CLI

```bash
railway variables set SCORE_SECRET="your-generated-secret"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://brickbreaker.cjunker.dev"
railway variables set CLIENT_IP_HEADER="CF-Connecting-IP"
```

---

## 📝 Step 5: Update Frontend with Secret

**IMPORTANT**: The frontend needs the same SCORE_SECRET to submit scores.

Edit `public/index.html` and replace:

```javascript
const SCORE_SECRET = 'REPLACE_THIS_IN_PRODUCTION';
```

With:

```javascript
const SCORE_SECRET = 'your-generated-secret-here';
```

**Commit this change**:

```bash
git add public/index.html
git commit -m "feat: Add production SCORE_SECRET"
git push origin main
```

---

## 🏗️ Step 6: Deploy

### Auto-Deploy (Recommended)

Railway automatically deploys when you push to GitHub:

```bash
git push origin main
```

Watch deployment logs in Railway dashboard:
- Click on latest deployment
- View build and runtime logs

**Build time**: ~2-3 minutes (first deploy), ~30 seconds (cached builds)

### Manual Deploy via CLI

```bash
railway up
```

---

## 🗃️ Step 7: Initialize Database

After first deployment, run migrations to create tables:

### Via Railway Dashboard

1. Go to your **BB-Bounce service**
2. Click **"..."** → **"Run Command"**
3. Enter: `npm run db:migrate`
4. Wait for success message ✅

### Via Railway CLI

```bash
railway run npm run db:migrate
```

**Expected output**:
```
🔧 Running database migrations...
✅ Migrations completed successfully!
✅ Table "high_scores" verified
📊 Current scores in database: 0
```

### Optional: Add Sample Data

```bash
railway run npm run db:seed
```

This adds 10 sample high scores for testing.

---

## 🌐 Step 8: Add Custom Domain (Optional)

### Railway Configuration

1. In BB-Bounce service, go to **"Settings"** → **"Networking"**
2. Click **"+ Custom Domain"**
3. Enter: `brickbreaker.cjunker.dev` (or your subdomain)
4. Copy the CNAME target (e.g., `bb-bounce-production.up.railway.app`)

### Cloudflare DNS Configuration

1. Go to Cloudflare dashboard → **DNS** → **Records**
2. Click **"+ Add record"**
3. Configure:
   ```
   Type: CNAME
   Name: brickbreaker
   Target: <railway-cname-from-above>
   Proxy status: Proxied ☁️ (orange cloud)
   TTL: Auto
   ```
4. Click **"Save"**

**Wait 1-5 minutes** for DNS propagation.

### Verify Custom Domain

```bash
curl -I https://brickbreaker.cjunker.dev/health
```

**Expected**: `HTTP/2 200` with JSON response

---

## ✅ Step 9: Verify Deployment

### 1. Health Check

```bash
curl https://brickbreaker.cjunker.dev/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Leaderboard API

```bash
curl https://brickbreaker.cjunker.dev/api/scores
```

**Expected**: JSON array of scores (or empty if no submissions yet)

### 3. Frontend

1. Visit: `https://brickbreaker.cjunker.dev`
2. Play game and achieve a score
3. Submit score with your name
4. Verify it appears in leaderboard

### 4. Check Logs

**Railway Dashboard**:
- Service → **"Deployments"** → Click latest → **"View Logs"**

**Railway CLI**:
```bash
railway logs --tail 100
```

---

## 🐛 Troubleshooting

### Build Fails

**Check deployment logs**:
```bash
railway logs --deployment
```

**Common issues**:
- ❌ Missing `package.json` → Ensure it's in repo root
- ❌ Node version mismatch → Railway uses Node 18+ by default
- ❌ Build command fails → Check `npm install` works locally

**Fix**: Ensure `package.json` and `package-lock.json` are committed.

### Database Connection Fails

**Verify DATABASE_URL is set**:
```bash
railway variables | grep DATABASE_URL
```

**Test connection**:
```bash
railway run psql $DATABASE_URL -c "SELECT NOW();"
```

**If connection fails**:
- Ensure PostgreSQL database is added to project
- Check that `DATABASE_URL` references correct database service

### Health Check Returns 503

**Check database is initialized**:
```bash
railway run npm run db:migrate
```

**Check server logs**:
```bash
railway logs --tail 50
```

**Common causes**:
- Database migrations not run
- Missing environment variables
- PostgreSQL service not started

### Score Submission Returns 401

**Error**: "Invalid authentication token"

**Fix**: Ensure `SCORE_SECRET` in Railway matches the value in `public/index.html`

```bash
# Check Railway secret
railway variables | grep SCORE_SECRET

# Update frontend if needed
# Edit public/index.html → const SCORE_SECRET = '...'
```

### Rate Limit Too Strict (429 Error)

**Adjust rate limits** in Railway variables:

```bash
railway variables set RATE_LIMIT_WINDOW_MS="60000"  # 1 minute
railway variables set RATE_LIMIT_MAX_REQUESTS="5"   # 5 submissions
```

**Redeploy** to apply changes.

### CORS Errors in Browser Console

**Error**: "Access to fetch at ... has been blocked by CORS policy"

**Fix**: Update `CORS_ORIGIN` to include your domain:

```bash
railway variables set CORS_ORIGIN="https://brickbreaker.cjunker.dev"
```

For development, temporarily allow all:
```bash
railway variables set CORS_ORIGIN="*"
```

### Domain Not Working

**Check DNS propagation**:
```bash
dig brickbreaker.cjunker.dev +short
```

**Should show**: Cloudflare proxy IPs or Railway CNAME

**Clear DNS cache** (if needed):
```bash
# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

**Verify SSL certificate**:
```bash
curl -I https://brickbreaker.cjunker.dev
```

Should show `HTTP/2 200` (not SSL errors)

---

## 📊 Monitoring & Maintenance

### View Metrics (Railway Dashboard)

- **CPU/Memory usage**: Service → "Metrics"
- **Network traffic**: Service → "Metrics" → "Network"
- **Database size**: PostgreSQL service → "Metrics"

### Check Leaderboard Stats

```bash
curl https://brickbreaker.cjunker.dev/api/stats
```

Returns:
```json
{
  "total_scores": 42,
  "average_score": 3500,
  "highest_score": 8500,
  "highest_level": 15
}
```

### Database Backup

**Manual backup**:
```bash
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

**Restore from backup**:
```bash
railway run psql $DATABASE_URL < backup-20251111.sql
```

### Pruning Old Scores

To enable auto-cleanup (scores older than 30 days), uncomment in `db/schema.sql`:

```sql
CREATE TRIGGER trigger_cleanup_scores
  AFTER INSERT ON high_scores
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_scores();
```

Then re-run migrations:
```bash
railway run npm run db:migrate
```

---

## 💰 Cost Monitoring

**Railway Free Tier**:
- $5 credit/month
- 500 hours/month
- PostgreSQL included

**Estimated usage** (BB-Bounce + PostgreSQL):
- ~730 hours/month (24/7 uptime)
- **Cost**: $0.01/hour × 230 hours over limit = **~$2.30/month**

**Tips to reduce costs**:
1. Use Railway's **Hobby Plan**: $5/month with 500 hours included
2. Enable **sleep mode** for non-production environments
3. Monitor usage in Railway dashboard

---

## 🔄 Updating Your Deployment

### Deploy New Features

```bash
# Make changes locally
git add .
git commit -m "feat: Add new feature"
git push origin main
```

Railway auto-deploys on push ✅

### Update Environment Variables

```bash
# Update via CLI
railway variables set NEW_VAR="value"

# Or via dashboard: Variables → Edit
```

Changes apply on next deployment.

### Rollback to Previous Version

**Railway Dashboard**:
1. Service → "Deployments"
2. Find last working deployment
3. Click "..." → "Redeploy"

**Railway CLI**:
```bash
railway rollback
```

---

## 🎯 Production Checklist

Before going live:

- [ ] `SCORE_SECRET` set in both Railway and `index.html`
- [ ] Database migrations run successfully
- [ ] Custom domain configured (if applicable)
- [ ] CORS configured for your domain
- [ ] Health check returns 200
- [ ] Leaderboard API returns data
- [ ] Score submission works (test with game)
- [ ] Logs show no errors
- [ ] SSL certificate valid (https://)
- [ ] Rate limiting tested (can't spam submit)

---

## 🔗 Useful Resources

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
- [Custom Domains Guide](https://docs.railway.app/deploy/deployments#custom-domains)
- [Environment Variables](https://docs.railway.app/develop/variables)

---

## 📞 Support

**Issues?**
- Check Railway logs: `railway logs`
- Review troubleshooting section above
- Open issue in repository

**Questions?**
- Railway Discord: https://discord.gg/railway
- Railway Help Center: https://help.railway.app

---

**Deployment Status**: 🟢 Production Ready

**Last Updated**: November 2025

**Next Steps**: [See README.md for gameplay and features](../README.md)
