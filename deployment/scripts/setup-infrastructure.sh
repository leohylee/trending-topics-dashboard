#!/bin/bash

# AWS Infrastructure Setup for trends.leohyl.me
# Run this script to create all AWS resources

set -e

echo "🚀 Setting up AWS infrastructure for trends.leohyl.app..."

# Configuration
BUCKET_NAME="trends-leohyl-app"
TABLE_NAME="TrendingCache"
API_NAME="trending-topics-api"
DOMAIN_NAME="trends.leohyl.app"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-Z10405232A9O7PPCBA791}"  # leohyl.app hosted zone

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

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

print_status "AWS Account: $AWS_ACCOUNT_ID"
print_status "AWS Region: $AWS_REGION"

# 1. Create S3 bucket for frontend
print_status "Creating S3 bucket: $BUCKET_NAME"

if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    
    # Configure for static website hosting
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html
    
    # Set bucket policy for public read
    cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
    
    aws s3api put-bucket-policy \
        --bucket "$BUCKET_NAME" \
        --policy file://bucket-policy.json
    
    rm bucket-policy.json
    print_success "S3 bucket created and configured"
else
    print_warning "S3 bucket $BUCKET_NAME already exists"
fi

# 2. Create DynamoDB table for caching
print_status "Creating DynamoDB table: $TABLE_NAME"

if ! aws dynamodb describe-table --table-name "$TABLE_NAME" &> /dev/null; then
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName=keyword,AttributeType=S \
        --key-schema \
            AttributeName=keyword,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"
    
    # Wait for table to be created
    print_status "Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$TABLE_NAME"
    
    # Enable TTL
    aws dynamodb update-time-to-live \
        --table-name "$TABLE_NAME" \
        --time-to-live-specification "Enabled=true,AttributeName=ttl"
    
    print_success "DynamoDB table created with TTL enabled"
else
    print_warning "DynamoDB table $TABLE_NAME already exists"
fi

# 3. Create IAM role for Lambda functions
print_status "Creating IAM role for Lambda functions"

ROLE_NAME="trending-lambda-role"

if ! aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
    # Trust policy for Lambda
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file://trust-policy.json
    
    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    
    # Create custom policy for DynamoDB access
    cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:$AWS_REGION:$AWS_ACCOUNT_ID:table/$TABLE_NAME"
    }
  ]
}
EOF
    
    aws iam create-policy \
        --policy-name "trending-dynamodb-policy" \
        --policy-document file://dynamodb-policy.json
    
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::$AWS_ACCOUNT_ID:policy/trending-dynamodb-policy"
    
    rm trust-policy.json dynamodb-policy.json
    print_success "IAM role created with DynamoDB permissions"
else
    print_warning "IAM role $ROLE_NAME already exists"
fi

# 4. Create API Gateway
print_status "Creating API Gateway: $API_NAME"

if ! aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text | grep -q .; then
    API_ID=$(aws apigateway create-rest-api \
        --name "$API_NAME" \
        --description "API for trending topics dashboard" \
        --endpoint-configuration types=REGIONAL \
        --query 'id' --output text)
    
    print_success "API Gateway created with ID: $API_ID"
    echo "API_GATEWAY_ID=$API_ID" >> ../config/aws-resources.env
else
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)
    print_warning "API Gateway $API_NAME already exists with ID: $API_ID"
fi

# 5. Create CloudFront distribution (placeholder - requires manual SSL cert setup)
print_status "CloudFront distribution setup required:"
echo "  1. Request/verify SSL certificate for *.leohyl.app in ACM (us-east-1)"
echo "  2. Create CloudFront distribution with:"
echo "     - Origin: $BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
echo "     - Alternate domain: $DOMAIN_NAME"
echo "     - SSL certificate: *.leohyl.app"
echo "  3. Update Route 53 CNAME record for $DOMAIN_NAME"

# Create resources summary
print_status "Creating AWS resources summary..."
cat > ../config/aws-resources.env << EOF
# AWS Resources for trends.leohyl.app
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
AWS_REGION=$AWS_REGION
S3_BUCKET_NAME=$BUCKET_NAME
DYNAMODB_TABLE_NAME=$TABLE_NAME
IAM_ROLE_NAME=$ROLE_NAME
API_GATEWAY_ID=$API_ID
API_GATEWAY_URL=https://$API_ID.execute-api.$AWS_REGION.amazonaws.com
LAMBDA_ROLE_ARN=arn:aws:iam::$AWS_ACCOUNT_ID:role/$ROLE_NAME

# Manual setup required:
# 1. SSL Certificate ARN (from ACM)
# 2. CloudFront Distribution ID
# 3. Route 53 Hosted Zone ID: $HOSTED_ZONE_ID
EOF

print_success "Infrastructure setup completed!"
print_status "Next steps:"
echo "  1. Set up SSL certificate in ACM"
echo "  2. Create CloudFront distribution"
echo "  3. Update Route 53 DNS"
echo "  4. Deploy Lambda functions: ./deploy-backend.sh"
echo "  5. Deploy frontend: ./deploy-frontend.sh"