# Trending Topics Dashboard

A React + Node.js application that provides real-time trending topics using OpenAI's web search capabilities, deployed as a serverless AWS application.

## 🏗️ Project Structure

```
trending-topics-dashboard/
├── src/
│   ├── client/              # React frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── services/    # API services
│   │   │   ├── types/       # TypeScript type definitions
│   │   │   └── config/      # Frontend configuration
│   │   ├── public/          # Static assets
│   │   └── package.json
│   │
│   ├── server/              # Node.js backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── services/    # Business logic services
│   │   │   ├── routes/      # API routes
│   │   │   ├── middleware/  # Express middleware
│   │   │   └── config/      # Server configuration
│   │   └── package.json
│   │
│   └── shared/              # Shared code between client & server
│       ├── types/           # TypeScript interfaces
│       ├── utils/           # Utility functions
│       └── config/          # Shared configuration
│
├── deployment/              # AWS deployment configuration
│   ├── lambda/              # Lambda function code
│   ├── scripts/             # Deployment scripts
│   ├── config/              # CloudFront & AWS config
│   └── docs/                # Deployment documentation
│
├── config/                  # Environment configurations
│   └── base.json           # Base application config
│
└── docs/                   # Project documentation
```

A real-time trending topics dashboard that provides **factual, current information** from the internet using OpenAI's advanced web search capabilities with cost-effective `gpt-4o-mini`.

## 🌟 Key Features

- **🌐 Real Web Search**: Uses OpenAI API with web search to get **actual current events**
- **📊 Customizable Dashboard**: Drag-and-drop grid layout with resizable sections  
- **🤖 AI-Powered Analysis**: Cost-effective `gpt-4o-mini` processing of real web search results
- **⚡ Smart Caching**: Intelligent 2-hour cache with progressive loading
- **🌙 Dark Mode**: Toggle between light and dark themes with persistence
- **📱 Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **🔒 Production Ready**: Structured logging, validation middleware, and error handling
- **🗂️ Cache Management**: Full cache control with stats and selective clearing
- **🏗️ Clean Architecture**: Shared utilities, centralized config, and modular design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
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
npm run build
npm start
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
REDIS_URL=redis://localhost:6379
PORT=3002
NODE_ENV=development

# OpenAI Configuration (Optional - defaults provided)
OPENAI_MODEL=gpt-4o-mini              # Cost-effective default model
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=3000
OPENAI_PRESENCE_PENALTY=0.1
OPENAI_FREQUENCY_PENALTY=0.1

# Web Search Configuration (Optional)
OPENAI_WEB_SEARCH_ENABLED=true        # Enable/disable web search
OPENAI_WEB_SEARCH_CONTEXT_SIZE=medium # high, medium, low
```

## 🏗️ Project Architecture

### 📁 Directory Structure
```
trending-topics-dashboard/
├── config/                    # Centralized configuration system
│   ├── base.json             # Shared app config (ports, limits, defaults)
│   ├── environment.schema.json # Environment variable documentation
│   └── README.md             # Configuration guide
├── shared/                   # Shared utilities and types
│   ├── types/index.ts        # Common type definitions
│   └── utils/               # Shared utility functions
│       ├── api.ts           # API response utilities
│       ├── logger.ts        # Structured logging system
│       └── validation.ts    # Input validation utilities
├── server/                  # Backend Express.js application
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Validation, rate limiting, errors
│   │   ├── services/        # Business logic (OpenAI, cache, trending)
│   │   ├── utils/          # Server-specific utilities
│   │   ├── types/          # Server type definitions
│   │   └── config/         # Server configuration loader
│   ├── dist/               # Compiled JavaScript output
│   └── .env.example        # Environment template
└── client/                 # React frontend application
    ├── src/
    │   ├── components/     # React components
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API client
    │   ├── contexts/       # React contexts (theme)
    │   ├── types/          # Client type definitions
    │   └── config/         # Client configuration
    ├── dist/              # Production build output
    └── public/            # Static assets
```

### 🔄 Request Flow
```
Client (3000) → Vite Proxy → Server (3002) → OpenAI API → Cache → Response
```

## 💡 Key Improvements Made

### 🧹 **Code Quality & Architecture**
- **Eliminated 78+ lines of duplicate code** across type definitions
- **Centralized configuration system** with single source of truth
- **Shared utilities library** for consistent API responses and validation
- **Structured logging system** replacing 30+ console.log statements
- **Validation middleware** eliminating 7+ duplicate validation patterns
- **Local server utilities** avoiding TypeScript cross-directory issues

### ⚡ **Performance & Cost Optimization** 
- **gpt-4o-mini model** for significant cost reduction (vs gpt-4-turbo)
- **Progressive loading** - show cached data immediately, fetch fresh data in background
- **Smart caching strategy** with 2-hour duration and hit/miss tracking
- **Reduced API calls** through intelligent cache-first approach

### 🛡️ **Production Readiness**
- **TypeScript strict mode** with comprehensive type safety
- **Environment-specific logging** (development vs production)
- **Structured error handling** with consistent API responses
- **Input validation** at middleware level
- **Rate limiting** protection for production environments
- **Build optimization** for both client and server

### 🔧 **Developer Experience**
- **Hot module reloading** with zero-config setup
- **Consistent property naming** (camelCase throughout)
- **Type exports** properly configured for isolated modules
- **Port configuration** centralized and consistent (client proxy → server)
- **Documentation** with configuration guides and troubleshooting

## 💰 Cost Optimization

### Model Configuration
The application now uses **gpt-4o-mini** by default for significant cost savings:

```json
{
  "openai": {
    "model": "gpt-4o-mini",        // Most cost effective
    "temperature": 0.3,
    "maxTokens": 3000,
    "webSearch": {
      "enabled": true,
      "contextSize": "medium"      // Balanced cost and quality
    }
  }
}
```

### Cost Comparison
- **gpt-4o-mini**: Most cost effective, good quality
- **gpt-3.5-turbo**: Good balance of cost and quality  
- **gpt-4-turbo**: High quality, higher cost
- **gpt-4o**: Latest model, premium cost

### Smart Caching
- **2-hour cache duration** significantly reduces API calls
- **Progressive loading** shows cached data immediately
- **Cache hit tracking** for monitoring effectiveness
- **Selective cache clearing** for targeted updates

## 🔌 API Endpoints

### Core Endpoints
- `GET /api/trending?keywords=tech,science` - Get trending topics (cache-first)
- `GET /api/trending/cached?keywords=tech` - Progressive loading endpoint
- `POST /api/trending/refresh` - Force refresh with real web search (rate limited)
- `GET /api/health` - Server health check with uptime

### 🗂️ Cache Management
- `GET /api/cache/stats` - Hit/miss statistics and performance metrics
- `GET /api/cache/info` - View cached keywords with expiration times
- `DELETE /api/cache` - Clear all cached data
- `DELETE /api/cache/{keyword}` - Clear specific keyword from cache

## 🔧 Configuration System

### Centralized Config (`/config/base.json`)
```json
{
  "app": {
    "name": "Trending Topics Dashboard",
    "version": "1.0.0"
  },
  "ports": {
    "server": 3002,
    "client": 3000
  },
  "limits": {
    "maxKeywords": 10,
    "manualRefreshLimit": 3,
    "cacheDurationHours": 2,
    "manualRefreshEnabled": false,
    "maxResultsPerKeyword": 10,
    "minResultsPerKeyword": 1
  },
  "openai": {
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "maxTokens": 3000,
    "webSearch": {
      "enabled": true,
      "contextSize": "medium"
    }
  }
}
```

### Environment Variable Schema
The project includes comprehensive environment variable documentation with validation:

- **Required**: `OPENAI_API_KEY`
- **Optional**: `PORT`, `NODE_ENV`, `REDIS_URL`, `OPENAI_MODEL`, etc.
- **Validated ranges**: Temperature (0-2), token limits, keyword counts
- **Cost guidance**: Model selection with efficiency ratings

## 🏃‍♂️ Usage

### 📋 Dashboard Management
1. **Add Sections**: Click "Add Section" to create keyword-based trending topic sections
2. **Customize**: Configure max results (1-10) per section via settings
3. **Arrange**: Drag and drop sections to organize your layout
4. **Theme**: Toggle between light and dark modes
5. **Progressive Loading**: See cached data instantly, fresh data loads in background

### 🔄 Data Operations  
1. **Smart Loading**: Cached data appears immediately, fresh data updates progressively
2. **Manual Refresh**: Use header refresh button (rate-limited in production)
3. **Cache Management**: Clear specific keywords or all cached data
4. **Real-time Updates**: Background polling with intelligent cache invalidation

## 🚀 Development

### Backend Commands
```bash
cd server
npm run build    # Build TypeScript to dist/
npm start        # Production server from dist/
npm run dev      # Development with nodemon (if available)
```

### Frontend Commands
```bash
cd client
npm run dev      # Vite dev server (http://localhost:3000)
npm run build    # Production build with TypeScript checking
npm run preview  # Preview production build
```

### 🧪 Testing
```bash
# Server
cd server && npm run build  # Verify TypeScript compilation

# Client  
cd client && npm run build  # Verify TypeScript + production build

# Health checks
curl http://localhost:3002/api/health  # Server health
curl http://localhost:3000/api/health  # Client proxy test
```

## 🔧 Troubleshooting

### Common Issues

**TypeScript compilation errors:**
- All imports use proper local paths (no cross-rootDir references)
- Type exports use `export type` for isolated modules
- Property names consistent throughout (camelCase)

**Client-server communication:**
- Client proxy correctly configured for port 3002
- CORS headers properly set for development/production
- API responses follow consistent structure

**Configuration issues:**
- Environment variables properly validated on startup
- Default values provided for all optional settings
- Centralized config prevents port mismatches

**Performance optimization:**
- Progressive loading shows cached data immediately
- Background updates don't block UI
- Smart caching reduces API costs significantly

## 📚 Documentation

- **[Technical Specification](/SPECIFICATION.md)** - Comprehensive technical details and architecture
- **[Development Guide](/DEVELOPMENT.md)** - Development workflow, implementation notes, and future enhancements  
- **[Configuration Guide](/config/README.md)** - Configuration system and environment variables
- **[Deployment Guide](/deployment/README.md)** - AWS deployment process and production setup

## 🎯 Production Deployment

For detailed deployment instructions, see **[Deployment Guide](/deployment/README.md)**.

**Quick deployment**:
```bash
cd deployment/scripts
./setup-infrastructure.sh    # Set up AWS resources
./build-and-deploy.sh        # Deploy backend from src/server
./deploy-frontend.sh         # Deploy React frontend
```

**Live deployment**: https://trends.leohyl.me

---

**Built with ❤️ using modern TypeScript, React, Express, and OpenAI gpt-4o-mini**