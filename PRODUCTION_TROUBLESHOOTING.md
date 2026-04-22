# Production Deployment Troubleshooting Guide

## Issue: 500 Internal Server Error on Register Endpoint

### Problem Analysis
The deployment is successful (application starts and responds) but the `/api/auth/register` endpoint returns a 500 error. This indicates the application is running but encountering a runtime error during the registration process.

### Root Causes

#### 1. Missing Environment Variables
The most common cause is missing required environment variables in production.

**Required Environment Variables:**
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
NODE_ENV="production"
APP_NAME="PTLPOS"
JWT_EXPIRATION="24h"
```

**Optional but Recommended:**
```bash
REDIS_URL="redis://host:port"
MAILGUN_DOMAIN="your-mailgun-domain"
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_FROM_EMAIL="noreply@yourapp.com"
```

#### 2. Database Schema Not Applied
The Prisma schema hasn't been pushed to the production database, so the required tables don't exist.

#### 3. Missing Database Seed Data
The register endpoint requires an ADMIN role to exist in the database.

### Solution Steps

#### Step 1: Verify Environment Variables
In Render dashboard, go to your service > Environment and ensure these variables are set:

1. **DATABASE_URL**: Must be a valid PostgreSQL connection string
2. **JWT_SECRET**: Must be a secure random string (at least 32 characters)
3. **PORT**: Set to 3000 (or your preferred port)
4. **NODE_ENV**: Set to "production"
5. **APP_NAME**: Set to "PTLPOS"
6. **JWT_EXPIRATION**: Set to "24h"

#### Step 2: Apply Database Schema
Add a post-build script to push the Prisma schema:

```bash
# In Render dashboard, add this to your Build Command:
npm ci --legacy-peer-deps && npx prisma generate && npx prisma db push && npm run build
```

#### Step 3: Seed Initial Data
Add database seeding to your build process:

```bash
# Complete Build Command for Render:
npm ci --legacy-peer-deps && npx prisma generate && npx prisma db push && npm run build && npm run prisma:seed
```

#### Step 4: Update package.json Scripts
Ensure your package.json has the necessary scripts:

```json
{
  "scripts": {
    "build": "tsc --build tsconfig.build.json",
    "start:prod": "node dist/main",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

### Testing the Fix

#### 1. Deploy with Updated Build Command
Update your Render service's build command to include database operations:

```bash
npm ci --legacy-peer-deps && npx prisma generate && npx prisma db push && npm run build && npm run prisma:seed
```

#### 2. Verify Database Connection
After deployment, test the health endpoint:

```bash
curl https://ptlpos.onrender.com/api/health
```

#### 3. Test Registration Again
Try the registration endpoint with a new email:

```bash
curl -X POST https://ptlpos.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test Organization",
    "name": "Test User",
    "email": "newuser@test.com",
    "password": "SecurePass123!"
  }'
```

### Common Error Scenarios

#### Database Connection Failed
**Error**: `Can't reach database server`
**Solution**: Verify DATABASE_URL is correct and database is accessible

#### JWT Secret Missing
**Error**: `secretOrPrivateKey must have a value`
**Solution**: Set JWT_SECRET environment variable

#### ADMIN Role Not Found
**Error**: `ADMIN role not found in database`
**Solution**: Run database seeding to create initial roles

#### Prisma Client Not Generated
**Error**: `Cannot find module '@prisma/client'`
**Solution**: Ensure `npx prisma generate` runs before build

### Advanced Troubleshooting

#### Enable Debug Logging
Add this to your environment variables to see detailed error logs:

```bash
LOG_LEVEL="debug"
```

#### Check Render Logs
In Render dashboard, go to your service > Logs to see the actual error messages.

#### Database Migration Issues
If you have existing data, use migrations instead of db push:

```bash
npx prisma migrate deploy
```

### Prevention

#### 1. Environment Variable Validation
Add validation in your main.ts to check required environment variables:

```typescript
// In main.ts
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}
```

#### 2. Health Check with Database
Update your health endpoint to verify database connectivity:

```typescript
// In health service
async checkDatabase(): Promise<boolean> {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}
```

### Quick Fix Checklist

- [ ] DATABASE_URL is set and valid
- [ ] JWT_SECRET is set (32+ characters)
- [ ] NODE_ENV is set to "production"
- [ ] Prisma schema is pushed to database
- [ ] Database is seeded with initial data
- [ ] Build command includes `npx prisma db push`
- [ ] Build command includes `npm run prisma:seed`

### Support

If you continue to experience issues:

1. Check Render logs for specific error messages
2. Verify database connectivity with a direct connection test
3. Ensure all environment variables are correctly formatted
4. Test with a fresh database if needed

---

**Note**: The application builds and runs successfully, so the issue is specifically related to database configuration or missing environment variables in production.
