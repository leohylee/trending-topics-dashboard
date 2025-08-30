# Trending Topics Dashboard

A customizable dashboard application that displays trending topics for user-defined keywords using AI-powered content aggregation.

## Features

- **Customizable Dashboard**: Drag-and-drop grid layout with resizable sections
- **AI-Powered Content**: ChatGPT API integration for trending topic discovery
- **Smart Caching**: 1-hour cache duration with automatic refresh
- **Dark Mode**: Toggle between light and dark themes with persistence
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Rate Limiting**: Configurable refresh limits (disabled in development)
- **Batch Processing**: Efficient single API call for all keywords

## Tech Stack

### Frontend
- **React 18** with TypeScript for modern component architecture
- **Tailwind CSS** for utility-first styling with dark mode support
- **react-grid-layout** for responsive drag-and-drop grid functionality
- **@tanstack/react-query** for server state management and caching
- **Vite** for fast development server and optimized builds
- **Lucide React** for consistent iconography
- **date-fns** for date formatting and manipulation
- **Axios** for HTTP client with request/response interceptors

### Backend
- Node.js with Express and TypeScript
- Redis for production caching (node-cache for development)
- OpenAI API integration
- CORS and security middleware

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- OpenAI API key
- Redis server (optional for development)

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd trending-topics-dashboard
```

2. **Backend setup**:
```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm run dev
```

3. **Frontend setup** (in new terminal):
```bash
cd client
npm install
npm run dev
```

4. **Visit**: http://localhost:3000

### Environment Variables

Create `server/.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=redis://localhost:6379  # optional
PORT=5000
NODE_ENV=development
```

## Usage

### 📋 Dashboard Management
1. **Add Sections**: Click "Add Section" to create keyword-based trending topic sections
2. **Customize**: Configure max results (1-10) per section via section settings
3. **Arrange**: Drag and drop sections to organize your dashboard layout
4. **Remove**: Delete sections using the settings gear icon
5. **Theme Toggle**: Switch between light and dark modes using header toggle

### 🔄 Data Operations  
1. **Auto Refresh**: Sections automatically update every hour via background polling
2. **Manual Refresh**: Use header refresh button (rate-limited in production)
3. **Cache Indicators**: Visual indicators show when data is cached vs. fresh
4. **Error Handling**: Graceful fallbacks and retry options for failed requests

### 🔍 Content Interaction
1. **Topic Links**: Click any topic title to search Google for that keyword
2. **Timestamps**: Hover over sections to see "last updated" information  
3. **Loading States**: Skeleton loading indicators during data fetches
4. **Responsive**: Full mobile, tablet, and desktop support

### ⚙️ Settings & Configuration
- **Sections**: Add up to 10 keyword-based sections
- **Results**: Configure 1-10 trending topics per section
- **Layout**: Persistent drag-and-drop arrangement
- **Theme**: Light/dark mode with system preference detection

## Server Architecture

### 📁 Directory Structure
```
server/src/
├── index.ts              # Express server setup & entry point
├── config/               # Configuration & environment variables
├── routes/               # API endpoint definitions
├── controllers/          # Request/response handlers
├── services/             # Business logic & external integrations
├── middleware/           # Request processing (errors, rate limiting)
└── types/                # TypeScript type definitions
```

### 🔄 Request Flow
```
Client → Routes → Controller → Service → Cache/OpenAI → Response
```

1. **Routes** define API endpoints and map to controller methods
2. **Controllers** handle HTTP requests, validate input, call services
3. **Services** implement business logic:
   - `TrendingService`: Orchestrates cache-first strategy
   - `CacheService`: Redis/NodeCache with hit/miss tracking  
   - `OpenAIService`: ChatGPT API integration
4. **Middleware** processes requests (CORS, errors, rate limiting)

### 🧠 Cache-First Strategy
```typescript
// 1. Check cache for all keywords first
const cachedData = await cacheService.getMultiple(keywords);

// 2. Only call OpenAI for uncached keywords  
const uncachedKeywords = keywords.filter(k => !cachedData.has(k));

// 3. Combine cached + fresh results
if (uncachedKeywords.length > 0) {
  const freshData = await openaiService.getTrendingTopics(uncachedKeywords);
  await cacheService.setMultiple(freshData); // Cache for next time
}
```

## API Endpoints

### Core Endpoints
- `GET /api/trending?keywords=tech,science` - Get trending topics (cache-first)
- `POST /api/trending/refresh` - Force refresh bypassing cache (rate limited)
- `GET /api/health` - Server health check

### Cache Management
- `GET /api/cache/stats` - Cache hit/miss statistics & performance
- `GET /api/cache/info` - View cached keywords & expiration times

## Configuration

Edit `server/src/config/index.ts`:
```typescript
export const APP_LIMITS = {
  MAX_KEYWORDS: 10,
  MANUAL_REFRESH_LIMIT: 3, // per day
  CACHE_DURATION_HOURS: 1,
  MANUAL_REFRESH_ENABLED: false, // enable in production
  MAX_RESULTS_PER_KEYWORD: 10
}
```

## Client Architecture

### 📁 Frontend Directory Structure
```
client/src/
├── main.tsx              # Application entry point with providers
├── components/           # React components
│   ├── Dashboard.tsx     # Main grid layout and state management
│   ├── TrendingSection.tsx # Individual keyword section display
│   ├── SettingsModal.tsx   # Section configuration modal
│   └── ThemeToggle.tsx     # Dark mode toggle component
├── contexts/             # React contexts
│   └── ThemeContext.tsx  # Theme state management
├── hooks/                # Custom React hooks
│   └── useTrending.ts    # Data fetching and caching logic
├── services/             # API communication
│   └── api.ts           # HTTP client configuration
├── types/                # TypeScript definitions
│   └── index.ts         # Shared type definitions
├── utils/                # Utility functions
│   └── storage.ts       # LocalStorage management
└── index.css            # Global styles and Tailwind imports
```

### 🔄 Client Data Flow
```
User Interaction → Component State → Custom Hook → API Service → Server
                                   ↓
LocalStorage ← State Update ← React Query Cache ← Response
```

### 📱 Responsive Grid System
- **Breakpoints**: `lg: 1200px, md: 996px, sm: 768px, xs: 480px`
- **Grid Columns**: `lg: 4, md: 3, sm: 2, xs: 1`
- **Auto Layout**: Sections automatically reflow on screen size changes
- **Persistent Layout**: User arrangements saved to localStorage

### 🎨 Theme System
- **Mode Toggle**: Light/dark theme switch with system preference detection
- **Persistence**: Theme choice saved across browser sessions
- **Context API**: Centralized theme state management
- **CSS Variables**: Tailwind dark mode classes for seamless transitions

### 📊 State Management
- **React Query**: Server state, caching, background updates, error handling
- **Local State**: Component-level state with useState
- **Context API**: Global theme state
- **localStorage**: Settings persistence (sections, layout, theme)

## Development

### Backend commands:
```bash
cd server
npm run dev      # Development server with hot reload
npm run build    # Build TypeScript to dist/
npm start        # Production server from dist/
npm test         # Run Jest test suite
npm run lint     # ESLint code checking
```

### Frontend commands:
```bash
cd client
npm run dev      # Vite dev server (http://localhost:3000)
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm run lint     # ESLint + TypeScript checking
```

## Production Deployment

1. Set environment variables
2. Enable `MANUAL_REFRESH_ENABLED: true`
3. Set up Redis server
4. Build both frontend and backend
5. Configure reverse proxy (nginx recommended)

## Cost Optimization

- **Batch API Calls**: All keywords processed in single ChatGPT request
- **Smart Caching**: Reduces API calls with 1-hour cache
- **Rate Limiting**: Prevents excessive refreshes
