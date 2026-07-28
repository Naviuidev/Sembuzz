import { SchoolAdminAuthService } from './auth.service';
import { SchoolAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
export declare class SchoolAdminAuthController {
    private readonly authService;
    constructor(authService: SchoolAdminAuthService);
    login(loginDto: SchoolAdminLoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            schoolId: string;
            schoolName: string;
            refNum: string;
            isFirstLogin: boolean;
            schoolDomain: string | null;
            features: {
                code: string;
                name: string;
            }[];
        };
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        schoolId: string;
        schoolName: string;
        refNum: string;
        isFirstLogin: boolean;
        schoolDomain: string | null;
        features: {
            code: string;
            name: string;
        }[];
    }>;
    requestOtp(requestOtpDto: RequestOtpDto): Promise<{
        message: string;
        email: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
