import { CategoryAdminAuthService } from './auth.service';
import { CategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
export declare class CategoryAdminAuthController {
    private readonly authService;
    constructor(authService: CategoryAdminAuthService);
    login(loginDto: CategoryAdminLoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            categoryId: string;
            categoryName: string;
            schoolId: string;
            schoolName: string;
            isFirstLogin: boolean;
        };
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        categoryId: string;
        categoryName: string;
        schoolId: string;
        schoolName: string;
        schoolDomain: string | null;
        isFirstLogin: boolean;
    }>;
    requestOtp(dto: RequestOtpDto): Promise<{
        devOtp?: string | undefined;
        message: string;
        email: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
