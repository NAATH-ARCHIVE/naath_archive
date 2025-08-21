# Naath Archive

A fullstack cultural heritage archive application built with Next.js 14 and NestJS 10.

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript, TailwindCSS, and branded Naath colors
- **Backend**: NestJS 10 API with Prisma ORM and PostgreSQL
- **Database**: PostgreSQL 15 with Redis caching
- **Storage**: S3-compatible storage (MinIO for local dev)
- **Search**: OpenSearch/Elasticsearch
- **Deployment**: Vercel (frontend) + AWS ECS (API)

## 🎨 Branding

The application uses the official Naath Archive colors:
- **Dark Blue** (`#0A2540`): Primary text and UI elements
- **Brown/Bronze** (`#B08D57`): Accents, borders, and highlights

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15
- Redis 7

### Local Development

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd naath_archive
   npm install
   ```

2. **Start local services**:
   ```bash
   docker compose up -d postgres redis minio
   ```

3. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your local database URLs
   ```

4. **Run database migrations**:
   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

5. **Start development servers**:
   ```bash
   # From root directory
   npm run dev          # Runs both web and API
   npm run dev:web      # Frontend only
   npm run dev:api      # API only
   ```

### Available Scripts

- `npm run dev` - Start both frontend and API in development mode
- `npm run build` - Build both applications for production
- `npm run lint` - Run linting on both applications
- `npm run format` - Format code with Prettier

## 📁 Project Structure

```
naath_archive/
├── apps/
│   ├── web/                 # Next.js 14 frontend
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable UI components
│   │   └── ...
│   └── api/                # NestJS 10 backend
│       ├── src/            # Source code
│       ├── prisma/         # Database schema and migrations
│       └── ...
├── docker-compose.yml      # Local development services
├── Dockerfile.web          # Frontend Docker image
├── Dockerfile.api          # API Docker image
└── .github/workflows/      # CI/CD pipelines
```

## 🗄️ Database Schema

The application includes comprehensive data models for:
- **Users** (admin, contributor, user roles)
- **Articles** with threaded comments and likes
- **Artifacts** (photos, documents, audio, video)
- **Oral Histories** with transcripts
- **Research Items** and **Education Resources**
- **Events** and **Donations**
- **Shop** with products and orders

## 🔐 Authentication & Authorization

- **NextAuth.js** for frontend authentication
- **OAuth providers**: Google, Facebook, X (Twitter)
- **Form-based signup** with validation
- **RBAC**: Role-based access control with granular permissions
- **Admin-created contributors**: Only admins can create contributor accounts

## 🚢 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Automatic deployments on push to main/develop branches

### Backend (AWS ECS)

1. Create ECS cluster and service
2. Set up ECR repository for Docker images
3. Configure environment variables and secrets
4. Use provided GitHub Actions workflow for automated deployment

### Required Environment Variables

See `.env.example` for the complete list of required environment variables.

## 🔧 Development

### Adding New Features

1. **Frontend**: Add pages in `apps/web/app/` following the App Router pattern
2. **Backend**: Create modules in `apps/api/src/` following NestJS conventions
3. **Database**: Update Prisma schema and run migrations
4. **Tests**: Add unit and integration tests

### Code Quality

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **GitHub Actions** for automated testing and deployment

## 📚 API Documentation

Once the API is running, visit `/api/docs` for interactive Swagger documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary to Naath Archive.

## 🆘 Support

For support and questions, please contact the development team.
