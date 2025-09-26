#!/bin/bash

API_ID="qfewncdzqi"
REGION="eu-west-2"
ACCOUNT_ID="128844309521"

# Resource IDs from previous creation
TRENDING_RESOURCE_ID="y7m19r"
HEALTH_RESOURCE_ID="xyep5l" 
CACHE_RESOURCE_ID="2qu3bp"
TRENDING_CACHED_RESOURCE_ID="ilss07"
TRENDING_REFRESH_RESOURCE_ID="sl5yfr"
CACHE_INFO_RESOURCE_ID="5b895p"

echo "Setting up API Gateway methods and integrations..."

# Function to create method and integration
create_method_and_integration() {
    local resource_id=$1
    local http_method=$2
    local lambda_function_name=$3
    local path=$4
    
    echo "Creating $http_method method for $path"
    
    # Create method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $http_method \
        --authorization-type NONE \
        --no-api-key-required
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $http_method \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$lambda_function_name/invocations"
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name $lambda_function_name \
        --statement-id "${lambda_function_name}-apigateway-invoke-$(date +%s)" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" || true
}

# Create methods and integrations
create_method_and_integration $TRENDING_RESOURCE_ID "GET" "trending-getTrending" "/trending"
create_method_and_integration $TRENDING_CACHED_RESOURCE_ID "GET" "trending-getTrendingCached" "/trending/cached"  
create_method_and_integration $TRENDING_REFRESH_RESOURCE_ID "POST" "trending-refreshTrending" "/trending/refresh"
create_method_and_integration $HEALTH_RESOURCE_ID "GET" "trending-health" "/health"
create_method_and_integration $CACHE_INFO_RESOURCE_ID "GET" "trending-getCacheInfo" "/cache/info"

echo "Creating deployment..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --stage-description "Production stage"

echo "API Gateway setup complete!"
echo "API base URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"