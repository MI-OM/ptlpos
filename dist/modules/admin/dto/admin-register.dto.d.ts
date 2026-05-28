declare enum AdminRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    SUPPORT_ADMIN = "SUPPORT_ADMIN",
    BILLING_ADMIN = "BILLING_ADMIN"
}
export declare class AdminRegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
}
export {};
