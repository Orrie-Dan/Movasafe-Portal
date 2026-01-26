#!/bin/bash
# Script to verify deployment on CloudFront
# Usage: ./verify-deployment.sh [domain]

set -e

DOMAIN=${1:-"portal-demo.movasafe.com"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Verifying deployment for: $DOMAIN${NC}"
echo ""

# Test 1: Check if site is accessible
echo -e "${GREEN}Test 1: Checking if site is accessible...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Site is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Site returned HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 2: Check SSL certificate
echo -e "${GREEN}Test 2: Checking SSL certificate...${NC}"
SSL_INFO=$(curl -vI "https://$DOMAIN" 2>&1 | grep -i "SSL certificate" || echo "")
if [ -n "$SSL_INFO" ]; then
    echo -e "${GREEN}✓ SSL certificate found${NC}"
    echo "$SSL_INFO"
else
    echo -e "${YELLOW}⚠ Could not verify SSL certificate details${NC}"
fi
echo ""

# Test 3: Check SPA routing (should return 200, not 404)
echo -e "${GREEN}Test 3: Testing SPA routing (/admin/transactions)...${NC}"
SPA_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/admin/transactions" || echo "000")

if [ "$SPA_CODE" = "200" ]; then
    echo -e "${GREEN}✓ SPA routing works correctly (HTTP $SPA_CODE)${NC}"
elif [ "$SPA_CODE" = "404" ]; then
    echo -e "${RED}✗ SPA routing not configured - returned 404${NC}"
    echo -e "${YELLOW}  You need to configure CloudFront custom error responses${NC}"
else
    echo -e "${YELLOW}⚠ SPA route returned HTTP $SPA_CODE${NC}"
fi
echo ""

# Test 4: Check if index.html is served
echo -e "${GREEN}Test 4: Checking if index.html is served...${NC}"
CONTENT_TYPE=$(curl -s -I "https://$DOMAIN" | grep -i "content-type" || echo "")
if echo "$CONTENT_TYPE" | grep -qi "text/html"; then
    echo -e "${GREEN}✓ HTML content is being served${NC}"
else
    echo -e "${YELLOW}⚠ Content-Type: $CONTENT_TYPE${NC}"
fi
echo ""

# Test 5: Check CloudFront headers
echo -e "${GREEN}Test 5: Checking CloudFront headers...${NC}"
CF_HEADER=$(curl -s -I "https://$DOMAIN" | grep -i "x-amz-cf-id" || echo "")
if [ -n "$CF_HEADER" ]; then
    echo -e "${GREEN}✓ CloudFront is serving the content${NC}"
else
    echo -e "${YELLOW}⚠ CloudFront header not found${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}Verification complete!${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  - Site accessible: $([ "$HTTP_CODE" = "200" ] && echo "✓" || echo "✗")"
echo "  - SSL certificate: $([ -n "$SSL_INFO" ] && echo "✓" || echo "?")"
echo "  - SPA routing: $([ "$SPA_CODE" = "200" ] && echo "✓" || echo "✗")"
echo "  - CloudFront: $([ -n "$CF_HEADER" ] && echo "✓" || echo "?")"
