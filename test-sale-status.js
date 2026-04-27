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

async function testSaleStatus() {
  console.log('=== Testing Sale Status Update ===\n');

  // Login
  const loginResponse = await makeRequest('/auth/login', {
    method: 'POST',
    body: CREDENTIALS,
  });

  if (!loginResponse.ok) {
    console.log('Login failed:', loginResponse.data);
    return;
  }

  const token = loginResponse.data.access_token;
  console.log('✓ Login successful\n');

  // Get product types
  const typesResponse = await makeRequest('/product-types', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!typesResponse.ok || !typesResponse.data.length) {
    console.log('No product types available');
    return;
  }

  const typeId = typesResponse.data[0].id;

  // Get categories
  const categoriesResponse = await makeRequest('/categories', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!categoriesResponse.ok || !categoriesResponse.data.length) {
    console.log('No categories available');
    return;
  }

  const categoryId = categoriesResponse.data[0].id;

  // Create product
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

  if (!productResponse.ok) {
    console.log('Product creation failed:', productResponse.data);
    return;
  }

  const productId = productResponse.data.id;
  console.log('✓ Product created\n');

  // Create sale
  const saleResponse = await makeRequest('/sales', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {},
  });

  if (!saleResponse.ok) {
    console.log('Sale creation failed:', saleResponse.data);
    return;
  }

  const saleId = saleResponse.data.id;
  console.log(`✓ Sale created (ID: ${saleId})`);
  console.log(`  Status before completion: ${saleResponse.data.status}\n`);

  // Add item
  const itemResponse = await makeRequest(`/sales/${saleId}/items`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      productId,
      quantity: 1,
    },
  });

  if (!itemResponse.ok) {
    console.log('Add item failed:', itemResponse.data);
    return;
  }

  console.log('✓ Item added\n');

  // Complete sale
  const completeResponse = await makeRequest(`/sales/${saleId}/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: {
      payments: [
        {
          method: 'CASH',
          amount: 10.99,
          direction: 'SALE',
        },
      ],
    },
  });

  if (!completeResponse.ok) {
    console.log('Sale completion failed:', completeResponse.data);
    return;
  }

  console.log('✓ Sale completed');
  console.log(`  Status after completion: ${completeResponse.data.status}\n`);

  // Get sale details to verify
  const getSaleResponse = await makeRequest(`/sales/${saleId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (getSaleResponse.ok) {
    console.log('✓ Sale details retrieved');
    console.log(`  Current status in DB: ${getSaleResponse.data.status}`);
    console.log(`  Completed at: ${getSaleResponse.data.completedAt}\n`);

    if (getSaleResponse.data.status === 'COMPLETED') {
      console.log('✓✓ SUCCESS: Sale status correctly updated to COMPLETED');
    } else {
      console.log(`✗✗ FAILURE: Sale status is ${getSaleResponse.data.status} instead of COMPLETED`);
    }
  }

  // Cleanup
  await makeRequest(`/products/${productId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

testSaleStatus().catch(console.error);
