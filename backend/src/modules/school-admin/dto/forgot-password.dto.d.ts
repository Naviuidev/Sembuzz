export declare class RequestOtpDto {
    refNum: string;
}
export declare class VerifyOtpDto {
    refNum: string;
    otp: string;
}
export declare class ResetPasswordDto {
    refNum: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}
