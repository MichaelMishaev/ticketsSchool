#!/bin/bash

# Railway Payment Gateway Setup Script
# This script configures payment credentials in Railway development environment

set -e  # Exit on any error

echo "🚀 Railway Payment Gateway Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Check authentication
echo "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

USER=$(railway whoami 2>&1)
echo -e "${GREEN}✅ Logged in as: $USER${NC}"
echo ""

# Check current status
echo "Checking Railway project status..."
railway status
echo ""

# Set payment variables
echo "Setting payment gateway variables..."
echo ""

echo "Setting YAADPAY_MASOF..."
railway variables set YAADPAY_MASOF="0010342319" --environment development

echo "Setting YAADPAY_API_SECRET..."
railway variables set YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6" --environment development

echo "Setting YAADPAY_DOMAIN_ID..."
railway variables set YAADPAY_DOMAIN_ID="hyp1234" --environment development

echo "Setting YAADPAY_BASE_URL..."
railway variables set YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/" --environment development

echo "Setting YAADPAY_TEST_MODE..."
railway variables set YAADPAY_TEST_MODE="true" --environment development  # ✅ TEST MODE for development

echo ""
echo -e "${GREEN}✅ All payment variables set successfully!${NC}"
echo ""

# Verify variables
echo "Verifying variables..."
railway variables --environment development --kv | grep YAADPAY || echo -e "${YELLOW}⚠️  Variables set but not showing (might need service link)${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Test payment: http://localhost:9000/p/tests/ntnyh-tl-abyb"
echo "3. Deploy changes: git push"
echo ""
