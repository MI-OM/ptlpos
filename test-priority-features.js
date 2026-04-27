#!/usr/bin/env node

/**
 * Test script for priority features:
 * - Shift Management
 * - Barcode Scanning
 * - Returns/Exchanges
 * - Credit Account/Store Credit
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const CREDENTIALS = {
  email: 'admin@ptlpos.local',
  password: 'ChangeMe123!',
  tenantId: 'cmogy08rn000310be2n94emxp',
};

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

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers,
      data: options.body,
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

  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: {
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
      tenantId: CREDENTIALS.tenantId,
    },
  });

  if (response.ok) {
    logTest('Login', true);
    return response.data.access_token;
  } else {
    logTest('Login', false, response.data);
    return null;
  }
}

async function testShiftManagement(token) {
  log('\n=== SHIFT MANAGEMENT ===', 'blue');

  // Get active shift
  let activeShift = await makeRequest('/shifts/active', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (activeShift.ok && activeShift.data) {
    logTest('Get active shift (existing)', true, 'Already has active shift');
    // Close it first
    await makeRequest(`/shifts/${activeShift.data.id}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        closingBalance: 150.00,
        notes: 'Closing before test',
      },
    });
  }

  // Open shift
  const openShift = await makeRequest('/shifts/open', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      openingBalance: 100.00,
      notes: 'Test shift',
    },
  });

  if (openShift.ok) {
    logTest('Open shift', true, openShift.data);
    const shiftId = openShift.data.id;

    // Get active shift
    const getActive = await makeRequest('/shifts/active', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (getActive.ok) {
      logTest('Get active shift', true, getActive.data);
    } else {
      logTest('Get active shift', false, getActive.data);
    }

    // List shifts
    const listShifts = await makeRequest('/shifts', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (listShifts.ok) {
      logTest('List shifts', true, `Found ${listShifts.data.data.length} shifts`);
    } else {
      logTest('List shifts', false, listShifts.data);
    }

    // Close shift
    const closeShift = await makeRequest(`/shifts/${shiftId}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        closingBalance: 150.00,
        notes: 'Test shift close',
      },
    });

    if (closeShift.ok) {
      logTest('Close shift', true, closeShift.data);
    } else {
      logTest('Close shift', false, closeShift.data);
    }
  } else {
    logTest('Open shift', false, openShift.data);
  }
}

async function testBarcodeScanning(token) {
  log('\n=== BARCODE SCANNING ===', 'blue');

  const timestamp = Date.now();
  const barcode = `1234567890${timestamp.toString().slice(-4)}`;

  // Create a product with barcode
  const createProduct = await makeRequest('/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      name: `Test Barcode Product ${timestamp}`,
      sku: `BARCODE-TEST-${timestamp}`,
      barcode: barcode,
      type: 'SIMPLE',
      price: 29.99,
      cost: 15.00,
      taxRate: 0,
    },
  });

  if (createProduct.ok) {
    logTest('Create product with barcode', true, createProduct.data);
    const productId = createProduct.data.id;

    // Wait a moment for cache to clear
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Search by barcode
    const searchByBarcode = await makeRequest(`/products?barcode=${barcode}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (searchByBarcode.ok) {
      logTest('Search product by barcode', true, `Found ${searchByBarcode.data.data.length} product(s)`);
    } else {
      logTest('Search product by barcode', false, searchByBarcode.data);
    }

    // Cleanup
    await makeRequest(`/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } else {
    logTest('Create product with barcode', false, createProduct.data);
  }
}

async function testCreditAccount(token) {
  log('\n=== CREDIT ACCOUNT / STORE CREDIT ===', 'blue');

  const timestamp = Date.now();

  // Create a customer
  const createCustomer = await makeRequest('/customers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      name: `Test Credit Customer ${timestamp}`,
      email: `credit${timestamp}@test.com`,
      phone: `+123456${timestamp.toString().slice(-4)}`,
    },
  });

  if (createCustomer.ok) {
    logTest('Create customer', true, createCustomer.data);
    const customerId = createCustomer.data.id;

    // Add credit
    const addCredit = await makeRequest(`/customers/${customerId}/credit/add`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        amount: 50.00,
        note: 'Initial credit',
      },
    });

    if (addCredit.ok) {
      logTest('Add credit to customer', true, addCredit.data);
    } else {
      logTest('Add credit to customer', false, addCredit.data);
    }

    // Get credit balance
    const getBalance = await makeRequest(`/customers/${customerId}/credit`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (getBalance.ok) {
      logTest('Get credit balance', true, getBalance.data);
    } else {
      logTest('Get credit balance', false, getBalance.data);
    }

    // Get credit transactions
    const getTransactions = await makeRequest(`/customers/${customerId}/credit/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (getTransactions.ok) {
      logTest('Get credit transactions', true, `Found ${getTransactions.data.transactions.length} transactions`);
    } else {
      logTest('Get credit transactions', false, getTransactions.data);
    }

    // Cleanup
    await makeRequest(`/customers/${customerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } else {
    logTest('Create customer', false, createCustomer.data);
  }
}

async function testReturnsExchanges(token) {
  log('\n=== RETURNS / EXCHANGES ===', 'blue');

  // Create a sale first (would need a product with inventory)
  logTest('Returns/Exchanges', false, 'Requires existing sale with items - skipping detailed test');
  log('  Note: Returns/Exchanges endpoint exists at POST /sales/:id/return-exchange', 'yellow');
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║           TEST PRIORITY FEATURES                                 ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTarget: ${BASE_URL}`, 'blue');

  const token = await login();
  if (!token) {
    log('\n❌ Authentication failed. Cannot continue tests.', 'red');
    return;
  }

  await testShiftManagement(token);
  await testBarcodeScanning(token);
  await testCreditAccount(token);
  await testReturnsExchanges(token);

  log('\n✓ All tests completed', 'green');
}

runTests().catch(error => {
  log(`\n❌ Test error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
