#!/usr/bin/env node

/**
 * Production Endpoint Test Suite
 * Tests all endpoints on production server to check rate limiter and functionality
 */

const axios = require('axios');

const BASE_URL = 'https://ptlpos.onrender.com/api';
const TEST_CONFIG = {
  products: 5,
  customers: 3,
  suppliers: 2,
  categories: 2,
  branches: 3,
  sales: 3,
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
  const response = await makeRequest('/auth/login/email', {
    method: 'POST',
    body: JSON.stringify({
      email: 'omfmail@aol.com',
      password: 'Hello@123',
    }),
  });

  if (response.ok) {
    authToken = response.data.access_token;
    tenantId = response.data.user.tenantId;
    logTest('Admin Login', true);
    log(`  Tenant ID: ${tenantId}`, 'yellow');
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
    await delay(500); // Add delay to avoid rate limiting
    const timestamp = Date.now();
    const response = await makeRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: `Prod Test Category ${timestamp}-${i}`,
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

  // Get specific category
  if (createdData.categories.length > 0) {
    const getResponse = await makeRequest(`/categories/${createdData.categories[0].id}`);
    logTest('Get category by ID', getResponse.ok);
  }

  return true;
}

async function testSuppliers() {
  log('\n=== SUPPLIERS ===', 'blue');

  // Create suppliers
  for (let i = 0; i < TEST_CONFIG.suppliers; i++) {
    await delay(500); // Add delay to avoid rate limiting
    const timestamp = Date.now();
    const response = await makeRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: `Prod Test Supplier ${timestamp}-${i}`,
        email: `prodsupplier${timestamp}${i}@test.com`,
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

  return true;
}

async function testCustomers() {
  log('\n=== CUSTOMERS ===', 'blue');

  // Create customers
  for (let i = 0; i < TEST_CONFIG.customers; i++) {
    await delay(500); // Add delay to avoid rate limiting
    const timestamp = Date.now();
    const response = await makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: `Prod Test Customer ${timestamp}-${i}`,
        email: `prodcustomer${timestamp}${i}@test.com`,
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

  return true;
}

async function testProducts() {
  log('\n=== PRODUCTS ===', 'blue');

  const productData = [
    { name: 'Whole Wheat Bread', sku: 'BREAD-001', price: 2.50 },
    { name: 'Milk 1L', sku: 'DAIRY-001', price: 1.50 },
    { name: 'Orange Juice', sku: 'BEV-001', price: 3.00 },
    { name: 'Potato Chips', sku: 'SNACK-001', price: 2.00 },
    { name: 'Rice 1kg', sku: 'GROC-001', price: 3.00 },
  ];

  // Create products
  for (let i = 0; i < TEST_CONFIG.products; i++) {
    await delay(500); // Add delay to avoid rate limiting
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

  return true;
}

async function testSales() {
  log('\n=== SALES ===', 'blue');

  // Create sales
  for (let i = 0; i < TEST_CONFIG.sales; i++) {
    await delay(500); // Add delay to avoid rate limiting
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

  return true;
}

async function testRateLimiting() {
  log('\n=== RATE LIMITING TEST ===', 'blue');
  
  log('Sending 10 rapid requests to test rate limiter...', 'yellow');
  
  let rateLimitHits = 0;
  let successCount = 0;
  
  for (let i = 0; i < 10; i++) {
    const response = await makeRequest('/products');
    if (response.status === 429) {
      rateLimitHits++;
      log(`  Request ${i + 1}: Rate limited (429)`, 'red');
    } else if (response.ok) {
      successCount++;
      log(`  Request ${i + 1}: Success`, 'green');
    } else {
      log(`  Request ${i + 1}: Failed (${response.status})`, 'yellow');
    }
  }
  
  log(`\nRate Limiting Summary:`, 'blue');
  log(`  Successful requests: ${successCount}`, 'green');
  log(`  Rate limited requests: ${rateLimitHits}`, rateLimitHits > 0 ? 'yellow' : 'green');
  
  if (rateLimitHits > 0) {
    log(`  ⚠️ Rate limiter is active on production`, 'yellow');
  } else {
    log(`  ✓ No rate limiting detected in rapid requests`, 'green');
  }
  
  return true;
}

async function runProductionTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║     PRODUCTION ENDPOINT TEST SUITE                             ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTarget: ${BASE_URL}`, 'blue');

  const startTime = Date.now();

  // Test authentication
  const authSuccess = await login();
  if (!authSuccess) {
    log('\n❌ Authentication failed. Cannot continue tests.', 'red');
    return;
  }

  // Run test suites
  await testBranches();
  await testCategories();
  await testSuppliers();
  await testCustomers();
  await testProducts();
  await testSales();
  await testRateLimiting();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║                    TEST SUMMARY                                ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Test Duration: ${duration}s`, 'blue');
  log(`\nData Created on Production:`, 'blue');
  log(`  - Products: ${createdData.products.length}`, 'yellow');
  log(`  - Customers: ${createdData.customers.length}`, 'yellow');
  log(`  - Suppliers: ${createdData.suppliers.length}`, 'yellow');
  log(`  - Categories: ${createdData.categories.length}`, 'yellow');
  log(`  - Sales: ${createdData.sales.length}`, 'yellow');
  log('\n✓ Production test suite completed', 'green');
}

// Run the tests
runProductionTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
