declare enum TicketPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
declare enum TicketCategory {
    BILLING = "BILLING",
    TECHNICAL = "TECHNICAL",
    FEATURE_REQUEST = "FEATURE_REQUEST",
    BUG_REPORT = "BUG_REPORT",
    ACCOUNT_ISSUE = "ACCOUNT_ISSUE",
    OTHER = "OTHER"
}
export declare class CreateSupportTicketDto {
    tenantId: string;
    userId: string;
    subject: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
}
export {};
