export declare enum CustomerType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS"
}
export declare class CreateCustomerDto {
    name: string;
    phone?: string;
    email?: string;
}
