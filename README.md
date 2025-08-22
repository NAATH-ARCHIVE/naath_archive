# Naath Archive

A comprehensive digital archive platform for preserving and sharing the cultural heritage, history, and knowledge of the Naath people. This platform provides a modern, accessible way to explore articles, artifacts, oral histories, research materials, and educational content.

## 🌟 Features

### Core Functionality
- **Article Management**: Create, edit, and publish articles with rich text content
- **User Authentication**: Secure user registration, login, and role-based access control
- **Media Management**: Upload and manage images, videos, and documents
- **Search & Discovery**: Advanced search with filtering and categorization
- **Responsive Design**: Mobile-first design that works on all devices

### Content Types
- **Articles**: Long-form content with rich text and media
- **Artifacts**: Cultural objects and historical items
- **Oral Histories**: Audio and video recordings of personal stories
- **Research Materials**: Academic papers and scholarly content
- **Educational Content**: Learning resources and courses
- **Events**: Cultural events and community gatherings

### User Roles
- **Public Users**: Browse and search public content
- **Registered Users**: Comment, save favorites, and access member content
- **Contributors**: Create and edit content (pending approval)
- **Administrators**: Full system access and content moderation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Docker (optional, for containerized deployment)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/naath-archive.git
cd naath-archive
```

### 2. Run the Setup Script
```bash
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

### 3. Configure Environment
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend configuration
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL
```

### 4. Start Development Servers
```bash
# Start both backend and frontend
./scripts/dev.sh

# Or start individually:
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js with TypeScript support
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT-based with bcrypt password hashing
- **Validation**: Express-validator for input sanitization
- **Security**: Helmet, CORS, rate limiting, and input validation
- **File Upload**: Multer for media file handling

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state
- **Forms**: React Hook Form with validation
- **Routing**: React Router v6 with protected routes

### Database Schema
- **Users**: Authentication and user management
- **Articles**: Content management with versioning
- **Media**: File storage and metadata
- **Comments**: User interaction and discussion
- **Categories**: Content organization and tagging

## 📁 Project Structure

```
naath-archive/
├── backend/                 # Backend API server
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Authentication and validation
│   ├── routes/             # API endpoint definitions
│   ├── tests/              # Test suites
│   └── server.js           # Main server file
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   └── contexts/       # React contexts
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── database/               # Database schema and migrations
├── scripts/                # Development and deployment scripts
└── docker-compose.yml      # Container orchestration
```

## 🔧 Development

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Management
```bash
# Run migrations
npm run migrate

# Seed with sample data
npm run seed

# Reset database
npm run db:reset
```

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage
- **Backend**: Unit tests for API endpoints, middleware, and utilities
- **Frontend**: Component testing with React Testing Library
- **Integration**: API endpoint testing with Supertest
- **E2E**: End-to-end testing with Playwright (planned)

## 🚀 Deployment

### Production Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 2: Manual Deployment
```bash
# Backend
cd backend
npm install --production
npm run build
npm start

# Frontend
cd frontend
npm install --production
npm run build
# Serve build folder with nginx or similar
```

#### Option 3: Cloud Deployment
- **Heroku**: Use the provided Procfile and app.json
- **AWS**: Deploy with Elastic Beanstalk or ECS
- **Google Cloud**: Use Cloud Run or App Engine
- **Azure**: Deploy with App Service

### Environment Variables

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=naath_archive
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://yourdomain.com
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=Naath Archive
VITE_APP_VERSION=1.0.0
```

## 📊 Performance & Monitoring

### Backend Performance
- **Database**: Connection pooling and query optimization
- **Caching**: Redis integration for session and data caching
- **Compression**: Gzip compression for API responses
- **Rate Limiting**: Protection against abuse and DDoS

### Frontend Performance
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component and image lazy loading
- **Caching**: Service worker for offline support
- **Optimization**: Tree shaking and bundle optimization

### Monitoring
- **Health Checks**: `/health` endpoint for system status
- **Logging**: Structured logging with Morgan
- **Error Tracking**: Global error handling and reporting
- **Metrics**: Performance monitoring and analytics

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Password Security**: bcrypt hashing with configurable rounds
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure token storage and refresh

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection**: Parameterized queries and ORM usage
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Token-based request validation

### Infrastructure Security
- **HTTPS**: SSL/TLS encryption for all communications
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Helmet.js for security headers

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **Backend**: ESLint with Airbnb style guide
- **Frontend**: ESLint + Prettier configuration
- **Testing**: Minimum 80% test coverage
- **Documentation**: JSDoc comments for all functions

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `PUT /api/auth/change-password` - Change user password

### Content Endpoints
- `GET /api/articles` - List articles with pagination
- `GET /api/articles/:slug` - Get article by slug
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Media Endpoints
- `POST /api/media/upload` - Upload media files
- `GET /api/media` - List media files
- `DELETE /api/media/:id` - Delete media file

### Complete API Reference
See [API Documentation](./docs/API.md) for complete endpoint documentation.

## 🌍 Internationalization

### Supported Languages
- **Primary**: English
- **Planned**: Arabic, French, and local dialects

### Localization Features
- **RTL Support**: Right-to-left text direction
- **Date Formatting**: Locale-specific date formats
- **Number Formatting**: Cultural number representations
- **Content Translation**: Multi-language content support

## 📱 Mobile Support

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Touch Friendly**: Large touch targets and gestures
- **Offline Support**: Service worker for offline access
- **Progressive Web App**: Installable web application

### Native Features
- **Camera Integration**: Photo and video capture
- **GPS Location**: Location-based content
- **Push Notifications**: Real-time updates
- **File Sharing**: Native sharing capabilities

## 🔮 Future Roadmap

### Phase 2 (Q2 2024)
- [ ] Advanced search with AI recommendations
- [ ] Social features and user interactions
- [ ] Mobile app development
- [ ] Content recommendation engine

### Phase 3 (Q3 2024)
- [ ] Machine learning for content analysis
- [ ] Advanced analytics and insights
- [ ] API for third-party integrations
- [ ] Multi-tenant architecture

### Phase 4 (Q4 2024)
- [ ] Blockchain for content verification
- [ ] AR/VR content experiences
- [ ] Advanced content creation tools
- [ ] Community governance features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Naath Community**: For sharing their stories and culture
- **Open Source Contributors**: For the amazing tools and libraries
- **Cultural Heritage Organizations**: For inspiration and guidance
- **Academic Partners**: For research and validation support

## 📞 Support

### Getting Help
- **Documentation**: Check this README and docs folder
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

### Community
- **Discord**: Join our community server
- **Twitter**: Follow for updates and news
- **Newsletter**: Subscribe to our monthly newsletter
- **Events**: Attend community meetups and workshops

---

**Built with ❤️ for the Naath community**

*Preserving culture, sharing knowledge, building connections*
