export declare class RequestOtpDto {
    email: string;
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
}
export declare class ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}
