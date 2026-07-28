import { UserAuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { RequestPasswordResetOtpDto, VerifyPasswordResetOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
export declare class UserAuthController {
    private readonly authService;
    constructor(authService: UserAuthService);
    getSchools(): Promise<{
        id: string;
        name: string;
        domain: string | null;
        image: string | null;
    }[]>;
    verifyUpdateDocToken(token: string | undefined): Promise<{
        valid: boolean;
        type: string;
        email: string;
    }>;
    verifyApproval(token: string | undefined): Promise<{
        success: boolean;
    }>;
    submitUpdateDoc(req: {
        body?: {
            token?: string;
        };
    }, file: Express.Multer.File): Promise<{
        success: boolean;
    }>;
    uploadRegistrationDoc(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadProfilePic(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    register(dto: RegisterDto): Promise<{
        devOtp?: string | undefined;
        requiresOtp: boolean;
        email: string;
        pendingApproval?: undefined;
    } | {
        pendingApproval: boolean;
    }>;
    resendOtp(dto: ResendOtpDto): Promise<{
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
    getMe(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    deleteAccount(req: {
        user: {
            sub: string;
        };
    }, dto: DeleteAccountDto): Promise<{
        success: boolean;
    }>;
    updateProfile(req: {
        user: {
            sub: string;
        };
    }, dto: UpdateProfileDto): Promise<{
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
}
