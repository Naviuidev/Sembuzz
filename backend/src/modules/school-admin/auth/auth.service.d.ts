import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { SchoolAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class SchoolAdminAuthService {
    private prisma;
    private jwtService;
    private emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
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
    changePassword(adminId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<{
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
