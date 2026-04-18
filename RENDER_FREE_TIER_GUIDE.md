# PTLPOS Render Free Plan Deployment Guide

**Plan**: Render Free Tier ($0/month)  
**Deployment Time**: 15-20 minutes  
**Status**: Ready to Deploy ✅

---

## ⚡ Free Plan Overview

### What's Included
- ✅ 1 free web service
- ✅ 750 hours/month (always-on within limits)
- ✅ Auto-spins down after 15 min inactivity (5-10 sec startup time)
- ✅ 0.5 CPU, 512MB RAM
- ✅ GitHub integration with auto-deploy

### What You Need Externally
- 🔗 PostgreSQL database (free options below)
- 🔗 Redis (optional, can skip for free plan)
- 🔗 Mailgun account (for email)

---

## 📦 Step 1: Set Up External Databases (5 minutes)

### Option A: PostgreSQL (Railway.app - Recommended for Free Tier)

1. Go to **https://railway.app**
2. Sign up with GitHub
3. Create new project → Add PostgreSQL
4. Copy connection string from **Railway Dashboard**
   - Format: `postgresql://user:password@host:port/dbname`
5. Save this string - you'll need it for Render

**Cost**: Free tier includes 5GB storage

### Option B: PostgreSQL (Neon.tech - Also Free)

1. Go to **https://neon.tech**
2. Sign up
3. Create new project
4. Copy Postgres connection string
5. Save for later

**Cost**: Free tier with 3GB storage

---

## 🔐 Step 2: Generate Production Secrets (2 minutes)

Run this to generate a strong JWT secret:

```bash
openssl rand -hex 32
```

Copy the output - this is your `JWT_SECRET`

Example output: `a3f5d9c2b1e8f4a6c9d2e5f8a1b3c4d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a`

---

## 🚀 Step 3: Deploy to Render (10 minutes)

### 3.1 Create Render Web Service

1. Go to **https://render.com**
2. Sign up / Log in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your GitHub repository: `ptlpos`
5. Configure:
   - **Name**: `ptlpos-api`
   - **Environment**: `Node`
   - **Plan**: `Free`
   - **Build Command**: `npm install && npm run prisma:generate && npx nest build`
   - **Start Command**: `npm run start:prod`

### 3.2 Add Environment Variables

Click **"Advanced"** and add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Paste from Railway/Neon |
| `JWT_SECRET` | Paste your generated secret |
| `JWT_EXPIRATION` | `24h` |
| `APP_NAME` | `PTLPOS` |
| `MAILGUN_DOMAIN` | Your Mailgun domain |
| `MAILGUN_API_KEY` | Your Mailgun API key |
| `MAILGUN_FROM_EMAIL` | `noreply@ptlpos.com` |
| `REDIS_URL` | (optional - skip for free tier) |

### 3.3 Deploy

1. Click **"Create Web Service"**
2. Render will start building automatically
3. Wait for build to complete (2-3 minutes)
4. Once successful, you'll get a URL like: `https://ptlpos-api.onrender.com`

---

## 💾 Step 4: Initialize Production Database (2 minutes)

After deployment succeeds, run migrations on production database:

### Option A: Via Render Shell (Recommended)

1. In Render dashboard, go to your service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run prisma:push
   npm run prisma:seed
   ```

### Option B: Via Local Terminal

Add DATABASE_URL to your local `.env`:

```bash
# Copy DATABASE_URL from Railway/Neon
export DATABASE_URL="postgresql://user:password@host:port/dbname"

npm run prisma:push
npm run prisma:seed
```

This creates:
- ✅ All database tables
- ✅ Default tenant
- ✅ Admin user
- ✅ Roles and permissions

---

## ✅ Step 5: Verify Deployment (5 minutes)

### Test Health Check

```bash
curl https://ptlpos-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "ptlpos-api",
  "timestamp": "2026-04-18T19:45:32.123Z"
}
```

### Test Login

```bash
curl -X POST https://ptlpos-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ptlpos.local",
    "password": "admin@ptlpos.local"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "...",
  "user": { ... }
}
```

---

## 📋 Environment Variables Reference

**Production (.env for Render)**

```env
# Application
NODE_ENV=production
PORT=3000
APP_NAME=PTLPOS

# Database (from Railway/Neon)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Authentication
JWT_SECRET=your-generated-secret-from-above
JWT_EXPIRATION=24h

# Email (from Mailgun)
MAILGUN_DOMAIN=sandbox.xxxxx.mailgun.org
MAILGUN_API_KEY=key-xxxxxxxxxxxx
MAILGUN_FROM_EMAIL=noreply@ptlpos.com

# Optional - Skip for free tier
REDIS_URL=redis://...
```

---

## ⚠️ Free Tier Considerations

### Startup Time
- **First request**: 5-10 seconds (instance spinning up)
- **Subsequent requests**: <200ms (normal response)
- After 15 minutes of inactivity: spins down, next request slow again

### CPU/Memory
- 0.5 CPU, 512MB RAM
- May be slow with concurrent users (10+)
- Sufficient for small business/testing

### Recommendations
- Upgrade to `Paid ($7/month)` for always-on service
- Scale up if handling >50 concurrent users

### Solutions
- Add **cron monitor** to keep service awake
- Use **Render's new paid instances** ($7/month) for production
- Cache responses with Redis (or skip for free tier)

---

## 🔗 Database Connection Troubleshooting

### "Database connection refused"
- [ ] Verify DATABASE_URL in Render dashboard
- [ ] Check Railway/Neon still running
- [ ] Try connecting locally first:
  ```bash
  psql "postgresql://user:password@host:port/dbname"
  ```

### "Connection pool exhausted"
- Free tier has limited connections
- Ensure PRISMA_POOL_SIZE not too high
- Keep one connection from Render shell

### "SSL certificate error"
- Some databases require SSL
- Add `?sslmode=require` to DATABASE_URL:
  ```
  postgresql://...?sslmode=require
  ```

---

## 🎯 Next Steps

After deployment:

1. **Test workflow**
   - Login to API
   - Create a product
   - Create a sale
   - Generate report

2. **Monitor logs**
   - Render dashboard → Logs tab
   - Watch for errors

3. **Set up monitoring** (optional)
   - Render has built-in metrics
   - Set up email alerts for crashes

4. **Prepare for scaling**
   - If usage grows, upgrade to Paid plan
   - Move to dedicated PostgreSQL (Neon Pro)
   - Add caching with Redis

---

## 💳 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render Web Service | Yes | $0 |
| Railway PostgreSQL | Yes (5GB) | $0 |
| Neon PostgreSQL | Yes (3GB) | $0 |
| Mailgun | Yes (limited) | $0* |
| **Total** | | **$0** |

*Mailgun free tier: 100-1000 emails/month, then pay per email

---

## 🚀 When to Upgrade

Upgrade to paid when:
- [ ] Expecting >50 concurrent users
- [ ] Need always-on service (no spin-down)
- [ ] Database reaches size limit
- [ ] Sending >1000 emails/month

**Recommended upgrade paths:**
- Render Paid: **$7/month** (1GB RAM, always-on)
- Railway PostgreSQL Pro: **$9/month** (unlimited)
- Neon Paid: **$9/month** (unlimited)
- Mailgun: **Pay as you go** ($0.50-1/month for typical usage)

---

## 📚 Useful Links

- [Render Docs](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Neon Documentation](https://neon.tech/docs)
- [Mailgun Email Guide](EMAIL_SETUP.md)
- [Production Readiness Checklist](PRODUCTION_READINESS.md)

---

## ✅ Deployment Checklist

Before clicking deploy:

- [ ] PostgreSQL database created (Railway/Neon)
- [ ] PostgreSQL connection string copied
- [ ] JWT_SECRET generated
- [ ] Mailgun keys ready
- [ ] GitHub repository connected to Render
- [ ] render.yaml file committed to main branch

During deployment:

- [ ] Build completes without errors
- [ ] Service gets public URL
- [ ] Health check returns 200

After deployment:

- [ ] Database migrations run (`npm run prisma:push`)
- [ ] Seed data loaded (`npm run prisma:seed`)
- [ ] Login endpoint tested
- [ ] Health check working

---

## 🆘 Support

If deployment fails:

1. Check Render logs (Logs tab)
2. Verify DATABASE_URL is correct
3. Ensure environment variables set
4. Check build command runs locally: `npm run build`
5. Verify Node.js version (v20 required)

---

**Status**: Ready to deploy! 🎉

Next: Create PostgreSQL on Railway/Neon, then deploy to Render.
