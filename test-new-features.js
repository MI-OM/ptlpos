#!/usr/bin/env node

/**
 * Test new features: Production endpoints and Receipt customization
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const CREDENTIALS = {
  email: 'admin@ptlpos.local',
  password: 'ChangeMe123!',
  tenantId: 'cmo2i33630003atjwki5qaekv',
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

  // Update receipt settings
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
      customHeader: 'Thank you for shopping with us!',
      customFooter: 'Please come again!',
      showPoweredBy: false,
    },
  });
  
  if (updateResponse.ok) {
    logTest('Update receipt settings', true, updateResponse.data);
  } else {
    logTest('Update receipt settings', false, updateResponse.data);
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

  log('\n✓ All tests completed', 'green');
}

runTests().catch(error => {
  log(`\n❌ Test error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
