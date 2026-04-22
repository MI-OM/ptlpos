#!/bin/bash

# Advanced Load Testing Suite for PTL POS API
# Testing with different scenarios, user roles, and edge cases

BASE_URL="https://ptlpos.onrender.com"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW85bTNxNjEwMDAyazY3b3lpc251eHdoIiwiZW1haWwiOiJvbWZtYWlsQGFvbC5jb20iLCJ0ZW5hbnRJZCI6ImNtbzltM3B1cDAwMDBrNjdvNGdlNDl4NjIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzY4MzY5OTQsImV4cCI6MTc3NjkyMzM5NH0.P37l5jM8rDprU5fh4mjWb0s0pALP77I2Cs5-TdN1CsI"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test results storage
declare -A RESULTS
declare -A USER_TOKENS

# Function to create test users with correct schema
create_test_users_correct() {
    echo -e "${BLUE}Creating Test Users with Correct Schema...${NC}"
    
    local users=("testmanager" "testsales1" "testsales2" "testcashier")
    local roles=("MANAGER" "SALES_REP" "SALES_REP" "SALES_REP")
    
    for i in "${!users[@]}"; do
        local user="${users[$i]}"
        local role="${roles[$i]}"
        local email="${user}@test.com"
        local password="Test123456!"
        local orgName="Test Organization"
        local name="Test User"
        
        echo -e "${YELLOW}Creating user: $user ($role)${NC}"
        
        # Register user with correct schema
        register_response=$(curl -s -w "%{http_code}" -X POST \
            "$BASE_URL/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$email\",\"password\":\"$password\",\"organizationName\":\"$orgName\",\"name\":\"$name\"}")
        
        http_code="${register_response: -3}"
        response_body="${register_response%???}"
        
        if [[ "$http_code" == "201" ]]; then
            echo -e "${GREEN}User $user created successfully${NC}"
            
            # Login to get token
            login_response=$(curl -s -X POST \
                "$BASE_URL/api/auth/login" \
                -H "Content-Type: application/json" \
                -d "{\"email\":\"$email\",\"password\":\"$password\"}")
            
            token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\([^"]*\)"/\1/')
            if [[ "$token" != "null" && "$token" != "" ]]; then
                USER_TOKENS["$user"]="$token"
                echo -e "${GREEN}Token obtained for $user${NC}"
            else
                echo -e "${RED}Failed to get token for $user${NC}"
            fi
        else
            echo -e "${RED}Failed to create user $user: $response_body${NC}"
        fi
    done
}

# Function to test endpoint with detailed metrics
test_endpoint_detailed() {
    local endpoint="$1"
    local method="$2"
    local token="$3"
    local data="$4"
    local concurrent_requests="$5"
    local test_name="$6"
    
    echo -e "${CYAN}Testing: $test_name${NC}"
    echo -e "${YELLOW}Endpoint: $method $endpoint${NC}"
    echo -e "${YELLOW}Concurrent requests: $concurrent_requests${NC}"
    
    local temp_file=$(mktemp)
    local total_requests=0
    local successful_requests=0
    local failed_requests=0
    local total_time=0
    local min_time=999999
    local max_time=0
    local status_codes=()
    
    # Run requests
    for ((i=1; i<=concurrent_requests; i++)); do
        (
            start_time=$(date +%s%N)
            
            if [[ "$method" == "GET" ]]; then
                response=$(curl -s -w "%{http_code}" -X GET \
                    "$BASE_URL$endpoint" \
                    -H "Authorization: Bearer $token" \
                    -H "Content-Type: application/json")
            else
                response=$(curl -s -w "%{http_code}" -X POST \
                    "$BASE_URL$endpoint" \
                    -H "Authorization: Bearer $token" \
                    -H "Content-Type: application/json" \
                    -d "$data")
            fi
            
            end_time=$(date +%s%N)
            duration=$((($end_time - $start_time) / 1000000))
            http_code="${response: -3}"
            
            echo "$duration $http_code" >> "$temp_file"
        ) &
        
        if ((i % 20 == 0)); then
            wait
        fi
    done
    
    wait
    
    # Process results
    while read -r line; do
        duration=$(echo "$line" | cut -d' ' -f1)
        http_code=$(echo "$line" | cut -d' ' -f2)
        
        total_requests=$((total_requests + 1))
        total_time=$((total_time + duration))
        
        if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
            successful_requests=$((successful_requests + 1))
        else
            failed_requests=$((failed_requests + 1))
        fi
        
        if ((duration < min_time)); then
            min_time=$duration
        fi
        if ((duration > max_time)); then
            max_time=$duration
        fi
        
        # Track status codes
        status_codes["$http_code"]=$((${status_codes["$http_code"]:-0} + 1))
    done < "$temp_file"
    
    rm "$temp_file"
    
    # Calculate statistics
    local avg_time=$((total_time / total_requests))
    local success_rate=$((successful_requests * 100 / total_requests))
    
    # Store results
    RESULTS["$test_name"]="$total_requests,$successful_requests,$failed_requests,$avg_time,$min_time,$max_time,$success_rate"
    
    echo -e "${GREEN}Results for $test_name:${NC}"
    echo -e "  Total Requests: $total_requests"
    echo -e "  Successful: $successful_requests"
    echo -e "  Failed: $failed_requests"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Avg Response Time: ${avg_time}ms"
    echo -e "  Min Response Time: ${min_time}ms"
    echo -e "  Max Response Time: ${max_time}ms"
    
    # Show status code distribution
    echo -e "  Status Code Distribution:"
    for code in "${!status_codes[@]}"; do
        echo -e "    $code: ${status_codes[$code]} requests"
    done
    echo ""
}

# Function to test POST operations
test_post_operations() {
    echo -e "${BLUE}Testing POST Operations...${NC}"
    
    # Test category creation
    test_endpoint_detailed "/api/categories" "POST" "$ADMIN_TOKEN" \
        '{"name":"Test Category","description":"Load test category","isActive":true}' \
        10 "POST_Categories_Create"
    
    # Test branch creation
    test_endpoint_detailed "/api/branches" "POST" "$ADMIN_TOKEN" \
        '{"name":"Test Branch","code":"TEST001","address":"123 Test St","city":"Test City","country":"Test Country","phone":"+1234567890","email":"test@test.com","isActive":true}' \
        10 "POST_Branches_Create"
    
    # Test customer creation
    test_endpoint_detailed "/api/customers" "POST" "$ADMIN_TOKEN" \
        '{"name":"Test Customer","email":"customer@test.com","phone":"+1234567890","address":"123 Customer St","city":"Customer City","country":"Customer Country","type":"INDIVIDUAL"}' \
        10 "POST_Customers_Create"
    
    # Test product creation (simple)
    test_endpoint_detailed "/api/products" "POST" "$ADMIN_TOKEN" \
        '{"name":"Test Product","sku":"TEST-PROD-001","price":29.99,"cost":15.00,"taxRate":0.08,"type":"SIMPLE","categoryId":null}' \
        10 "POST_Products_Create"
}

# Function to test pagination and filtering
test_pagination_filtering() {
    echo -e "${BLUE}Testing Pagination and Filtering...${NC}"
    
    # Test products with pagination
    test_endpoint_detailed "/api/products?page=1&limit=10" "GET" "$ADMIN_TOKEN" "" 15 "GET_Products_Pagination"
    
    # Test products with filtering
    test_endpoint_detailed "/api/products?type=SIMPLE" "GET" "$ADMIN_TOKEN" "" 15 "GET_Products_Filter_Type"
    
    # Test inventory with low stock
    test_endpoint_detailed "/api/inventory/low-stock?threshold=50" "GET" "$ADMIN_TOKEN" "" 15 "GET_Inventory_Low_Stock"
    
    # Test categories with active filter
    test_endpoint_detailed "/api/categories?isActive=true" "GET" "$ADMIN_TOKEN" "" 15 "GET_Categories_Active"
}

# Function to test concurrent user scenarios
test_concurrent_users() {
    echo -e "${BLUE}Testing Concurrent User Scenarios...${NC}"
    
    # Test with different user tokens
    for user in "${!USER_TOKENS[@]}"; do
        token="${USER_TOKENS[$user]}"
        test_endpoint_detailed "/api/products" "GET" "$token" "" 5 "Concurrent_${user}_Products"
        test_endpoint_detailed "/api/inventory" "GET" "$token" "" 5 "Concurrent_${user}_Inventory"
    done
}

# Function to test error scenarios
test_error_scenarios() {
    echo -e "${BLUE}Testing Error Scenarios...${NC}"
    
    # Test invalid token
    test_endpoint_detailed "/api/products" "GET" "invalid_token" "" 5 "Error_Invalid_Token"
    
    # Test missing token
    test_endpoint_detailed "/api/products" "GET" "" "" 5 "Error_Missing_Token"
    
    # Test invalid endpoint
    test_endpoint_detailed "/api/nonexistent" "GET" "$ADMIN_TOKEN" "" 5 "Error_Invalid_Endpoint"
    
    # Test invalid method
    test_endpoint_detailed "/api/products" "DELETE" "$ADMIN_TOKEN" "" 5 "Error_Invalid_Method"
}

# Function to test sustained load
test_sustained_load() {
    echo -e "${BLUE}Testing Sustained Load (5 minutes)...${NC}"
    
    local temp_file=$(mktemp)
    local duration=300  # 5 minutes
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local request_count=0
    local success_count=0
    
    while (( $(date +%s) < end_time )); do
        (
            response=$(curl -s -w "%{http_code}" -X GET \
                "$BASE_URL/api/products" \
                -H "Authorization: Bearer $ADMIN_TOKEN")
            
            http_code="${response: -3}"
            
            if [[ "$http_code" == "200" ]]; then
                echo "success" >> "$temp_file"
            else
                echo "failed" >> "$temp_file"
            fi
        ) &
        
        request_count=$((request_count + 1))
        
        # Control rate (10 requests per second)
        if ((request_count % 10 == 0)); then
            sleep 1
        fi
    done
    
    wait
    
    # Count results
    success_count=$(grep -c "success" "$temp_file" || echo 0)
    local failed_count=$((request_count - success_count))
    local success_rate=$((success_count * 100 / request_count))
    
    RESULTS["Sustained_Load_Test"]="$request_count,$success_count,$failed_count,0,0,0,$success_rate"
    
    echo -e "${GREEN}Sustained Load Test Results:${NC}"
    echo -e "  Duration: 5 minutes"
    echo -e "  Total Requests: $request_count"
    echo -e "  Successful: $success_count"
    echo -e "  Failed: $failed_count"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Requests per Second: $((request_count / duration))"
    echo ""
    
    rm "$temp_file"
}

# Function to generate comprehensive report
generate_advanced_report() {
    echo -e "${BLUE}Generating Advanced Test Report...${NC}"
    
    local report_file="advanced-test-results-$(date +%Y%m%d-%H%M%S).csv"
    
    echo "Test Name,Total Requests,Successful,Failed,Avg Response Time (ms),Min Response Time (ms),Max Response Time (ms),Success Rate (%)" > "$report_file"
    
    for test_name in "${!RESULTS[@]}"; do
        result="${RESULTS[$test_name]}"
        echo "$test_name,$result" >> "$report_file"
    done
    
    echo -e "${GREEN}Advanced report generated: $report_file${NC}"
    
    # Display summary
    echo -e "${CYAN}=== ADVANCED TEST EXECUTION SUMMARY ===${NC}"
    echo -e "${YELLOW}Total Test Cases: ${#RESULTS[@]}${NC}"
    
    local total_requests_all=0
    local total_successful_all=0
    
    for result in "${RESULTS[@]}"; do
        total_req=$(echo "$result" | cut -d',' -f1)
        total_success=$(echo "$result" | cut -d',' -f2)
        
        total_requests_all=$((total_requests_all + total_req))
        total_successful_all=$((total_successful_all + total_success))
    done
    
    local overall_success_rate=$((total_successful_all * 100 / total_requests_all))
    
    echo -e "${YELLOW}Total Requests Executed: $total_requests_all${NC}"
    echo -e "${YELLOW}Total Successful Requests: $total_successful_all${NC}"
    echo -e "${YELLOW}Overall Success Rate: ${overall_success_rate}%${NC}"
    echo ""
    
    # Performance analysis
    echo -e "${CYAN}=== PERFORMANCE ANALYSIS ===${NC}"
    
    local fast_tests=()
    local slow_tests=()
    local failed_tests=()
    
    for test_name in "${!RESULTS[@]}"; do
        result="${RESULTS[$test_name]}"
        avg_time=$(echo "$result" | cut -d',' -f4)
        success_rate=$(echo "$result" | cut -d',' -f7)
        
        if ((success_rate < 100)); then
            failed_tests+=("$test_name ($success_rate%)")
        elif ((avg_time < 1000)); then
            fast_tests+=("$test_name (${avg_time}ms)")
        elif ((avg_time > 2000)); then
            slow_tests+=("$test_name (${avg_time}ms)")
        fi
    done
    
    echo -e "${GREEN}Fast Performing Tests (<1000ms):${NC}"
    for test in "${fast_tests[@]}"; do
        echo -e "  - $test"
    done
    
    echo -e "${YELLOW}Slow Performing Tests (>2000ms):${NC}"
    for test in "${slow_tests[@]}"; do
        echo -e "  - $test"
    done
    
    echo -e "${RED}Failed Tests (<100% success):${NC}"
    for test in "${failed_tests[@]}"; do
        echo -e "  - $test"
    done
    echo ""
}

# Main execution
main() {
    echo -e "${CYAN}=== PTL POS ADVANCED LOAD TESTING SUITE ===${NC}"
    echo -e "${CYAN}Started at: $(date)${NC}"
    echo ""
    
    # Create test users
    create_test_users_correct
    echo ""
    
    # Run basic load tests
    echo -e "${BLUE}=== BASIC LOAD TESTS ===${NC}"
    test_endpoint_detailed "/api/products" "GET" "$ADMIN_TOKEN" "" 25 "Basic_Products_Load"
    test_endpoint_detailed "/api/inventory" "GET" "$ADMIN_TOKEN" "" 25 "Basic_Inventory_Load"
    test_endpoint_detailed "/api/branches" "GET" "$ADMIN_TOKEN" "" 25 "Basic_Branches_Load"
    echo ""
    
    # Run POST operations tests
    test_post_operations
    echo ""
    
    # Run pagination and filtering tests
    test_pagination_filtering
    echo ""
    
    # Run concurrent user tests
    test_concurrent_users
    echo ""
    
    # Run error scenario tests
    test_error_scenarios
    echo ""
    
    # Run sustained load test
    test_sustained_load
    echo ""
    
    # Generate report
    generate_advanced_report
    
    echo -e "${GREEN}=== ADVANCED LOAD TESTING COMPLETED ===${NC}"
    echo -e "${GREEN}Completed at: $(date)${NC}"
}

# Run main function
main "$@"
