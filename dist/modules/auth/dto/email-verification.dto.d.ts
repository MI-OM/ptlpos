export declare class RequestEmailVerificationDto {
    email: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class RequestPasswordResetDto {
    email: string;
    tenantId: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
