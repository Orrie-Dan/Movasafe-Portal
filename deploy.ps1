# PowerShell deployment script for AWS S3 + CloudFront
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "Starting deployment to AWS S3 + CloudFront..." -ForegroundColor Green

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "Error: AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Default CloudFront distribution ID
$DEFAULT_DISTRIBUTION_ID = "E2AS59MYYKFLFX"

# Check if distribution ID is set, otherwise use default
if (-not $env:CLOUDFRONT_DISTRIBUTION_ID) {
    $env:CLOUDFRONT_DISTRIBUTION_ID = $DEFAULT_DISTRIBUTION_ID
    Write-Host "Using CloudFront distribution: $env:CLOUDFRONT_DISTRIBUTION_ID" -ForegroundColor Green
    Write-Host "To override, set: `$env:CLOUDFRONT_DISTRIBUTION_ID='your-distribution-id'" -ForegroundColor Yellow
}

# Build the static site
Write-Host "Building Next.js static site..." -ForegroundColor Green
npm run build

if (-not (Test-Path "out")) {
    Write-Host "Error: Build failed - 'out' directory not found." -ForegroundColor Red
    exit 1
}

# Upload to S3 with proper cache headers
Write-Host "Uploading to S3 bucket: adminportal-demo..." -ForegroundColor Green

# Upload HTML files with no-cache headers
aws s3 sync out/ s3://adminportal-demo `
    --delete `
    --cache-control "no-cache,no-store,must-revalidate" `
    --exclude "*" `
    --include "*.html"

# Upload static assets with long cache headers
aws s3 sync out/ s3://adminportal-demo `
    --delete `
    --cache-control "max-age=31536000,public,immutable" `
    --exclude "*.html"

Write-Host "S3 upload complete!" -ForegroundColor Green

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Green
try {
    $invalidation = aws cloudfront create-invalidation `
        --distribution-id $env:CLOUDFRONT_DISTRIBUTION_ID `
        --paths "/*" `
        --output json | ConvertFrom-Json
    
    if ($invalidation.Invalidation.Id) {
        Write-Host "CloudFront invalidation created: $($invalidation.Invalidation.Id)" -ForegroundColor Green
        Write-Host "Note: Cache invalidation may take a few minutes to complete." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Failed to create CloudFront invalidation." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://portal-demo.movasafe.com" -ForegroundColor Green
