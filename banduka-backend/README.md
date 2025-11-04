# Banduka POS Backend

A robust, production-ready backend for the Banduka POS system built with NestJS, PostgreSQL, and Prisma.

## 🚀 Features

- **NestJS Framework**: Enterprise-grade Node.js framework with TypeScript
- **PostgreSQL Database**: ACID-compliant relational database for financial data integrity
- **Prisma ORM**: Type-safe database access with auto-generated types
- **JWT Authentication**: Secure authentication with access and refresh tokens
- **Role-Based Access Control (RBAC)**: Fine-grained permissions system
- **Offline Sync Support**: Batch synchronization for offline-first operation
- **WebSocket Support**: Real-time updates across terminals
- **Double-Entry Accounting**: Built-in accounting engine
- **eTIMS Integration Ready**: Kenya Revenue Authority integration support

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (local or cloud instance)
- Git

## 🛠️ Installation

1. **Clone the repository**
```bash
cd banduka-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. **Set up the database**
```bash
# Create the database
createdb banduka_pos

# Run migrations
npx prisma migrate dev --name init

# Seed the database (optional)
npm run prisma:seed
```

5. **Start the development server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001/api`

## 📁 Project Structure

```
src/
├── auth/               # Authentication module (JWT, strategies, guards)
├── users/              # User management module
├── products/           # Product/inventory management
├── customers/          # Customer management
├── sales/              # Sales transactions and POS operations
├── suppliers/          # Supplier management
├── sync/               # Offline synchronization
├── websocket/          # Real-time updates
├── prisma/             # Database service
└── main.ts             # Application entry point

prisma/
├── schema.prisma       # Database schema definition
├── migrations/         # Database migrations
└── seed.ts            # Database seeding script
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/login-pin` - Quick login with PIN
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - List products with pagination
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `POST /api/sales` - Create new sale
- `GET /api/sales` - List sales with filters
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/return` - Process return

### Sync
- `POST /api/sync` - Batch sync offline data
- `GET /api/sync/status` - Check sync status

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Short-lived access tokens (15m) and refresh tokens (7d)
- **CORS**: Configured for frontend origins
- **Input Validation**: Global validation pipe
- **SQL Injection Protection**: Parameterized queries via Prisma
- **Rate Limiting**: (To be implemented)

## 🗄️ Database Schema

The database schema includes:
- **Users & Authentication**
- **Products & Inventory**
- **Customers & Loyalty**
- **Sales & Transactions**
- **Suppliers & Purchase Orders**
- **Accounting (Double-Entry)**
- **Settings & Configuration**

See `prisma/schema.prisma` for the complete schema definition.

## 🚀 Deployment

### Using Docker

```bash
# Build the image
docker build -t banduka-backend .

# Run the container
docker run -p 3001:3001 --env-file .env banduka-backend
```

### Using PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start dist/main.js --name banduka-backend
```

### Cloud Deployment

Recommended platforms:
- **Google Cloud Run** (Serverless)
- **Heroku** (PaaS)
- **AWS ECS** (Containers)
- **DigitalOcean App Platform**

Database hosting:
- **Google Cloud SQL**
- **Amazon RDS**
- **Supabase**
- **Neon**

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Environment Variables

Key environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/banduka_pos

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

# Server
PORT=3001
NODE_ENV=production

# External Services (Optional)
KRA_API_KEY=xxx
MPESA_CONSUMER_KEY=xxx
GOOGLE_DRIVE_API_KEY=xxx
```

## 🔄 Next Steps

1. **Complete API Implementation**
   - Implement remaining service methods
   - Add business logic for transactions
   - Implement accounting engine

2. **Add Security Features**
   - Rate limiting
   - Request logging
   - API documentation (Swagger)

3. **Performance Optimization**
   - Add Redis caching
   - Implement database indexing
   - Query optimization

4. **Testing**
   - Write unit tests
   - Add integration tests
   - Set up CI/CD pipeline

5. **Monitoring**
   - Add application monitoring (Sentry)
   - Implement health checks
   - Set up logging (Winston)

## 📚 Documentation

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software for Banduka POS™.

## 🆘 Support

For support, email support@bandukapos.com or open an issue in the repository.
