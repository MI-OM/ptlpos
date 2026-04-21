export interface A4InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
  };
  tenant: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    logoUrl?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  sale: {
    id: string;
    saleNumber: string;
    saleDate: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    discountAmount: number;
    items: Array<{
      id: string;
      productName: string;
      productSku?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      taxRate: number;
      taxAmount: number;
    }>;
  };
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
    reference?: string;
  }>;
}

export function generateA4InvoiceHTML(data: A4InvoiceData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${data.invoice.invoiceNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-logo {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 10px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .company-details {
            font-size: 11px;
            color: #64748b;
            line-height: 1.3;
        }
        
        .invoice-info {
            text-align: right;
            flex: 0 0 200px;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .invoice-meta {
            font-size: 11px;
            color: #64748b;
        }
        
        .invoice-meta strong {
            color: #1e293b;
            display: inline-block;
            width: 80px;
        }
        
        .addresses {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 40px;
        }
        
        .address-section {
            flex: 1;
        }
        
        .address-title {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }
        
        .address-content {
            font-size: 11px;
            line-height: 1.4;
            color: #64748b;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: #1e293b;
            font-size: 11px;
            text-transform: uppercase;
        }
        
        .items-table td {
            border: 1px solid #e2e8f0;
            padding: 10px 8px;
            font-size: 11px;
        }
        
        .items-table .text-right {
            text-align: right;
        }
        
        .items-table .text-center {
            text-align: center;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 8px;
            font-size: 12px;
            border: none;
        }
        
        .totals-table .label {
            text-align: left;
            color: #64748b;
        }
        
        .totals-table .value {
            text-align: right;
            font-weight: bold;
            color: #1e293b;
        }
        
        .totals-table .total-row {
            border-top: 2px solid #2563eb;
            font-size: 14px;
            color: #2563eb;
        }
        
        .payments-section {
            margin-bottom: 30px;
        }
        
        .payments-title {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }
        
        .payments-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .payments-table th {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            color: #1e293b;
            font-size: 11px;
            text-transform: uppercase;
        }
        
        .payments-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            font-size: 11px;
        }
        
        .payments-table .text-right {
            text-align: right;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-paid {
            background-color: #dcfce7;
            color: #166534;
        }
        
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-overdue {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                ${data.tenant.logoUrl ? `<img src="${data.tenant.logoUrl}" alt="${data.tenant.name}" class="company-logo">` : ''}
                <div class="company-name">${data.tenant.name}</div>
                <div class="company-details">
                    ${data.tenant.email}<br>
                    ${data.tenant.phone}<br>
                    ${data.tenant.address}<br>
                    ${data.tenant.city}, ${data.tenant.state} ${data.tenant.zipCode}<br>
                    ${data.tenant.country}
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-meta">
                    <strong>Number:</strong> ${data.invoice.invoiceNumber}<br>
                    <strong>Date:</strong> ${data.invoice.issueDate}<br>
                    <strong>Due:</strong> ${data.invoice.dueDate}<br>
                    <strong>Status:</strong> <span class="status-badge status-${data.invoice.status.toLowerCase()}">${data.invoice.status}</span>
                </div>
            </div>
        </div>

        <!-- Addresses -->
        <div class="addresses">
            <div class="address-section">
                <div class="address-title">Bill To</div>
                <div class="address-content">
                    <strong>${data.customer.name}</strong><br>
                    ${data.customer.email}<br>
                    ${data.customer.phone}<br>
                    ${data.customer.address || ''}<br>
                    ${data.customer.city && data.customer.state ? `${data.customer.city}, ${data.customer.state} ${data.customer.zipCode || ''}` : ''}<br>
                    ${data.customer.country || ''}
                </div>
            </div>
            <div class="address-section">
                <div class="address-title">Invoice Details</div>
                <div class="address-content">
                    <strong>Sale Number:</strong> ${data.sale.saleNumber}<br>
                    <strong>Sale Date:</strong> ${data.sale.saleDate}<br>
                    <strong>Invoice ID:</strong> ${data.invoice.id}<br>
                    <strong>Payment Terms:</strong> Due on receipt
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Tax</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.sale.items.map(item => `
                    <tr>
                        <td>
                            <strong>${item.productName}</strong><br>
                            <small style="color: #64748b;">${item.productSku || ''}</small>
                        </td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                        <td class="text-right">$${item.taxAmount.toFixed(2)} (${(item.taxRate * 100).toFixed(1)}%)</td>
                        <td class="text-right"><strong>$${item.totalPrice.toFixed(2)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">$${data.sale.subtotal.toFixed(2)}</td>
                </tr>
                ${data.sale.discountAmount > 0 ? `
                    <tr>
                        <td class="label">Discount:</td>
                        <td class="value" style="color: #dc2626;">-$${data.sale.discountAmount.toFixed(2)}</td>
                    </tr>
                ` : ''}
                <tr>
                    <td class="label">Tax:</td>
                    <td class="value">$${data.sale.taxAmount.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="label">TOTAL:</td>
                    <td class="value">$${data.sale.totalAmount.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <!-- Payments -->
        ${data.payments.length > 0 ? `
            <div class="payments-section">
                <div class="payments-title">Payment History</div>
                <table class="payments-table">
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Reference</th>
                            <th class="text-right">Amount</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.payments.map(payment => `
                            <tr>
                                <td>${payment.method}</td>
                                <td>${payment.reference || 'N/A'}</td>
                                <td class="text-right">$${payment.amount.toFixed(2)}</td>
                                <td class="text-center">
                                    <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>This is a computer-generated invoice. No signature is required.</p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
  `;
}
