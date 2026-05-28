declare enum BillingCycle {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
export declare class UpdateSubscriptionDto {
    planId?: string;
    name?: string;
    description?: string;
    price?: number;
    billingCycle?: BillingCycle;
    limits?: string;
    features?: string;
    isActive?: boolean;
    endDate?: Date;
}
export {};
