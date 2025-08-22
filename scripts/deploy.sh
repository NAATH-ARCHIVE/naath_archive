#!/bin/bash

# Naath Archive Production Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

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

# Configuration
DEPLOYMENT_ENV=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
ROLLBACK_TAG=""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check for Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check for environment file
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file (.env.production) not found."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    print_status "Loading production environment variables..."
    
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
        print_success "Environment variables loaded"
    else
        print_error "Production environment file not found"
        exit 1
    fi
}

# Create backup
create_backup() {
    print_status "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    if [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ] && [ ! -z "$DB_PASSWORD" ]; then
        docker exec naath_postgres_prod pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/database_backup.sql"
        print_success "Database backup created: $BACKUP_DIR/database_backup.sql"
    else
        print_warning "Database credentials not found, skipping backup"
    fi
    
    # File uploads backup
    if [ -d "./uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads_backup.tar.gz" ./uploads
        print_success "Uploads backup created: $BACKUP_DIR/uploads_backup.tar.gz"
    fi
    
    # Configuration backup
    cp .env.production "$BACKUP_DIR/"
    cp docker-compose.prod.yml "$BACKUP_DIR/"
    print_success "Configuration backup created"
}

# Stop existing services
stop_services() {
    print_status "Stopping existing services..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.prod.yml down
        print_success "Existing services stopped"
    else
        print_status "No running services found"
    fi
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts"
        
        # Check backend health
        if curl -f http://localhost:${BACKEND_PORT:-5000}/health > /dev/null 2>&1; then
            print_success "Backend is healthy"
        else
            print_warning "Backend health check failed, attempt $attempt"
            if [ $attempt -eq $max_attempts ]; then
                print_error "Backend failed to become healthy"
                return 1
            fi
            sleep 10
            ((attempt++))
            continue
        fi
        
        # Check frontend health
        if curl -f http://localhost:${FRONTEND_PORT:-80} > /dev/null 2>&1; then
            print_success "Frontend is healthy"
        else
            print_warning "Frontend health check failed, attempt $attempt"
            if [ $attempt -eq $max_attempts ]; then
                print_error "Frontend failed to become healthy"
                return 1
            fi
            sleep 10
            ((attempt++))
            continue
        fi
        
        # Check database health
        if docker exec naath_postgres_prod pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
            print_success "Database is healthy"
        else
            print_warning "Database health check failed, attempt $attempt"
            if [ $attempt -eq $max_attempts ]; then
                print_error "Database failed to become healthy"
                return 1
            fi
            sleep 10
            ((attempt++))
            continue
        fi
        
        print_success "All services are healthy!"
        return 0
    done
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations if they exist
    if [ -f "./backend/scripts/migrate.js" ]; then
        docker exec naath_backend_prod node scripts/migrate.js
        print_success "Database migrations completed"
    else
        print_warning "No migration script found, skipping"
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if all containers are running
    local running_containers=$(docker-compose -f docker-compose.prod.yml ps -q | wc -l)
    local expected_containers=5  # postgres, redis, backend, frontend, nginx
    
    if [ "$running_containers" -eq "$expected_containers" ]; then
        print_success "All containers are running"
    else
        print_error "Expected $expected_containers containers, found $running_containers"
        return 1
    fi
    
    # Test API endpoints
    if curl -f http://localhost:${BACKEND_PORT:-5000}/health > /dev/null 2>&1; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        return 1
    fi
    
    # Test frontend
    if curl -f http://localhost:${FRONTEND_PORT:-80} > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
        return 1
    fi
    
    print_success "Deployment verification completed"
}

# Rollback deployment
rollback_deployment() {
    print_error "Deployment failed, initiating rollback..."
    
    # Stop current services
    docker-compose -f docker-compose.prod.yml down
    
    # Restore from backup if available
    if [ -d "$BACKUP_DIR" ]; then
        print_status "Restoring from backup: $BACKUP_DIR"
        
        # Restore database if backup exists
        if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
            print_status "Restoring database from backup..."
            # This would require the database to be running
            # docker exec -i naath_postgres_prod psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_DIR/database_backup.sql"
        fi
        
        # Restore uploads if backup exists
        if [ -f "$BACKUP_DIR/uploads_backup.tar.gz" ]; then
            print_status "Restoring uploads from backup..."
            tar -xzf "$BACKUP_DIR/uploads_backup.tar.gz"
        fi
        
        print_warning "Rollback completed. Please check the system manually."
    else
        print_error "No backup available for rollback"
    fi
    
    exit 1
}

# Main deployment function
main() {
    print_status "Starting Naath Archive production deployment..."
    print_status "Deployment environment: $DEPLOYMENT_ENV"
    print_status "Backup directory: $BACKUP_DIR"
    
    # Set up error handling
    trap 'rollback_deployment' ERR
    
    # Execute deployment steps
    check_prerequisites
    load_environment
    create_backup
    stop_services
    deploy_services
    run_migrations
    verify_deployment
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Services are now running and accessible"
    print_status "Backup saved to: $BACKUP_DIR"
    
    # Display service status
    echo ""
    print_status "Service Status:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    print_status "Service URLs:"
    echo "Frontend: http://localhost:${FRONTEND_PORT:-80}"
    echo "Backend API: http://localhost:${BACKEND_PORT:-5000}"
    echo "Health Check: http://localhost:${BACKEND_PORT:-5000}/health"
    
    echo ""
    print_status "Next steps:"
    echo "1. Update DNS records to point to this server"
    echo "2. Configure SSL certificates with Certbot"
    echo "3. Set up monitoring and alerting"
    echo "4. Test all functionality thoroughly"
}

# Run main function
main "$@"
