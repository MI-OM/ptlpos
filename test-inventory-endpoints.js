#!/usr/bin/env node

/**
 * Inventory Endpoints Test
 * Tests all inventory endpoints on dev and production
 */

const axios = require('axios');

const ENVIRONMENTS = {
  dev: 'http://localhost:3000/api',
  production: 'https://ptlpos.onrender.com/api',
};

const CREDENTIALS = {
  dev: {
    email: 'admin@ptlpos.local',
    password: 'ChangeMe123!',
    tenantId: 'cmo2i33630003atjwki5qaekv',
  },
  production: {
    email: 'omfmail@aol.com',
    password: 'Hello@123',
  },
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

async function makeRequest(baseUrl, endpoint, token, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
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

async function login(baseUrl, credentials) {
  const body = {
    email: credentials.email,
    password: credentials.password,
  };
  if (credentials.tenantId) {
    body.tenantId = credentials.tenantId;
  }

  const response = await makeRequest(baseUrl, '/auth/login', null, {
    method: 'POST',
    body,
  });

  return response.ok ? response.data.access_token : null;
}

async function testInventoryEndpoints(baseUrl, token, envName) {
  log(`\n=== INVENTORY ENDPOINTS - ${envName.toUpperCase()} ===`, 'blue');

  const endpoints = [
    { path: '/inventory', name: 'List all inventory' },
    { path: '/inventory/low-stock?threshold=5', name: 'Get low stock items' },
    { path: '/inventory/valuation', name: 'Get inventory valuation' },
    { path: '/inventory/history', name: 'Get inventory history' },
  ];

  for (const endpoint of endpoints) {
    const response = await makeRequest(baseUrl, endpoint.path, token);
    const is401 = response.status === 401;
    logTest(endpoint.name, response.ok, is401 ? '401 Unauthorized' : response.data);
  }

  // Test inventory adjust (POST)
  const adjustResponse = await makeRequest(baseUrl, '/inventory/adjust', token, {
    method: 'POST',
    body: {
      productId: 'test-id',
      quantity: 10,
      reason: 'Test',
      type: 'ADDITION',
    },
  });
  logTest('Adjust inventory', adjustResponse.ok, adjustResponse.status === 401 ? '401 Unauthorized' : adjustResponse.data);
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'blue');
  log('║           INVENTORY ENDPOINTS AUTHENTICATION TEST                ║', 'blue');
  log('╚════════════════════════════════════════════════════════════════╝', 'blue');

  // Test Dev
  log('\n--- Testing DEV Environment ---', 'blue');
  const devToken = await login(ENVIRONMENTS.dev, CREDENTIALS.dev);
  if (devToken) {
    logTest('Dev Login', true);
    await testInventoryEndpoints(ENVIRONMENTS.dev, devToken, 'dev');
  } else {
    logTest('Dev Login', false, 'Could not authenticate');
  }

  // Test Production
  log('\n--- Testing Production Environment ---', 'blue');
  const prodToken = await login(ENVIRONMENTS.production, CREDENTIALS.production);
  if (prodToken) {
    logTest('Production Login', true);
    await testInventoryEndpoints(ENVIRONMENTS.production, prodToken, 'production');
  } else {
    logTest('Production Login', false, 'Could not authenticate');
  }

  log('\n✓ Inventory endpoint tests completed', 'green');
}

runTests().catch(error => {
  log(`\n❌ Test error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
