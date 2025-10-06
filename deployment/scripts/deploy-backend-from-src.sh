#!/bin/bash

# Backend Deployment Script - Using src/server as Source of Truth
# Builds Lambda functions from Express controllers and deploys them

set -e

echo "🚀 Deploying backend Lambda functions from src/server..."

# Configuration
LAMBDA_BUILD_DIR="../lambda-build"
DEPLOYMENT_PACKAGE="lambda-deployment-from-src.zip"
ROLE_NAME="trending-lambda-role"

# Lambda function names (must match AWS function names)
FUNCTIONS=(
    "trending-getTrending"
    "trending-getTrendingCached"
    "trending-refreshTrending"
    "trending-getCacheInfo"
    "trending-health"
)

# Function to get handler file for a function name
get_handler_file() {
    case $1 in
        "trending-getTrending") echo "getTrending" ;;
        "trending-getTrendingCached") echo "getTrendingCached" ;;
        "trending-refreshTrending") echo "refreshTrending" ;;
        "trending-getCacheInfo") echo "getCacheInfo" ;;
        "trending-health") echo "health" ;;
        *) echo "" ;;
    esac
}

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

# Get AWS account details
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

print_status "AWS Account: $AWS_ACCOUNT_ID"
print_status "AWS Region: $AWS_REGION"

# Check if environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    print_error "OPENAI_API_KEY environment variable is not set"
    print_status "Please export OPENAI_API_KEY=your_key_here"
    exit 1
fi

# Check if Lambda build directory exists
if [ ! -d "$LAMBDA_BUILD_DIR" ]; then
    print_error "Lambda build directory not found: $LAMBDA_BUILD_DIR"
    print_status "Please run ./build-lambda-simple.sh first to build Lambda functions from src/server"
    exit 1
fi

# Check if deployment package exists
if [ ! -f "$LAMBDA_BUILD_DIR/$DEPLOYMENT_PACKAGE" ]; then
    print_error "Deployment package not found: $LAMBDA_BUILD_DIR/$DEPLOYMENT_PACKAGE"
    print_status "Please run ./build-lambda-simple.sh first to create the deployment package"
    exit 1
fi

print_status "Using deployment package: $LAMBDA_BUILD_DIR/$DEPLOYMENT_PACKAGE"

# Function to create Lambda function if it doesn't exist
create_lambda_function() {
    local func_name=$1
    local handler_file=$(get_handler_file "$func_name")
    
    if [ -z "$handler_file" ]; then
        print_error "No handler mapping found for function: $func_name"
        return 1
    fi
    
    print_status "Checking if function $func_name exists..."
    
    if aws lambda get-function --function-name "$func_name" &> /dev/null; then
        print_warning "Function $func_name already exists, will update code"
        return 0
    fi
    
    print_status "Creating function $func_name with handler $handler_file..."
    
    aws lambda create-function \
        --function-name "$func_name" \
        --runtime nodejs18.x \
        --role "arn:aws:iam::$AWS_ACCOUNT_ID:role/$ROLE_NAME" \
        --handler "$handler_file.handler" \
        --zip-file "fileb://$LAMBDA_BUILD_DIR/$DEPLOYMENT_PACKAGE" \
        --timeout 28 \
        --memory-size 1024 \
        --environment "Variables={OPENAI_API_KEY=$OPENAI_API_KEY,OPENAI_MODEL=gpt-4o-mini,NODE_ENV=production,DYNAMODB_TABLE_NAME=TrendingCache,OPENAI_WEB_SEARCH_ENABLED=true,OPENAI_TEMPERATURE=0.3,OPENAI_MAX_TOKENS=3000}" > /dev/null
    
    print_success "Function $func_name created"
}

# Function to update Lambda function
update_lambda_function() {
    local func_name=$1
    
    print_status "Updating function code: $func_name"
    
    aws lambda update-function-code \
        --function-name "$func_name" \
        --zip-file "fileb://$LAMBDA_BUILD_DIR/$DEPLOYMENT_PACKAGE" > /dev/null
    
    print_status "Waiting for code update to complete..."
    aws lambda wait function-updated --function-name "$func_name"
    
    # Update environment variables and configuration
    print_status "Updating function configuration: $func_name"
    aws lambda update-function-configuration \
        --function-name "$func_name" \
        --timeout 28 \
        --memory-size 1024 \
        --environment "Variables={OPENAI_API_KEY=$OPENAI_API_KEY,OPENAI_MODEL=gpt-4o-mini,NODE_ENV=production,DYNAMODB_TABLE_NAME=TrendingCache,OPENAI_WEB_SEARCH_ENABLED=true,OPENAI_TEMPERATURE=0.3,OPENAI_MAX_TOKENS=3000}" > /dev/null
    
    print_success "Function $func_name updated"
}

# Deploy all Lambda functions
print_status "Deploying ${#FUNCTIONS[@]} Lambda functions..."

for func in "${FUNCTIONS[@]}"; do
    create_lambda_function "$func"
    update_lambda_function "$func"
done

print_success "All Lambda functions deployed successfully!"
echo ""
print_status "Deployment Summary:"
echo "  • Source: src/server (Express controllers → Lambda handlers)"
echo "  • Functions deployed: ${#FUNCTIONS[@]}"
echo "  • Runtime: Node.js 18.x"
echo "  • Memory: 1024 MB (optimized for performance)"
echo "  • Timeout: 28 seconds (optimized for API Gateway 29s limit)"
echo ""
print_status "Environment Variables Set:"
echo "  • OPENAI_MODEL: gpt-4o-mini"
echo "  • NODE_ENV: production"
echo "  • DYNAMODB_TABLE_NAME: TrendingCache"
echo "  • OPENAI_WEB_SEARCH_ENABLED: true"
echo "  • OPENAI_TEMPERATURE: 0.3"
echo "  • OPENAI_MAX_TOKENS: 3000"
echo ""
print_success "✅ Lambda functions are now in sync with src/server!"
echo ""
print_status "Code Synchronization Achieved:"
echo "  • Express controllers in src/server/src/controllers/"
echo "  • TrendingService business logic in src/server/src/services/"
echo "  • Lambda handlers use the same service classes"
echo "  • Changes in src/server will reflect after rebuilding and redeploying"
echo ""
print_warning "To deploy changes from src/server:"
echo "  1. ./build-lambda-simple.sh      # Build from src/server"
echo "  2. ./deploy-backend-from-src.sh  # Deploy built Lambda functions"
echo ""
print_status "Your Lambda functions are now the true reflection of your Express server!"