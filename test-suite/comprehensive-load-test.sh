#!/bin/bash

# Comprehensive Load Testing Suite for PTL POS API
# Testing with multiple users, load balancing, and stress scenarios

BASE_URL="https://ptlpos.onrender.com"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW85bTNxNjEwMDAyazY3b3lpc251eHdoIiwiZW1haWwiOiJvbWZtYWlsQGFvbC5jb20iLCJ0ZW5hbnRJZCI6ImNtbzltM3B1cDAwMDBrNjdvNGdlNDl4NjIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzY4MzY5OTQsImV4cCI6MTc3NjkyMzM5NH0.P37l5jM8rDprU5fh4mjWb0s0pALP77I2Cs5-TdN1CsI"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results storage
declare -A RESULTS
declare -A USER_TOKENS

# Function to create test users
create_test_users() {
    echo -e "${BLUE}Creating Test Users...${NC}"
    
    local users=("manager1" "salesrep1" "salesrep2" "cashier1" "cashier2")
    local roles=("MANAGER" "SALES_REP" "SALES_REP" "SALES_REP" "SALES_REP")
    
    for i in "${!users[@]}"; do
        local user="${users[$i]}"
        local role="${roles[$i]}"
        local email="${user}@test.com"
        local password="Test123456!"
        
        echo -e "${YELLOW}Creating user: $user ($role)${NC}"
        
        # Register user
        register_response=$(curl -s -w "%{http_code}" -X POST \
            "$BASE_URL/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$email\",\"password\":\"$password\",\"firstName\":\"Test\",\"lastName\":\"$user\",\"role\":\"$role\"}")
        
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

# Function to test endpoint performance
test_endpoint_performance() {
    local endpoint="$1"
    local method="$2"
    local token="$3"
    local data="$4"
    local concurrent_requests="$5"
    local test_name="$6"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    echo -e "${YELLOW}Endpoint: $method $endpoint${NC}"
    echo -e "${YELLOW}Concurrent requests: $concurrent_requests${NC}"
    
    local total_requests=0
    local successful_requests=0
    local failed_requests=0
    local total_time=0
    local min_time=999999
    local max_time=0
    
    # Create temporary file for results
    local temp_file=$(mktemp)
    
    # Run concurrent requests
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
            duration=$((($end_time - $start_time) / 1000000)) # Convert to milliseconds
            
            http_code="${response: -3}"
            
            echo "$duration $http_code" >> "$temp_file"
        ) &
        
        # Control concurrency
        if ((i % 10 == 0)); then
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
    echo ""
}

# Function to run load tests
run_load_tests() {
    echo -e "${BLUE}Starting Load Tests...${NC}"
    
    # Test with admin token
    test_endpoint_performance "/api/branches" "GET" "$ADMIN_TOKEN" "" 20 "Load_Test_Branches_GET"
    test_endpoint_performance "/api/products" "GET" "$ADMIN_TOKEN" "" 20 "Load_Test_Products_GET"
    test_endpoint_performance "/api/inventory" "GET" "$ADMIN_TOKEN" "" 20 "Load_Test_Inventory_GET"
    test_endpoint_performance "/api/categories" "GET" "$ADMIN_TOKEN" "" 20 "Load_Test_Categories_GET"
    test_endpoint_performance "/api/customers" "GET" "$ADMIN_TOKEN" "" 20 "Load_Test_Customers_GET"
    
    # Test with different user tokens
    for user in "${!USER_TOKENS[@]}"; do
        token="${USER_TOKENS[$user]}"
        test_endpoint_performance "/api/products" "GET" "$token" "" 10 "Load_Test_Products_${user}"
        test_endpoint_performance "/api/inventory" "GET" "$token" "" 10 "Load_Test_Inventory_${user}"
    done
}

# Function to run stress tests
run_stress_tests() {
    echo -e "${BLUE}Starting Stress Tests...${NC}"
    
    # High concurrency tests
    test_endpoint_performance "/api/products" "GET" "$ADMIN_TOKEN" "" 50 "Stress_Test_Products_High_Concurrency"
    test_endpoint_performance "/api/inventory" "GET" "$ADMIN_TOKEN" "" 50 "Stress_Test_Inventory_High_Concurrency"
    test_endpoint_performance "/api/branches" "GET" "$ADMIN_TOKEN" "" 30 "Stress_Test_Branches_High_Concurrency"
    
    # Mixed operations stress test
    echo -e "${BLUE}Running Mixed Operations Stress Test...${NC}"
    
    local temp_file=$(mktemp)
    local total_operations=100
    
    for ((i=1; i<=total_operations; i++)); do
        (
            token="$ADMIN_TOKEN"
            operation=$((i % 4))
            start_time=$(date +%s%N)
            
            case $operation in
                0)
                    response=$(curl -s -w "%{http_code}" -X GET \
                        "$BASE_URL/api/products" \
                        -H "Authorization: Bearer $token")
                    ;;
                1)
                    response=$(curl -s -w "%{http_code}" -X GET \
                        "$BASE_URL/api/inventory" \
                        -H "Authorization: Bearer $token")
                    ;;
                2)
                    response=$(curl -s -w "%{http_code}" -X GET \
                        "$BASE_URL/api/branches" \
                        -H "Authorization: Bearer $token")
                    ;;
                3)
                    response=$(curl -s -w "%{http_code}" -X GET \
                        "$BASE_URL/api/categories" \
                        -H "Authorization: Bearer $token")
                    ;;
            esac
            
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
    
    # Process mixed operations results
    local total_requests=0
    local successful_requests=0
    local total_time=0
    
    while read -r line; do
        duration=$(echo "$line" | cut -d' ' -f1)
        http_code=$(echo "$line" | cut -d' ' -f2)
        
        total_requests=$((total_requests + 1))
        total_time=$((total_time + duration))
        
        if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
            successful_requests=$((successful_requests + 1))
        fi
    done < "$temp_file"
    
    rm "$temp_file"
    
    local avg_time=$((total_time / total_requests))
    local success_rate=$((successful_requests * 100 / total_requests))
    
    RESULTS["Stress_Test_Mixed_Operations"]="$total_requests,$successful_requests,0,$avg_time,0,0,$success_rate"
    
    echo -e "${GREEN}Mixed Operations Stress Test Results:${NC}"
    echo -e "  Total Operations: $total_requests"
    echo -e "  Successful: $successful_requests"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Avg Response Time: ${avg_time}ms"
    echo ""
}

# Function to test authentication under load
test_auth_load() {
    echo -e "${BLUE}Testing Authentication Under Load...${NC}"
    
    local temp_file=$(mktemp)
    local login_attempts=50
    
    for ((i=1; i<=login_attempts; i++)); do
        (
            start_time=$(date +%s%N)
            
            response=$(curl -s -w "%{http_code}" -X POST \
                "$BASE_URL/api/auth/login" \
                -H "Content-Type: application/json" \
                -d '{"email":"omfmail@aol.com","password":"Admin123456!"}')
            
            end_time=$(date +%s%N)
            duration=$((($end_time - $start_time) / 1000000))
            http_code="${response: -3}"
            
            echo "$duration $http_code" >> "$temp_file"
        ) &
        
        if ((i % 10 == 0)); then
            wait
        fi
    done
    
    wait
    
    # Process auth results
    local total_requests=0
    local successful_requests=0
    local total_time=0
    local min_time=999999
    local max_time=0
    
    while read -r line; do
        duration=$(echo "$line" | cut -d' ' -f1)
        http_code=$(echo "$line" | cut -d' ' -f2)
        
        total_requests=$((total_requests + 1))
        total_time=$((total_time + duration))
        
        if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
            successful_requests=$((successful_requests + 1))
        fi
        
        if ((duration < min_time)); then
            min_time=$duration
        fi
        if ((duration > max_time)); then
            max_time=$duration
        fi
    done < "$temp_file"
    
    rm "$temp_file"
    
    local avg_time=$((total_time / total_requests))
    local success_rate=$((successful_requests * 100 / total_requests))
    
    RESULTS["Auth_Load_Test"]="$total_requests,$successful_requests,0,$avg_time,$min_time,$max_time,$success_rate"
    
    echo -e "${GREEN}Authentication Load Test Results:${NC}"
    echo -e "  Total Login Attempts: $total_requests"
    echo -e "  Successful: $successful_requests"
    echo -e "  Success Rate: ${success_rate}%"
    echo -e "  Avg Response Time: ${avg_time}ms"
    echo -e "  Min Response Time: ${min_time}ms"
    echo -e "  Max Response Time: ${max_time}ms"
    echo ""
}

# Function to generate comprehensive report
generate_report() {
    echo -e "${BLUE}Generating Comprehensive Test Report...${NC}"
    
    local report_file="test-results-$(date +%Y%m%d-%H%M%S).csv"
    
    echo "Test Name,Total Requests,Successful,Failed,Avg Response Time (ms),Min Response Time (ms),Max Response Time (ms),Success Rate (%)" > "$report_file"
    
    for test_name in "${!RESULTS[@]}"; do
        result="${RESULTS[$test_name]}"
        echo "$test_name,$result" >> "$report_file"
    done
    
    echo -e "${GREEN}Report generated: $report_file${NC}"
    
    # Display summary
    echo -e "${BLUE}=== TEST EXECUTION SUMMARY ===${NC}"
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
    
    # Performance highlights
    echo -e "${BLUE}=== PERFORMANCE HIGHLIGHTS ===${NC}"
    
    local best_avg=999999
    local worst_avg=0
    local best_test=""
    local worst_test=""
    
    for test_name in "${!RESULTS[@]}"; do
        result="${RESULTS[$test_name]}"
        avg_time=$(echo "$result" | cut -d',' -f4)
        
        if ((avg_time < best_avg)); then
            best_avg=$avg_time
            best_test=$test_name
        fi
        
        if ((avg_time > worst_avg)); then
            worst_avg=$avg_time
            worst_test=$test_name
        fi
    done
    
    echo -e "${GREEN}Best Performing: $best_test (${best_avg}ms avg)${NC}"
    echo -e "${RED}Worst Performing: $worst_test (${worst_avg}ms avg)${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}=== PTL POS COMPREHENSIVE LOAD TESTING SUITE ===${NC}"
    echo -e "${BLUE}Started at: $(date)${NC}"
    echo ""
    
    # No jq dependency - using grep/sed for JSON parsing
    
    # Create test users
    create_test_users
    echo ""
    
    # Run load tests
    run_load_tests
    echo ""
    
    # Run stress tests
    run_stress_tests
    echo ""
    
    # Test authentication under load
    test_auth_load
    echo ""
    
    # Generate report
    generate_report
    
    echo -e "${GREEN}=== LOAD TESTING COMPLETED ===${NC}"
    echo -e "${GREEN}Completed at: $(date)${NC}"
}

# Run main function
main "$@"
