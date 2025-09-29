#!/bin/bash

# Quick Email Test for Voting App
# Send a test email to yourself

set -e

echo "📧 Quick Email Test"
echo "==================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env is configured
if ! grep -q "SMTP_USER=your-gmail@gmail.com" backend/.env 2>/dev/null; then
    print_error "Email not configured. Run ./setup-email.sh first."
    exit 1
fi

read -p "Enter your email address to test with: " TEST_EMAIL

print_status "Starting backend server..."

# Kill existing server
pkill -f "deno run.*test-server.ts" || true

# Start server in background
export PATH="$HOME/.deno/bin:$PATH"
cd backend && deno run --allow-net --allow-env --allow-read --watch server/test-server.ts &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 3

print_status "Sending test registration email to $TEST_EMAIL..."

# Send test email
RESPONSE=$(curl -s -X POST "http://localhost:8000/make-server-02adf113/send-registration-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "✅ Email sent successfully!"
    echo ""
    echo "📧 Check your email inbox (and spam folder) for:"
    echo "   Subject: Complete Your Voter Registration - Class Representative Election"
    echo ""
    echo "🔗 Registration Link: $(echo "$RESPONSE" | grep -o '"testLink":"[^"]*' | cut -d'"' -f4)"
    echo ""
    print_status "Server is running (PID: $SERVER_PID). Press Ctrl+C to stop."
    wait $SERVER_PID
else
    print_error "❌ Failed to send email: $RESPONSE"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
