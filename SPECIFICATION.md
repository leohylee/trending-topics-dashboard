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
- **Caching**: Redis or node-cache
- **API Integration**: OpenAI SDK
- **Middleware**: CORS, security headers

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