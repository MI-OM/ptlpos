declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    DEACTIVATED = "DEACTIVATED",
    TRIAL = "TRIAL"
}
export declare class UpdateTenantStatusDto {
    status: TenantStatus;
    reason?: string;
}
export {};
