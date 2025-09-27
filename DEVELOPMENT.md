# Development Guide & Implementation Notes

## 🛠️ Development Workflow

### Local Development Setup

1. **Backend Development**:
```bash
cd src/server
npm install
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
npm run build
npm start         # Production mode
npm run dev       # Development mode (if nodemon available)
```

2. **Frontend Development**:
```bash
cd src/client
npm install
npm run dev       # Development server (http://localhost:3000)
npm run build     # Production build
npm run preview   # Preview production build
```

3. **Testing**:
```bash
# Server
cd src/server && npm run build  # Verify TypeScript compilation

# Client  
cd src/client && npm run build  # Verify TypeScript + production build

# Health checks
curl http://localhost:3002/api/health  # Server health
curl http://localhost:3000/api/health  # Client proxy test
```

### Development Tools

- **Hot Reload**: Vite provides instant updates for React components
- **TypeScript**: Strict mode enabled for type safety
- **Structured Logging**: Development vs production log levels
- **Error Handling**: Consistent API responses with proper error codes

## 🔧 Configuration Management

### Environment Variables

All configuration follows a centralized pattern with environment overrides:

**Required**:
- `OPENAI_API_KEY` - OpenAI API key for web search

**Optional** (with defaults):
- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (default: 'development')
- `REDIS_URL` - Redis connection (default: local)
- `OPENAI_MODEL` - Model selection (default: 'gpt-4o-mini')
- `OPENAI_TEMPERATURE` - Response creativity (default: 0.3)
- `OPENAI_MAX_TOKENS` - Response length (default: 3000)

### Configuration Hierarchy

1. **Base Config** (`/config/base.json`) - Shared defaults
2. **Environment Variables** - Runtime overrides
3. **Validation** - Startup validation with helpful error messages

## 🧱 Architecture Decisions

### Code Organization

**Centralized Configuration**:
- Single source of truth in `/config/base.json`
- Prevents port mismatches and duplicate values
- Environment-specific overrides via env vars

**Shared Utilities**:
- Common types in `/src/shared/types/`
- Shared utilities for API responses and validation
- Structured logging system replacing console.log

**TypeScript Isolation**:
- Each module has local utility copies due to TypeScript cross-directory constraints
- Type exports use `export type` for proper isolation
- Consistent camelCase property naming throughout

### Performance Optimizations

**Smart Caching**:
- 2-hour cache duration balances freshness and cost
- Progressive loading shows cached data immediately
- Background updates don't block UI interaction

**Cost Optimization**:
- `gpt-4o-mini` model for 80% cost reduction vs `gpt-4-turbo`
- Intelligent cache-first approach reduces API calls
- Web search context size configurable (high/medium/low)

**Frontend Performance**:
- Vite for fast development builds
- React 18 with concurrent features
- Responsive design for all device sizes

## 🔍 Implementation Stories

### Content Filtering Response Handler

**Problem**: OpenAI's content filtering occasionally returns minimal responses (1 character) for politically sensitive keywords, causing users to receive generic fallback messages.

**Analysis**: 
- Web search component functions correctly (status: "completed")
- Model applies content filtering before response generation
- Affects controversial political figures or sensitive topics
- Example: "Charlie Kirk US" returns single space instead of JSON

**Current Handling**:
```typescript
// Detection pattern in openaiService.ts
if (content.trim().length <= 3 && webSearchWasSuccessful) {
  // Use fallback message explaining content filtering
  return [{
    title: `Current ${keyword} Developments`,
    summary: `Web search successfully found current information about ${keyword}, but the response format requires manual review.`,
    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' latest news')}`
  }];
}
```

**Future Enhancement Ideas**:

1. **Smart Detection**:
```typescript
private isContentFiltered(response: any, content: string): boolean {
  return (
    content.trim().length <= 3 &&
    response.output?.some((item: any) => 
      item.type === "web_search_call" && 
      item.status === "completed"
    )
  );
}
```

2. **Alternative Search Strategies**:
```typescript
private async handleContentFiltering(keyword: string): Promise<TrendingTopic[]> {
  const alternatives = [
    `${keyword} news updates`,
    `recent developments ${keyword}`,
    `${keyword} latest information`
  ];
  
  for (const altKeyword of alternatives) {
    const result = await this.getWebSearchTrendingTopics(altKeyword, 3);
    if (result.topics.length > 0 && !this.isGenericFallback(result.topics[0])) {
      return result.topics.map(topic => ({
        ...topic,
        title: topic.title.replace(altKeyword, keyword)
      }));
    }
  }
  
  return this.getCategoryBasedTopics(keyword);
}
```

3. **Enhanced User Communication**:
```typescript
private getContentFilteredMessage(keyword: string): TrendingTopic {
  return {
    title: `Content Filtering Notice for "${keyword}"`,
    summary: `Our content provider has applied filtering to this keyword. This may be due to the sensitive nature of the topic. Alternative search strategies are being explored.`,
    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' news')}`,
    metadata: {
      isFiltered: true,
      reason: 'content_filtering',
      timestamp: new Date().toISOString()
    }
  };
}
```

**Implementation Priority**: Medium - Most keywords work correctly, but enhanced handling would improve user experience for sensitive topics.

### OpenAI Model Selection Strategy

**Current Model**: `gpt-4o-mini`
- **Cost**: ~80% cheaper than gpt-4-turbo
- **Quality**: Sufficient for trending topics summarization
- **Speed**: Faster response times
- **Web Search**: Full compatibility with Responses API

**Model Comparison**:
- `gpt-4o-mini`: Most cost effective, good quality
- `gpt-3.5-turbo`: Good balance, but no web search support
- `gpt-4-turbo`: High quality, higher cost
- `gpt-4o`: Latest features, premium cost

**Configuration**:
```json
{
  "openai": {
    "model": "gpt-4o-mini",
    "webSearch": {
      "enabled": true,
      "contextSize": "medium"  // high/medium/low for cost/quality balance
    }
  }
}
```

## 🚀 Deployment Pipeline

### Lambda Build Process

The deployment uses a source-of-truth approach:
1. **Source**: `src/server/` contains the Express application
2. **Build**: `build-lambda-simple.sh` compiles TypeScript and creates Lambda handlers
3. **Deploy**: `deploy-backend-from-src.sh` uploads to AWS Lambda
4. **Sync**: Lambda functions mirror Express controllers exactly

### CI/CD Integration Ideas

```bash
# Proposed pipeline
npm run test               # Run tests (when added)
npm run build:server      # Compile TypeScript
npm run build:client      # Build React app
npm run deploy:backend    # Deploy Lambda functions
npm run deploy:frontend   # Deploy to S3/CloudFront
npm run health:check      # Verify deployment
```

### Environment Management

**Development**:
- Local Redis for caching
- Hot reload for both client and server
- Detailed logging and error messages

**Production**:
- DynamoDB for serverless caching
- CloudWatch for logging and monitoring
- Rate limiting and proper CORS

## 🔍 Monitoring & Debugging

### Logging Strategy

**Structured Logging**:
```typescript
import { logger } from '../utils/logger';

logger.info('Operation completed', { 
  keyword, 
  responseTime: Date.now() - startTime,
  cacheHit: fromCache 
});
```

**Log Levels**:
- `error`: Critical issues requiring attention
- `warn`: Non-critical issues (cache misses, API limits)
- `info`: Normal operation events
- `debug`: Detailed debugging (development only)

### Health Monitoring

**Endpoints**:
- `/api/health` - Basic health check with uptime
- `/api/cache/stats` - Cache performance metrics
- `/api/cache/info` - Current cache contents

**CloudWatch Metrics**:
- Lambda invocation count and duration
- Error rates by function
- DynamoDB read/write consumption
- OpenAI API response times

## 🎯 Future Enhancements

### Short Term
1. **Enhanced Content Filtering** - Implement alternative search strategies
2. **Performance Metrics** - Add response time tracking
3. **Error Recovery** - Improved fallback mechanisms
4. **Testing Suite** - Unit and integration tests

### Medium Term
1. **User Preferences** - Saved keywords and layouts
2. **Real-time Updates** - WebSocket for live data
3. **Analytics** - Usage patterns and popular keywords
4. **A/B Testing** - Model and prompt optimization

### Long Term
1. **Multi-source Data** - Additional news sources
2. **Personalization** - AI-driven content curation
3. **API Monetization** - External API access
4. **Mobile App** - React Native implementation

## 🛡️ Security Considerations

### API Security
- Rate limiting on refresh endpoints
- Input validation and sanitization
- CORS properly configured
- No sensitive data in client logs

### Data Privacy
- No user data persistence
- Minimal logging of search terms
- OpenAI API terms compliance
- GDPR considerations for EU users

### Infrastructure Security
- Lambda execution roles with minimal permissions
- S3 bucket policies restrict public access
- CloudFront security headers
- SSL/TLS everywhere

---

**Maintainer Notes**: This document should be updated as the project evolves. Key implementation decisions and their rationale are documented here for future developers.