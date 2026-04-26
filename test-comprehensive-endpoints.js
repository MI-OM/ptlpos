#!/usr/bin/env node

/**
 * Comprehensive Endpoint Test Suite
 * Tests all endpoints with volume of data to ensure functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_CONFIG = {
  products: 10,
  customers: 5,
  suppliers: 3,
  categories: 3,
  branches: 3,
  sales: 5,
};

// Test state
let authToken = null;
let tenantId = null;
let branchId = null;
let createdData = {
  products: [],
  customers: [],
  suppliers: [],
  categories: [],
  branches: [],
  sales: [],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
  if (details) {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
    log(`  ${detailsStr}`, 'yellow');
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers,
      data: typeof options.body === 'string' ? JSON.parse(options.body) : options.body,
    });
    return {
      ok: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status || 0,
      data: error.response?.data || error.message,
    };
  }
}

async function login() {
  log('\n=== AUTHENTICATION ===', 'blue');
  
  // Register/login with admin credentials
  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@ptlpos.local',
      password: 'ChangeMe123!',
      tenantId: 'cmo2i33630003atjwki5qaekv',
    }),
  });

  if (response.ok) {
    authToken = response.data.access_token;
    tenantId = response.data.user.tenantId;
    logTest('Admin Login', true);
    return true;
  } else {
    logTest('Admin Login', false, response.data);
    return false;
  }
}

async function testBranches() {
  log('\n=== BRANCHES ===', 'blue');
  
  // List branches
  const listResponse = await makeRequest('/branches');
  logTest('List branches', listResponse.ok);
  
  if (listResponse.ok && listResponse.data.length > 0) {
    branchId = listResponse.data[0].id;
    createdData.branches = listResponse.data;
    log(`  Found ${listResponse.data.length} branches`, 'yellow');
  }

  // Get specific branch
  if (branchId) {
    const getResponse = await makeRequest(`/branches/${branchId}`);
    logTest('Get branch by ID', getResponse.ok);
  }

  return true;
}

async function testCategories() {
  log('\n=== CATEGORIES ===', 'blue');

  // Create categories
  for (let i = 0; i < TEST_CONFIG.categories; i++) {
    await delay(1000); // Add delay to avoid rate limiting
    const timestamp = Date.now();
    const response = await makeRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Category ${timestamp}-${i}`,
        description: `Test category ${i + 1}`,
        isActive: true,
      }),
    });

    if (response.ok) {
      createdData.categories.push(response.data);
      logTest(`Create category ${i + 1}`, true);
    } else {
      logTest(`Create category ${i + 1}`, false, response.data);
    }
  }

  // List categories
  const listResponse = await makeRequest('/categories');
  logTest('List categories', listResponse.ok);
  log(`  Total categories: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // List with search
  const searchResponse = await makeRequest('/categories?search=Bakery');
  logTest('Search categories', searchResponse.ok);

  // Get specific category
  if (createdData.categories.length > 0) {
    const getResponse = await makeRequest(`/categories/${createdData.categories[0].id}`);
    logTest('Get category by ID', getResponse.ok);
  }

  // Update category
  if (createdData.categories.length > 0) {
    const updateResponse = await makeRequest(`/categories/${createdData.categories[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: `Updated ${createdData.categories[0].name}`,
      }),
    });
    logTest('Update category', updateResponse.ok);
  }

  return true;
}

async function testSuppliers() {
  log('\n=== SUPPLIERS ===', 'blue');

  // Create suppliers
  for (let i = 0; i < TEST_CONFIG.suppliers; i++) {
    await delay(1000); // Add delay to avoid rate limiting
    const timestamp = Date.now();
    const response = await makeRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Supplier ${timestamp}-${i}`,
        email: `supplier${timestamp}${i}@test.com`,
        phone: `+123456789${timestamp}${i}`.slice(-15),
      }),
    });

    if (response.ok) {
      createdData.suppliers.push(response.data);
      logTest(`Create supplier ${i + 1}`, true);
    } else {
      logTest(`Create supplier ${i + 1}`, false, response.data);
    }
  }

  // List suppliers
  const listResponse = await makeRequest('/suppliers');
  logTest('List suppliers', listResponse.ok);
  log(`  Total suppliers: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // Get specific supplier
  if (createdData.suppliers.length > 0) {
    const getResponse = await makeRequest(`/suppliers/${createdData.suppliers[0].id}`);
    logTest('Get supplier by ID', getResponse.ok);
  }

  // Update supplier
  if (createdData.suppliers.length > 0) {
    const updateResponse = await makeRequest(`/suppliers/${createdData.suppliers[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: `Updated ${createdData.suppliers[0].name}`,
      }),
    });
    logTest('Update supplier', updateResponse.ok);
  }

  return true;
}

async function testCustomers() {
  log('\n=== CUSTOMERS ===', 'blue');

  // Create customers
  for (let i = 0; i < TEST_CONFIG.customers; i++) {
    await delay(1000); // Add delay to avoid rate limiting
    const timestamp = Date.now();
    const response = await makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test Customer ${timestamp}-${i}`,
        email: `customer${timestamp}${i}@test.com`,
        phone: `+123456789${timestamp}${i}`.slice(-15),
      }),
    });

    if (response.ok) {
      createdData.customers.push(response.data);
      logTest(`Create customer ${i + 1}`, true);
    } else {
      logTest(`Create customer ${i + 1}`, false, response.data);
    }
  }

  // List customers
  const listResponse = await makeRequest('/customers');
  logTest('List customers', listResponse.ok);
  log(`  Total customers: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // Get specific customer
  if (createdData.customers.length > 0) {
    const getResponse = await makeRequest(`/customers/${createdData.customers[0].id}`);
    logTest('Get customer by ID', getResponse.ok);
  }

  // Get customer history
  if (createdData.customers.length > 0) {
    const historyResponse = await makeRequest(`/customers/${createdData.customers[0].id}/history?page=1&limit=10`);
    logTest('Get customer history', historyResponse.ok);
  }

  // Update customer
  if (createdData.customers.length > 0) {
    const updateResponse = await makeRequest(`/customers/${createdData.customers[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: `Updated ${createdData.customers[0].name}`,
      }),
    });
    logTest('Update customer', updateResponse.ok);
  }

  return true;
}

async function testProducts() {
  log('\n=== PRODUCTS ===', 'blue');

  const productData = [
    { name: 'Whole Wheat Bread', sku: 'BREAD-001', price: 2.50, category: 'Bakery' },
    { name: 'White Bread', sku: 'BREAD-002', price: 2.00, category: 'Bakery' },
    { name: 'Sourdough Bread', sku: 'BREAD-003', price: 3.50, category: 'Bakery' },
    { name: 'Milk 1L', sku: 'DAIRY-001', price: 1.50, category: 'Dairy' },
    { name: 'Cheese Block', sku: 'DAIRY-002', price: 5.00, category: 'Dairy' },
    { name: 'Orange Juice', sku: 'BEV-001', price: 3.00, category: 'Beverages' },
    { name: 'Cola 2L', sku: 'BEV-002', price: 2.50, category: 'Beverages' },
    { name: 'Potato Chips', sku: 'SNACK-001', price: 2.00, category: 'Snacks' },
    { name: 'Chocolate Bar', sku: 'SNACK-002', price: 1.50, category: 'Snacks' },
    { name: 'Rice 1kg', sku: 'GROC-001', price: 3.00, category: 'Groceries' },
  ];

  // Create products
  for (let i = 0; i < TEST_CONFIG.products; i++) {
    await delay(1000); // Add delay to avoid rate limiting
    const product = productData[i % productData.length];
    const categoryId = createdData.categories[i % createdData.categories.length]?.id;
    
    const timestamp = Date.now();
    const response = await makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: `${product.name} ${Math.floor(i / productData.length) + 1}`,
        sku: `${product.sku}-${timestamp}-${i}`,
        price: product.price,
        cost: product.price * 0.7,
        type: 'SIMPLE',
        categoryId: categoryId,
        openingQuantity: 50,
      }),
    });

    if (response.ok) {
      createdData.products.push(response.data);
      logTest(`Create product ${i + 1}`, true);
    } else {
      logTest(`Create product ${i + 1}`, false, response.data);
    }
  }

  // List products
  const listResponse = await makeRequest('/products');
  logTest('List products', listResponse.ok);
  log(`  Total products: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // List products with pagination
  const paginatedResponse = await makeRequest('/products?page=1&limit=10');
  logTest('List products with pagination', paginatedResponse.ok);

  // List products with search
  const searchResponse = await makeRequest('/products?search=Bread');
  logTest('Search products', searchResponse.ok);

  // List products with category filter
  if (createdData.categories.length > 0) {
    const categoryResponse = await makeRequest(`/products?categoryId=${createdData.categories[0].id}`);
    logTest('Filter products by category', categoryResponse.ok);
  }

  // Get specific product
  if (createdData.products.length > 0) {
    const getResponse = await makeRequest(`/products/${createdData.products[0].id}`);
    logTest('Get product by ID', getResponse.ok);
  }

  // Update product
  if (createdData.products.length > 0) {
    const updateResponse = await makeRequest(`/products/${createdData.products[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        price: createdData.products[0].price * 1.1,
      }),
    });
    logTest('Update product', updateResponse.ok);
  }

  // Create composite product
  if (createdData.products.length >= 2) {
    const compositeResponse = await makeRequest('/products/composite', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bread and Milk Bundle',
        sku: 'BUNDLE-001',
        price: 4.00,
        description: 'Bundle of bread and milk',
        compositeParent: [
          {
            childProductId: createdData.products[0].id,
            quantity: 1,
          },
          {
            childProductId: createdData.products[1].id,
            quantity: 1,
          },
        ],
      }),
    });
    logTest('Create composite product', compositeResponse.ok);
    if (compositeResponse.ok) {
      createdData.products.push(compositeResponse.data);
    }
  }

  return true;
}

async function testInventory() {
  log('\n=== INVENTORY ===', 'blue');

  // List all inventory
  const listResponse = await makeRequest('/inventory');
  logTest('List inventory', listResponse.ok);
  log(`  Total inventory items: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // Get low stock items
  const lowStockResponse = await makeRequest('/inventory/low-stock?threshold=5');
  logTest('Get low stock items', lowStockResponse.ok);

  // Get inventory valuation
  const valuationResponse = await makeRequest('/inventory/valuation');
  logTest('Get inventory valuation', valuationResponse.ok);

  // Get inventory history
  const historyResponse = await makeRequest('/inventory/history');
  logTest('Get inventory history', historyResponse.ok);

  // Adjust inventory
  if (createdData.products.length > 0) {
    const adjustResponse = await makeRequest('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: createdData.products[0].id,
        quantity: 100,
        reason: 'Initial stock',
        type: 'ADDITION',
      }),
    });
    logTest('Adjust inventory', adjustResponse.ok);
  }

  return true;
}

async function testSales() {
  log('\n=== SALES ===', 'blue');

  // Create sales
  for (let i = 0; i < TEST_CONFIG.sales; i++) {
    await delay(1000); // Add delay to avoid rate limiting
    const customer = createdData.customers[i % createdData.customers.length];
    const productsToUse = createdData.products.slice(0, Math.min(3, createdData.products.length));
    
    const saleItems = productsToUse.map((product, idx) => ({
      productId: product.id,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: parseFloat(product.price) || 10.00,
    }));

    const response = await makeRequest('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customerId: customer?.id,
        items: saleItems,
      }),
    });

    if (response.ok) {
      createdData.sales.push(response.data);
      logTest(`Create sale ${i + 1}`, true);
    } else {
      logTest(`Create sale ${i + 1}`, false, response.data);
    }
  }

  // List sales
  const listResponse = await makeRequest('/sales');
  logTest('List sales', listResponse.ok);
  log(`  Total sales: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // List sales with pagination
  const paginatedResponse = await makeRequest('/sales?page=1&limit=10');
  logTest('List sales with pagination', paginatedResponse.ok);

  // List sales with status filter
  const statusResponse = await makeRequest('/sales?status=ACTIVE');
  logTest('Filter sales by status', statusResponse.ok);

  // Get specific sale
  if (createdData.sales.length > 0) {
    const getResponse = await makeRequest(`/sales/${createdData.sales[0].id}`);
    logTest('Get sale by ID', getResponse.ok);
  }

  // Add item to sale
  if (createdData.sales.length > 0 && createdData.products.length > 3) {
    const addItemResponse = await makeRequest(`/sales/${createdData.sales[0].id}/items`, {
      method: 'POST',
      body: JSON.stringify({
        productId: createdData.products[3].id,
        quantity: 2,
        unitPrice: createdData.products[3].price,
      }),
    });
    logTest('Add item to sale', addItemResponse.ok);
  }

  // Complete sale
  if (createdData.sales.length > 0) {
    const completeResponse = await makeRequest(`/sales/${createdData.sales[0].id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        paymentMethod: 'CASH',
        amountPaid: createdData.sales[0].totalAmount,
      }),
    });
    logTest('Complete sale', completeResponse.ok);
  }

  // Get sale receipt
  if (createdData.sales.length > 0) {
    const receiptResponse = await makeRequest(`/sales/${createdData.sales[0].id}/receipt`);
    logTest('Get sale receipt', receiptResponse.ok);
  }

  // Hold sale
  if (createdData.sales.length > 1) {
    const holdResponse = await makeRequest(`/sales/${createdData.sales[1].id}/hold`, {
      method: 'POST',
    });
    logTest('Hold sale', holdResponse.ok);
  }

  // Resume sale
  if (createdData.sales.length > 1) {
    const resumeResponse = await makeRequest(`/sales/${createdData.sales[1].id}/resume`, {
      method: 'POST',
    });
    logTest('Resume sale', resumeResponse.ok);
  }

  return true;
}

async function testUsers() {
  log('\n=== USERS ===', 'blue');

  // List users
  const listResponse = await makeRequest('/users');
  logTest('List users', listResponse.ok);
  log(`  Total users: ${listResponse.ok ? listResponse.data.length : 0}`, 'yellow');

  // Get current user
  const meResponse = await makeRequest('/auth/me');
  logTest('Get current user', meResponse.ok);

  return true;
}

async function testMetrics() {
  log('\n=== METRICS ===', 'blue');

  // Get health status
  const healthResponse = await makeRequest('/metrics/health');
  logTest('Get health status', healthResponse.ok);

  // Get metrics summary
  const summaryResponse = await makeRequest('/metrics/summary');
  logTest('Get metrics summary', summaryResponse.ok);

  // Get raw metrics
  const metricsResponse = await makeRequest('/metrics');
  logTest('Get raw metrics', metricsResponse.ok);

  return true;
}

async function testExports() {
  log('\n=== EXPORTS ===', 'blue');

  // Export products
  const productsResponse = await makeRequest('/exports/products');
  logTest('Export products', productsResponse.ok);

  // Export customers
  const customersResponse = await makeRequest('/exports/customers');
  logTest('Export customers', customersResponse.ok);

  // Export suppliers
  const suppliersResponse = await makeRequest('/exports/suppliers');
  logTest('Export suppliers', suppliersResponse.ok);

  // Export inventory
  const inventoryResponse = await makeRequest('/exports/inventory');
  logTest('Export inventory', inventoryResponse.ok);

  return true;
}

async function runComprehensiveTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║     COMPREHENSIVE ENDPOINT TEST SUITE WITH DATA VOLUME        ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');

  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;

  // Test authentication
  const authSuccess = await login();
  if (!authSuccess) {
    log('\n❌ Authentication failed. Cannot continue tests.', 'red');
    return;
  }

  // Run all test suites
  const testSuites = [
    { name: 'Branches', fn: testBranches },
    { name: 'Categories', fn: testCategories },
    { name: 'Suppliers', fn: testSuppliers },
    { name: 'Customers', fn: testCustomers },
    { name: 'Products', fn: testProducts },
    { name: 'Inventory', fn: testInventory },
    { name: 'Sales', fn: testSales },
    { name: 'Users', fn: testUsers },
    { name: 'Metrics', fn: testMetrics },
    { name: 'Exports', fn: testExports },
  ];

  for (const suite of testSuites) {
    await suite.fn();
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║                    TEST SUMMARY                                ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Test Duration: ${duration}s`, 'blue');
  log(`\nData Created:`, 'blue');
  log(`  - Products: ${createdData.products.length}`, 'yellow');
  log(`  - Customers: ${createdData.customers.length}`, 'yellow');
  log(`  - Suppliers: ${createdData.suppliers.length}`, 'yellow');
  log(`  - Categories: ${createdData.categories.length}`, 'yellow');
  log(`  - Sales: ${createdData.sales.length}`, 'yellow');
  log(`  - Branches: ${createdData.branches.length}`, 'yellow');
  log('\n✓ All test suites completed', 'green');
}

// Run the tests
runComprehensiveTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
