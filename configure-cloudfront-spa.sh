#!/bin/bash
# Script to configure CloudFront for SPA routing
# This configures custom error responses so 403/404 errors redirect to index.html

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default CloudFront distribution ID
DEFAULT_DISTRIBUTION_ID="E2AS59MYYKFLFX"

DISTRIBUTION_ID=${1:-${CLOUDFRONT_DISTRIBUTION_ID:-$DEFAULT_DISTRIBUTION_ID}}

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: CloudFront distribution ID is required${NC}"
    echo -e "${YELLOW}Usage: ./configure-cloudfront-spa.sh [distribution-id]${NC}"
    echo -e "${YELLOW}Or set CLOUDFRONT_DISTRIBUTION_ID environment variable${NC}"
    exit 1
fi

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: CloudFront distribution ID is required${NC}"
    exit 1
fi

echo -e "${GREEN}Configuring CloudFront distribution: $DISTRIBUTION_ID${NC}"

# Get current distribution config
echo -e "${GREEN}Fetching current CloudFront configuration...${NC}"
aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > dist-config.json

# Extract ETag (required for update)
ETAG=$(jq -r '.ETag' dist-config.json)
DIST_CONFIG=$(jq -r '.DistributionConfig' dist-config.json)

echo -e "${GREEN}Current ETag: $ETAG${NC}"

# Check if custom error responses already exist
HAS_403=$(echo "$DIST_CONFIG" | jq '.CustomErrorResponses.Items[] | select(.ErrorCode == 403)')
HAS_404=$(echo "$DIST_CONFIG" | jq '.CustomErrorResponses.Items[] | select(.ErrorCode == 404)')

if [ -n "$HAS_403" ] && [ -n "$HAS_404" ]; then
    echo -e "${YELLOW}Custom error responses (403/404) already exist. Updating them...${NC}"
    
    # Update existing custom error responses
    UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq '
        .CustomErrorResponses.Items = (
            .CustomErrorResponses.Items | map(
                if .ErrorCode == 403 or .ErrorCode == 404 then
                    . + {
                        ResponsePagePath: "/index.html",
                        ResponseCode: "200",
                        ErrorCachingMinTTL: 0
                    }
                else
                    .
                end
            )
        )
    ')
else
    echo -e "${GREEN}Adding custom error responses for SPA routing...${NC}"
    
    # Add custom error responses
    UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq '
        .CustomErrorResponses.Items += [
            {
                ErrorCode: 403,
                ResponsePagePath: "/index.html",
                ResponseCode: "200",
                ErrorCachingMinTTL: 0
            },
            {
                ErrorCode: 404,
                ResponsePagePath: "/index.html",
                ResponseCode: "200",
                ErrorCachingMinTTL: 0
            }
        ]
    ')
fi

# Set default root object
UPDATED_CONFIG=$(echo "$UPDATED_CONFIG" | jq '.DefaultRootObject = "index.html"')

# Save updated config
echo "$UPDATED_CONFIG" > dist-config-updated.json

echo -e "${GREEN}Updated configuration saved to dist-config-updated.json${NC}"
echo -e "${YELLOW}Review the configuration, then press Enter to apply it to CloudFront...${NC}"
read -r

# Update CloudFront distribution
echo -e "${GREEN}Updating CloudFront distribution...${NC}"
aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --distribution-config file://dist-config-updated.json \
    --if-match "$ETAG" > update-result.json

NEW_ETAG=$(jq -r '.ETag' update-result.json)
echo -e "${GREEN}Update initiated! New ETag: $NEW_ETAG${NC}"
echo -e "${YELLOW}Note: CloudFront distribution updates can take 15-20 minutes to deploy.${NC}"
echo -e "${YELLOW}You can check status with: aws cloudfront get-distribution --id $DISTRIBUTION_ID${NC}"

# Cleanup
rm -f dist-config.json dist-config-updated.json update-result.json

echo -e "${GREEN}CloudFront SPA configuration complete!${NC}"
