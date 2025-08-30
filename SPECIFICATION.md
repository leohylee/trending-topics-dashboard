# Project Specification: Trending Topics Dashboard

## Overview

A real-time trending topics dashboard that provides **factual, current information** from the internet using OpenAI's advanced Responses API with web search capabilities. Users can create customizable dashboard sections that display actual trending events, news, and developments.

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

#### AI Integration with Real Web Search
- **API**: **OpenAI Responses API with web_search_preview tool** for **real-time internet search**
- **Web Search Capability**: Searches actual current sources (CNN, BBC, Reuters, TechCrunch, Twitter/X, Reddit)
- **Processing Strategy**: Individual keyword processing for maximum accuracy and real data
- **Model Requirements**: Uses `gpt-4o` or `gpt-4o-mini` (web search not supported on `gpt-4-turbo`)
- **Content Format**:
  - **Real News Headlines**: Actual current events with specific names, dates, and figures
  - **Factual Summaries**: 2-3 sentence summaries based on actual web search findings
  - **Google Search Links**: Direct links to search for each specific topic
  - **Processing Time**: 20-30 seconds per keyword for thorough web research

#### Caching Strategy with Management
- **Cache Duration**: 1 hour per keyword (configurable via `CACHE_DURATION_HOURS`)
- **Shared Caching**: Same keyword instances share cached results across all sections
- **Cache Storage**: Redis (production) or node-cache (development)
- **Cache Management**: 
  - **Full Cache Clearing**: `DELETE /api/cache` for complete refresh
  - **Selective Clearing**: `DELETE /api/cache/:keyword` for individual keyword refresh
  - **Cache Statistics**: Hit/miss ratios and performance metrics via `/api/cache/stats`
  - **Cache Monitoring**: View cached keywords and expiration times via `/api/cache/info`

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
- **Framework**: React 18 with TypeScript and strict mode
- **Build Tool**: Vite with Hot Module Replacement (HMR)
- **Styling**: Tailwind CSS with dark mode support and custom configuration
- **Key Libraries**:
  - `react-grid-layout` for responsive drag-and-drop grid system
  - `@tanstack/react-query` for server state management and caching
  - `axios` for HTTP client with interceptors and error handling
  - `date-fns` for date formatting and relative time display
  - `lucide-react` for consistent SVG icons throughout the app
- **Development**: ESLint for code quality, TypeScript for type safety

#### Backend Stack
- **Runtime**: Node.js with Express and TypeScript
- **AI Integration**: **OpenAI Responses API with web_search_preview tool** for real-time internet search
- **Caching**: Redis (production) or node-cache (development) with management endpoints
- **Model Support**: `gpt-4o` and `gpt-4o-mini` (web search capability)
- **Advanced Parsing**: Multi-pattern JSON extraction with intelligent text parsing fallbacks
- **Middleware**: CORS, security headers, rate limiting
- **Cache Management**: Statistics tracking, selective clearing, performance monitoring

### 5. Frontend Component Architecture

#### Core Components

##### Dashboard.tsx
- **Purpose**: Main application container with grid layout management
- **State Management**: 
  - Section configurations via useState
  - Grid layout persistence to localStorage
  - Modal state for settings and editing
- **Hooks**: useTrending for data fetching, useRefreshTrending for manual refresh
- **Responsive**: react-grid-layout with breakpoint-specific column configurations

##### TrendingSection.tsx
- **Purpose**: Individual keyword section display with trending topics
- **Props**: Section config, trending data, loading/error states, callbacks
- **Features**: Topic list with Google search links, last updated timestamps
- **Loading States**: Skeleton placeholders during data fetches
- **Error Handling**: Fallback UI with retry options

##### SettingsModal.tsx  
- **Purpose**: Section configuration modal for add/edit operations
- **Features**: Keyword input validation, max results slider, section management
- **Validation**: Keyword uniqueness checking, result count limits (1-10)
- **UX**: Form validation with real-time feedback

##### ThemeToggle.tsx
- **Purpose**: Light/dark mode switcher with system preference detection  
- **Persistence**: Theme choice stored in localStorage
- **Integration**: Works with Tailwind's dark mode classes
- **Context**: Connected to ThemeContext for global state

#### Custom Hooks

##### useTrending.ts
- **Purpose**: Data fetching and caching logic using React Query
- **Features**:
  - Automatic background refetching every 5 minutes
  - Cache-first strategy with 5-minute stale time
  - Error handling with 2 retry attempts
  - Loading states for initial and background fetches
- **Query Key**: Based on keyword array for proper cache invalidation

##### useRefreshTrending.ts (via useTrending)
- **Purpose**: Manual refresh mutation with rate limiting awareness
- **Features**: Force refresh bypassing cache, error handling
- **Rate Limiting**: Respects server-side limits with user feedback

#### Utility Services

##### api.ts  
- **Purpose**: Axios HTTP client configuration
- **Features**: 
  - Base URL configuration for development/production
  - Request/response interceptors for error handling
  - Timeout configuration (10 seconds)
  - Type-safe API methods for all endpoints

##### storage.ts
- **Purpose**: localStorage abstraction for settings persistence  
- **Features**:
  - Section CRUD operations with validation
  - Theme preference storage
  - Grid layout persistence
  - Error handling for storage quota issues

### 6. Data Models

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

#### Core Data Endpoints

##### GET /api/trending?keywords=keyword1,keyword2
- **Description**: Retrieve trending topics for specified keywords using cache-first strategy with **real web search**
- **Parameters**: 
  - `keywords` (required): Comma-separated list of keywords (max 10)
  - Cache-first strategy: Returns cached data if available, fetches fresh data from web search if expired
- **Web Search**: Uses OpenAI Responses API with web_search_preview tool for **factual, current information**
- **Processing Time**: 20-30 seconds per uncached keyword (real web search takes time)
- **Response Format**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "keyword": "AI",
        "topics": [
          {
            "title": "Microsoft Unveils MAI-Voice-1 and MAI-1-Preview AI Models",
            "summary": "Microsoft announced two new AI models on August 28, 2025, focusing on voice synthesis and advanced language processing capabilities. The models are designed for enterprise applications and represent Microsoft's latest advancement in AI technology.",
            "searchUrl": "https://www.google.com/search?q=AI%20Microsoft%20MAI-Voice-1"
          }
        ],
        "lastUpdated": "2025-08-30T09:56:48.176Z",
        "cached": true
      }
    ],
    "message": "Trending topics retrieved successfully"
  }
  ```

##### POST /api/trending/refresh
- **Description**: Force refresh for keywords, bypassing cache with **real-time web search**
- **Rate Limited**: 3 requests per day (configurable via `MANUAL_REFRESH_LIMIT`)
- **Body**: 
  ```json
  {
    "keywords": ["keyword1", "keyword2"]
  }
  ```
- **Processing**: Each keyword processed individually with OpenAI web search for maximum accuracy
- **Response**: Fresh trending data with updated timestamps and real web search results

#### System Health Endpoints

##### GET /api/health
- **Description**: Comprehensive server health check and system status
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "timestamp": "2025-08-30T10:15:32.456Z",
      "uptime": 3661.245,
      "version": "1.2.0",
      "webSearchEnabled": true,
      "cacheType": "NodeCache"
    }
  }
  ```

#### Cache Management Endpoints

##### GET /api/cache/stats
- **Description**: Detailed cache performance metrics and hit/miss ratios
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "hits": 15,
      "misses": 4,
      "errors": 0,
      "hitRate": "78.95%",
      "cacheType": "NodeCache",
      "totalRequests": 19
    }
  }
  ```

##### GET /api/cache/info
- **Description**: View all cached keywords with expiration details and cache keys
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "cacheType": "NodeCache",
      "totalKeys": 3,
      "keys": [
        {
          "keyword": "AI",
          "expiresIn": "42 minutes",
          "key": "trending:ai",
          "topicsCount": 3
        },
        {
          "keyword": "crypto",
          "expiresIn": "18 minutes", 
          "key": "trending:crypto",
          "topicsCount": 5
        }
      ]
    }
  }
  ```

##### DELETE /api/cache
- **Description**: **Clear all cached data** across all keywords
- **Use Case**: Force complete refresh, troubleshooting, or clearing stale data
- **Response**:
  ```json
  {
    "success": true,
    "message": "All cache cleared successfully",
    "data": {
      "clearedKeys": 3,
      "cacheType": "NodeCache"
    }
  }
  ```

##### DELETE /api/cache/:keyword
- **Description**: **Clear cache for specific keyword** to force fresh web search
- **Parameters**: `keyword` - The keyword to clear from cache
- **Use Case**: Refresh specific topic that may have stale or incorrect data
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cache cleared for keyword: tech",
    "data": {
      "keyword": "tech",
      "wasPresent": true,
      "cacheKey": "trending:tech"
    }
  }
  ```

#### Error Responses

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-30T10:15:32.456Z"
}
```

**Common Error Codes**:
- `RATE_LIMIT_EXCEEDED`: Manual refresh limit reached
- `INVALID_KEYWORDS`: Invalid or missing keywords parameter  
- `WEB_SEARCH_FAILED`: OpenAI web search API error
- `CACHE_ERROR`: Cache operation failure
- `VALIDATION_ERROR`: Request validation failure

### 7. Configuration Management

#### OpenAI Configuration
```typescript
// Environment Variables (.env)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o                     // Required for web search (not gpt-4-turbo)
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=3000
OPENAI_PRESENCE_PENALTY=0.1
OPENAI_FREQUENCY_PENALTY=0.1

// Web Search Configuration
OPENAI_WEB_SEARCH_ENABLED=true          // Enable/disable web search
OPENAI_WEB_SEARCH_CONTEXT_SIZE=medium   // high, medium, low
```

#### Application Limits
```typescript
const APP_LIMITS = {
  MAX_KEYWORDS: 10,
  MANUAL_REFRESH_LIMIT: 3, // per day (configurable)
  CACHE_DURATION_HOURS: 1, // configurable cache expiration
  MANUAL_REFRESH_ENABLED: false, // development toggle
  MAX_RESULTS_PER_KEYWORD: 10
}
```

#### Cache Configuration
```typescript
const CACHE_CONFIG = {
  DEFAULT_TTL: 3600, // 1 hour in seconds
  CHECK_PERIOD: 600, // Clean expired keys every 10 minutes
  USE_CLONES: false, // Don't clone cached objects for performance
  DELETE_ON_EXPIRE: true // Automatically delete expired keys
}
```

### 8. Error Handling & Troubleshooting

#### UI Error States
- **Web Search Failure**: Intelligent fallbacks with real error context
- **Parsing Issues**: Multiple JSON extraction patterns with text parsing fallbacks
- **API Failure**: Show actionable fallback messages with retry options
- **Network Issues**: Display cached content with retry mechanisms
- **Rate Limiting**: Clear messaging about daily limits and reset times

#### Advanced Error Recovery
- **Multi-Pattern JSON Parsing**: 4 different JSON extraction strategies
- **Intelligent Text Extraction**: Fallback parsing for non-JSON responses  
- **OpenAI Model Fallback**: Automatically uses `gpt-4o` if configured model doesn't support web search
- **Cache-First Strategy**: Always serve cached content during API failures

#### Common Issues & Solutions

**"Current [Keyword] Development" appearing instead of real topics:**
- **Cause**: Web search parsing failed or returned generic fallback
- **Solution**: Clear cache with `DELETE /api/cache/keyword` and retry
- **Prevention**: Enhanced parsing with multiple extraction patterns

**Web search taking too long:**
- **Expected**: 20-30 seconds per keyword for real web search
- **Optimization**: Cache results for 1 hour to minimize repeated searches
- **Monitoring**: Check API response times and consider rate limiting

**Cache not updating:**
- **Manual Refresh**: Use `POST /api/trending/refresh` (rate limited)
- **Selective Clear**: Use `DELETE /api/cache/keyword` for specific keywords
- **Full Clear**: Use `DELETE /api/cache` for complete cache reset

#### Logging and Monitoring
- **Comprehensive Logging**: JSON parsing attempts, web search results, cache operations
- **Error Tracking**: Detailed error context with parsing fallback attempts
- **Performance Monitoring**: Cache hit/miss rates, API response times, web search success rates
- **Cache Statistics**: Real-time monitoring via `/api/cache/stats` endpoint

### 9. User Experience

#### Loading States
- **Initial Load**: 
  - Skeleton cards with animated shimmer effects while data loads
  - Responsive skeleton layout matching final grid structure
  - Loading indicators in header during background updates
- **Refresh State**: 
  - Spinner overlay on refresh button during manual refresh
  - Background updates show cached content with subtle loading indicator
  - Toast notifications for successful/failed refresh operations
- **Empty State**: 
  - Centered empty state with call-to-action for first section
  - Settings icon and descriptive text to guide user onboarding
  - Preview of how sections will look once configured

#### Responsive Design
- **Mobile (xs < 480px)**:
  - Single column layout with full-width sections
  - Simplified header with collapsed navigation  
  - Touch-optimized drag handles and buttons
  - Modal dialogs adapted for mobile viewport
- **Tablet (sm 768px - md 996px)**:
  - 2-3 column adaptive grid based on screen width
  - Optimized touch targets for drag-and-drop
  - Sidebar-style settings modal for landscape orientation
- **Desktop (lg 1200px+)**:
  - 4+ column grid with optimal information density
  - Hover states and tooltips for enhanced UX
  - Keyboard navigation support for accessibility

#### Interactions & Animations
- **Drag and Drop**:
  - Visual feedback with elevation and shadow effects
  - Smooth transitions during grid reorganization
  - Drop zone indicators and invalid drop feedback
  - Snap-to-grid behavior with visual alignment guides
- **Topic Links**: 
  - Click any topic title to search Google in new tab
  - Hover states with subtle color transitions
  - External link indicators for user awareness
- **Theme Switching**:
  - Instant theme transitions with CSS transitions
  - System preference detection and respect
  - Persistent theme choice across browser sessions
- **Form Interactions**:
  - Real-time validation with inline error messages
  - Auto-save for grid layout changes
  - Keyboard shortcuts for power users (ESC to close modals)

#### Accessibility Features
- **Keyboard Navigation**: Full app navigation via keyboard
- **Screen Readers**: ARIA labels and semantic HTML structure  
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: WCAG AA compliant color combinations in both themes
- **Reduced Motion**: Respects `prefers-reduced-motion` for animations

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

### Phase 1: Core MVP ✅
**Frontend**:
1. React 18 dashboard with TypeScript setup
2. Basic grid layout with react-grid-layout
3. Theme system with dark mode support
4. Settings modal for section management
5. API integration with React Query for data fetching

**Backend**:
1. Express API with ChatGPT integration
2. Simple node-cache caching mechanism  
3. Basic error handling and CORS setup

### Phase 2: Enhanced UX ✅ 
**Frontend**:
1. Responsive drag-and-drop with persistent layouts
2. Enhanced loading states and error handling
3. Optimized React Query configuration with background updates
4. Improved accessibility and keyboard navigation
5. Polish animations and micro-interactions

**Backend**:
1. Rate limiting implementation
2. Enhanced caching strategy with Redis support
3. Comprehensive error handling and validation
4. Cache statistics and monitoring endpoints

### Phase 3: Production Ready 🚀
**Frontend**:
1. Build optimization and code splitting
2. Service worker for offline capability  
3. Performance monitoring and error tracking
4. Comprehensive testing suite (unit, integration, e2e)
5. SEO optimization and social meta tags

**Backend**:
1. Production deployment configuration
2. Logging and monitoring infrastructure
3. Security hardening and rate limiting
4. Load testing and performance optimization
5. Backup and disaster recovery procedures

**Infrastructure**:
1. CI/CD pipeline with automated testing
2. Environment-specific configurations
3. Docker containerization
4. Monitoring and alerting setup

## Success Metrics

- **Functionality**: All 10 sections can display trending topics
- **Performance**: API responses under 2 seconds
- **Reliability**: 99% uptime with proper error handling
- **User Experience**: Intuitive interface requiring no documentation
- **Cost Efficiency**: Optimized API usage through effective caching