import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { RequestPasswordResetOtpDto, VerifyPasswordResetOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class UserAuthService {
    private prisma;
    private jwtService;
    private emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
    private userResponse;
    register(dto: RegisterDto): Promise<{
        devOtp?: string | undefined;
        requiresOtp: boolean;
        email: string;
        pendingApproval?: undefined;
    } | {
        pendingApproval: boolean;
    }>;
    resendOtp(email: string): Promise<{
        success: boolean;
        devOtp: string;
    } | {
        success: boolean;
        devOtp?: undefined;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        success: boolean;
        email: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            firstName: string | undefined;
            lastName: string | undefined;
            email: string;
            schoolId: string;
            schoolName: string;
            schoolImage: string | undefined;
            profilePicUrl: string | undefined;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        name: string;
        firstName: string | undefined;
        lastName: string | undefined;
        email: string;
        schoolId: string;
        schoolName: string;
        schoolImage: string | undefined;
        profilePicUrl: string | undefined;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        firstName: string | undefined;
        lastName: string | undefined;
        email: string;
        schoolId: string;
        schoolName: string;
        schoolImage: string | undefined;
        profilePicUrl: string | undefined;
    }>;
    getSchools(): Promise<{
        id: string;
        name: string;
        domain: string | null;
        image: string | null;
    }[]>;
    deleteAccount(userId: string, password: string): Promise<{
        success: boolean;
    }>;
    /** Verify token from update-verification-doc link (public). */
    verifyUpdateDocToken(token: string): Promise<{
        valid: boolean;
        type: string;
        email: string;
    }>;
    /** Submit updated doc from email link (public). */
    submitUpdateDoc(token: string, docUrl: string): Promise<{
        success: boolean;
    }>;
    /** Verify approval-email link (user clicked link in "you're approved" email). Allows login after. */
    verifyApprovalToken(token: string): Promise<{
        success: boolean;
    }>;
    requestPasswordResetOtp(dto: RequestPasswordResetOtpDto): Promise<{
        message: string;
        email: string;
    }>;
    verifyPasswordResetOtp(dto: VerifyPasswordResetOtpDto): Promise<{
        message: string;
        verified: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
        success: boolean;
    }>;
}
