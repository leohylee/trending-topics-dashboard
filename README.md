# Trending Topics Dashboard

A customizable dashboard application that displays trending topics for user-defined keywords using AI-powered content aggregation.

## Features

- **Customizable Dashboard**: Drag-and-drop grid layout with resizable sections
- **AI-Powered Content**: ChatGPT API integration for trending topic discovery
- **Smart Caching**: 1-hour cache duration with automatic refresh
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Rate Limiting**: Configurable refresh limits (disabled in development)
- **Batch Processing**: Efficient single API call for all keywords

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- react-grid-layout for drag-and-drop
- @tanstack/react-query for data fetching
- Vite for development and building

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

1. **Add Sections**: Click "Add Section" to create keyword-based trending topic sections
2. **Customize**: Configure max results (1-10) per section
3. **Arrange**: Drag and drop sections to organize your dashboard
4. **Refresh**: Manual refresh button (rate-limited in production)
5. **Explore**: Click topics to search on Google

## API Endpoints

- `GET /api/trending?keywords=tech,science` - Get trending topics
- `POST /api/trending/refresh` - Force refresh (rate limited)
- `GET /api/health` - Health check

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

## Development

### Backend commands:
```bash
cd server
npm run dev      # Development server
npm run build    # Build TypeScript
npm start        # Production server
```

### Frontend commands:
```bash
cd client
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
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
