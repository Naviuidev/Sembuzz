"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryAdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let CategoryAdminAuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminAuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminAuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        jwtService;
        emailService;
        constructor(prisma, jwtService, emailService) {
            this.prisma = prisma;
            this.jwtService = jwtService;
            this.emailService = emailService;
        }
        async login(loginDto) {
            const { email, password } = loginDto;
            // Find category admin by email
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { email },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    school: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            if (!admin) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (!admin.isActive) {
                throw new common_1.UnauthorizedException('Account is inactive');
            }
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const payload = {
                sub: admin.id,
                email: admin.email,
                categoryId: admin.categoryId,
                schoolId: admin.schoolId,
                role: 'category_admin',
                isFirstLogin: admin.isFirstLogin,
            };
            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    categoryId: admin.categoryId,
                    categoryName: admin.category.name,
                    schoolId: admin.schoolId,
                    schoolName: admin.school.name,
                    isFirstLogin: admin.isFirstLogin,
                },
            };
        }
        async changePassword(adminId, changePasswordDto) {
            const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException('New password and confirm password do not match');
            }
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: adminId },
            });
            if (!admin) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isCurrentPasswordValid) {
                throw new common_1.BadRequestException('Current password is incorrect');
            }
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await this.prisma.categoryAdmin.update({
                where: { id: adminId },
                data: {
                    password: hashedNewPassword,
                    isFirstLogin: false,
                },
            });
            return { message: 'Password changed successfully' };
        }
        async validateUser(userId) {
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: userId },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    school: {
                        select: {
                            id: true,
                            name: true,
                            domain: true,
                        },
                    },
                },
            });
            if (!admin) {
                throw new common_1.UnauthorizedException('User not found');
            }
            return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                categoryId: admin.categoryId,
                categoryName: admin.category.name,
                schoolId: admin.schoolId,
                schoolName: admin.school.name,
                schoolDomain: admin.school.domain || null,
                isFirstLogin: admin.isFirstLogin,
            };
        }
        async requestOtp(requestOtpDto) {
            const { email } = requestOtpDto;
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { email: email.trim(), isActive: true },
            });
            if (!admin) {
                throw new common_1.NotFoundException('No category admin found with this email address');
            }
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await this.prisma.categoryAdminPasswordResetOtp.updateMany({
                where: { categoryAdminId: admin.id, isUsed: false },
                data: { isUsed: true },
            });
            await this.prisma.categoryAdminPasswordResetOtp.create({
                data: {
                    categoryAdminId: admin.id,
                    otp,
                    expiresAt,
                },
            });
            const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
            try {
                await this.emailService.sendCategoryAdminPasswordResetOtp(admin.email, admin.name, otp);
            }
            catch (emailErr) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('[CategoryAdminAuth] OTP email failed (dev). OTP logged by EmailService.');
                    return {
                        message: 'OTP has been sent to your registered email address',
                        email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
                        devOtp: otp,
                    };
                }
                throw emailErr;
            }
            // Only in development when SMTP not configured: return devOtp. Never in production.
            const isDev = process.env.NODE_ENV !== 'production';
            const includeDevOtp = isDev && !smtpConfigured;
            return {
                message: 'OTP has been sent to your registered email address',
                email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
                ...(includeDevOtp ? { devOtp: otp } : {}),
            };
        }
        async verifyOtp(verifyOtpDto) {
            const { email, otp } = verifyOtpDto;
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { email: email.trim(), isActive: true },
            });
            if (!admin) {
                throw new common_1.NotFoundException('No category admin found with this email address');
            }
            const otpRecord = await this.prisma.categoryAdminPasswordResetOtp.findFirst({
                where: {
                    categoryAdminId: admin.id,
                    otp,
                    isUsed: false,
                    expiresAt: { gte: new Date() },
                },
            });
            if (!otpRecord) {
                throw new common_1.BadRequestException('Invalid or expired OTP');
            }
            return { message: 'OTP verified successfully', verified: true };
        }
        async resetPassword(resetPasswordDto) {
            const { email, otp, newPassword, confirmPassword } = resetPasswordDto;
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException('New password and confirm password do not match');
            }
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { email: email.trim(), isActive: true },
            });
            if (!admin) {
                throw new common_1.NotFoundException('No category admin found with this email address');
            }
            const otpRecord = await this.prisma.categoryAdminPasswordResetOtp.findFirst({
                where: {
                    categoryAdminId: admin.id,
                    otp,
                    isUsed: false,
                    expiresAt: { gte: new Date() },
                },
            });
            if (!otpRecord) {
                throw new common_1.BadRequestException('Invalid or expired OTP');
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.prisma.$transaction([
                this.prisma.categoryAdmin.update({
                    where: { id: admin.id },
                    data: { password: hashedPassword, isFirstLogin: false },
                }),
                this.prisma.categoryAdminPasswordResetOtp.update({
                    where: { id: otpRecord.id },
                    data: { isUsed: true },
                }),
            ]);
            return { message: 'Password reset successfully. Please login with your new password.' };
        }
    };
    return CategoryAdminAuthService = _classThis;
})();
exports.CategoryAdminAuthService = CategoryAdminAuthService;
//# sourceMappingURL=auth.service.js.map