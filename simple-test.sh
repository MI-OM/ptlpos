#!/bin/bash

# Simple API Testing Script for PTLPOS (without jq dependency)
set -e

BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@ptlpos.local"
ADMIN_PASSWORD="ChangeMe123!"
TENANT_ID="cmo2i33630003atjwki5qaekv"
ACCESS_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test server connectivity
test_server_connectivity() {
    log_info "Testing server connectivity..."
    
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        log_success "Server is running and responding"
        return 0
    else
        log_error "Server is not responding on $BASE_URL"
        return 1
    fi
}

# Test authentication
test_authentication() {
    log_info "Testing authentication..."
    
    # Test login
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"tenantId\":\"$TENANT_ID\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        log_success "Login successful"
    else
        log_error "Login failed"
        echo "$LOGIN_RESPONSE"
        return 1
    fi
}

# Test category creation
test_categories() {
    log_info "Testing category creation..."
    
    # Create category
    CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Electronics","description":"Test category","isActive":true}')
    
    if echo "$CATEGORY_RESPONSE" | grep -q '"id"'; then
        CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_success "Category created: $CATEGORY_ID"
    else
        log_error "Category creation failed"
        echo "$CATEGORY_RESPONSE"
        return 1
    fi
    
    # List categories
    LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$LIST_RESPONSE" | grep -q '"data"'; then
        log_success "Categories listed successfully"
    else
        log_error "Category listing failed"
        return 1
    fi
}

# Test product creation with category
test_products() {
    log_info "Testing product creation with category..."
    
    # Create product with category
    PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test Laptop\",\"sku\":\"LAPTOP-001\",\"categoryId\":\"$CATEGORY_ID\",\"type\":\"SIMPLE\",\"price\":999.99,\"cost\":750.00,\"taxRate\":0.08,\"openingQuantity\":10}")
    
    if echo "$PRODUCT_RESPONSE" | grep -q '"id"'; then
        PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_success "Product created: $PRODUCT_ID"
    else
        log_error "Product creation failed"
        echo "$PRODUCT_RESPONSE"
        return 1
    fi
    
    # Filter products by category
    FILTERED_RESPONSE=$(curl -s -X GET "$BASE_URL/products?categoryId=$CATEGORY_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$FILTERED_RESPONSE" | grep -q '"data"'; then
        log_success "Products filtered by category successfully"
    else
        log_error "Product filtering failed"
        return 1
    fi
}

# Test metrics
test_metrics() {
    log_info "Testing metrics endpoints..."
    
    # Test health
    HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/metrics/health" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$HEALTH_RESPONSE" | grep -q '"status"'; then
        log_success "Metrics health endpoint working"
    else
        log_error "Metrics health failed"
        return 1
    fi
}

# Test A4 invoice generation
test_invoice() {
    log_info "Testing A4 invoice generation..."
    
    # Create customer
    CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Customer","email":"test@example.com","phone":"+1234567890"}')
    
    if echo "$CUSTOMER_RESPONSE" | grep -q '"id"'; then
        CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_success "Customer created: $CUSTOMER_ID"
    else
        log_error "Customer creation failed"
        return 1
    fi
    
    # Create sale
    SALE_RESPONSE=$(curl -s -X POST "$BASE_URL/sales" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"customerId\":\"$CUSTOMER_ID\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1,\"price\":999.99}],\"payments\":[{\"method\":\"CASH\",\"amount\":999.99}]}")
    
    if echo "$SALE_RESPONSE" | grep -q '"id"'; then
        SALE_ID=$(echo "$SALE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_success "Sale created: $SALE_ID"
    else
        log_error "Sale creation failed"
        echo "$SALE_RESPONSE"
        return 1
    fi
    
    # Create invoice
    INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"saleId\":\"$SALE_ID\"}")
    
    if echo "$INVOICE_RESPONSE" | grep -q '"id"'; then
        INVOICE_ID=$(echo "$INVOICE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log_success "Invoice created: $INVOICE_ID"
    else
        log_error "Invoice creation failed"
        echo "$INVOICE_RESPONSE"
        return 1
    fi
    
    # Generate A4 invoice
    A4_RESPONSE=$(curl -s -X GET "$BASE_URL/invoices/$INVOICE_ID/a4" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$A4_RESPONSE" | grep -q "<!DOCTYPE html>"; then
        log_success "A4 invoice HTML generated successfully"
    else
        log_error "A4 invoice generation failed"
        return 1
    fi
}

# Main test execution
main() {
    log_info "Starting PTLPOS API testing (simple version)..."
    echo "========================================"
    
    test_server_connectivity || exit 1
    test_authentication || exit 1
    test_categories || exit 1
    test_products || exit 1
    test_metrics || exit 1
    test_invoice || exit 1
    
    echo "========================================"
    log_success "All core tests completed successfully!"
    log_info "Application is ready for deployment."
}

# Run main function
main "$@"
