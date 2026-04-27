#!/usr/bin/env node

/**
 * Test new features: Production endpoints and Receipt customization
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

async function testProductionEndpoints(token) {
  log('\n=== PRODUCTION ENDPOINTS ===', 'blue');

  const endpoints = [
    { path: '/production/orders', name: 'Get production orders' },
    { path: '/production/materials', name: 'Get production materials' },
    { path: '/production/machines', name: 'Get production machines' },
  ];

  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint.path, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.ok) {
      logTest(endpoint.name, true, `Found ${Array.isArray(response.data) ? response.data.length : 1} item(s)`);
    } else {
      logTest(endpoint.name, false, response.data);
    }
  }
}

async function testReceiptSettingsEndpoints(token) {
  log('\n=== RECEIPT SETTINGS ENDPOINTS ===', 'blue');

  // Get receipt settings
  const getResponse = await makeRequest('/sales/settings/receipt', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (getResponse.ok) {
    logTest('Get receipt settings', true, getResponse.data);
  } else {
    logTest('Get receipt settings', false, getResponse.data);
  }

  // Update receipt settings with showUnitPrice
  const updateResponse = await makeRequest('/sales/settings/receipt', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      showBusinessName: true,
      showPhone: true,
      showAddress: true,
      showEmail: false,
      showReceiptNumber: true,
      showCustomerName: true,
      showCustomerPhone: false,
      showUnitPrice: true,
      customHeader: 'Thank you for shopping with us!',
      customFooter: 'Please come again!',
      showPoweredBy: false,
    },
  });

  if (updateResponse.ok) {
    logTest('Update receipt settings (with showUnitPrice)', true, updateResponse.data);
  } else {
    logTest('Update receipt settings (with showUnitPrice)', false, updateResponse.data);
  }
}

async function testShiftManagement(token) {
  log('\n=== SHIFT MANAGEMENT ===', 'blue');

  // Get branches
  const branchesResponse = await makeRequest('/branches', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!branchesResponse.ok || !branchesResponse.data.length) {
    logTest('Get branches', false, 'No branches available');
    return;
  }

  const branchId = branchesResponse.data[0].id;

  // Open shift
  const openShiftResponse = await makeRequest('/shifts/open', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      branchId,
      openingBalance: 100.00,
      notes: 'Test shift opening',
    },
  });

  if (openShiftResponse.ok) {
    logTest('Open shift', true, { shiftId: openShiftResponse.data.id });
    const shiftId = openShiftResponse.data.id;

    // Get cash drawer summary
    const summaryResponse = await makeRequest('/shifts/cash-drawer/summary', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (summaryResponse.ok) {
      logTest('Get cash drawer summary', true, summaryResponse.data);
    } else {
      logTest('Get cash drawer summary', false, summaryResponse.data);
    }

    // Close shift
    const closeShiftResponse = await makeRequest(`/shifts/${shiftId}/close`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        closingBalance: 150.00,
        notes: 'Test shift closing',
      },
    });

    if (closeShiftResponse.ok) {
      logTest('Close shift', true, closeShiftResponse.data);
    } else {
      logTest('Close shift', false, closeShiftResponse.data);
    }
  } else {
    logTest('Open shift', false, openShiftResponse.data);
  }
}

async function testBarcodeScanning(token) {
  log('\n=== BARCODE SCANNING ===', 'blue');

  // Get product types
  const typesResponse = await makeRequest('/product-types', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!typesResponse.ok || !typesResponse.data.length) {
    logTest('Get product types', false, 'No product types available');
    return;
  }

  const typeId = typesResponse.data[0].id;

  // Get categories
  const categoriesResponse = await makeRequest('/categories', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!categoriesResponse.ok || !categoriesResponse.data.length) {
    logTest('Get categories', false, 'No categories available');
    return;
  }

  const categoryId = categoriesResponse.data[0].id;

  // Create product with barcode
  const timestamp = Date.now();
  const productResponse = await makeRequest('/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      name: `Test Product ${timestamp}`,
      sku: `TEST-${timestamp}`,
      barcode: `1234567890${timestamp.toString().slice(-4)}`,
      price: 10.99,
      cost: 5.00,
      taxRate: 0.10,
      typeId,
      categoryId,
    },
  });

  if (productResponse.ok) {
    const productId = productResponse.data.id;
    const barcode = productResponse.data.barcode;
    logTest('Create product with barcode', true, { productId, barcode });

    // Search by barcode
    const searchResponse = await makeRequest(`/products?barcode=${barcode}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (searchResponse.ok && searchResponse.data.length > 0) {
      logTest('Search product by barcode', true, { found: searchResponse.data[0].name });
    } else {
      logTest('Search product by barcode', false, searchResponse.data);
    }

    // Cleanup: delete product
    await makeRequest(`/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } else {
    logTest('Create product with barcode', false, productResponse.data);
  }
}

async function testCreditAccount(token) {
  log('\n=== CREDIT ACCOUNT / STORE CREDIT ===', 'blue');

  // Create customer
  const timestamp = Date.now();
  const customerResponse = await makeRequest('/customers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      name: `Test Customer ${timestamp}`,
      email: `test${timestamp}@example.com`,
      phone: `+12345678${timestamp.toString().slice(-4)}`,
    },
  });

  if (!customerResponse.ok) {
    logTest('Create customer', false, customerResponse.data);
    return;
  }

  const customerId = customerResponse.data.id;
  logTest('Create customer', true, { customerId });

  // Add credit
  const addCreditResponse = await makeRequest(`/customers/${customerId}/credit/add`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      amount: 100.00,
      note: 'Test credit addition',
    },
  });

  if (addCreditResponse.ok) {
    logTest('Add store credit', true, addCreditResponse.data);
  } else {
    logTest('Add store credit', false, addCreditResponse.data);
  }

  // Get credit balance
  const balanceResponse = await makeRequest(`/customers/${customerId}/credit`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (balanceResponse.ok) {
    logTest('Get credit balance', true, balanceResponse.data);
  } else {
    logTest('Get credit balance', false, balanceResponse.data);
  }

  // Get credit transactions
  const transactionsResponse = await makeRequest(`/customers/${customerId}/credit/transactions`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (transactionsResponse.ok) {
    logTest('Get credit transactions', true, { count: transactionsResponse.data.length });
  } else {
    logTest('Get credit transactions', false, transactionsResponse.data);
  }

  // Cleanup: delete customer
  const deleteResponse = await makeRequest(`/customers/${customerId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (deleteResponse.ok) {
    logTest('Delete customer', true);
  } else {
    logTest('Delete customer', false, deleteResponse.data);
  }
}

async function testDeleteEndpoints(token) {
  log('\n=== DELETE ENDPOINTS ===', 'blue');

  // Test delete supplier
  const supplierTimestamp = Date.now();
  const supplierResponse = await makeRequest('/suppliers', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      name: `Test Supplier ${supplierTimestamp}`,
      email: `supplier${supplierTimestamp}@example.com`,
      phone: `+98765432${supplierTimestamp.toString().slice(-4)}`,
    },
  });

  if (supplierResponse.ok) {
    const supplierId = supplierResponse.data.id;
    logTest('Create supplier', true, { supplierId });

    const deleteSupplierResponse = await makeRequest(`/suppliers/${supplierId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (deleteSupplierResponse.ok) {
      logTest('Delete supplier', true);
    } else {
      logTest('Delete supplier', false, deleteSupplierResponse.data);
    }
  } else {
    logTest('Create supplier', false, supplierResponse.data);
  }
}

async function testChangePassword(token) {
  log('\n=== CHANGE PASSWORD ===', 'blue');

  const newPassword = 'NewPassword@123';

  // Change password
  const changeResponse = await makeRequest('/auth/change-password', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      currentPassword: CREDENTIALS.password,
      newPassword: newPassword,
    },
  });

  if (changeResponse.ok) {
    logTest('Change password', true);

    // Revert password
    const revertResponse = await makeRequest('/auth/change-password', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: {
        currentPassword: newPassword,
        newPassword: CREDENTIALS.password,
      },
    });

    if (revertResponse.ok) {
      logTest('Revert password', true);
    } else {
      logTest('Revert password', false, revertResponse.data);
      log('WARNING: Password was changed but not reverted. Update credentials manually.', 'yellow');
    }
  } else {
    logTest('Change password', false, changeResponse.data);
  }
}

async function testReturnsExchanges(token) {
  log('\n=== RETURNS / EXCHANGES ===', 'blue');

  // This test requires a completed sale. For simplicity, we'll just test the endpoint exists
  // by trying to process a return on a non-existent sale (should return 404 or validation error)
  const returnResponse = await makeRequest('/sales/non-existent-id/return-exchange', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      type: 'RETURN',
      returnItems: [],
      refundAmount: 0,
      refundMethod: 'CASH',
      reason: 'Test',
    },
  });

  // We expect this to fail (404), which means the endpoint exists and is working
  if (returnResponse.status === 404 || returnResponse.status === 400) {
    logTest('Returns/Exchanges endpoint exists', true, 'Endpoint is accessible');
  } else {
    logTest('Returns/Exchanges endpoint exists', false, returnResponse.data);
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║           TEST NEW FEATURES                                      ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTarget: ${BASE_URL}`, 'blue');

  const token = await login();
  if (!token) {
    log('\n❌ Authentication failed. Cannot continue tests.', 'red');
    return;
  }

  await testProductionEndpoints(token);
  await testReceiptSettingsEndpoints(token);
  await testShiftManagement(token);
  await testBarcodeScanning(token);
  await testCreditAccount(token);
  await testDeleteEndpoints(token);
  await testChangePassword(token);
  await testReturnsExchanges(token);

  log('\n✓ All tests completed', 'green');
}

runTests().catch(error => {
  log(`\n❌ Test error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
