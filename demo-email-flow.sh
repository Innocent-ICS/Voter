#!/bin/bash

# Demo Email Registration Flow
# Shows the complete email registration and voting process

set -e

echo "🎯 Email Registration Flow Demo"
echo "==============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEMO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# API base URL
API_BASE="http://localhost:8000/make-server-02adf113"

# Demo user
DEMO_EMAIL="demo$(date +%s)@school.edu"
DEMO_NAME="Demo Student"
DEMO_CLASS="Grade 12"

echo "Using demo email: $DEMO_EMAIL"
echo ""

# Step 1: Request registration link
print_status "Step 1: Requesting registration link..."
response=$(curl -s -X POST "${API_BASE}/send-registration-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\"}")

if echo "$response" | grep -q '"success":true'; then
    print_success "Registration link sent!"
    REG_LINK=$(echo "$response" | grep -o '"testLink":"[^"]*' | cut -d'"' -f4)
    echo "Registration Link: $REG_LINK"
else
    echo "Error: $response"
    exit 1
fi

# Step 2: Extract token from link
print_status "Step 2: Extracting registration token..."
TOKEN=$(echo "$REG_LINK" | grep -o 'regToken=[^&]*' | cut -d'=' -f2)
print_success "Token extracted: $TOKEN"

# Step 3: Verify token
print_status "Step 3: Verifying registration token..."
response=$(curl -s "${API_BASE}/verify-registration-token/$TOKEN")

if echo "$response" | grep -q '"success":true'; then
    print_success "Token is valid!"
    EMAIL_VERIFIED=$(echo "$response" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    echo "Email verified: $EMAIL_VERIFIED"
else
    echo "Error verifying token: $response"
    exit 1
fi

# Step 4: Complete registration
print_status "Step 4: Completing registration..."
response=$(curl -s -X POST "${API_BASE}/complete-registration" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"fullName\":\"$DEMO_NAME\",\"studentClass\":\"$DEMO_CLASS\"}")

if echo "$response" | grep -q '"success":true'; then
    print_success "Registration completed!"
else
    echo "Error completing registration: $response"
    exit 1
fi

# Step 5: Request voting link
print_status "Step 5: Requesting voting link..."
response=$(curl -s -X POST "${API_BASE}/send-vote-link" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\"}")

if echo "$response" | grep -q '"success":true'; then
    print_success "Voting link sent!"
    VOTE_LINK=$(echo "$response" | grep -o '"testLink":"[^"]*' | cut -d'"' -f4)
    echo "Voting Link: $VOTE_LINK"
else
    echo "Error: $response"
    exit 1
fi

# Step 6: Check candidates
print_status "Step 6: Checking available candidates..."
response=$(curl -s "${API_BASE}/candidates/$DEMO_CLASS")

if echo "$response" | grep -q '"candidates"'; then
    print_success "Candidates retrieved!"
    echo "Response: $response"
else
    echo "Error retrieving candidates: $response"
fi

echo ""
print_success "🎉 Email registration flow demo completed successfully!"
echo ""
echo "📧 Check the backend server console for email logs"
echo "🔗 Registration Link: $REG_LINK"
echo "🗳️ Voting Link: $VOTE_LINK"
echo ""
echo "💡 The email registration system is working perfectly!"
echo "   In production, emails would be sent to real SMTP servers instead of console logs."
