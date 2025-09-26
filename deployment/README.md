# AWS Deployment Guide - Trending Topics Dashboard

> **Status**: ✅ **LIVE** at https://trends.leohyl.me

## 🏗️ Architecture Overview

```
https://trends.leohyl.me → CloudFront (E3NVFF4VISSPTO) 
    ├── / → S3 (trends-leohyl-me) → React Frontend
    └── /api/* → API Gateway (qfewncdzqi) → Lambda Functions → DynamoDB (TrendingCache)
```

## 📁 Directory Structure

```
deployment/
├── README.md                          # This deployment guide
├── config/                           # AWS configurations
│   ├── cloudfront-config.json              # Initial CloudFront setup
│   └── cloudfront-updated-config.json      # Final CloudFront + API Gateway
└── scripts/                          # Deployment automation
    ├── setup-infrastructure.sh             # Create AWS resources
    ├── setup-api-gateway.sh               # Configure API Gateway routes  
    ├── build-lambda-simple.sh             # Build Lambda functions from src/server
    ├── deploy-backend-from-src.sh         # Deploy Lambda functions to AWS
    ├── build-and-deploy.sh                # Combined build + deploy
    ├── deploy-frontend.sh                 # Deploy React frontend to S3
    ├── package.json                       # Script dependencies and npm commands
    ├── bucket-policy.json                 # S3 policy template
    └── temp/                              # One-off scripts (gitignored)
        ├── README.md                      # Documentation for temp scripts
        ├── simple-fix.sh                  # Testing/debugging scripts
        └── fix-api-gateway.sh             # Historical fix scripts
```

## 🚀 Quick Deployment Commands

### Full New Deployment
```bash
# 1. Set up AWS infrastructure
cd deployment/scripts
./setup-infrastructure.sh

# 2. Build and deploy backend Lambda functions from src/server
export OPENAI_API_KEY=your_key_here
./build-and-deploy.sh

# 3. Set up API Gateway routes
./setup-api-gateway.sh

# 4. Deploy React frontend
./deploy-frontend.sh
```

### Updates Only
```bash
# Update Lambda functions from src/server (recommended workflow)
cd deployment/scripts
export OPENAI_API_KEY=your_key_here
./build-and-deploy.sh

# Or separate steps:
./build-lambda-simple.sh        # Build from src/server TypeScript
./deploy-backend-from-src.sh    # Deploy to AWS Lambda

# Update frontend only
./deploy-frontend.sh
```

### NPM Commands (Alternative)
```bash
cd deployment/scripts
npm run deploy:all      # Deploy both backend and frontend
npm run deploy:backend  # Deploy Lambda functions only
npm run deploy:frontend # Deploy React frontend only
npm run logs:lambda     # View Lambda logs
npm run check:health    # Health check API
```

## 📋 Prerequisites

### Required
- **AWS CLI** configured with appropriate credentials
- **Node.js 18+** and npm installed
- **OpenAI API key** (set as environment variable)
- **Domain access**: `leohyl.me` hosted in Route 53

### AWS Permissions Required
- S3 (bucket creation, file upload)
- CloudFront (distribution management)
- Lambda (function deployment)
- API Gateway (route configuration)
- DynamoDB (table creation)
- Route 53 (DNS management)
- ACM (SSL certificate access)

## 🏭 Production Resources

### Core Infrastructure
- **S3 Bucket**: `trends-leohyl-me` 
  - Static website hosting enabled
  - Public read access configured
  - Contains built React application

- **CloudFront Distribution**: `E3NVFF4VISSPTO`
  - Custom domain: `trends.leohyl.me`
  - SSL: Wildcard certificate `*.leohyl.me`
  - Origins: S3 + API Gateway
  - Cache behaviors: `/` → S3, `/api/*` → API Gateway

- **Route 53 DNS**: 
  - Hosted Zone: `Z0465161YDUQ1IELA4X0`
  - CNAME: `trends.leohyl.me` → `d278be1warhrf3.cloudfront.net`

### SSL Certificate
- **ACM Certificate**: `arn:aws:acm:us-east-1:128844309521:certificate/1d0cc708-4e15-4a9c-bc61-aae746db62cf`
- **Type**: Wildcard `*.leohyl.me` + `leohyl.me`
- **Status**: ✅ ISSUED (DNS validated)

### Backend Services

#### API Gateway
- **API ID**: `qfewncdzqi`
- **Stage**: `prod`
- **Base URL**: `https://qfewncdzqi.execute-api.eu-west-2.amazonaws.com/prod`
- **Routes**:
  - `GET /api/health` → `trending-health`
  - `GET /api/trending` → `trending-getTrending`
  - `GET /api/trending/cached` → `trending-getTrendingCached`
  - `POST /api/trending/refresh` → `trending-refreshTrending`
  - `GET /api/cache/info` → `trending-getCacheInfo`

#### Lambda Functions
All functions use Node.js 18.x runtime with 512MB memory and 60-second timeout:

1. **trending-getTrending** - Main trending topics endpoint with web search
2. **trending-getTrendingCached** - Cache-first endpoint for progressive loading
3. **trending-refreshTrending** - Force refresh with rate limiting
4. **trending-getCacheInfo** - Cache management and statistics
5. **trending-health** - Health check and system status

#### DynamoDB
- **Table**: `TrendingCache`
- **Purpose**: Caching trending topics with TTL
- **Region**: `eu-west-2`

## 🔧 Detailed Deployment Process

### Step 1: Infrastructure Setup

The `setup-infrastructure.sh` script creates:
- S3 bucket with static website hosting
- CloudFront distribution with SSL
- DynamoDB table for caching
- Lambda execution role
- Initial bucket policies

### Step 2: Backend Deployment

The build and deployment process:
1. **Build**: `build-lambda-simple.sh` compiles TypeScript from `src/server/`
2. **Package**: Creates deployment ZIP with all dependencies
3. **Deploy**: `deploy-backend-from-src.sh` uploads to Lambda functions
4. **Configure**: Sets environment variables and function settings

### Step 3: API Gateway Configuration

The `setup-api-gateway.sh` script:
- Creates REST API
- Configures routes and methods
- Sets up CORS
- Deploys to production stage

### Step 4: Frontend Deployment

The `deploy-frontend.sh` script:
- Builds React application from `src/client/`
- Uploads to S3 bucket
- Invalidates CloudFront cache
- Updates MIME types

## 🔍 Monitoring & Maintenance

### Health Checks
```bash
# Production health check
curl https://trends.leohyl.me/api/health

# API Gateway direct test
curl https://qfewncdzqi.execute-api.eu-west-2.amazonaws.com/prod/health
```

### Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/trending-getTrending --follow

# Or use npm command
cd deployment/scripts && npm run logs:lambda
```

### Cache Management
- View cache stats: `GET /api/cache/info`
- Clear cache: `DELETE /api/cache`
- Monitor performance via CloudWatch

### Updates
- **Code changes**: Run `./build-and-deploy.sh`
- **Frontend updates**: Run `./deploy-frontend.sh`
- **Infrastructure changes**: Modify and run setup scripts

## 🎯 Cost Optimization

### Lambda Configuration
- **Runtime**: Node.js 18.x (latest supported)
- **Memory**: 512MB (balanced performance/cost)
- **Timeout**: 60 seconds (sufficient for web search)
- **Model**: `gpt-4o-mini` (cost-effective OpenAI model)

### Caching Strategy
- **DynamoDB TTL**: 2-hour cache duration
- **CloudFront**: Frontend asset caching
- **Progressive loading**: Immediate cached responses

### Resource Monitoring
- CloudWatch metrics for Lambda invocations
- S3 storage and transfer costs
- DynamoDB read/write units
- CloudFront data transfer

## 🚨 Troubleshooting

### Common Issues

**Lambda deployment fails:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify OpenAI API key
echo $OPENAI_API_KEY

# Check build output
ls -la deployment/lambda-build/
```

**Frontend not updating:**
```bash
# Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id E3NVFF4VISSPTO --paths "/*"

# Or use npm command
cd deployment/scripts && npm run invalidate:cloudfront
```

**API Gateway issues:**
```bash
# Test direct Lambda function
aws lambda invoke --function-name trending-health response.json
cat response.json

# Check API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "API-Gateway"
```

### Rollback Process
1. Revert to previous Lambda deployment
2. Update API Gateway if needed
3. Invalidate CloudFront cache
4. Monitor health endpoints

## 📚 Related Documentation

- **Main Project**: `/README.md` - Project overview and setup
- **Technical Specs**: `/SPECIFICATION.md` - Detailed technical documentation
- **Configuration**: `/config/README.md` - Configuration system guide
- **Source Code**: `/src/` - Client and server implementation

---

**Last Updated**: September 2025  
**Production URL**: https://trends.leohyl.me  
**Status**: ✅ Active and Operational