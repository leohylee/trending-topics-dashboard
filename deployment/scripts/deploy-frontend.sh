#!/bin/bash

# Frontend Deployment Script for trends.leohyl.me
# Builds React app and deploys to S3 + CloudFront

set -e

echo "🚀 Deploying frontend to trends.leohyl.app..."

# Configuration
BUCKET_NAME="trends-leohyl-app"
BUILD_DIR="../src/client/dist"
DOMAIN_NAME="trends.leohyl.app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    print_error "S3 bucket '$BUCKET_NAME' does not exist. Please run setup-infrastructure.sh first."
    exit 1
fi

# Navigate to client directory and build
print_status "Building React application..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT/src/client"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm ci
fi

# Update API configuration for production
print_status "Updating API configuration for production..."
if [ ! -f "src/config/index.ts.backup" ]; then
    cp src/config/index.ts src/config/index.ts.backup
fi

# Update the API base URL to use the subdomain
cat > src/config/index.ts << EOF
export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://trends.leohyl.app/api'
    : 'http://localhost:3002/api',
  timeout: 30000,
};
EOF

# Build the application
print_status "Building production bundle..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Upload to S3
print_status "Uploading files to S3..."

# Upload static assets with long cache
aws s3 sync dist/ "s3://$BUCKET_NAME" \
    --delete \
    --exclude "index.html" \
    --exclude "*.map" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata-directive REPLACE

# Upload index.html with no cache
aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata-directive REPLACE

print_success "Files uploaded to S3"

# Find CloudFront distribution ID
print_status "Finding CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '$DOMAIN_NAME')].Id | [0]" \
    --output text)

if [ "$DISTRIBUTION_ID" != "None" ] && [ -n "$DISTRIBUTION_ID" ]; then
    print_status "Creating CloudFront invalidation for distribution: $DISTRIBUTION_ID"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    print_success "CloudFront invalidation created: $INVALIDATION_ID"
    print_status "Invalidation may take 3-5 minutes to complete"
else
    print_warning "Could not find CloudFront distribution for $DOMAIN_NAME"
    print_warning "You may need to manually invalidate the cache or create the distribution"
fi

# Restore original config
if [ -f "src/config/index.ts.backup" ]; then
    mv src/config/index.ts.backup src/config/index.ts
fi

# Display deployment information
print_success "Frontend deployment completed!"
echo ""
print_status "Deployment Summary:"
echo "  • S3 Bucket: $BUCKET_NAME"
echo "  • Domain: https://$DOMAIN_NAME"
if [ "$DISTRIBUTION_ID" != "None" ] && [ -n "$DISTRIBUTION_ID" ]; then
    echo "  • CloudFront Distribution: $DISTRIBUTION_ID"
fi
echo ""
print_status "Your application should be available at: https://$DOMAIN_NAME"

# Check if site is accessible
print_status "Checking if site is accessible..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" | grep -q "200"; then
    print_success "Site is accessible at https://$DOMAIN_NAME"
else
    print_warning "Site may not be accessible yet. DNS propagation can take a few minutes."
fi

echo ""
print_status "Next steps:"
echo "  1. Verify the site loads correctly"
echo "  2. Test API endpoints once backend is deployed"
echo "  3. Monitor CloudFront metrics in AWS Console"