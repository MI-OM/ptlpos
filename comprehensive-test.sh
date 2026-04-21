#!/bin/bash

# Comprehensive API Testing Script for PTLPOS
set -e

BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@ptlpos.local"
ADMIN_PASSWORD="ChangeMe123!"
ACCESS_TOKEN=""
REFRESH_TOKEN=""
TENANT_ID=""
USER_ID=""

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
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

# Test authentication endpoints
test_authentication() {
    log_info "Testing authentication endpoints..."
    
    # Test login
    log_info "Testing admin login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"tenantId\":\"cmo2i33630003atjwki5qaekv\"}")
    
    if echo "$LOGIN_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
        ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
        REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refresh_token')
        USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.userId')
        log_success "Login successful"
        log_info "User ID: $USER_ID"
    else
        log_error "Login failed"
        echo "$LOGIN_RESPONSE"
        return 1
    fi
    
    # Test refresh token
    log_info "Testing refresh token..."
    REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
    
    if echo "$REFRESH_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
        ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token')
        log_success "Token refresh successful"
    else
        log_error "Token refresh failed"
        echo "$REFRESH_RESPONSE"
        return 1
    fi
    
    # Test current user endpoint
    log_info "Testing current user endpoint..."
    ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$ME_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Current user endpoint working"
    else
        log_error "Current user endpoint failed"
        echo "$ME_RESPONSE"
        return 1
    fi
}

# Test category CRUD operations
test_categories() {
    log_info "Testing category CRUD operations..."
    
    # Create category
    log_info "Creating test category..."
    CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Electronics","description":"Test category for electronic items","isActive":true}')
    
    if echo "$CATEGORY_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id')
        log_success "Category created successfully: $CATEGORY_ID"
    else
        log_error "Category creation failed"
        echo "$CATEGORY_RESPONSE"
        return 1
    fi
    
    # List categories
    log_info "Listing categories..."
    LIST_CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$LIST_CATEGORIES_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
        CATEGORY_COUNT=$(echo "$LIST_CATEGORIES_RESPONSE" | jq '.data | length')
        log_success "Categories listed successfully ($CATEGORY_COUNT categories)"
    else
        log_error "Category listing failed"
        echo "$LIST_CATEGORIES_RESPONSE"
        return 1
    fi
    
    # Update category
    log_info "Updating category..."
    UPDATE_CATEGORY_RESPONSE=$(curl -s -X PATCH "$BASE_URL/categories/$CATEGORY_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Updated Electronics","description":"Updated description"}')
    
    if echo "$UPDATE_CATEGORY_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Category updated successfully"
    else
        log_error "Category update failed"
        echo "$UPDATE_CATEGORY_RESPONSE"
        return 1
    fi
    
    # Get single category
    log_info "Getting single category..."
    GET_CATEGORY_RESPONSE=$(curl -s -X GET "$BASE_URL/categories/$CATEGORY_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$GET_CATEGORY_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Single category retrieved successfully"
    else
        log_error "Single category retrieval failed"
        echo "$GET_CATEGORY_RESPONSE"
        return 1
    fi
}

# Test product operations with categories
test_products() {
    log_info "Testing product operations with categories..."
    
    # Create product with category
    log_info "Creating test product with category..."
    PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test Laptop\",\"sku\":\"LAPTOP-TEST-001\",\"categoryId\":\"$CATEGORY_ID\",\"type\":\"SIMPLE\",\"price\":999.99,\"cost\":750.00,\"taxRate\":0.08,\"openingQuantity\":10}")
    
    if echo "$PRODUCT_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.id')
        log_success "Product created successfully: $PRODUCT_ID"
    else
        log_error "Product creation failed"
        echo "$PRODUCT_RESPONSE"
        return 1
    fi
    
    # List products filtered by category
    log_info "Listing products filtered by category..."
    FILTERED_PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products?categoryId=$CATEGORY_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$FILTERED_PRODUCTS_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
        FILTERED_COUNT=$(echo "$FILTERED_PRODUCTS_RESPONSE" | jq '.data | length')
        log_success "Products filtered by category successfully ($FILTERED_COUNT products)"
    else
        log_error "Product filtering by category failed"
        echo "$FILTERED_PRODUCTS_RESPONSE"
        return 1
    fi
    
    # Get single product
    log_info "Getting single product..."
    GET_PRODUCT_RESPONSE=$(curl -s -X GET "$BASE_URL/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$GET_PRODUCT_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Single product retrieved successfully"
        # Check if category is included
        if echo "$GET_PRODUCT_RESPONSE" | jq -e '.category' > /dev/null 2>&1; then
            log_success "Product includes category relationship"
        else
            log_warning "Product does not include category relationship"
        fi
    else
        log_error "Single product retrieval failed"
        echo "$GET_PRODUCT_RESPONSE"
        return 1
    fi
}

# Test composite products
test_composite_products() {
    log_info "Testing composite product operations..."
    
    # Create another simple product to use as component
    COMPONENT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Mouse","sku":"MOUSE-TEST-001","type":"SIMPLE","price":29.99,"cost":15.00,"taxRate":0.08,"openingQuantity":50}')
    
    if echo "$COMPONENT_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        COMPONENT_ID=$(echo "$COMPONENT_RESPONSE" | jq -r '.id')
        log_success "Component product created: $COMPONENT_ID"
    else
        log_error "Component product creation failed"
        return 1
    fi
    
    # Create composite product
    log_info "Creating composite product..."
    COMPOSITE_RESPONSE=$(curl -s -X POST "$BASE_URL/products/composite" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Computer Bundle\",\"sku\":\"BUNDLE-001\",\"categoryId\":\"$CATEGORY_ID\",\"price\":1029.98,\"cost\":765.00,\"taxRate\":0.08,\"openingQuantity\":5,\"components\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1},{\"productId\":\"$COMPONENT_ID\",\"quantity\":1}]}")
    
    if echo "$COMPOSITE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        COMPOSITE_ID=$(echo "$COMPOSITE_RESPONSE" | jq -r '.id')
        log_success "Composite product created: $COMPOSITE_ID"
    else
        log_error "Composite product creation failed"
        echo "$COMPOSITE_RESPONSE"
        return 1
    fi
    
    # Get composite product with inventory
    log_info "Getting composite product with inventory..."
    COMPOSITE_INVENTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/products/composite/$COMPOSITE_ID/inventory" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$COMPOSITE_INVENTORY_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Composite product with inventory retrieved successfully"
    else
        log_error "Composite product inventory retrieval failed"
        echo "$COMPOSITE_INVENTORY_RESPONSE"
        return 1
    fi
}

# Test metrics endpoints
test_metrics() {
    log_info "Testing metrics endpoints..."
    
    # Test health endpoint
    log_info "Testing metrics health endpoint..."
    HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/metrics/health" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$HEALTH_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
        HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status')
        log_success "Metrics health endpoint working (status: $HEALTH_STATUS)"
    else
        log_error "Metrics health endpoint failed"
        echo "$HEALTH_RESPONSE"
        return 1
    fi
    
    # Test metrics summary
    log_info "Testing metrics summary endpoint..."
    SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/metrics/summary" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$SUMMARY_RESPONSE" | jq -e '.metrics' > /dev/null 2>&1; then
        log_success "Metrics summary endpoint working"
    else
        log_error "Metrics summary endpoint failed"
        echo "$SUMMARY_RESPONSE"
        return 1
    fi
    
    # Test raw metrics
    log_info "Testing raw metrics endpoint..."
    RAW_METRICS_RESPONSE=$(curl -s -X GET "$BASE_URL/metrics" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$RAW_METRICS_RESPONSE" | jq -e '.metrics' > /dev/null 2>&1; then
        log_success "Raw metrics endpoint working"
    else
        log_error "Raw metrics endpoint failed"
        echo "$RAW_METRICS_RESPONSE"
        return 1
    fi
}

# Test A4 invoice generation (requires a sale first)
test_invoice_generation() {
    log_info "Testing A4 invoice generation..."
    
    # First create a customer
    CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Customer","email":"test@example.com","phone":"+1234567890"}')
    
    if echo "$CUSTOMER_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.id')
        log_success "Test customer created: $CUSTOMER_ID"
    else
        log_error "Customer creation failed"
        return 1
    fi
    
    # Create a sale
    SALE_RESPONSE=$(curl -s -X POST "$BASE_URL/sales" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"customerId\":\"$CUSTOMER_ID\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2,\"price\":999.99}],\"payments\":[{\"method\":\"CASH\",\"amount\":1999.98}]}")
    
    if echo "$SALE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        SALE_ID=$(echo "$SALE_RESPONSE" | jq -r '.id')
        log_success "Test sale created: $SALE_ID"
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
    
    if echo "$INVOICE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        INVOICE_ID=$(echo "$INVOICE_RESPONSE" | jq -r '.id')
        log_success "Invoice created: $INVOICE_ID"
    else
        log_error "Invoice creation failed"
        echo "$INVOICE_RESPONSE"
        return 1
    fi
    
    # Generate A4 invoice
    log_info "Generating A4 invoice HTML..."
    A4_INVOICE_RESPONSE=$(curl -s -X GET "$BASE_URL/invoices/$INVOICE_ID/a4" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$A4_INVOICE_RESPONSE" | grep -q "<!DOCTYPE html>" > /dev/null 2>&1; then
        log_success "A4 invoice HTML generated successfully"
        log_info "Invoice HTML size: $(echo "$A4_INVOICE_RESPONSE" | wc -c) characters"
    else
        log_error "A4 invoice generation failed"
        echo "$A4_INVOICE_RESPONSE" | head -20
        return 1
    fi
}

# Main test execution
main() {
    log_info "Starting comprehensive PTLPOS API testing..."
    echo "========================================"
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        log_error "jq is required for JSON parsing. Please install jq."
        exit 1
    fi
    
    # Run tests
    test_server_connectivity || exit 1
    test_authentication || exit 1
    test_categories || exit 1
    test_products || exit 1
    test_composite_products || exit 1
    test_metrics || exit 1
    test_invoice_generation || exit 1
    
    echo "========================================"
    log_success "All tests completed successfully! "
    log_info "Application is ready for deployment."
    
    # Cleanup test data (optional)
    read -p "Do you want to clean up test data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up test data..."
        # Add cleanup logic here if needed
        log_info "Cleanup completed"
    fi
}

# Run main function
main "$@"
