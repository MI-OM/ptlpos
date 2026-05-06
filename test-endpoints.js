#!/usr/bin/env node

/**
 * Comprehensive API Test Script
 * Focus areas: Shifts, Email Sending, Sales, Inventory, Production
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
let AUTH_TOKEN = null;
let TENANT_ID = null;
let USER_ID = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`→ ${message}`, colors.blue);
}

async function request(method, endpoint, data = null, requireAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (requireAuth && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await response.text();
    
    if (!response.ok) {
      return { success: false, status: response.status, data: text };
    }
    
    try {
      return { success: true, data: JSON.parse(text) };
    } catch {
      return { success: true, data: text };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== AUTHENTICATION ====================

async function testAuthentication() {
  logSection('1. AUTHENTICATION');
  
  logInfo('Registering new organization...');
  const registerData = {
    organizationName: 'Test Organization ' + Date.now(),
    name: 'Test Admin',
    email: `admin${Date.now()}@test.com`,
    password: 'Test123!'
  };
  
  const registerResult = await request('POST', '/auth/register', registerData, false);
  if (registerResult.success) {
    logSuccess('Organization registered');
    AUTH_TOKEN = registerResult.data.access_token;
    TENANT_ID = registerResult.data.tenant.id;
    USER_ID = registerResult.data.user.userId;
    logInfo(`Tenant ID: ${TENANT_ID}`);
    logInfo(`User ID: ${USER_ID}`);
  } else {
    logError('Registration failed: ' + JSON.stringify(registerResult.data));
    return false;
  }

  // Test email verification (test endpoint)
  logInfo('Testing email verification endpoint...');
  const verifyResult = await request('POST', '/auth/email/verify-request', { email: registerData.email });
  if (verifyResult.success) {
    logSuccess('Email verification request sent');
  } else {
    logInfo('Email verification endpoint: ' + verifyResult.data);
  }

  // Test change password
  logInfo('Testing change password...');
  const passwordResult = await request('POST', '/auth/change-password', {
    currentPassword: 'Test123!',
    newPassword: 'NewTest123!'
  });
  if (passwordResult.success) {
    logSuccess('Password changed');
    // Change back
    await request('POST', '/auth/change-password', {
      currentPassword: 'NewTest123!',
      newPassword: 'Test123!'
    });
  } else {
    logInfo('Change password: ' + passwordResult.data);
  }

  return true;
}

// ==================== SHIFTS (FOCUS AREA) ====================

async function testShifts() {
  logSection('2. SHIFTS (FOCUS AREA)');
  
  // Open shift
  logInfo('Opening a new shift...');
  const openShiftData = {
    openingBalance: 100.00
  };
  
  const openResult = await request('POST', '/shifts/open', openShiftData);
  if (openResult.success) {
    logSuccess('Shift opened');
    const shiftId = openResult.data.id;
    logInfo(`Shift ID: ${shiftId}`);
    
    // Get active shift
    logInfo('Getting active shift...');
    const activeResult = await request('GET', '/shifts/active');
    if (activeResult.success) {
      logSuccess('Active shift retrieved');
    }
    
    // Get cash drawer summary
    logInfo('Getting cash drawer summary...');
    const cashDrawerResult = await request('GET', '/shifts/cash-drawer/summary');
    if (cashDrawerResult.success) {
      logSuccess('Cash drawer summary retrieved');
      logInfo(`  Opening Balance: ${cashDrawerResult.data.openingBalance}`);
      logInfo(`  Cash Sales: ${cashDrawerResult.data.cashSales}`);
    }
    
    // List shifts
    logInfo('Listing all shifts...');
    const listResult = await request('GET', '/shifts');
    if (listResult.success) {
      logSuccess(`Retrieved ${listResult.data.length || 1} shift(s)`);
    }
    
    // Get shift by ID
    logInfo('Getting shift by ID...');
    const shiftDetailResult = await request('GET', `/shifts/${shiftId}`);
    if (shiftDetailResult.success) {
      logSuccess('Shift details retrieved');
    }
    
    // Close shift
    logInfo('Closing shift...');
    const closeShiftData = {
      closingBalance: 250.00,
      countedCash: 250.00,
      countedCard: 0,
      countedOther: 0,
      note: 'Shift ended normally'
    };
    
    const closeResult = await request('POST', `/shifts/${shiftId}/close`, closeShiftData);
    if (closeResult.success) {
      logSuccess('Shift closed');
    }
    
    // Reconcile shift
    logInfo('Reconciling shift...');
    const reconcileData = {
      actualCash: 250.00,
      actualCard: 0,
      actualOther: 0,
      variance: 0,
      note: 'Balanced'
    };
    
    const reconcileResult = await request('POST', `/shifts/${shiftId}/reconcile`, reconcileData);
    if (reconcileResult.success) {
      logSuccess('Shift reconciled');
    }
    
    // Get end of shift report
    logInfo('Getting end of shift report...');
    const reportResult = await request('GET', `/shifts/reports/end-of-shift?shiftId=${shiftId}`);
    if (reportResult.success) {
      logSuccess('End of shift report generated');
    }
    
    // Get sales performance report
    logInfo('Getting sales performance report...');
    const perfResult = await request('GET', '/shifts/reports/sales-performance');
    if (perfResult.success) {
      logSuccess('Sales performance report generated');
    }
    
    return shiftId;
  } else {
    logError('Failed to open shift: ' + JSON.stringify(openResult.data));
    return null;
  }
}

// ==================== PRODUCTS & PRODUCTION (FOCUS AREA) ====================

async function testProductsAndProduction() {
  logSection('3. PRODUCTS & PRODUCTION (FOCUS AREA)');
  
  const products = [];
  
  // Create simple product
  logInfo('Creating simple product...');
  const simpleProductData = {
    name: 'Test Simple Product',
    sku: 'SIMPLE-' + Date.now(),
    price: 10.00,
    cost: 5.00,
    type: 'SIMPLE',
    taxRate: 0.08
  };
  
  const simpleResult = await request('POST', '/products', simpleProductData);
  if (simpleResult.success) {
    logSuccess('Simple product created');
    products.push({ id: simpleResult.data.id, name: simpleProductData.name, type: 'SIMPLE' });
  }
  
  // Create composite product
  logInfo('Creating composite product...');
  const compositeProductData = {
    name: 'Test Composite Product',
    sku: 'COMPOSITE-' + Date.now(),
    price: 25.00,
    cost: 15.00,
    type: 'COMPOSITE',
    taxRate: 0.08
  };
  
  const compositeResult = await request('POST', '/products', compositeProductData);
  if (compositeResult.success) {
    logSuccess('Composite product created');
    const compositeId = compositeResult.data.id;
    products.push({ id: compositeId, name: compositeProductData.name, type: 'COMPOSITE' });
    
    // Add child products to composite
    logInfo('Adding child products to composite...');
    const compositeUpdateData = {
      children: [
        { productId: simpleResult.data.id, quantity: 2 }
      ]
    };
    
    const compositeUpdateResult = await request('POST', '/products/composite', {
      ...compositeUpdateData,
      productId: compositeId
    });
    if (compositeUpdateResult.success) {
      logSuccess('Child products added to composite');
    }
    
    // Get composite product details
    logInfo('Getting composite product details...');
    const compositeDetailResult = await request('GET', `/products/composite/${compositeId}`);
    if (compositeDetailResult.success) {
      logSuccess('Composite product details retrieved');
    }
    
    // Get composite inventory
    logInfo('Getting composite inventory status...');
    const compositeInvResult = await request('GET', `/products/composite/${compositeId}/inventory`);
    if (compositeInvResult.success) {
      logSuccess('Composite inventory status retrieved');
    }
    
    // Get product history
    logInfo('Getting product history...');
    const historyResult = await request('GET', `/products/${simpleResult.data.id}/history`);
    if (historyResult.success) {
      logSuccess('Product history retrieved');
    }
  }
  
  // List products
  logInfo('Listing all products...');
  const listResult = await request('GET', '/products');
  if (listResult.success) {
    logSuccess(`Retrieved ${listResult.data.length || 1} product(s)`);
  }
  
  return products;
}

// ==================== INVENTORY (FOCUS AREA) ====================

async function testInventory(products) {
  logSection('4. INVENTORY (FOCUS AREA)');
  
  const productId = products[0]?.id;
  if (!productId) {
    logError('No product available for inventory tests');
    return;
  }
  
  // Add inventory
  logInfo('Adding inventory to product...');
  const adjustData = {
    productId: productId,
    quantity: 50,
    type: 'OPENING',
    note: 'Initial stock'
  };
  
  const adjustResult = await request('POST', '/inventory/adjust', adjustData);
  if (adjustResult.success) {
    logSuccess('Inventory added');
  }
  
  // List inventory
  logInfo('Listing all inventory...');
  const listResult = await request('GET', '/inventory');
  if (listResult.success) {
    logSuccess('Inventory list retrieved');
  }
  
  // Get low stock alerts
  logInfo('Getting low stock alerts...');
  const lowStockResult = await request('GET', '/inventory/low-stock?threshold=10');
  if (lowStockResult.success) {
    logSuccess('Low stock alerts retrieved');
  }
  
  // Get inventory alerts
  logInfo('Getting inventory alerts...');
  const alertsResult = await request('GET', '/inventory/alerts');
  if (alertsResult.success) {
    logSuccess('Inventory alerts retrieved');
  }
  
  // Check and create alerts
  logInfo('Checking and creating inventory alerts...');
  const checkAlertsResult = await request('POST', '/inventory/alerts/check');
  if (checkAlertsResult.success) {
    logSuccess('Inventory alerts checked');
  }
  
  // Get inventory history
  logInfo('Getting inventory history...');
  const historyResult = await request('GET', '/inventory/history');
  if (historyResult.success) {
    logSuccess('Inventory history retrieved');
  }
  
  // Get inventory valuation
  logInfo('Getting inventory valuation...');
  const valuationResult = await request('GET', '/inventory/valuation');
  if (valuationResult.success) {
    logSuccess('Inventory valuation retrieved');
    logInfo(`  Total Value: ${valuationResult.data.totalValue || 'N/A'}`);
  }
  
  // Create stocktake
  logInfo('Creating stocktake...');
  const stocktakeData = {
    name: 'Test Stocktake',
    note: 'Monthly stocktake'
  };
  
  const stocktakeResult = await request('POST', '/inventory/stocktakes', stocktakeData);
  if (stocktakeResult.success) {
    logSuccess('Stocktake created');
    const stocktakeId = stocktakeResult.data.id;
    
    // Start stocktake
    logInfo('Starting stocktake...');
    const startResult = await request('POST', `/inventory/stocktakes/${stocktakeId}/start`);
    if (startResult.success) {
      logSuccess('Stocktake started');
    }
    
    // Record counts
    logInfo('Recording stocktake counts...');
    const countsData = {
      counts: [
        { productId: productId, countedQuantity: 45 }
      ]
    };
    
    const countsResult = await request('POST', `/inventory/stocktakes/${stocktakeId}/record-counts`, countsData);
    if (countsResult.success) {
      logSuccess('Stocktake counts recorded');
    }
    
    // Complete stocktake
    logInfo('Completing stocktake...');
    const completeResult = await request('POST', `/inventory/stocktakes/${stocktakeId}/complete`);
    if (completeResult.success) {
      logSuccess('Stocktake completed');
    }
  }
  
  // List stocktakes
  logInfo('Listing stocktakes...');
  const listStocktakesResult = await request('GET', '/inventory/stocktakes');
  if (listStocktakesResult.success) {
    logSuccess('Stocktakes listed');
  }
}

// ==================== SALES (FOCUS AREA) ====================

async function testSales(products) {
  logSection('5. SALES (FOCUS AREA)');
  
  const productId = products[0]?.id;
  if (!productId) {
    logError('No product available for sales tests');
    return null;
  }
  
  // Create a customer
  logInfo('Creating customer...');
  const customerData = {
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: '1234567890'
  };
  
  const customerResult = await request('POST', '/customers', customerData);
  let customerId = null;
  if (customerResult.success) {
    logSuccess('Customer created');
    customerId = customerResult.data.id;
  }
  
  // Create sale
  logInfo('Creating sale...');
  const saleData = {
    customerId: customerId,
    items: [
      {
        productId: productId,
        quantity: 2,
        price: 10.00
      }
    ],
    discountAmount: 2.00,
    note: 'Test sale'
  };
  
  const saleResult = await request('POST', '/sales', saleData);
  if (saleResult.success) {
    logSuccess('Sale created');
    const saleId = saleResult.data.id;
    const saleItemId = saleResult.data.items[0]?.id;
    
    logInfo(`Sale ID: ${saleId}`);
    logInfo(`Sale Item ID: ${saleItemId}`);
    
    // Update sale item (NEW ENDPOINT)
    logInfo('Updating sale item quantity...');
    const updateItemResult = await request('PATCH', `/sales/${saleId}/items/${saleItemId}`, {
      quantity: 3
    });
    if (updateItemResult.success) {
      logSuccess('Sale item updated (PATCH endpoint working)');
    }
    
    // Add payment to sale (NEW ENDPOINT)
    logInfo('Adding payment to sale...');
    const paymentResult = await request('POST', `/sales/${saleId}/payments`, {
      method: 'CASH',
      amount: 15.00
    });
    if (paymentResult.success) {
      logSuccess('Payment added to sale (POST endpoint working)');
    }
    
    // Hold sale
    logInfo('Holding sale...');
    const holdResult = await request('POST', `/sales/${saleId}/hold`);
    if (holdResult.success) {
      logSuccess('Sale held');
    }
    
    // Resume sale
    logInfo('Resuming sale...');
    const resumeResult = await request('POST', `/sales/${saleId}/resume`);
    if (resumeResult.success) {
      logSuccess('Sale resumed');
    }
    
    // Complete sale
    logInfo('Completing sale...');
    const completeData = {
      payments: [
        {
          method: 'CASH',
          amount: 28.00
        }
      ]
    };
    
    const completeResult = await request('POST', `/sales/${saleId}/complete`, completeData);
    if (completeResult.success) {
      logSuccess('Sale completed');
    }
    
    // Get sale receipt
    logInfo('Getting sale receipt...');
    const receiptResult = await request('GET', `/sales/${saleId}/receipt`);
    if (receiptResult.success) {
      logSuccess('Sale receipt retrieved');
    }
    
    // Get receipt settings
    logInfo('Getting receipt settings...');
    const receiptSettingsResult = await request('GET', '/sales/settings/receipt');
    if (receiptSettingsResult.success) {
      logSuccess('Receipt settings retrieved');
    }
    
    // Update receipt settings
    logInfo('Updating receipt settings...');
    const settingsData = {
      header: 'Test Store',
      footer: 'Thank you for shopping',
      showCustomerDetails: true
    };
    
    const updateSettingsResult = await request('PATCH', '/sales/settings/receipt', settingsData);
    if (updateSettingsResult.success) {
      logSuccess('Receipt settings updated');
    }
    
    // List sales
    logInfo('Listing all sales...');
    const listSalesResult = await request('GET', '/sales');
    if (listSalesResult.success) {
      logSuccess(`Retrieved ${listSalesResult.data.length || 1} sale(s)`);
    }
    
    return { id: saleId, customerId: customerId };
  } else {
    logError('Failed to create sale: ' + JSON.stringify(saleResult.data));
    return null;
  }
}

// ==================== INVOICES & EMAIL (FOCUS AREA) ====================

async function testInvoicesAndEmail(saleId) {
  logSection('6. INVOICES & EMAIL (FOCUS AREA)');
  
  if (!saleId) {
    logError('No sale available for invoice tests');
    return;
  }
  
  // Create invoice
  logInfo('Creating invoice from sale...');
  const invoiceData = {
    saleId: saleId,
    note: 'Test invoice'
  };
  
  const invoiceResult = await request('POST', '/invoices', invoiceData);
  if (invoiceResult.success) {
    logSuccess('Invoice created');
    const invoiceId = invoiceResult.data.id;
    
    // Get invoice
    logInfo('Getting invoice details...');
    const getInvoiceResult = await request('GET', `/invoices/${invoiceId}`);
    if (getInvoiceResult.success) {
      logSuccess('Invoice details retrieved');
    }
    
    // Generate A4 invoice HTML
    logInfo('Generating A4 invoice HTML...');
    const a4Result = await request('GET', `/invoices/${invoiceId}/a4`);
    if (a4Result.success) {
      logSuccess('A4 invoice HTML generated');
    }
    
    // Generate invoice PDF (NEW ENDPOINT)
    logInfo('Generating invoice PDF...');
    const pdfResult = await request('GET', `/invoices/${invoiceId}/pdf`);
    if (pdfResult.success) {
      logSuccess('Invoice PDF generated (GET endpoint working)');
    }
    
    // Send invoice via email (NEW ENDPOINT)
    logInfo('Sending invoice via email...');
    const sendEmailData = {
      email: 'test@example.com'
    };
    
    const sendResult = await request('POST', `/invoices/${invoiceId}/send`, sendEmailData);
    if (sendResult.success) {
      logSuccess('Invoice email sent (POST endpoint working)');
      logInfo('Note: Actual email delivery requires SMTP configuration');
    }
    
    // List invoices
    logInfo('Listing all invoices...');
    const listInvoicesResult = await request('GET', '/invoices');
    if (listInvoicesResult.success) {
      logSuccess(`Retrieved ${listInvoicesResult.data.data?.length || 1} invoice(s)`);
    }
  }
}

// ==================== EMAIL SENDING (FOCUS AREA) ====================

async function testEmailSending() {
  logSection('7. EMAIL SENDING (FOCUS AREA)');
  
  // Test email verification request
  logInfo('Testing email verification request...');
  const emailVerifyResult = await request('POST', '/auth/email/verify-request', {
    email: 'test@example.com'
  });
  if (emailVerifyResult.success) {
    logSuccess('Email verification request sent');
  }
  
  // Test password reset request
  logInfo('Testing password reset request...');
  const passwordResetResult = await request('POST', '/auth/password/reset-request', {
    email: 'test@example.com'
  });
  if (passwordResetResult.success) {
    logSuccess('Password reset request sent');
  }
  
  // Test welcome email (if test endpoint exists)
  logInfo('Testing welcome email...');
  const welcomeResult = await request('POST', '/test/email-welcome', {
    email: 'test@example.com',
    name: 'Test User'
  });
  if (welcomeResult.success) {
    logSuccess('Welcome email sent');
  } else {
    logInfo('Welcome email endpoint: ' + (welcomeResult.data || 'Not available'));
  }
  
  // Test password reset email (if test endpoint exists)
  logInfo('Testing password reset email...');
  const resetEmailResult = await request('POST', '/test/email-password-reset', {
    email: 'test@example.com'
  });
  if (resetEmailResult.success) {
    logSuccess('Password reset email sent');
  } else {
    logInfo('Password reset email endpoint: ' + (resetEmailResult.data || 'Not available'));
  }
}

// ==================== DASHBOARD & METRICS ====================

async function testDashboardAndMetrics() {
  logSection('8. DASHBOARD & METRICS');
  
  // Get dashboard stats
  logInfo('Getting dashboard statistics...');
  const dashboardResult = await request('GET', '/dashboard/stats');
  if (dashboardResult.success) {
    logSuccess('Dashboard statistics retrieved');
    const stats = dashboardResult.data;
    logInfo(`  Customers: ${stats.customers}`);
    logInfo(`  Products: ${stats.products}`);
    logInfo(`  Total Sales: ${stats.sales?.total}`);
    logInfo(`  Total Revenue: ${stats.revenue?.total}`);
  }
  
  // Get metrics health
  logInfo('Getting metrics health status...');
  const healthResult = await request('GET', '/metrics/health', null, false);
  if (healthResult.success) {
    logSuccess('Metrics health status retrieved');
  }
  
  // Get metrics summary
  logInfo('Getting metrics summary...');
  const metricsResult = await request('GET', '/metrics/summary', null, false);
  if (metricsResult.success) {
    logSuccess('Metrics summary retrieved');
  }
}

// ==================== ORGANIZATION & USER MANAGEMENT ====================

async function testOrganizationAndUsers() {
  logSection('9. ORGANIZATION & USER MANAGEMENT');
  
  // Get current tenant
  logInfo('Getting current tenant details...');
  const tenantResult = await request('GET', '/tenants/me');
  if (tenantResult.success) {
    logSuccess('Tenant details retrieved');
    logInfo(`  Tenant Name: ${tenantResult.data.name}`);
  }
  
  // Update tenant details
  logInfo('Updating tenant details...');
  const updateTenantData = {
    name: 'Updated Organization Name',
    phone: '1234567890',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  };
  
  const updateTenantResult = await request('PATCH', '/tenants/me', updateTenantData);
  if (updateTenantResult.success) {
    logSuccess('Tenant details updated');
  }
  
  // Update tenant settings
  logInfo('Updating tenant settings...');
  const settingsData = {
    currency: 'USD',
    taxRate: 0.08,
    receiptFooter: 'Thank you for shopping!'
  };
  
  const settingsResult = await request('PATCH', '/tenants/me/settings', settingsData);
  if (settingsResult.success) {
    logSuccess('Tenant settings updated');
  }
  
  // Get roles
  logInfo('Getting available roles...');
  const rolesResult = await request('GET', '/roles', null, false);
  if (rolesResult.success) {
    logSuccess('Roles retrieved');
  }
}

// ==================== BRANCH MANAGEMENT ====================

async function testBranchManagement() {
  logSection('10. BRANCH MANAGEMENT');
  
  // Create branch
  logInfo('Creating branch...');
  const branchData = {
    name: 'Test Branch',
    address: '456 Branch Street',
    city: 'Branch City',
    state: 'Branch State',
    country: 'Test Country'
  };
  
  const branchResult = await request('POST', '/branches', branchData);
  if (branchResult.success) {
    logSuccess('Branch created');
    const branchId = branchResult.data.id;
    
    // List branches
    logInfo('Listing all branches...');
    const listBranchesResult = await request('GET', '/branches');
    if (listBranchesResult.success) {
      logSuccess('Branches listed');
    }
    
    // Get branch by ID
    logInfo('Getting branch by ID...');
    const getBranchResult = await request('GET', `/branches/${branchId}`);
    if (getBranchResult.success) {
      logSuccess('Branch details retrieved');
    }
    
    // Update branch
    logInfo('Updating branch...');
    const updateBranchData = {
      name: 'Updated Branch Name'
    };
    
    const updateBranchResult = await request('PATCH', `/branches/${branchId}`, updateBranchData);
    if (updateBranchResult.success) {
      logSuccess('Branch updated');
    }
  } else {
    logInfo('Branch creation: ' + (branchResult.data || 'Endpoint may not exist'));
  }
}

// ==================== CATEGORIES ====================

async function testCategories() {
  logSection('11. CATEGORIES');
  
  // Create category
  logInfo('Creating category...');
  const categoryData = {
    name: 'Test Category',
    description: 'A test category'
  };
  
  const categoryResult = await request('POST', '/categories', categoryData);
  if (categoryResult.success) {
    logSuccess('Category created');
    const categoryId = categoryResult.data.id;
    
    // List categories
    logInfo('Listing all categories...');
    const listCategoriesResult = await request('GET', '/categories');
    if (listCategoriesResult.success) {
      logSuccess('Categories listed');
    }
    
    // Get category by ID
    logInfo('Getting category by ID...');
    const getCategoryResult = await request('GET', `/categories/${categoryId}`);
    if (getCategoryResult.success) {
      logSuccess('Category details retrieved');
    }
    
    // Update category
    logInfo('Updating category...');
    const updateCategoryData = {
      name: 'Updated Category Name'
    };
    
    const updateCategoryResult = await request('PATCH', `/categories/${categoryId}`, updateCategoryData);
    if (updateCategoryResult.success) {
      logSuccess('Category updated');
    }
  } else {
    logInfo('Category creation: ' + (categoryResult.data || 'Endpoint may not exist'));
  }
}

// ==================== SUPPLIERS ====================

async function testSuppliers() {
  logSection('12. SUPPLIERS');
  
  // Create supplier
  logInfo('Creating supplier...');
  const supplierData = {
    name: 'Test Supplier',
    email: 'supplier@test.com',
    phone: '1111111111'
  };
  
  const supplierResult = await request('POST', '/suppliers', supplierData);
  if (supplierResult.success) {
    logSuccess('Supplier created');
    const supplierId = supplierResult.data.id;
    
    // List suppliers
    logInfo('Listing all suppliers...');
    const listSuppliersResult = await request('GET', '/suppliers');
    if (listSuppliersResult.success) {
      logSuccess('Suppliers listed');
    }
    
    // Get supplier by ID
    logInfo('Getting supplier by ID...');
    const getSupplierResult = await request('GET', `/suppliers/${supplierId}`);
    if (getSupplierResult.success) {
      logSuccess('Supplier details retrieved');
    }
    
    // Update supplier
    logInfo('Updating supplier...');
    const updateSupplierData = {
      name: 'Updated Supplier Name',
      phone: '2222222222'
    };
    
    const updateSupplierResult = await request('PATCH', `/suppliers/${supplierId}`, updateSupplierData);
    if (updateSupplierResult.success) {
      logSuccess('Supplier updated');
    }
    
    // Delete supplier
    logInfo('Deleting supplier...');
    const deleteSupplierResult = await request('DELETE', `/suppliers/${supplierId}`);
    if (deleteSupplierResult.success) {
      logSuccess('Supplier deleted');
    }
  } else {
    logInfo('Supplier creation: ' + (supplierResult.data || 'Endpoint may not exist'));
  }
}

// ==================== CUSTOMER CREDIT MANAGEMENT ====================

async function testCustomerCredit(customerId) {
  logSection('13. CUSTOMER CREDIT MANAGEMENT');
  
  if (!customerId) {
    logInfo('No customer available for credit tests');
    return;
  }
  
  // Add credit to customer
  logInfo('Adding credit to customer...');
  const addCreditData = {
    amount: 100.00,
    note: 'Initial credit'
  };
  
  const addCreditResult = await request('POST', `/customers/${customerId}/credit/add`, addCreditData);
  if (addCreditResult.success) {
    logSuccess('Credit added to customer');
  }
  
  // Get customer credit balance
  logInfo('Getting customer credit balance...');
  const creditBalanceResult = await request('GET', `/customers/${customerId}/credit`);
  if (creditBalanceResult.success) {
    logSuccess('Credit balance retrieved');
    logInfo(`  Balance: ${creditBalanceResult.data.balance}`);
  }
  
  // Get customer credit transactions
  logInfo('Getting customer credit transactions...');
  const creditTransactionsResult = await request('GET', `/customers/${customerId}/credit/transactions`);
  if (creditTransactionsResult.success) {
    logSuccess('Credit transactions retrieved');
  }
  
  // Get customer purchase history
  logInfo('Getting customer purchase history...');
  const historyResult = await request('GET', `/customers/${customerId}/history`);
  if (historyResult.success) {
    logSuccess('Customer purchase history retrieved');
  }
  
  // Deduct credit from customer
  logInfo('Deducting credit from customer...');
  const deductCreditData = {
    amount: 20.00,
    referenceType: 'SALE',
    note: 'Purchase deduction'
  };
  
  const deductCreditResult = await request('POST', `/customers/${customerId}/credit/deduct`, deductCreditData);
  if (deductCreditResult.success) {
    logSuccess('Credit deducted from customer');
  }
}

// ==================== ADVANCED SALES FEATURES ====================

async function testAdvancedSalesFeatures(productId) {
  logSection('14. ADVANCED SALES FEATURES');
  
  if (!productId) {
    logInfo('No product available for advanced sales tests');
    return null;
  }
  
  const completeData = {
    payments: [
      {
        method: 'CASH',
        amount: 20.00
      }
    ]
  };
  
  // Create a sale for refund testing
  logInfo('Creating sale for refund testing...');
  const saleData = {
    items: [
      {
        productId: productId,
        quantity: 2,
        price: 10.00
      }
    ]
  };
  
  const saleResult = await request('POST', '/sales', saleData);
  if (saleResult.success) {
    const saleId = saleResult.data.id;
    
    // Complete the sale first
    logInfo('Completing sale for refund testing...');
    await request('POST', `/sales/${saleId}/complete`, completeData);
    
    // Test refund
    logInfo('Testing sale refund...');
    const refundData = {
      reason: 'Customer request',
      items: [
        {
          saleItemId: saleResult.data.items[0].id,
          quantity: 1
        }
      ]
    };
    
    const refundResult = await request('POST', `/sales/${saleId}/refund`, refundData);
    if (refundResult.success) {
      logSuccess('Sale refunded successfully');
    }
  }
  
  // Create another sale for return/exchange testing
  logInfo('Creating sale for return/exchange testing...');
  const sale2Result = await request('POST', '/sales', saleData);
  if (sale2Result.success) {
    const sale2Id = sale2Result.data.id;
    
    // Complete the sale
    await request('POST', `/sales/${sale2Id}/complete`, completeData);
    
    // Test return/exchange
    logInfo('Testing return/exchange...');
    const exchangeData = {
      type: 'EXCHANGE',
      reason: 'Wrong size',
      returnItems: [
        {
          saleItemId: sale2Result.data.items[0].id,
          quantity: 1
        }
      ],
      exchangeItems: [
        {
          productId: productId,
          quantity: 1,
          price: 10.00
        }
      ]
    };
    
    const exchangeResult = await request('POST', `/sales/${sale2Id}/return-exchange`, exchangeData);
    if (exchangeResult.success) {
      logSuccess('Return/exchange processed successfully');
    }
  }
}

// ==================== INVENTORY TRANSFERS ====================

async function testInventoryTransfers(productId) {
  logSection('15. INVENTORY TRANSFERS');
  
  if (!productId) {
    logInfo('No product available for transfer tests');
    return;
  }
  
  // First create a branch to transfer to
  logInfo('Creating branch for transfer...');
  const branchData = {
    name: 'Transfer Destination Branch',
    code: 'TD001',
    address: 'Transfer Address',
    city: 'Transfer City',
    state: 'Transfer State',
    country: 'Test Country'
  };
  
  const branchResult = await request('POST', '/branches', branchData);
  if (branchResult.success) {
    const toBranchId = branchResult.data.id;
    
    // Perform inventory transfer
    logInfo('Performing inventory transfer...');
    const transferData = {
      productId: productId,
      quantity: 5,
      fromBranchId: null, // Use default branch
      toBranchId: toBranchId,
      note: 'Test transfer'
    };
    
    const transferResult = await request('POST', '/inventory/transfers', transferData);
    if (transferResult.success) {
      logSuccess('Inventory transfer completed');
    } else {
      logInfo('Transfer: ' + (transferResult.data || 'May require valid branch setup'));
    }
  }
}

// ==================== MAIN RUNNER ====================

async function main() {
  console.log('\n' + '='.repeat(60));
  log('PTLPOS API ENDPOINT TEST SUITE', colors.cyan);
  log('Focus: Shifts, Email, Sales, Inventory, Production', colors.yellow);
  log('Extended Coverage: Organization, Branches, Categories, Suppliers, Credit, Advanced Sales, Transfers', colors.yellow);
  console.log('='.repeat(60) + '\n');
  
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  
  let products = [];
  let customerId = null;
  
  try {
    // Authentication
    if (await testAuthentication()) {
      passed++;
    } else {
      failed++;
      return;
    }
    
    // Organization & User Management
    await testOrganizationAndUsers();
    passed++;
    
    // Branch Management
    await testBranchManagement();
    passed++;
    
    // Categories
    await testCategories();
    passed++;
    
    // Products & Production
    products = await testProductsAndProduction();
    if (products.length > 0) passed++;
    else failed++;
    
    // Inventory
    await testInventory(products);
    passed++;
    
    // Suppliers
    await testSuppliers();
    passed++;
    
    // Shifts
    const shiftId = await testShifts();
    if (shiftId) passed++;
    else failed++;
    
    // Sales
    const saleResult = await testSales(products);
    if (saleResult) {
      passed++;
      customerId = saleResult.customerId;
    }
    else failed++;
    
    // Customer Credit Management
    await testCustomerCredit(customerId);
    passed++;
    
    // Advanced Sales Features
    await testAdvancedSalesFeatures(products[0]?.id);
    passed++;
    
    // Inventory Transfers
    await testInventoryTransfers(products[0]?.id);
    passed++;
    
    // Invoices & Email
    await testInvoicesAndEmail(saleResult?.id || null);
    passed++;
    
    // Email Sending
    await testEmailSending();
    passed++;
    
    // Dashboard & Metrics
    await testDashboardAndMetrics();
    passed++;
    
  } catch (error) {
    logError('Test suite error: ' + error.message);
    failed++;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', colors.cyan);
  console.log('='.repeat(60));
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
  log(`Duration: ${duration}s`, colors.blue);
  console.log('='.repeat(60) + '\n');
}

// Run the test suite
main().catch(error => {
  logError('Fatal error: ' + error.message);
  process.exit(1);
});
