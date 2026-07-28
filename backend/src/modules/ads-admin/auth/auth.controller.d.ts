import { AdsAdminAuthService } from './auth.service';
import { AdsAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
export declare class AdsAdminAuthController {
    private readonly authService;
    constructor(authService: AdsAdminAuthService);
    login(loginDto: AdsAdminLoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            schoolId: any;
            schoolName: any;
            isFirstLogin: any;
        };
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        id: any;
        name: any;
        email: any;
        schoolId: any;
        schoolName: any;
        isFirstLogin: any;
    }>;
    requestOtp(dto: RequestOtpDto): Promise<{
        message: string;
        email: string;
        devOtp: string;
    } | {
        message: string;
        email: string;
        devOtp?: undefined;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
