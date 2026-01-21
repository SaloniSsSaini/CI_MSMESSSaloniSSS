#!/bin/bash

# Carbon Intelligence - Quick Start Script
# This script provides an easy way to get started with the project

set -e

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("Docker")
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        missing_tools+=("AWS CLI")
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install the missing tools and run this script again."
        echo ""
        echo "Installation guides:"
        echo "- Node.js: https://nodejs.org/"
        echo "- Docker: https://docs.docker.com/get-docker/"
        echo "- AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        echo "- jq: https://stedolan.github.io/jq/"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to setup project
setup_project() {
    print_status "Setting up project..."
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    # Create environment file
    if [ ! -f ".env" ]; then
        print_status "Creating environment file..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration"
    fi
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    print_success "Project setup completed"
}

# Function to show menu
show_menu() {
    echo ""
    echo "=========================================="
    echo "Carbon Intelligence - Quick Start Menu"
    echo "=========================================="
    echo ""
    echo "1. Local Development (Docker Compose)"
    echo "2. Deploy to Development (AWS)"
    echo "3. Deploy to Staging (AWS)"
    echo "4. Deploy to Production (AWS)"
    echo "5. Setup Monitoring"
    echo "6. View Documentation"
    echo "7. Exit"
    echo ""
    read -p "Select an option (1-7): " choice
}

# Function to start local development
start_local_dev() {
    print_status "Starting local development environment..."
    
    # Start Docker Compose
    docker-compose up -d
    
    print_success "Local development environment started!"
    echo ""
    echo "Services available at:"
    echo "- Backend API: http://localhost:3000"
    echo "- Frontend: http://localhost:80"
    echo "- Prometheus: http://localhost:9090"
    echo "- Grafana: http://localhost:3001"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Function to deploy to development
deploy_dev() {
    print_status "Deploying to development environment..."
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Deploy to development
    ./scripts/deploy.sh dev deploy
    
    print_success "Development deployment completed!"
}

# Function to deploy to staging
deploy_staging() {
    print_status "Deploying to staging environment..."
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Deploy to staging
    ./scripts/deploy.sh staging deploy
    
    print_success "Staging deployment completed!"
}

# Function to deploy to production
deploy_production() {
    print_warning "This will deploy to PRODUCTION environment!"
    read -p "Are you sure? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        print_status "Deploying to production environment..."
        
        # Check AWS credentials
        if ! aws sts get-caller-identity &> /dev/null; then
            print_error "AWS CLI is not configured. Please run 'aws configure' first."
            exit 1
        fi
        
        # Deploy to production
        ./scripts/deploy.sh production deploy
        
        print_success "Production deployment completed!"
    else
        print_status "Production deployment cancelled"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Setup monitoring
    ./scripts/setup-monitoring.sh
    
    print_success "Monitoring setup completed!"
}

# Function to show documentation
show_documentation() {
    echo ""
    echo "=========================================="
    echo "Carbon Intelligence - Documentation"
    echo "=========================================="
    echo ""
    echo "📚 Available Documentation:"
    echo ""
    echo "1. Deployment Guide: DEPLOYMENT_GUIDE.md"
    echo "2. API Documentation: docs/API_DOCUMENTATION.md"
    echo "3. Architecture Guide: docs/ARCHITECTURE_DIAGRAMS.md"
    echo "4. User Guide: docs/USER_GUIDE.md"
    echo "5. Technical Documentation: docs/TECHNICAL_DOCUMENTATION.md"
    echo ""
    echo "🔧 Quick Commands:"
    echo ""
    echo "Deploy to environment:"
    echo "  ./scripts/deploy.sh [dev|staging|production] deploy"
    echo ""
    echo "Check status:"
    echo "  ./scripts/deploy.sh [dev|staging|production] status"
    echo ""
    echo "View logs:"
    echo "  ./scripts/deploy.sh [dev|staging|production] logs"
    echo ""
    echo "Local development:"
    echo "  docker-compose up -d"
    echo ""
    echo "Setup monitoring:"
    echo "  ./scripts/setup-monitoring.sh"
    echo ""
}

# Function to show project info
show_project_info() {
    echo ""
    echo "=========================================="
    echo "Carbon Intelligence - Project Information"
    echo "=========================================="
    echo ""
    echo "🌱 Carbon Intelligence is a comprehensive ESG analysis platform"
    echo "   that provides carbon footprint tracking and sustainability insights."
    echo ""
    echo "🏗️ Architecture:"
    echo "   - Frontend: React Native mobile app"
    echo "   - Backend: Node.js API with Express"
    echo "   - Database: MongoDB"
    echo "   - Infrastructure: AWS (EC2, RDS, S3, CloudFront)"
    echo "   - Monitoring: CloudWatch, Prometheus, Grafana"
    echo ""
    echo "🚀 Features:"
    echo "   - On-device SMS analysis with privacy protection"
    echo "   - Data encryption for sensitive information"
    echo "   - Comprehensive audit logging"
    echo "   - ESG impact analysis"
    echo "   - Carbon footprint tracking"
    echo "   - Recommendations engine"
    echo ""
    echo "🔒 Privacy & Security:"
    echo "   - No SMS content sent to backend servers"
    echo "   - All analysis performed locally on device"
    echo "   - AES-256 encryption for stored data"
    echo "   - User-controlled data retention"
    echo "   - Complete data deletion capability"
    echo ""
}

# Main function
main() {
    show_project_info
    
    # Check prerequisites
    check_prerequisites
    
    # Setup project
    setup_project
    
    # Main menu loop
    while true; do
        show_menu
        
        case $choice in
            1)
                start_local_dev
                ;;
            2)
                deploy_dev
                ;;
            3)
                deploy_staging
                ;;
            4)
                deploy_production
                ;;
            5)
                setup_monitoring
                ;;
            6)
                show_documentation
                ;;
            7)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"