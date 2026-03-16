import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { EmailService } from '../../super-admin/schools/email.service';

const OTP_EXPIRY_MINUTES = 10;

function handlePrismaError(err: unknown, context: string): never {
  console.error(`[UserAuthService] ${context} error:`, err);
  const e = err as { code?: string; message?: string; meta?: unknown };
  const msg = e?.message ?? '';
  const schemaHint =
    e?.code?.startsWith('P2') ||
    msg.includes('Unknown column') ||
    msg.includes('doesn\'t exist')
      ? ' Database schema may be out of date: apply migrations (see backend/prisma/migrations) or run the SQL for users/schools columns.'
      : '';
  throw new InternalServerErrorException(
    (msg && msg.length < 200 ? msg : 'A database error occurred.') + schemaHint,
  );
}

@Injectable()
export class UserAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private userResponse(user: { id: string; name: string; email: string; schoolId: string; school: { id: string; name: string; image: string | null } }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      schoolId: user.schoolId,
      schoolName: user.school.name,
      schoolImage: user.school.image ?? undefined,
    };
  }

  async register(dto: RegisterDto) {
    try {
      const email = dto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findUnique({
        where: { email },
        include: { school: { select: { id: true, name: true, domain: true } } },
      });
      if (existing) {
        if (existing.status === 'pending_otp') {
          const school = existing.school;
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
          await this.prisma.user.update({
            where: { id: existing.id },
            data: { otp, otpExpiresAt },
          });
          try {
            await this.emailService.sendUserOtp(email, otp, school?.name ?? 'SemBuzz');
          } catch (emailErr) {
            const isDevelopment = process.env.NODE_ENV === 'development';
            if (isDevelopment) {
              console.warn('[UserAuthService] OTP email failed (dev). User kept for verification.');
              return { requiresOtp: true, email, devOtp: otp };
            }
            console.error('[UserAuthService] OTP email failed on resume:', emailErr);
            throw new BadRequestException(
              'We couldn\'t send a new verification email. Please try again later or use Resend OTP on the verification step.',
            );
          }
          const isDevelopment = process.env.NODE_ENV === 'development';
          return { requiresOtp: true, email, ...(isDevelopment ? { devOtp: otp } : {}) };
        }
        if (existing.status === 'pending_approval') {
          throw new BadRequestException(
            'Your registration is pending school admin approval. Check your email or contact your school admin.',
          );
        }
        throw new BadRequestException('An account with this email already exists');
      }

      const school = await this.prisma.school.findFirst({
        where: { id: dto.schoolId, isActive: true },
      });
      if (!school) {
        throw new BadRequestException('Invalid school');
      }

      const name = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim() || email;
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      if (dto.registrationMethod === 'school_domain') {
        const schoolDomain = school.domain?.toLowerCase().replace(/^@?\.?/, '');
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!schoolDomain || !emailDomain || emailDomain !== schoolDomain) {
          throw new BadRequestException(
            `Your email domain must match the school domain (${school.domain ?? 'not set'}). Use your school email address.`,
          );
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const user = await this.prisma.user.create({
          data: {
            name,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            profilePicUrl: dto.profilePicUrl ?? null,
            verificationDocUrl: dto.verificationDocUrl ?? null,
            email,
            password: hashedPassword,
            schoolId: dto.schoolId,
            registrationMethod: 'school_domain',
            status: 'pending_otp',
            otp,
            otpExpiresAt,
          },
          include: {
            school: { select: { id: true, name: true, image: true } },
          },
        });

        try {
          await this.emailService.sendUserOtp(email, otp, school.name);
        } catch (emailErr) {
          const isDevelopment = process.env.NODE_ENV === 'development';
          if (isDevelopment) {
            console.warn('[UserAuthService] OTP email failed (dev fallback). OTP logged by EmailService. User kept for verification.');
            return { requiresOtp: true, email, devOtp: otp };
          }
          console.error('[UserAuthService] OTP email failed, removing pending user:', emailErr);
          await this.prisma.user.delete({ where: { id: user.id } }).catch(() => {});
          throw new BadRequestException(
            'We couldn\'t send the verification email. Check that SMTP is configured (SMTP_USER, SMTP_PASS in backend .env) and your email is valid, or try again later.',
          );
        }

        // Only expose OTP in response when NODE_ENV is explicitly 'development' (production and other envs never get devOtp).
        const isDevelopment = process.env.NODE_ENV === 'development';
        return { requiresOtp: true, email, ...(isDevelopment ? { devOtp: otp } : {}) };
      }

      // gmail/public domain: require verification doc and create user pending_approval
      if (!dto.verificationDocUrl?.trim()) {
        throw new BadRequestException(
          'Please upload a school-related document (e.g. ID card or fee receipt) to verify your enrollment.',
        );
      }
      const user = await this.prisma.user.create({
        data: {
          name,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          profilePicUrl: dto.profilePicUrl ?? null,
          email,
          password: hashedPassword,
          schoolId: dto.schoolId,
          registrationMethod: 'gmail',
          status: 'pending_approval',
          verificationDocUrl: dto.verificationDocUrl.trim(),
        },
        include: {
          school: { select: { id: true, name: true, image: true } },
        },
      });

      const admins = await this.prisma.schoolAdmin.findMany({
        where: { schoolId: dto.schoolId, isActive: true },
        select: { email: true },
      });
      const userDetails = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email,
      };
      for (const admin of admins) {
        this.emailService.sendPendingUserToSchoolAdmin(
          admin.email,
          userDetails,
          school.name,
          user.id,
        );
      }

      return { pendingApproval: true };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      handlePrismaError(err, 'register');
    }
  }

  async resendOtp(email: string) {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: { school: { select: { name: true } } },
    });
    if (!user || user.status !== 'pending_otp') {
      throw new BadRequestException('No pending registration found for this email. Please register again.');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    });
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    try {
      await this.emailService.sendUserOtp(normalized, otp, user.school.name);
    } catch (emailErr) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[UserAuthService] Resend OTP email failed (dev). OTP logged by EmailService.');
        return { success: true, devOtp: otp };
      }
      console.error('[UserAuthService] Resend OTP email failed:', emailErr);
      throw new BadRequestException(
        'We couldn\'t send the verification email. Check SMTP configuration and try again.',
      );
    }
    const isDevelopment = process.env.NODE_ENV === 'development';
    return isDevelopment && !smtpConfigured ? { success: true, devOtp: otp } : { success: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: { select: { id: true, name: true, image: true } },
      },
    });
    if (!user || user.status !== 'pending_otp') {
      throw new BadRequestException('Invalid or expired OTP. Please register again.');
    }
    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one by registering again.');
    }
    if (user.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'active', otp: null, otpExpiresAt: null },
    });

    // Do not issue JWT here; user must log in with email and password.
    return { success: true, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        school: { select: { id: true, name: true, image: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Email not registered');
    }
    if (user.status !== 'active') {
      if (user.status === 'banned') {
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact your school admin to restore access.',
        );
      }
      if (user.status === 'pending_otp') {
        throw new UnauthorizedException('Please verify your email with the OTP we sent.');
      }
      if (user.status === 'pending_approval') {
        throw new UnauthorizedException('Your account is pending approval by your school admin.');
      }
      throw new UnauthorizedException('Account is not active. Please contact support.');
    }

    // After admin approval (gmail flow), user must click verify link in email before they can login
    if (user.registrationMethod === 'gmail' && !user.approvalEmailVerifiedAt) {
      throw new UnauthorizedException(
        'Admin has approved you. Please verify the link in the email we sent to log in.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    const payload = { sub: user.id, email: user.email, role: 'user' };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: this.userResponse(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: { select: { id: true, name: true, image: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.status === 'banned') {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact your school admin to restore access.',
      );
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      schoolId: user.schoolId,
      schoolName: user.school.name,
      schoolImage: user.school.image ?? undefined,
      profilePicUrl: user.profilePicUrl ?? undefined,
    };
  }

  async getSchools() {
    try {
      const schools = await this.prisma.school.findMany({
        where: { isActive: true },
        select: { id: true, name: true, domain: true, image: true },
        orderBy: { name: 'asc' },
      });
      return schools;
    } catch (err) {
      handlePrismaError(err, 'getSchools');
    }
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new BadRequestException('Invalid password');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  /** Verify token from update-verification-doc link (public). */
  async verifyUpdateDocToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Invalid or expired link.');
    }
    try {
      const payload = this.jwtService.verify(token) as { sub?: string; type?: string; purpose?: string };
      if (payload.purpose !== 'update_verification_doc' || !payload.sub) {
        throw new BadRequestException('Invalid or expired link.');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, status: true },
      });
      if (!user || user.status !== 'pending_approval') {
        throw new BadRequestException('Invalid or expired link.');
      }
      const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      return {
        valid: true,
        type: payload.type === 'additional' ? 'additional' : 'reupload',
        email: maskedEmail,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid or expired link. Please use the latest link from your email.');
    }
  }

  /** Submit updated doc from email link (public). */
  async submitUpdateDoc(token: string, docUrl: string) {
    if (!token || !docUrl) {
      throw new BadRequestException('Token and document are required.');
    }
    try {
      const payload = this.jwtService.verify(token) as { sub?: string; type?: string; purpose?: string };
      if (payload.purpose !== 'update_verification_doc' || !payload.sub) {
        throw new BadRequestException('Invalid or expired link.');
      }
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, status: 'pending_approval' },
      });
      if (!user) {
        throw new BadRequestException('Invalid or expired link.');
      }
      const isAdditional = payload.type === 'additional';
      await this.prisma.user.update({
        where: { id: user.id },
        data: isAdditional
          ? { additionalVerificationDocUrl: docUrl }
          : { verificationDocUrl: docUrl },
      });
      return { success: true };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid or expired link. Please use the latest link from your email.');
    }
  }

  /** Verify approval-email link (user clicked link in "you're approved" email). Allows login after. */
  async verifyApprovalToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Invalid or expired link.');
    }
    try {
      const payload = this.jwtService.verify(token) as { sub?: string; purpose?: string };
      if (payload.purpose !== 'approval_email_verify' || !payload.sub) {
        throw new BadRequestException('Invalid or expired link.');
      }
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, status: 'active' },
      });
      if (!user) {
        throw new BadRequestException('Invalid or expired link.');
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: { approvalEmailVerifiedAt: new Date() },
      });
      return { success: true };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid or expired link. Please use the latest link from your email.');
    }
  }
}
