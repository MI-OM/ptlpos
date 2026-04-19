# 🚀 PTLPOS Render Deployment - Exact Steps

**Status**: Build command issue fixed  
**Current Issue**: Build command incomplete in Render dashboard  
**Fix Time**: 2 minutes

---

## ✅ EXACT RENDER DASHBOARD SETTINGS

### Step 1: Verify Render Service Configuration

Go to: https://dashboard.render.com → Click your **ptlpos-api** service → Click **Settings**

Verify these settings **EXACTLY**:

```
Service Name: ptlpos-api
Environment: Node
Region: [your choice - doesn't matter for free tier]
Build & Deploy: Always build and deploy from head

🔴 CRITICAL - Build Command:
npm install --legacy-peer-deps && npm run prisma:generate && npm run build

🔴 CRITICAL - Start Command:
npm run start:prod
```

**If your Build Command is just `npm run build`**, that's the problem! 
Change it to the full command above.

---

### Step 2: Update Environment Variables

Click **Environment** in the left menu (or scroll down)

Add these variables:

```
NODE_ENV        production
PORT            3000
DATABASE_URL    postgresql://[your-elephantsql-url]
JWT_SECRET      [your-generated-secret]
JWT_EXPIRES_IN  24h
REFRESH_TOKEN_EXPIRES_IN  7d
LOG_LEVEL       info
APP_NAME        PTLPOS
MAILGUN_DOMAIN  sandbox.xxxxx.mailgun.org
MAILGUN_API_KEY key-xxxxx
MAILGUN_FROM_EMAIL  noreply@ptlpos.com
```

**⚠️ Make sure DATABASE_URL is set correctly!**

---

### Step 3: Save & Deploy

1. Click **Save changes**
2. Click **Manual Deploy** (orange button)
3. Wait for build to complete

You should now see in logs:
```
==> Running build command 'npm install --legacy-peer-deps && npm run prisma:generate && npm run build'...
✓ npm install
✓ npm run prisma:generate  
✓ npm run build
==> Your service is live!
```

---

## 🆘 If Build Still Fails

**Check the build log for the actual error:**
1. In Render dashboard, click **Logs**
2. Look for the red error message
3. Common issues:

| Error | Fix |
|-------|-----|
| `npm error could not determine executable` | Build command incomplete - use full command above |
| `EACCES permission denied` | Try: `npm cache clean --force` |
| `ERESOLVE unable to resolve dependency` | Add `--legacy-peer-deps` to install |
| `Database connection refused` | Check DATABASE_URL in Environment vars |

---

## ✅ What To Do RIGHT NOW

1. **Open Render Dashboard**: https://dashboard.render.com
2. **Click your ptlpos-api service**
3. **Click Settings**
4. **Find Build Command field**
5. **Replace with**:
   ```
   npm install --legacy-peer-deps && npm run prisma:generate && npm run build
   ```
6. **Click Save**
7. **Click Manual Deploy**
8. **Wait 5-10 minutes for build**

That's it! The build should succeed now.

---

## Why This Matters

Your original setting:
- Build Command: `npm run build` ❌
- This runs ONLY the build script
- But npm install never ran!
- So @nestjs/cli isn't in node_modules
- So npx can't find the nest binary

Fixed command:
- Build Command: `npm install --legacy-peer-deps && npm run prisma:generate && npm run build` ✅
- This runs all three steps in sequence
- Dependencies installed first
- Prisma client generated
- Then builds the app

---

## Next Steps After Build Succeeds

Once you see "Your service is live!":

```bash
# Run migrations (use your actual DATABASE_URL)
DATABASE_URL="postgresql://..." npm run prisma:push

# Seed admin user
DATABASE_URL="postgresql://..." npm run prisma:seed
```

Then test:
```bash
curl https://ptlpos-api.onrender.com/api/health
```

---

**That's all you need to do!** Let me know once the build succeeds. 🚀
