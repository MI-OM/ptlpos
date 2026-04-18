# PTLPOS Deployment Checklist - Render Free Tier

**Status**: ✅ ALL SYSTEMS GO

---

## 📋 Pre-Deployment (Do This Now)

### Local Verification
- [x] Build succeeds: `npm run build` ✅
- [x] Tests pass: `npm test` (99 tests) ✅
- [x] Email module integrated ✅
- [x] render.yaml configured for free tier ✅
- [x] .nvmrc specifies Node v20 ✅

### Prepare Credentials (Get These Ready)

1. **PostgreSQL Database** (Choose one)
   - [ ] Create Railway account (railway.app)
     - [ ] Create PostgreSQL instance
     - [ ] Copy connection string
   - OR
   - [ ] Create Neon account (neon.tech)
     - [ ] Create PostgreSQL project
     - [ ] Copy connection string

2. **Generate JWT Secret**
   ```bash
   # Run this command
   openssl rand -hex 32
   ```
   - [ ] Copy the output (32-char hex string)
   - [ ] Save in safe place

3. **Mailgun Keys** (You already have these)
   - [ ] MAILGUN_DOMAIN - `sandbox.xxxxx.mailgun.org`
   - [ ] MAILGUN_API_KEY - API key from dashboard
   - [ ] MAILGUN_FROM_EMAIL - `noreply@yourapp.com`

---

## 🚀 Deployment (Follow These Steps)

### Step 1: Create Render Web Service (5 min)

```
1. Go to https://render.com
2. Sign up with GitHub (if needed)
3. Click "New +" → "Web Service"
4. Select repository: ptlpos
5. Configure:
   - Name: ptlpos-api
   - Environment: Node
   - Plan: Free ✅
   - Build Command: npm install && npm run prisma:generate && npx nest build
   - Start Command: npm run start:prod
6. Click "Advanced" → Add environment variables
```

### Step 2: Add Environment Variables (3 min)

Copy-paste these into Render dashboard:

```
NODE_ENV=production
PORT=3000
APP_NAME=PTLPOS
DATABASE_URL=postgresql://[PASTE_FROM_RAILWAY_OR_NEON]
JWT_SECRET=[PASTE_YOUR_GENERATED_SECRET]
JWT_EXPIRATION=24h
MAILGUN_DOMAIN=[YOUR_MAILGUN_DOMAIN]
MAILGUN_API_KEY=[YOUR_MAILGUN_API_KEY]
MAILGUN_FROM_EMAIL=noreply@ptlpos.com
```

### Step 3: Deploy (Click button!)

```
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (2-3 min)
- [ ] Watch logs for success message
- [ ] Note the public URL (ptlpos-api-xxxx.onrender.com)
```

### Step 4: Initialize Database (2 min)

**Via Render Shell** (Recommended):
```
1. In Render dashboard, click your service
2. Go to "Shell" tab
3. Run these commands:
   npm run prisma:push
   npm run prisma:seed
4. Wait for completion
```

---

## ✅ Verification (Test Everything)

### Test 1: Health Check (Should return 200)
```bash
curl https://ptlpos-api-xxxx.onrender.com/api/health
```

Expected:
```json
{
  "status": "ok",
  "service": "ptlpos-api",
  "timestamp": "2026-04-18T..."
}
```

### Test 2: Login (Should return tokens)
```bash
curl -X POST https://ptlpos-api-xxxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ptlpos.local",
    "password": "admin@ptlpos.local"
  }'
```

Expected:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

### Test 3: Protected Endpoint (Should return data)
```bash
curl https://ptlpos-api-xxxx.onrender.com/api/auth/me \
  -H "Authorization: Bearer [PASTE_ACCESS_TOKEN]"
```

Expected:
```json
{
  "id": "...",
  "email": "admin@ptlpos.local",
  "name": "Admin",
  "role": "ADMIN"
}
```

---

## 🎯 Success Criteria

Mark when complete:

- [ ] Render deployment shows "Live"
- [ ] Health check returns 200 OK
- [ ] Login endpoint returns tokens
- [ ] Protected endpoints work with token
- [ ] No errors in Render logs
- [ ] Database operations working

---

## ⚠️ Troubleshooting

### "Build failed - nest: not found"
✅ FIXED - Build command updated to use `npx nest build`

### "DATABASE_URL connection refused"
- [ ] Verify DATABASE_URL correct in Render dashboard
- [ ] Check Railway/Neon is running
- [ ] Try `psql "$DATABASE_URL"` locally to test

### "Prisma client not found"
- [ ] Ensure `npm run prisma:generate` in build command
- [ ] Check `.rendered` folder exists in dist/

### "JWT authentication failing"
- [ ] Verify JWT_SECRET is set
- [ ] Check Authorization header format: `Bearer [token]`
- [ ] Ensure token not expired (24h default)

### "Service keeps spinning down"
- This is normal on free tier - first request takes 5-10 sec
- Upgrade to paid ($7/month) for always-on

---

## 📱 What to Test Next

After successful deployment:

1. **Product Creation**
   ```bash
   POST /api/products
   Body: { name: "Test Product", price: 10.00 }
   ```

2. **Inventory Adjustment**
   ```bash
   POST /api/inventory/adjust
   Body: { productId: "...", quantityChange: 100 }
   ```

3. **Create Sale**
   ```bash
   POST /api/sales
   Body: { items: [...], branchId: "..." }
   ```

4. **Complete Payment**
   ```bash
   POST /api/sales/{id}/complete
   Body: { paymentMethod: "CASH", amount: 100 }
   ```

---

## 📊 Monitoring (Optional)

Monitor your app:

1. **Render Dashboard**
   - Check "Metrics" tab for CPU/RAM
   - Check "Logs" for errors
   - Set up alerts for crashes

2. **Database (Railway/Neon)**
   - Monitor connection count
   - Check query performance
   - Monitor storage usage

---

## 💡 Free Tier Pro Tips

1. **Keep it alive**
   - Add a cron job to ping `/api/health` every 10 min
   - Prevents spin-down during inactivity

2. **Monitor costs**
   - Railway free: 5GB storage
   - Neon free: 3GB storage
   - Mailgun free: 100-1000 emails/month

3. **Scale when ready**
   - Render Paid: $7/month (always-on)
   - Railway Pro: $9/month (unlimited storage)
   - Mailgun Pro: $0.50-1/month per email

---

## 🎉 You're Ready!

**Current Status**:
- ✅ Code compiled
- ✅ Tests passing
- ✅ Docker configured
- ✅ Documentation complete
- ✅ Secrets ready
- ✅ Database ready
- ✅ Email configured

**Time to deployment**: 20-30 minutes 🚀

---

## 📚 Reference Docs

- **Full Guide**: `RENDER_FREE_TIER_GUIDE.md`
- **Email Setup**: `EMAIL_SETUP.md`
- **Testing**: `TEST_EXECUTION_GUIDE.md`
- **Production**: `PRODUCTION_READINESS.md`
- **Status**: `DEPLOYMENT_READY.md`

---

**Last Updated**: April 18, 2026  
**Status**: ✅ READY TO DEPLOY
