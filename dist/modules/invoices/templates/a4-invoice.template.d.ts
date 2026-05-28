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
export declare function generateA4InvoiceHTML(data: A4InvoiceData): string;
