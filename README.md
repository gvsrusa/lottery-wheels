# Lottery Wheels - Monorepo

A lottery wheel PWA for Texas Two Step lottery analysis. This is a monorepo containing:

- **Frontend**: React + Vite application
- **Backend**: Express API server

## Project Structure

```
lottery-wheels/
├── apps/
│   ├── frontend/     # React + Vite frontend
│   └── backend/      # Express API server
├── api/              # Vercel serverless functions
└── package.json      # Root workspace configuration
```

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development servers:**
   ```bash
   # Run frontend only
   npm run dev

   # Run backend only
   npm run dev:backend

   # Run both frontend and backend
   npm run dev:all
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Building for Production

```bash
npm run build
```

## Deployment

This project is configured for deployment on Vercel:

- Frontend is deployed as a static site
- Backend API is deployed as serverless functions
- All `/api/*` routes are automatically routed to the serverless backend

## Contributing

For contributor guidance, see [Repository Guidelines](apps/frontend/AGENTS.md).
