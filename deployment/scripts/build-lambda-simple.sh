#!/bin/bash

# Simple Lambda Build Script
# Builds Lambda functions from Express controllers

set -e

# Configuration
PROJECT_ROOT="/Users/leo/Projects/trending-topics-dashboard"
SERVER_SRC="$PROJECT_ROOT/src/server"
LAMBDA_BUILD_DIR="$PROJECT_ROOT/deployment/lambda-build"
DEPLOYMENT_PACKAGE="lambda-deployment-from-src.zip"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_status "🚀 Building Lambda functions from Express controllers..."
echo ""

# Step 1: Clean build directory
print_status "Cleaning build directory..."
rm -rf "$LAMBDA_BUILD_DIR"
mkdir -p "$LAMBDA_BUILD_DIR"
print_success "Build directory ready"

# Step 2: Build server TypeScript
print_status "Building server TypeScript..."
cd "$SERVER_SRC"
npm run build
print_success "Server TypeScript compiled"

# Step 3: Copy server dependencies to Lambda build
print_status "Setting up Lambda package..."
cd "$LAMBDA_BUILD_DIR"

# Copy built TypeScript files
cp -r "$SERVER_SRC/dist" "$LAMBDA_BUILD_DIR/"
cp -r "$SERVER_SRC/node_modules" "$LAMBDA_BUILD_DIR/"

# Copy config directory to Lambda build root so it can be found at runtime  
cp -r "$PROJECT_ROOT/config" "$LAMBDA_BUILD_DIR/"

# Create package.json for Lambda  
cat > package.json << 'EOF'
{
  "name": "trending-topics-lambda-from-src",
  "version": "1.0.0",
  "type": "commonjs",
  "dependencies": {
    "aws-sdk": "^2.1520.0",
    "openai": "^4.38.5", 
    "axios": "^1.6.2"
  }
}
EOF

print_success "Lambda package setup complete"

# Step 4: Create Lambda handlers that use the server controllers
print_status "Creating Lambda handlers..."

# getTrending handler
cat > getTrending.js << 'EOF'
const { TrendingService } = require('./dist/services/trendingService');

const trendingService = new TrendingService();

exports.handler = async (event, context) => {
    console.log('getTrending Lambda invoked', JSON.stringify(event, null, 2));
    
    try {
        // Parse keywords from query parameters
        const keywords = parseKeywords(event.queryStringParameters?.keywords);
        
        if (!keywords || keywords.length === 0) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Keywords parameter is required'
                })
            };
        }
        
        const data = await trendingService.getTrendingTopics(keywords);
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data,
                message: 'Trending topics retrieved successfully'
            })
        };
    } catch (error) {
        console.error('getTrending error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

function parseKeywords(keywordsParam) {
    if (!keywordsParam) return [];
    if (typeof keywordsParam === 'string') {
        return keywordsParam.split(',').map(k => k.trim()).filter(k => k);
    }
    return [];
}

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://trends.leohyl.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}
EOF

# getTrendingCached handler
cat > getTrendingCached.js << 'EOF'
const { TrendingService } = require('./dist/services/trendingService');

const trendingService = new TrendingService();

exports.handler = async (event, context) => {
    console.log('getTrendingCached Lambda invoked');
    
    try {
        const keywords = parseKeywords(event.queryStringParameters?.keywords);
        
        if (!keywords || keywords.length === 0) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Keywords parameter is required'
                })
            };
        }
        
        const result = await trendingService.getCachedTopics(keywords);
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: result,
                message: 'Cached trending topics retrieved successfully'
            })
        };
    } catch (error) {
        console.error('getTrendingCached error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

function parseKeywords(keywordsParam) {
    if (!keywordsParam) return [];
    if (typeof keywordsParam === 'string') {
        return keywordsParam.split(',').map(k => k.trim()).filter(k => k);
    }
    return [];
}

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://trends.leohyl.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}
EOF

# health handler
cat > health.js << 'EOF'
exports.handler = async (event, context) => {
    console.log('health Lambda invoked');
    
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            source: 'Express Controller'
        };
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: healthData,
                message: 'Service is healthy'
            })
        };
    } catch (error) {
        console.error('health error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://trends.leohyl.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}
EOF

# getCacheInfo handler
cat > getCacheInfo.js << 'EOF'
const { TrendingService } = require('./dist/services/trendingService');

const trendingService = new TrendingService();

exports.handler = async (event, context) => {
    console.log('getCacheInfo Lambda invoked');
    
    try {
        const info = await trendingService.getCacheInfo();
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data: info,
                message: 'Cache information retrieved successfully'
            })
        };
    } catch (error) {
        console.error('getCacheInfo error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://trends.leohyl.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}
EOF

# refreshTrending handler
cat > refreshTrending.js << 'EOF'
const { TrendingService } = require('./dist/services/trendingService');

const trendingService = new TrendingService();

exports.handler = async (event, context) => {
    console.log('refreshTrending Lambda invoked');
    
    try {
        let keywords;
        
        if (event.body) {
            const body = JSON.parse(event.body);
            keywords = body.keywords || [];
        } else {
            keywords = parseKeywords(event.queryStringParameters?.keywords);
        }
        
        if (!keywords || keywords.length === 0) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    error: 'Keywords are required'
                })
            };
        }
        
        const data = await trendingService.refreshTopics(keywords);
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                data,
                message: 'Trending topics refreshed successfully'
            })
        };
    } catch (error) {
        console.error('refreshTrending error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};

function parseKeywords(keywordsParam) {
    if (!keywordsParam) return [];
    if (typeof keywordsParam === 'string') {
        return keywordsParam.split(',').map(k => k.trim()).filter(k => k);
    }
    return [];
}

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://trends.leohyl.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}
EOF

print_success "Lambda handlers created"

# Step 5: Create deployment package
print_status "Creating deployment package..."
zip -r "$DEPLOYMENT_PACKAGE" . -x "*.git*" "*.DS_Store*"
print_success "Deployment package created: $DEPLOYMENT_PACKAGE"

echo ""
print_success "✅ Lambda build completed successfully!"
echo ""
print_status "📦 Build outputs:"
echo "   • Build directory: $LAMBDA_BUILD_DIR"
echo "   • Deployment package: $LAMBDA_BUILD_DIR/$DEPLOYMENT_PACKAGE"
echo ""
print_status "🚀 Next steps:"
echo "   1. Deploy using: deployment/scripts/deploy-backend-from-src.sh"
echo "   2. Your Express controllers are now the source of truth"
echo "   3. Changes in src/server will reflect in Lambda after rebuild"