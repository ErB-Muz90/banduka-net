# Banduka POS System

A comprehensive Point of Sale (POS) system with frontend and backend components.

## Deployment Status

⚠️ **Build Issues**: The application currently has some syntax errors in motion components that need to be fixed before deployment. These are in:
- `components/UserPinView.tsx`
- `components/layaway/LayawayDetailView.tsx`  
- `components/pos/Cart.tsx`
- `components/setup/WelcomeView.tsx`

## Quick Deploy to Netlify

1. Fork or clone this repository
2. Fix the syntax errors mentioned above
3. Deploy via Netlify:
   - Connect your GitHub repo to Netlify
   - Build command: `npm run build`
   - Publish directory: `out`
   - Add environment variable: `GEMINI_API_KEY`

## Architecture

- **Frontend**: Next.js React application (TypeScript) - http://localhost:3000
- **Backend**: NestJS API with PostgreSQL database - http://localhost:3001/api
- **Deployment**: Docker Compose for local development

## Local Deployment

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ and npm (for development)

### Quick Start with Docker Compose

1. **Clone the repository**
```bash
git clone <repository-url>
cd banduka-pos
```

2. **Start all services**
```bash
cd banduka-backend
docker compose up -d --build
```

3. **Access the applications**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database Admin**: http://localhost:5050 (pgAdmin)
  - Email: admin@banduka.com
  - Password: admin

### Services Overview

The `docker-compose.yml` includes:
- **postgres**: PostgreSQL database (port 5432)
- **backend**: NestJS API server (port 3001)
- **frontend**: Next.js React app (port 3000)
- **pgadmin**: Database administration interface (port 5050)

### Development Mode

For development with hot reloading:

1. **Backend development**:
```bash
cd banduka-backend
npm install
npm run start:dev
```

2. **Frontend development**:
```bash
npm install
npm run dev
```

### Database Setup

The backend automatically:
- Creates the database schema
- Runs migrations
- Seeds initial data

### Environment Configuration

Backend environment variables are configured in `banduka-backend/.env`:
- Database connection
- JWT secrets
- Server port

Frontend connects to backend at `http://localhost:3001/api`

## API Documentation

The backend provides RESTful APIs for:
- Authentication & Users
- Products & Inventory
- Sales & Transactions
- Customers & Suppliers
- Purchase Orders
- Reports & Analytics

## Features

- Point of Sale interface
- Inventory management
- Customer relationship management
- Purchase order processing
- Sales reporting
- User role management
- Offline capability

## Support

For issues or questions:
- Check the backend README: `banduka-backend/README.md`
- Open an issue in the repository
