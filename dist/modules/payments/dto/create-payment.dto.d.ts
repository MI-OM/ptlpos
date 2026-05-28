import { PaymentMethod, PaymentStatus } from '@prisma/client';
export declare class CreatePaymentDto {
    saleId: string;
    method: PaymentMethod;
    amount: number;
    reference?: string;
    externalRef?: string;
    status?: PaymentStatus;
}
