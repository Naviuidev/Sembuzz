import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdsAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class AdsAdminAuthService {
    private prisma;
    private jwtService;
    private emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
    /** Cast so generated delegates (adsAdmin, adsAdminPasswordResetOtp) are accepted; run `npx prisma generate` so runtime client matches. */
    private get client();
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
    changePassword(adminId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    validateUser(userId: string): Promise<{
        id: any;
        name: any;
        email: any;
        schoolId: any;
        schoolName: any;
        isFirstLogin: any;
    }>;
    requestOtp(requestOtpDto: RequestOtpDto): Promise<{
        message: string;
        email: string;
        devOtp: string;
    } | {
        message: string;
        email: string;
        devOtp?: undefined;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
