# Project Specification: Trending Topics Dashboard

## Overview

A single-page web application that allows users to create a customizable dashboard with multiple sections, each displaying trending topics for user-defined keywords using AI-powered content aggregation.

## Core Requirements

### 1. User Interface

#### Dashboard Layout
- **Responsive Grid System**:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3-4 columns
  - Large screens: 4-5 columns
- **Drag-and-Drop Functionality**: Users can reorder sections
- **Fixed-height Cards**: Each section fits one grid cell with scrolling for overflow
- **Settings Menu**: Tucked away access to add/remove sections

#### Section Management
- **Maximum Sections**: 10 keyword-based sections
- **Section Configuration**:
  - Keyword assignment (simple text input)
  - Number of results to display (1-10, user configurable)
  - Section uses keyword as title
- **Add/Remove Sections**: Via settings menu interface

### 2. Content Aggregation

#### AI Integration
- **API**: ChatGPT API for content discovery and summarization
- **Batch Processing**: Single API call for all keywords to optimize costs
- **Content Format**:
  - Title of trending topic
  - 2-3 sentence summary (what happened, why significant, impact/next steps)
  - Maximum 10 topics per keyword

#### Caching Strategy
- **Cache Duration**: 1 hour per keyword
- **Shared Caching**: Same keyword instances share cached results
- **Cache Storage**: Redis (production) or node-cache (development)

### 3. Refresh Mechanism

#### Automatic Refresh
- **Frequency**: Every hour for all sections
- **Background Processing**: Non-blocking updates
- **Loading State**: Show cached content with spinner indicator during refresh

#### Manual Refresh
- **Rate Limiting**: 3 times per day maximum (configurable)
- **Development Toggle**: Can be disabled during development
- **Batch Processing**: Refreshes all sections simultaneously

### 4. Technical Architecture

#### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Key Libraries**:
  - `react-grid-layout` for drag-and-drop
  - `@tanstack/react-query` for data management
  - `axios` for API communication
  - `date-fns` for timestamp formatting

#### Backend Stack
- **Runtime**: Node.js with Express and TypeScript
- **Caching**: Redis or node-cache
- **API Integration**: OpenAI SDK
- **Middleware**: CORS, security headers

### 5. Data Models

#### Section Configuration
```typescript
interface Section {
  id: string;
  keyword: string;
  maxResults: number; // 1-10
  position: { x: number; y: number };
  createdAt: Date;
}
```

#### Trending Topic
```typescript
interface TrendingTopic {
  title: string;
  summary: string;
  searchUrl: string; // Google search link
}
```

#### Cache Entry
```typescript
interface CachedResult {
  keyword: string;
  topics: TrendingTopic[];
  lastUpdated: Date;
  expiresAt: Date;
}
```

### 6. API Specifications

#### GET /api/trending?keywords=keyword1,keyword2
- **Description**: Retrieve trending topics for specified keywords (cache-first)
- **Parameters**: `keywords` - Comma-separated list of keywords
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "keyword": "AI",
        "topics": [
          {
            "title": "Topic Title",
            "summary": "2-3 sentence summary...",
            "searchUrl": "https://www.google.com/search?q=..."
          }
        ],
        "lastUpdated": "2025-08-30T09:56:48.176Z",
        "cached": true
      }
    ],
    "message": "Trending topics retrieved successfully"
  }
  ```

#### POST /api/trending/refresh
- **Description**: Force refresh for keywords (bypasses cache)
- **Body**: `{ "keywords": ["keyword1", "keyword2"] }`
- **Rate Limited**: 3 requests per day (configurable)
- **Response**: Fresh trending data with updated timestamps

#### GET /api/health
- **Description**: Server health check
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "timestamp": "ISO timestamp",
      "uptime": 1234.567,
      "version": "1.0.0"
    }
  }
  ```

#### GET /api/cache/stats
- **Description**: Cache performance metrics
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "hits": 2,
      "misses": 1,
      "errors": 0,
      "hitRate": "66.67%",
      "cacheType": "NodeCache"
    }
  }
  ```

#### GET /api/cache/info
- **Description**: View cached keywords and expiration times
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "cacheType": "NodeCache",
      "totalKeys": 2,
      "keys": [
        {
          "keyword": "AI",
          "expiresIn": "45 minutes",
          "key": "trending:ai"
        }
      ]
    }
  }
  ```

### 7. Configuration Management

#### Application Limits
```typescript
const APP_LIMITS = {
  MAX_KEYWORDS: 10,
  MANUAL_REFRESH_LIMIT: 3, // per day
  CACHE_DURATION_HOURS: 1,
  MANUAL_REFRESH_ENABLED: false, // development toggle
  MAX_RESULTS_PER_KEYWORD: 10
}
```

### 8. Error Handling

#### UI Error States
- **API Failure**: Show fallback message in affected sections
- **Network Issues**: Display retry option with cached content
- **Rate Limiting**: Clear messaging about limits and reset times

#### Logging and Monitoring
- **Error Tracking**: Log API failures and system errors
- **Performance Monitoring**: Track API response times and cache hit rates

### 9. User Experience

#### Loading States
- **Initial Load**: Skeleton cards while data loads
- **Refresh State**: Spinner overlay with cached content visible
- **Empty State**: Helpful message when no sections configured

#### Interactions
- **Topic Links**: Click topic title to search Google for that keyword
- **Timestamps**: "Last updated X minutes/hours ago" display
- **Visual Feedback**: Smooth animations for drag-and-drop

### 10. Future Considerations

#### Phase 2 Enhancements
- Custom section titles instead of keyword-only
- Enhanced loading animations
- Section-specific refresh options
- Export/import dashboard configurations

#### Multi-user Migration
- User authentication system
- PostgreSQL database with Prisma ORM
- Personal dashboard persistence
- User preference management

#### Advanced Features
- Boolean keyword operators (AND, OR, NOT)
- Source filtering options
- Trending metrics and analytics
- Dashboard sharing capabilities

## Development Phases

### Phase 1: Core MVP
1. Basic React dashboard with grid layout
2. Backend API with ChatGPT integration
3. Simple caching mechanism
4. Manual section management

### Phase 2: Polish & Performance
1. Drag-and-drop functionality
2. Enhanced error handling
3. Optimized caching strategy
4. Rate limiting implementation

### Phase 3: Production Ready
1. Production deployment configuration
2. Monitoring and logging
3. Performance optimizations
4. Documentation and testing

## Success Metrics

- **Functionality**: All 10 sections can display trending topics
- **Performance**: API responses under 2 seconds
- **Reliability**: 99% uptime with proper error handling
- **User Experience**: Intuitive interface requiring no documentation
- **Cost Efficiency**: Optimized API usage through effective caching