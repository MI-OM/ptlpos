#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const CREDENTIALS = {
  email: 'admin@ptlpos.local',
  password: 'ChangeMe123!',
  tenantId: 'cmogy08rn000310be2n94emxp',
};

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

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m',
  };
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

async function testDashboardStats(token) {
  log('\n=== Testing Dashboard Stats ===', 'info');

  const response = await makeRequest('/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    log(`✗ Dashboard stats failed: ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  log('✓ Dashboard stats retrieved', 'success');
  log(`  Customers: ${response.data.customers}`, 'info');
  log(`  Products: ${response.data.products}`, 'info');
  log(`  Total Sales: ${response.data.sales.total}`, 'info');
  log(`  Today Sales: ${response.data.sales.today}`, 'info');
  log(`  Total Revenue: ${response.data.revenue.total}`, 'info');
  log(`  Today Revenue: ${response.data.revenue.today}`, 'info');
  log(`  Active Shifts: ${response.data.activeShifts}`, 'info');
  log(`  Low Stock Alerts: ${response.data.lowStockAlerts}`, 'info');

  return true;
}

async function testTaxSettings(token) {
  log('\n=== Testing Tax Settings ===', 'info');

  // Update tax settings
  const updateResponse = await makeRequest('/tenants/me/settings', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      taxRate: 0.15,
      taxEnabled: true,
      taxId: 'VAT123456',
    },
  });

  if (!updateResponse.ok) {
    log(`✗ Tax settings update failed: ${JSON.stringify(updateResponse.data)}`, 'error');
    return false;
  }

  log('✓ Tax settings updated', 'success');
  log(`  Tax Rate: ${updateResponse.data.settings.taxRate}`, 'info');
  log(`  Tax Enabled: ${updateResponse.data.settings.taxEnabled}`, 'info');
  log(`  Tax ID: ${updateResponse.data.settings.taxId}`, 'info');

  // Verify by getting tenant details
  const tenantResponse = await makeRequest('/tenants/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (tenantResponse.ok) {
    log('✓ Tenant settings verified', 'success');
    log(`  Settings: ${JSON.stringify(tenantResponse.data.settings)}`, 'info');
  }

  return true;
}

async function testShiftWithDrawerType(token) {
  log('\n=== Testing Shift with Drawer Type ===', 'info');

  const timestamp = Date.now();

  // Open shift with drawer type
  const openResponse = await makeRequest('/shifts/open', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      openingBalance: 100.00,
      drawerType: 'MIXED',
      notes: `Test shift ${timestamp}`,
    },
  });

  if (!openResponse.ok) {
    log(`✗ Shift open failed: ${JSON.stringify(openResponse.data)}`, 'error');
    return false;
  }

  const shiftId = openResponse.data.id;
  log(`✓ Shift opened (ID: ${shiftId})`, 'success');
  log(`  Drawer Type: ${openResponse.data.drawerType}`, 'info');
  log(`  Opening Balance: ${openResponse.data.openingBalance}`, 'info');

  // Close shift
  const closeResponse = await makeRequest(`/shifts/${shiftId}/close`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      closingBalance: 250.00,
      notes: 'Shift closed',
    },
  });

  if (!closeResponse.ok) {
    log(`✗ Shift close failed: ${JSON.stringify(closeResponse.data)}`, 'error');
    return false;
  }

  log('✓ Shift closed', 'success');
  log(`  Closing Balance: ${closeResponse.data.closingBalance}`, 'info');
  log(`  Cash Sales: ${closeResponse.data.cashSales}`, 'info');
  log(`  Card Sales: ${closeResponse.data.cardSales}`, 'info');
  log(`  Discrepancy: ${closeResponse.data.discrepancy}`, 'info');

  return shiftId;
}

async function testShiftReconciliation(token, shiftId) {
  log('\n=== Testing Shift Reconciliation ===', 'info');

  // Reconcile shift
  const reconcileResponse = await makeRequest(`/shifts/${shiftId}/reconcile`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      actualCash: 250.00,
      notes: 'Reconciliation notes',
    },
  });

  if (!reconcileResponse.ok) {
    log(`✗ Shift reconciliation failed: ${JSON.stringify(reconcileResponse.data)}`, 'error');
    return false;
  }

  log('✓ Shift reconciled', 'success');
  log(`  Expected Cash: ${reconcileResponse.data.expectedCash}`, 'info');
  log(`  Actual Cash: ${reconcileResponse.data.actualCash}`, 'info');
  log(`  Discrepancy: ${reconcileResponse.data.totalDiscrepancy}`, 'info');

  return true;
}

async function testEndOfShiftReport(token, shiftId) {
  log('\n=== Testing End of Shift Report ===', 'info');

  const response = await makeRequest(`/shifts/reports/end-of-shift?shiftId=${shiftId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    log(`✗ End of shift report failed: ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  log('✓ End of shift report retrieved', 'success');
  log(`  Total Sales: ${response.data.sales.totalSales}`, 'info');
  log(`  Total Revenue: ${response.data.sales.totalRevenue}`, 'info');
  log(`  Expected Cash: ${response.data.drawer.expectedCash}`, 'info');
  log(`  Actual Cash: ${response.data.drawer.actualCash}`, 'info');

  return true;
}

async function testEndOfDayReport(token) {
  log('\n=== Testing End of Day Report ===', 'info');

  const today = new Date().toISOString().split('T')[0];

  const response = await makeRequest('/shifts/reports/end-of-day', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
    params: {
      date: today,
    },
  });

  if (!response.ok) {
    log(`✗ End of day report failed: ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  log('✓ End of day report retrieved', 'success');
  log(`  Date: ${response.data.date}`, 'info');
  log(`  Number of Shifts: ${response.data.shifts.length}`, 'info');
  log(`  Total Sales: ${response.data.totals.totalSales}`, 'info');
  log(`  Total Revenue: ${response.data.totals.totalRevenue}`, 'info');

  return true;
}

async function testSalesPerformanceReport(token) {
  log('\n=== Testing Sales Performance Report ===', 'info');

  const today = new Date();
  const fromDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  const response = await makeRequest('/shifts/reports/sales-performance', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
    params: {
      from: fromDate,
      to: toDate,
    },
  });

  if (!response.ok) {
    log(`✗ Sales performance report failed: ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  log('✓ Sales performance report retrieved', 'success');
  log(`  Period: ${response.data.period.from} to ${response.data.period.to}`, 'info');
  log(`  Number of Users: ${response.data.users.length}`, 'info');
  log(`  Total Sales: ${response.data.totals.totalSales}`, 'info');
  log(`  Total Revenue: ${response.data.totals.totalRevenue}`, 'info');

  return true;
}

async function runTests() {
  log('=== Starting Comprehensive Feature Tests ===', 'info');

  // Login
  log('\n=== Authentication ===', 'info');
  const loginResponse = await makeRequest('/auth/login', {
    method: 'POST',
    body: CREDENTIALS,
  });

  if (!loginResponse.ok) {
    log(`✗ Login failed: ${JSON.stringify(loginResponse.data)}`, 'error');
    return;
  }

  const token = loginResponse.data.access_token;
  log('✓ Login successful', 'success');

  // Run all tests
  const results = {
    dashboardStats: await testDashboardStats(token),
    taxSettings: await testTaxSettings(token),
    shiftWithDrawerType: await testShiftWithDrawerType(token),
  };

  // Get shift ID for subsequent tests
  const shiftId = results.shiftWithDrawerType;

  if (shiftId) {
    results.shiftReconciliation = await testShiftReconciliation(token, shiftId);
    results.endOfShiftReport = await testEndOfShiftReport(token, shiftId);
  }

  results.endOfDayReport = await testEndOfDayReport(token);
  results.salesPerformanceReport = await testSalesPerformanceReport(token);

  // Summary
  log('\n=== Test Summary ===', 'info');
  const allPassed = Object.values(results).every((result) => result === true || typeof result === 'string');
  
  for (const [test, result] of Object.entries(results)) {
    const status = result === true || typeof result === 'string' ? '✓ PASS' : '✗ FAIL';
    const color = result === true || typeof result === 'string' ? 'success' : 'error';
    log(`${status} ${test}`, color);
  }

  if (allPassed) {
    log('\n✓✓ All tests passed!', 'success');
  } else {
    log('\n✗✗ Some tests failed', 'error');
  }
}

runTests().catch(console.error);
