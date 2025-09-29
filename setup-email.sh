#!/bin/bash

# Email Setup Helper for Voting App
# Helps configure Gmail SMTP for sending real emails

set -e

echo "📧 Email Setup for Voting App"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    print_error "backend/.env file not found. Run this script from the project root directory."
    exit 1
fi

echo "This script will help you configure Gmail SMTP to send real emails from your voting app."
echo ""
echo "📋 Prerequisites:"
echo "1. A Gmail account"
echo "2. 2-Factor Authentication enabled on your Gmail account"
echo "3. An App Password generated (not your regular password)"
echo ""

read -p "Do you have these prerequisites set up? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔗 Setup Instructions:"
    echo ""
    echo "1. Enable 2-Factor Authentication:"
    echo "   - Go to https://myaccount.google.com/security"
    echo "   - Enable 2-Step Verification"
    echo ""
    echo "2. Generate App Password:"
    echo "   - Go to https://myaccount.google.com/apppasswords"
    echo "   - Select 'Mail' and 'Other (custom name)'"
    echo "   - Enter 'Voting App' as the name"
    echo "   - Copy the 16-character password"
    echo ""
    read -p "Press Enter when you're ready to continue..."
fi

echo ""
read -p "Enter your Gmail address: " GMAIL_USER
read -s -p "Enter your Gmail App Password (16 characters): " GMAIL_PASS
echo ""

# Update the .env file
print_status "Updating backend/.env file..."
sed -i.bak "s|SMTP_USER=.*|SMTP_USER=$GMAIL_USER|" backend/.env
sed -i.bak "s|SMTP_PASS=.*|SMTP_PASS=$GMAIL_PASS|" backend/.env

print_success "Environment variables updated!"
echo ""
echo "📧 Configuration Summary:"
echo "   SMTP Host: smtp.gmail.com"
echo "   SMTP Port: 587"
echo "   Username: $GMAIL_USER"
echo "   Password: [HIDDEN]"
echo ""

print_warning "Security Note: Your App Password is stored in backend/.env"
print_warning "Make sure to add .env to your .gitignore file!"
echo ""

read -p "Would you like to test email sending now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your email address to test with: " TEST_EMAIL

    print_status "Restarting backend server with new configuration..."

    # Kill existing server
    pkill -f "deno run.*test-server.ts" || true

    # Start server in background
    export PATH="$HOME/.deno/bin:$PATH"
    cd backend && deno run --allow-net --allow-env --allow-read --watch server/test-server.ts &
    SERVER_PID=$!
    cd ..

    # Wait for server to start
    sleep 3

    print_status "Sending test email..."

    # Send test email
    curl -s -X POST "http://localhost:8000/make-server-02adf113/send-registration-link" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\"}" | head -5

    echo ""
    print_success "Test email sent! Check your inbox (and spam folder)."
    echo ""
    print_status "Server is running in background (PID: $SERVER_PID)"
    echo "Press Ctrl+C to stop the server when done testing."
    echo ""
    wait $SERVER_PID
else
    print_success "Setup complete! You can now send real emails."
    echo ""
    echo "To test email sending:"
    echo "1. Start the backend: cd backend && deno run --allow-net --allow-env --allow-read --watch server/test-server.ts"
    echo "2. Use the API: POST /make-server-02adf113/send-registration-link with {\"email\":\"your-email@example.com\"}"
fi

echo ""
print_success "🎉 Email setup completed successfully!"
