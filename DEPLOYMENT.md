# AWS S3 + CloudFront Deployment Guide

This guide explains how to deploy the Movasafe Wallet Admin Dashboard as a static site to AWS S3 and serve it through CloudFront.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **Node.js and npm installed**
   ```bash
   node --version
   npm --version
   ```

3. **AWS Resources**
   - S3 bucket: `adminportal-demo`
   - CloudFront distribution (already created)
   - SSL certificate attached to CloudFront
   - Custom domain: `portal-demo.movasafe.com`

## Architecture

```
Browser → CloudFront → S3 (Static Files)
         ↓
    Backend APIs (transaction.movasafe.com, auth.movasafe.com)
```

The frontend is served as static files from S3/CloudFront, and makes direct API calls to the backend services with CORS.

## Step 1: Configure Backend CORS

**IMPORTANT:** Before deploying, ensure your backend services have CORS configured to allow requests from `https://portal-demo.movasafe.com`.

### For transaction.movasafe.com:
Add these CORS headers:
```
Access-Control-Allow-Origin: https://portal-demo.movasafe.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### For auth.movasafe.com:
Add the same CORS headers as above.

## Step 2: Build and Deploy

### Option A: Using the deployment script (Recommended)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
# Distribution ID E2AS59MYYKFLFX is configured by default
# To override: export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

**Windows (PowerShell):**
```powershell
.\deploy.ps1
# Distribution ID E2AS59MYYKFLFX is configured by default
# To override: $env:CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"
```

### Option B: Manual deployment

1. **Build the static site:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   # Upload HTML files with no-cache headers
   aws s3 sync out/ s3://adminportal-demo \
       --delete \
       --cache-control "no-cache,no-store,must-revalidate" \
       --exclude "*" \
       --include "*.html"

   # Upload static assets with long cache headers
   aws s3 sync out/ s3://adminportal-demo \
       --delete \
       --cache-control "max-age=31536000,public,immutable" \
       --exclude "*.html"
   ```

3. **Invalidate CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation \
       --distribution-id E2AS59MYYKFLFX \
       --paths "/*"
   ```

## Step 3: Configure CloudFront for SPA Routing

For a Single Page Application (SPA), you need to configure CloudFront to redirect 403 and 404 errors to `index.html` with a 200 status code.

### Option A: Using the configuration script

```bash
chmod +x configure-cloudfront-spa.sh
./configure-cloudfront-spa.sh E2AS59MYYKFLFX
# Or just run without arguments (uses default: E2AS59MYYKFLFX)
./configure-cloudfront-spa.sh
```

### Option B: Manual configuration via AWS Console

1. Go to **CloudFront** → Your distribution → **Error pages** tab
2. Click **Create custom error response**
3. Configure for **403 Error**:
   - Response page path: `/index.html`
   - HTTP response code: `200`
   - Error caching minimum TTL: `0`
4. Click **Create custom error response** again
5. Configure for **404 Error**:
   - Response page path: `/index.html`
   - HTTP response code: `200`
   - Error caching minimum TTL: `0`
6. Go to **General** tab → **Default root object**: Set to `index.html`
7. Save changes (deployment takes 15-20 minutes)

### Option C: Using AWS CLI

```bash
# Get current config
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID > dist-config.json

# Edit dist-config.json to add custom error responses, then:
aws cloudfront update-distribution \
    --id YOUR_DISTRIBUTION_ID \
    --distribution-config file://dist-config.json \
    --if-match ETAG_FROM_GET_COMMAND
```

## Step 4: Verify Deployment

### Using the verification script:
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh portal-demo.movasafe.com
```

### Manual verification:

1. **Check if site is accessible:**
   ```bash
   curl -I https://portal-demo.movasafe.com
   ```
   Should return `HTTP/2 200`

2. **Check SSL certificate:**
   ```bash
   curl -vI https://portal-demo.movasafe.com 2>&1 | grep "SSL certificate"
   ```

3. **Test SPA routing (should return 200, not 404):**
   ```bash
   curl -I https://portal-demo.movasafe.com/admin/transactions
   ```

4. **Check CloudFront headers:**
   ```bash
   curl -I https://portal-demo.movasafe.com | grep "x-amz-cf-id"
   ```

## Troubleshooting

### Issue: Site returns 404 for routes
**Solution:** Ensure CloudFront custom error responses are configured (Step 3).

### Issue: CORS errors in browser console
**Solution:** Verify backend CORS configuration allows `https://portal-demo.movasafe.com`.

### Issue: Changes not appearing after deployment
**Solution:** 
1. Check CloudFront cache invalidation status
2. Clear browser cache
3. Wait for CloudFront propagation (can take 15-20 minutes)

### Issue: SSL certificate errors
**Solution:** Verify SSL certificate is attached to CloudFront distribution and custom domain is configured.

## Finding Your CloudFront Distribution ID

```bash
aws cloudfront list-distributions \
    --query "DistributionList.Items[*].{Id:Id,Domain:DomainName,Aliases:Aliases.Items}" \
    --output table
```

Look for the distribution with alias `portal-demo.movasafe.com`.

## Environment Variables

The deployment scripts are pre-configured with:
- **CloudFront Distribution ID**: `E2AS59MYYKFLFX` (configured by default)
- **S3 Bucket**: `adminportal-demo`
- **Domain**: `portal-demo.movasafe.com`

You can override the distribution ID if needed:

```bash
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

## Continuous Deployment

For CI/CD pipelines, you can use the deployment scripts:

```yaml
# Example GitHub Actions workflow
- name: Deploy to S3
  run: |
    npm run build
    ./deploy.sh
  env:
    CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Notes

- Static export generates files in the `out/` directory
- HTML files are cached with `no-cache` to ensure fresh content
- Static assets (JS, CSS, images) are cached for 1 year
- CloudFront cache invalidation is required after each deployment
- Distribution updates can take 15-20 minutes to propagate
