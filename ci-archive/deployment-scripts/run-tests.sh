#!/bin/bash

# Comprehensive Test Runner Script
# This script runs all test suites in the project

set -e

echo "🚀 Starting Comprehensive Test Suite"
echo "====================================="

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

# Function to run tests and capture results
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local test_dir="$3"
    
    print_status "Running $test_name..."
    
    if [ -n "$test_dir" ]; then
        cd "$test_dir"
    fi
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a TEST_RESULTS=()

# Frontend Tests
print_status "Setting up frontend tests..."
cd /workspace

if [ -f "package.json" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Frontend Unit Tests" "npm test -- --coverage --watchAll=false --passWithNoTests" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Frontend Unit Tests")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Frontend Unit Tests")
    fi
else
    print_warning "Frontend package.json not found, skipping frontend tests"
fi

# Backend Tests
print_status "Setting up backend tests..."
cd /workspace/backend

if [ -f "package.json" ]; then
    # Backend Unit Tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Backend Unit Tests" "npm test -- --coverage --watchAll=false --passWithNoTests" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Backend Unit Tests")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Backend Unit Tests")
    fi
    
    # Backend Integration Tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Backend Integration Tests" "npm test -- --testPathPattern=integration --coverage --watchAll=false --passWithNoTests" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Backend Integration Tests")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Backend Integration Tests")
    fi
    
    # Backend Performance Tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Backend Performance Tests" "npm test -- --testPathPattern=performance --coverage --watchAll=false --passWithNoTests" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Backend Performance Tests")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Backend Performance Tests")
    fi
    
    # Backend Security Tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Backend Security Tests" "npm test -- --testPathPattern=security --coverage --watchAll=false --passWithNoTests" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Backend Security Tests")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Backend Security Tests")
    fi
else
    print_warning "Backend package.json not found, skipping backend tests"
fi

# Linting Tests
print_status "Running linting checks..."
cd /workspace

# Frontend Linting
if [ -f "package.json" ] && [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Frontend Linting" "npm run lint" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Frontend Linting")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Frontend Linting")
    fi
fi

# Backend Linting
cd /workspace/backend
if [ -f "package.json" ] && [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Backend Linting" "npm run lint" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Backend Linting")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Backend Linting")
    fi
fi

# Type Checking (if TypeScript is used)
print_status "Running type checks..."
cd /workspace

if [ -f "tsconfig.json" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Frontend Type Checking" "npx tsc --noEmit" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Frontend Type Checking")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Frontend Type Checking")
    fi
fi

cd /workspace/backend
if [ -f "tsconfig.json" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test_suite "Backend Type Checking" "npx tsc --noEmit" ""; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ Backend Type Checking")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ Backend Type Checking")
    fi
fi

# Print Test Results Summary
echo ""
echo "====================================="
echo "📊 Test Results Summary"
echo "====================================="

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo ""
echo "📈 Overall Statistics:"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: $PASSED_TESTS"
echo "  Failed: $FAILED_TESTS"
echo "  Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%"

# Coverage Reports
echo ""
echo "📋 Coverage Reports:"
if [ -f "/workspace/coverage/lcov.info" ]; then
    print_success "Frontend coverage report generated: /workspace/coverage/lcov.info"
fi
if [ -f "/workspace/backend/coverage/lcov.info" ]; then
    print_success "Backend coverage report generated: /workspace/backend/coverage/lcov.info"
fi

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    print_success "All tests passed! 🎉"
    exit 0
else
    print_error "$FAILED_TESTS test(s) failed! 💥"
    exit 1
fi