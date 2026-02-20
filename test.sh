#!/bin/bash

# Test Script for Deal Motivation Demo App
# Tests dropdown functionality and regression

echo "========================================"
echo "Deal Motivation Demo - Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

test_result() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED=$((FAILED + 1))
    fi
}

echo "Testing: http://localhost:3000"
echo ""

# Test 1: Server is running
echo "1. Testing server availability..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"
test_result $? "Server responds with HTTP 200"

# Test 2: Page title loads
echo "2. Testing page title..."
curl -s http://localhost:3000 | grep -q "Deal Motivation Demo"
test_result $? "Page title 'Deal Motivation Demo' present"

# Test 3: React root div exists
echo "3. Testing React root element..."
curl -s http://localhost:3000 | grep -q '<div id="root">'
test_result $? "React root div exists"

# Test 4: JavaScript bundle loads
echo "4. Testing JavaScript bundle..."
curl -s http://localhost:3000 | grep -q "assets/index-"
test_result $? "JavaScript bundle reference exists"

# Test 5: Tailwind CSS CDN
echo "5. Testing Tailwind CSS..."
curl -s http://localhost:3000 | grep -q "cdn.tailwindcss.com"
test_result $? "Tailwind CSS CDN loaded"

# Test 6: JS bundle is accessible
echo "6. Testing JS bundle accessibility..."
JS_PATH=$(curl -s http://localhost:3000 | grep -o 'assets/index-[^"]*\.js' | head -1)
if [ -n "$JS_PATH" ]; then
    curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$JS_PATH" | grep -q "200"
    test_result $? "JavaScript bundle accessible (HTTP 200)"
else
    test_result 1 "JavaScript bundle path not found"
fi

# Test 7: Bundle contains Select component
echo "7. Testing Select component in bundle..."
if [ -n "$JS_PATH" ]; then
    curl -s "http://localhost:3000/$JS_PATH" | grep -q "Select"
    test_result $? "Select component found in bundle"
else
    test_result 1 "Cannot test - bundle path not found"
fi

# Test 8: Bundle contains state management
echo "8. Testing useState hook..."
if [ -n "$JS_PATH" ]; then
    curl -s "http://localhost:3000/$JS_PATH" | grep -q "useState"
    test_result $? "useState hook found in bundle"
else
    test_result 1 "Cannot test - bundle path not found"
fi

# Test 9: Bundle contains React
echo "9. Testing React import..."
if [ -n "$JS_PATH" ]; then
    curl -s "http://localhost:3000/$JS_PATH" | grep -q "react"
    test_result $? "React found in bundle"
else
    test_result 1 "Cannot test - bundle path not found"
fi

# Test 10: Bundle size check
echo "10. Testing bundle size..."
if [ -n "$JS_PATH" ]; then
    SIZE=$(curl -s -I "http://localhost:3000/$JS_PATH" | grep -i content-length | awk '{print $2}' | tr -d '\r')
    if [ "$SIZE" -gt 100000 ]; then
        test_result 0 "Bundle size is reasonable ($SIZE bytes)"
    else
        test_result 1 "Bundle size too small ($SIZE bytes)"
    fi
else
    test_result 1 "Cannot test - bundle path not found"
fi

# Test 11: Lucide icons
echo "11. Testing Lucide icons..."
if [ -n "$JS_PATH" ]; then
    curl -s "http://localhost:3000/$JS_PATH" | grep -q "lucide"
    test_result $? "Lucide icons found in bundle"
else
    test_result 1 "Cannot test - bundle path not found"
fi

# Test 12: Recharts library
echo "12. Testing Recharts..."
if [ -n "$JS_PATH" ]; then
    curl -s "http://localhost:3000/$JS_PATH" | grep -q "recharts"
    test_result $? "Recharts found in bundle"
else
    test_result 1 "Cannot test - bundle path not found"
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    PASS_RATE=100
else
    PASS_RATE=$((PASSED * 100 / TOTAL))
fi

echo "Pass Rate: ${PASS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
