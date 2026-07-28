import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubCategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class SubCategoryAdminAuthService {
    private prisma;
    private jwtService;
    private emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
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
    changePassword(adminId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<{
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
            subcategories: Array<{
                id: string;
                name: string;
            }>;
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
