#!/bin/bash

# Voting App Deployment Script
# This script helps deploy the voting application to various platforms

set -e

echo "🚀 Voting App Deployment Script"
echo "================================"

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
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    if ! command -v deno &> /dev/null; then
        print_error "Deno is not installed. Installing Deno..."
        curl -fsSL https://deno.land/install.sh | sh
        export PATH="$HOME/.deno/bin:$PATH"
    fi

    print_success "All dependencies are available"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."

    cd frontend
    npm install
    npm run build
    cd ..

    print_success "Frontend built successfully"
}

# Test the application locally
test_locally() {
    print_status "Starting local test servers..."

    # Start backend in background
    export PATH="$HOME/.deno/bin:$PATH"
    cd backend
    deno run --allow-net --allow-env --allow-read server/index.ts &
    BACKEND_PID=$!
    cd ..

    # Start frontend in background
    cd frontend
    npm run preview &
    FRONTEND_PID=$!
    cd ..

    print_success "Servers started (Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID)"

    # Wait for servers to be ready
    sleep 5

    # Test with curl or simple HTTP check
    if curl -f http://localhost:4173 > /dev/null 2>&1; then
        print_success "Frontend is responding on port 4173"
    else
        print_warning "Frontend may not be ready yet"
    fi

    # Kill test servers
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true

    print_success "Local testing completed"
}

# Deploy to Netlify (Frontend)
deploy_netlify() {
    print_status "Deploying frontend to Netlify..."

    if ! command -v netlify &> /dev/null; then
        print_error "Netlify CLI is not installed. Install with: npm install -g netlify-cli"
        return 1
    fi

    cd frontend
    netlify deploy --prod --dir=dist
    cd ..

    print_success "Frontend deployed to Netlify"
}

# Deploy to Railway (Backend)
deploy_railway() {
    print_status "Deploying backend to Railway..."

    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Install with: npm install -g @railway/cli"
        return 1
    fi

    cd backend
    railway deploy
    cd ..

    print_success "Backend deployed to Railway"
}

# Main deployment menu
main() {
    echo "Select deployment option:"
    echo "1. Test locally"
    echo "2. Deploy frontend to Netlify"
    echo "3. Deploy backend to Railway"
    echo "4. Full deployment (frontend + backend)"
    echo "5. Build only"
    read -p "Enter your choice (1-5): " choice

    case $choice in
        1)
            check_dependencies
            test_locally
            ;;
        2)
            check_dependencies
            build_frontend
            deploy_netlify
            ;;
        3)
            check_dependencies
            deploy_railway
            ;;
        4)
            check_dependencies
            build_frontend
            deploy_netlify
            deploy_railway
            ;;
        5)
            check_dependencies
            build_frontend
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    print_success "Deployment process completed!"
    echo ""
    echo "Next steps:"
    echo "1. Update your frontend's API calls to point to the deployed backend URL"
    echo "2. Set up your Supabase project and update environment variables"
    echo "3. Configure your domain and SSL certificates if needed"
    echo "4. Test the deployed application thoroughly"
}

# Run main function
main "$@"
