# Deployment Guide

## CORS Configuration for Different Environments

The CORS configuration is now dynamic and environment-aware, making it flexible for both development and production deployments.

### Environment Variables

Add these to your `.env` file:

```bash
# CORS Configuration
# Comma-separated list of allowed origins for frontend URLs
# Development: "http://localhost:3000,http://127.0.0.1:3000"
# Production: "https://your-frontend-domain.com,https://www.your-frontend-domain.com"
# Allow all (not recommended for production): "*"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

### Development Environment

```bash
NODE_ENV=development
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

### Production Environment (Render)

When deploying to Render, set these environment variables:

```bash
NODE_ENV=production
CORS_ORIGINS="https://your-frontend-domain.com,https://www.your-frontend-domain.com"
```

### Dynamic Configuration Features

1. **Automatic Environment Detection**: The app automatically adjusts CORS settings based on `NODE_ENV`
2. **Multiple Origins**: Support for multiple frontend URLs via comma-separated list
3. **Production Security**: In production, preflight requests are cached for 24 hours for better performance
4. **Development Flexibility**: In development, preflight requests are cached for 5 minutes for easier testing
5. **Fallback Defaults**: If `CORS_ORIGINS` is not set, defaults to localhost URLs

### Testing CORS Configuration

Test your CORS setup with curl:

```bash
# Test with your frontend origin
curl -H "Origin: https://your-frontend-domain.com" -I http://your-api-domain.com/api/test/services-status

# Expected response should include:
# Access-Control-Allow-Origin: https://your-frontend-domain.com
# Access-Control-Allow-Credentials: true
```

### Render Deployment Steps

1. **Set Environment Variables in Render Dashboard**:
   - `NODE_ENV=production`
   - `CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com`
   - All other required variables from `.env.example`

2. **Build Command**: 
   ```bash
   npm install && npm run build
   ```

3. **Start Command**:
   ```bash
   npm run start:prod
   ```

### Changing Frontend URLs

When you need to change the frontend URL:

1. **Development**: Update `CORS_ORIGINS` in your local `.env` file
2. **Production**: Update `CORS_ORIGINS` environment variable in Render dashboard
3. **No Code Changes Required**: The CORS configuration is completely dynamic

### Security Notes

- Never use `"*"` for `CORS_ORIGINS` in production
- Always use HTTPS URLs in production
- Include both `www` and non-`www` versions of your domain
- Test CORS configuration after deployment
