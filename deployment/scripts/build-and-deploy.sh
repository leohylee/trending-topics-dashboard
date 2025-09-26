#!/bin/bash

# Combined Build and Deploy Script
# Builds Lambda functions from src/server and deploys them to AWS

set -e

echo "🔄 Building and deploying Lambda functions from src/server..."
echo ""

# Step 1: Build Lambda functions from src/server
echo "📦 Step 1: Building Lambda functions from Express controllers..."
./build-lambda-simple.sh

echo ""
echo "🚀 Step 2: Deploying built Lambda functions to AWS..."
./deploy-backend-from-src.sh

echo ""
echo "✅ Build and deployment complete!"
echo ""
echo "🎉 Your Lambda functions are now synchronized with src/server!"
echo "   Any changes in src/server/src/ will be reflected in Lambda after running this script."