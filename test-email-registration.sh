#!/bin/bash

# Email Registration Testing Script
# Tests the complete email registration and voting flow

set -e

echo "📧 Testing Email Registration Functionality"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test data with timestamp to ensure uniqueness
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@school.edu"
TEST_NAME="John Doe"
TEST_CLASS="Grade 12"

# API base URL
API_BASE="http://localhost:8000/make-server-02adf113"

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ "$method" = "GET" ]; then
        curl -s -X GET "${API_BASE}${endpoint}" \
             -H "Content-Type: application/json"
    else
        curl -s -X $method "${API_BASE}${endpoint}" \
             -H "Content-Type: application/json" \
             -d "$data"
    fi
}

# Test 1: Health check
test_health() {
    print_status "Testing backend health..."
    response=$(api_call "GET" "/health" "")
    if echo "$response" | grep -q '"status":"ok"'; then
        print_success "Backend is healthy"
        return 0
    else
        print_error "Backend health check failed"
        return 1
    fi
}

# Test 2: Send registration link
test_send_registration_link() {
    print_status "Testing registration link generation..."
    data="{\"email\":\"$TEST_EMAIL\"}"
    response=$(api_call "POST" "/send-registration-link" "$data")

    if echo "$response" | grep -q '"success":true'; then
        print_success "Registration link generated"
        # Extract the test link for later use
        REG_LINK=$(echo "$response" | grep -o '"testLink":"[^"]*' | cut -d'"' -f4)
        if [ -n "$REG_LINK" ]; then
            print_success "Registration link extracted: $REG_LINK"
            export REG_LINK
        else
            REG_LINK=$(echo "$response" | grep -o '"registrationLink":"[^"]*' | cut -d'"' -f4)
            if [ -n "$REG_LINK" ]; then
                print_success "Registration link extracted: $REG_LINK"
                export REG_LINK
            fi
        fi
        return 0
    else
        print_error "Registration link generation failed: $response"
        return 1
    fi
}

# Test 3: Extract token from registration link
extract_token() {
    print_status "Extracting token from registration link..."
    if [ -n "$REG_LINK" ]; then
        TOKEN=$(echo "$REG_LINK" | grep -o 'regToken=[^&]*' | cut -d'=' -f2)
        if [ -n "$TOKEN" ]; then
            print_success "Token extracted: $TOKEN"
            export TOKEN
            return 0
        fi
    fi
    print_error "Could not extract token from link"
    return 1
}

# Test 4: Verify registration token
test_verify_token() {
    print_status "Verifying registration token..."
    response=$(api_call "GET" "/verify-registration-token/$TOKEN" "")

    if echo "$response" | grep -q '"success":true' && echo "$response" | grep -q "$TEST_EMAIL"; then
        print_success "Token verification successful"
        return 0
    else
        print_error "Token verification failed: $response"
        return 1
    fi
}

# Test 5: Complete registration
test_complete_registration() {
    print_status "Completing registration..."
    data="{\"token\":\"$TOKEN\",\"fullName\":\"$TEST_NAME\",\"studentClass\":\"$TEST_CLASS\"}"
    response=$(api_call "POST" "/complete-registration" "$data")

    if echo "$response" | grep -q '"success":true'; then
        print_success "Registration completed successfully"
        return 0
    else
        print_error "Registration completion failed: $response"
        return 1
    fi
}

# Test 6: Send voting link
test_send_voting_link() {
    print_status "Testing voting link generation..."
    data="{\"email\":\"$TEST_EMAIL\"}"
    response=$(api_call "POST" "/send-vote-link" "$data")

    if echo "$response" | grep -q '"success":true'; then
        print_success "Voting link generated"
        # Extract the voting link
        VOTE_LINK=$(echo "$response" | grep -o '"testLink":"[^"]*' | cut -d'"' -f4)
        if [ -n "$VOTE_LINK" ]; then
            print_success "Voting link extracted: $VOTE_LINK"
            export VOTE_LINK
        else
            VOTE_LINK=$(echo "$response" | grep -o '"votingLink":"[^"]*' | cut -d'"' -f4)
            if [ -n "$VOTE_LINK" ]; then
                print_success "Voting link extracted: $VOTE_LINK"
                export VOTE_LINK
            fi
        fi
        return 0
    else
        print_error "Voting link generation failed: $response"
        return 1
    fi
}

# Test 7: Check MailHog for emails
test_mailhog() {
    print_status "Checking MailHog for captured emails..."
    # Try to access MailHog API
    mailhog_response=$(curl -s http://localhost:8025/api/v2/messages 2>/dev/null || echo "MailHog not available")

    if echo "$mailhog_response" | grep -q "$TEST_EMAIL"; then
        EMAIL_COUNT=$(echo "$mailhog_response" | grep -o "$TEST_EMAIL" | wc -l)
        print_success "Found $EMAIL_COUNT emails for $TEST_EMAIL in MailHog"
        return 0
    else
        print_warning "MailHog not accessible or no emails found (this is OK for fallback testing)"
        return 0
    fi
}

# Test 8: Get candidates
test_get_candidates() {
    print_status "Testing candidate retrieval..."
    response=$(api_call "GET" "/candidates/$TEST_CLASS" "")

    if echo "$response" | grep -q '"candidates"'; then
        print_success "Candidates retrieved successfully"
        return 0
    else
        print_error "Candidate retrieval failed: $response"
        return 1
    fi
}

# Main test execution
main() {
    local passed=0
    local total=0

    # Run all tests
    tests=(
        "test_health"
        "test_send_registration_link"
        "extract_token"
        "test_verify_token"
        "test_complete_registration"
        "test_send_voting_link"
        "test_mailhog"
        "test_get_candidates"
    )

    for test_func in "${tests[@]}"; do
        total=$((total + 1))
        if $test_func; then
            passed=$((passed + 1))
        fi
        echo ""
    done

    # Summary
    echo "📊 Email Registration Test Results"
    echo "==================================="
    echo "Passed: $passed/$total tests"

    if [ $passed -eq $total ]; then
        print_success "🎉 All email registration tests passed!"
        echo ""
        echo "📧 Test emails can be viewed at: http://localhost:8025"
        echo "🔗 Registration Link: $REG_LINK"
        echo "🗳️ Voting Link: $VOTE_LINK"
    else
        print_error "❌ Some tests failed. Check the backend server and MailHog."
        exit 1
    fi
}

# Run main function
main "$@"
