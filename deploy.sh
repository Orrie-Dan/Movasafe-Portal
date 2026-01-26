#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to AWS S3 + CloudFront...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Default CloudFront distribution ID
DEFAULT_DISTRIBUTION_ID="E2AS59MYYKFLFX"

# Check if distribution ID is set, otherwise use default
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    CLOUDFRONT_DISTRIBUTION_ID=$DEFAULT_DISTRIBUTION_ID
    echo -e "${GREEN}Using CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID${NC}"
    echo -e "${YELLOW}To override, set: export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id${NC}"
fi

# Build the static site
echo -e "${GREEN}Building Next.js static site...${NC}"
npm run build

if [ ! -d "out" ]; then
    echo -e "${RED}Error: Build failed - 'out' directory not found.${NC}"
    exit 1
fi

# Upload to S3 with proper cache headers
echo -e "${GREEN}Uploading to S3 bucket: adminportal-demo...${NC}"

# Upload HTML files with no-cache headers
aws s3 sync out/ s3://adminportal-demo \
    --delete \
    --cache-control "no-cache,no-store,must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --exclude "*.html.*"

# Upload static assets with long cache headers
aws s3 sync out/ s3://adminportal-demo \
    --delete \
    --cache-control "max-age=31536000,public,immutable" \
    --exclude "*.html"

echo -e "${GREEN}S3 upload complete!${NC}"

# Invalidate CloudFront cache
echo -e "${GREEN}Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

if [ -n "$INVALIDATION_ID" ]; then
    echo -e "${GREEN}CloudFront invalidation created: $INVALIDATION_ID${NC}"
    echo -e "${YELLOW}Note: Cache invalidation may take a few minutes to complete.${NC}"
else
    echo -e "${RED}Warning: Failed to create CloudFront invalidation.${NC}"
fi

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your site should be available at: https://portal-demo.movasafe.com${NC}"
