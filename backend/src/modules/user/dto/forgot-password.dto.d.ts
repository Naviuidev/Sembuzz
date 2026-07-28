export declare class RequestPasswordResetOtpDto {
    email: string;
}
export declare class VerifyPasswordResetOtpDto {
    email: string;
    otp: string;
}
export declare class ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}
