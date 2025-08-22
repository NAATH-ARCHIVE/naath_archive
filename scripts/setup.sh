#!/bin/bash

# Naath Archive Setup Script
# This script sets up the development environment for the Naath Archive project

set -e  # Exit on any error

echo "🚀 Starting Naath Archive setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check for Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker found"
    else
        print_warning "Docker not found. Some features may not work."
    fi
    
    print_success "System requirements check passed"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Check if database config exists
    if [ ! -f "config/database.js" ]; then
        print_warning "Database configuration not found. Please configure database.js manually."
    fi
    
    print_success "Backend setup completed"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Frontend setup completed"
    cd ..
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -f "database/schema.sql" ]; then
        print_status "Database schema found"
        # Note: Database setup would require database credentials
        print_warning "Please configure your database connection and run the schema manually"
    else
        print_warning "No database schema found"
    fi
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=naath_archive
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF
        print_success "Created backend/.env"
    else
        print_status "backend/.env already exists"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=Naath Archive
VITE_APP_VERSION=1.0.0
EOF
        print_success "Created frontend/.env"
    else
        print_status "frontend/.env already exists"
    fi
}

# Create docker-compose file
create_docker_compose() {
    print_status "Creating docker-compose.yml..."
    
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: naath_postgres
    environment:
      POSTGRES_DB: naath_archive
      POSTGRES_USER: naath_user
      POSTGRES_PASSWORD: naath_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - naath_network

  # Backend API
  backend:
    build: ./backend
    container_name: naath_backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=naath_archive
      - DB_USER=naath_user
      - DB_PASSWORD=naath_password
    depends_on:
      - postgres
    networks:
      - naath_network
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Frontend
  frontend:
    build: ./frontend
    container_name: naath_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - naath_network
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:

networks:
  naath_network:
    driver: bridge
EOF
        print_success "Created docker-compose.yml"
    else
        print_status "docker-compose.yml already exists"
    fi
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    # Start development script
    cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Naath Archive in development mode..."

# Start backend
echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

    # Stop development script
    cat > scripts/stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping development servers..."

# Kill Node.js processes
pkill -f "npm run dev" || true
pkill -f "vite" || true

echo "✅ Development servers stopped"
EOF

    # Make scripts executable
    chmod +x scripts/dev.sh
    chmod +x scripts/stop.sh
    
    print_success "Created development scripts"
}

# Main setup function
main() {
    print_status "Starting Naath Archive setup..."
    
    # Check requirements
    check_requirements
    
    # Setup components
    setup_backend
    setup_frontend
    setup_database
    
    # Create configuration files
    create_env_files
    create_docker_compose
    create_dev_scripts
    
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your database credentials in backend/.env"
    echo "2. Run 'npm run dev' in backend/ to start the API server"
    echo "3. Run 'npm run dev' in frontend/ to start the development server"
    echo "4. Or use 'docker-compose up' to start everything with Docker"
    echo "5. Use './scripts/dev.sh' to start both servers simultaneously"
    echo ""
    echo "Happy coding! 🚀"
}

# Run main function
main "$@"
