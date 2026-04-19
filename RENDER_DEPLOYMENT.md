# 🚀 PTLPOS Production Deployment - Quick Start (Render)

## ✅ Do These NOW (In Order)

### Step 1: Local Verification (5 minutes)
```bash
# Regenerate Prisma client with Branch model
npm run prisma:generate

# Compile TypeScript
npm run build

# Run all tests (should pass)
npm test

# Check code quality
npm run lint
```

**Expected Result**: All commands succeed with no errors

---

### Step 2: Create Render Services (via Render Dashboard)

1. **PostgreSQL Database**
   - Go to: https://dashboard.render.com
   - Click: "+ New" → "PostgreSQL"
   - Name: `ptlpos-db`
   - Version: Latest (15+)
   - Region: Closest to your users
   - Click Create
   - Copy connection string (save it!)

2. **Redis Cache** (Optional but recommended)
   - Click: "+ New" → "Redis"
   - Name: `ptlpos-redis`
   - Region: Same as database
   - Click Create
   - Copy connection string (save it!)

3. **Web Service**
   - Click: "+ New" → "Web Service"
   - Connect your GitHub repo
   - Name: `ptlpos-api`
   - Environment: `Node`
   - Build Command: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`
   - Plan: Starter or paid (minimum 0.5 vCPU, 1GB RAM)
   - Click Create (DON'T deploy yet!)

---

### Step 3: Configure Environment Variables

In Render Web Service Dashboard, go to **Environment**:

```
NODE_ENV=production
DATABASE_URL=postgresql://[user:password@]host:5432/[dbname]
REDIS_URL=redis://[user:password@]host:6379
JWT_SECRET=generate_strong_secret_here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
LOG_LEVEL=info
```

**To generate JWT_SECRET**:
```bash
# In your terminal, run:
openssl rand -hex 32
# Copy the output and paste in Render dashboard
```

---

### Step 4: Deploy & Migrate Database

1. **Trigger Deploy**
   - In Render dashboard, click Deploy button
   - Wait for build to complete (3-5 minutes)
   - Check logs for any errors

2. **Run Database Migration**
   Once deployed, open terminal and run:
   ```bash
   # Migrate schema to production database
   DATABASE_URL='postgresql://user:pass@host:5432/dbname' npm run prisma:push
   
   # Seed admin user
   DATABASE_URL='postgresql://user:pass@host:5432/dbname' npm run prisma:seed
   ```
   
   Or via Render CLI:
   ```bash
   render deploy --service-id <service-id>
   ```

---

### Step 5: Test Production API

Once deployment completes:

```bash
# Test health endpoint
curl https://ptlpos-api.onrender.com/health

# Test login (get your admin user credentials)
curl -X POST https://ptlpos-api.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# If successful, you'll get a JWT token
```

---

## ⏱️ Total Time Required
- **Preparation**: 5 minutes
- **Render Setup**: 10 minutes
- **Deployment**: 5 minutes
- **Testing**: 5 minutes
- **TOTAL**: ~30 minutes

---

## 🧪 Tests to Run Locally First

```bash
# Run complete test suite
npm test

# Expected output:
# ✅ Unit Tests: 19/19 pass
# ✅ Workflow Tests: 38/38 pass
# ✅ Load Tests: 11/11 pass  
# ✅ Reliability Tests: 14/14 pass
# Total: 82 tests passing
# Duration: 4-6 minutes
```

If any test fails, check:
1. Database is created locally
2. .env file is configured
3. All migrations applied: `npm run prisma:push`
4. Redis is running (if using locally)

---

## 📋 Pre-Deployment Checklist

- [ ] Run: `npm run prisma:generate`
- [ ] Run: `npm run build` (verify success)
- [ ] Run: `npm test` (verify all pass)
- [ ] Create PostgreSQL on Render
- [ ] Create Redis on Render (optional)
- [ ] Create Web Service on Render
- [ ] Add environment variables in Render
- [ ] Trigger deployment in Render
- [ ] Wait for build to complete
- [ ] Run database migration
- [ ] Test health endpoint
- [ ] Test login endpoint
- [ ] Verify database has data

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Database password is strong
- [ ] Redis requires password
- [ ] No secrets in code или git history
- [ ] HTTPS enabled (Render provides this)
- [ ] Database URL uses correct region

---

## 📊 Expected Metrics After Deployment

```
API Response Time: <300ms average
Uptime: 99%+ (Render SLA)
Concurrent Users: 100+
Error Rate: <1%
```

---

## 🆘 Troubleshooting Quick Ref

| Issue | Solution |
|-------|----------|
| Database error on deploy | Run `npm run prisma:push` with correct DATABASE_URL |
| Build fails | Check build log, run `npm run build` locally |
| API won't start | Check environment variables in Render dashboard |
| Cannot connect to db | Verify DATABASE_URL is correct and network allows connection |
| Get "502 Bad Gateway" | Check app logs in Render dashboard |

---

## ✅ Your Admin Credentials

Once deployed, login with:
```
Email: admin@test.com
Password: [from seed script]
```

Check the seed script file for the actual password, or update it in `prisma/seed.ts` before seeding.

---

## 🎉 You're Almost Ready!

**Current Status**: ⚠️ Code ready, infrastructure pending

**Next Action**: Follow the 5 steps above in order (takes ~30 minutes)

**Result**: Production-ready PTLPOS running on Render! 🚀

---

For detailed information, see: [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)
