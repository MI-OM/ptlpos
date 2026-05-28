declare enum BillingCycle {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
export declare class CreateSubscriptionDto {
    name: string;
    description?: string;
    price: number;
    billingCycle: BillingCycle;
    limits: string;
    features: string;
    isActive?: boolean;
}
export {};
