import { SubCategoryAdminAuthService } from './auth.service';
import { SubCategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
export declare class SubCategoryAdminAuthController {
    private readonly authService;
    constructor(authService: SubCategoryAdminAuthService);
    login(loginDto: SubCategoryAdminLoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            subCategoryId: string;
            subCategoryName: string;
            subCategoryNames: string[];
            subCategories: {
                id: string;
                name: string;
            }[];
            categoryId: string;
            categoryName: string;
            categoryAdmin: {
                id: string;
                name: string;
                email: string;
            } | null;
            schoolId: string;
            schoolName: string;
            schoolDomain: string | null;
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
        subCategoryId: string;
        subCategoryName: string;
        subCategoryNames: string[];
        subCategories: {
            id: string;
            name: string;
            categoryId: string;
            categoryName: string;
        }[];
        categoriesWithSubcategories: {
            id: string;
            name: string;
            subcategories: {
                id: string;
                name: string;
            }[];
        }[];
        categoryId: string;
        categoryName: string;
        categoryAdmin: {
            id: string;
            name: string;
            email: string;
        } | null;
        schoolId: string;
        schoolName: string;
        schoolDomain: string | null;
        isFirstLogin: boolean;
    }>;
    requestOtp(dto: RequestOtpDto): Promise<{
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
