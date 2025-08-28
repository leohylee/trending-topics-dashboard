# Trending Topics Dashboard

A customizable dashboard application that displays trending topics for user-defined keywords using AI-powered content aggregation.

## Features

- **Custom Sections**: Add up to 10 keyword-based sections
- **AI-Powered Content**: Uses ChatGPT API to find and summarize trending topics
- **Responsive Design**: Drag-and-drop grid layout that adapts to screen size
- **Smart Caching**: 1-hour cache to optimize API usage and costs
- **Real-time Updates**: Automatic hourly refresh with manual refresh option
- **Rate Limiting**: Configurable limits to control API usage

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **react-grid-layout** for drag-and-drop functionality
- **@tanstack/react-query** for data fetching and caching
- **axios** for API requests
- **date-fns** for date formatting

### Backend
- **Node.js** with Express and TypeScript
- **Redis** for caching (fallback to node-cache for development)
- **OpenAI API** integration
- **CORS** and security middleware

### Future Enhancements
- **PostgreSQL** + **Prisma ORM** for multi-user support
- User authentication and personal dashboards
- Advanced keyword filtering options

## Project Structure

```
trending-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Helper functions
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Helper functions
│   └── package.json
├── README.md
├── SPECIFICATION.md
└── .env.example
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Redis server (optional for development)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd trending-dashboard
   ```

2. **Backend setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add your OpenAI API key to .env
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd ../client
   npm install
   npm start
   ```

### Environment Variables

```env
# Server/.env
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=redis://localhost:6379  # Optional
PORT=5000
NODE_ENV=development
```

## Usage

1. **Add Sections**: Use the settings menu to add keyword-based sections
2. **Customize Layout**: Drag and drop sections to rearrange
3. **Configure Results**: Set how many trending topics to display per section (1-10)
4. **Monitor Updates**: Sections refresh automatically every hour
5. **Manual Refresh**: Use the refresh button (limited to 3 times per day when enabled)

## API Endpoints

- `GET /api/trending` - Get trending topics for all keywords
- `POST /api/trending/refresh` - Manual refresh trigger
- `GET /api/health` - Health check

## Configuration

Key settings in `server/src/config/app.ts`:

```typescript
export const APP_LIMITS = {
  MAX_KEYWORDS: 10,
  MANUAL_REFRESH_LIMIT: 3,
  CACHE_DURATION_HOURS: 1,
  MANUAL_REFRESH_ENABLED: false // Toggle for development
}
```

## Development

### Running Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests  
cd server && npm test
```

### Building for Production
```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build
```

## Future Roadmap

### Phase 1 (Current)
- [x] Single-user dashboard
- [x] Basic keyword sections
- [x] AI-powered content aggregation
- [x] Responsive grid layout

### Phase 2
- [ ] Custom section titles
- [ ] Enhanced loading states
- [ ] Improved error handling
- [ ] Performance optimizations

### Phase 3
- [ ] Multi-user support
- [ ] User authentication
- [ ] Saved dashboard preferences
- [ ] Advanced keyword options (boolean, exclusions)
- [ ] Analytics and usage insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please use the GitHub issues page or contact the development team.