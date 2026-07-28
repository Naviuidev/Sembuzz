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
exports.SchoolAdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let SchoolAdminAuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SchoolAdminAuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SchoolAdminAuthService = _classThis = _classDescriptor.value;
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
            const { identifier, password } = loginDto;
            // Find school admin by email or refNum
            const admin = await this.prisma.schoolAdmin.findFirst({
                where: {
                    OR: [
                        { email: identifier },
                        {
                            school: {
                                refNum: identifier,
                            },
                        },
                    ],
                    isActive: true,
                },
                include: {
                    school: {
                        include: {
                            features: {
                                where: { isEnabled: true },
                                include: {
                                    feature: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!admin) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const payload = {
                sub: admin.id,
                email: admin.email,
                schoolId: admin.schoolId,
                role: 'school_admin',
                isFirstLogin: admin.isFirstLogin,
            };
            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    schoolId: admin.schoolId,
                    schoolName: admin.school.name,
                    refNum: admin.school.refNum,
                    isFirstLogin: admin.isFirstLogin,
                    schoolDomain: admin.school.domain || null,
                    features: admin.school.features.map((sf) => ({
                        code: sf.feature.code,
                        name: sf.feature.name,
                    })),
                },
            };
        }
        async changePassword(adminId, changePasswordDto) {
            const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException('New password and confirm password do not match');
            }
            const admin = await this.prisma.schoolAdmin.findUnique({
                where: { id: adminId },
            });
            if (!admin) {
                throw new common_1.UnauthorizedException('Admin not found');
            }
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isCurrentPasswordValid) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await this.prisma.schoolAdmin.update({
                where: { id: adminId },
                data: {
                    password: hashedNewPassword,
                    isFirstLogin: false, // Mark as password changed
                },
            });
            return { message: 'Password changed successfully' };
        }
        async validateUser(userId) {
            const admin = await this.prisma.schoolAdmin.findUnique({
                where: { id: userId },
                include: {
                    school: {
                        include: {
                            features: {
                                where: { isEnabled: true },
                                include: {
                                    feature: {
                                        select: {
                                            code: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
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
                schoolId: admin.schoolId,
                schoolName: admin.school.name,
                refNum: admin.school.refNum,
                isFirstLogin: admin.isFirstLogin,
                schoolDomain: admin.school.domain || null,
                features: admin.school.features.map((sf) => ({
                    code: sf.feature.code,
                    name: sf.feature.name,
                })),
            };
        }
        async requestOtp(requestOtpDto) {
            const { refNum } = requestOtpDto;
            // Find school admin by refNum
            const admin = await this.prisma.schoolAdmin.findFirst({
                where: {
                    school: {
                        refNum: refNum,
                    },
                    isActive: true,
                },
                include: {
                    school: {
                        select: {
                            name: true,
                            refNum: true,
                        },
                    },
                },
            });
            if (!admin) {
                throw new common_1.NotFoundException('School admin not found with the provided reference number');
            }
            // Generate 6-digit OTP
            const otp = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
            // Invalidate any existing unused OTPs for this admin
            await this.prisma.passwordResetOtp.updateMany({
                where: {
                    schoolAdminId: admin.id,
                    isUsed: false,
                },
                data: {
                    isUsed: true,
                },
            });
            // Create new OTP
            await this.prisma.passwordResetOtp.create({
                data: {
                    schoolAdminId: admin.id,
                    otp,
                    expiresAt,
                },
            });
            // Send OTP email
            await this.emailService.sendOtpEmail(admin.email, admin.school.name, refNum, otp);
            return {
                message: 'OTP has been sent to your registered email address',
                email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
            };
        }
        async verifyOtp(verifyOtpDto) {
            const { refNum, otp } = verifyOtpDto;
            // Find school admin by refNum
            const admin = await this.prisma.schoolAdmin.findFirst({
                where: {
                    school: {
                        refNum: refNum,
                    },
                    isActive: true,
                },
            });
            if (!admin) {
                throw new common_1.NotFoundException('School admin not found');
            }
            // Find valid OTP
            const otpRecord = await this.prisma.passwordResetOtp.findFirst({
                where: {
                    schoolAdminId: admin.id,
                    otp,
                    isUsed: false,
                    expiresAt: {
                        gte: new Date(),
                    },
                },
            });
            if (!otpRecord) {
                throw new common_1.BadRequestException('Invalid or expired OTP');
            }
            return {
                message: 'OTP verified successfully',
                verified: true,
            };
        }
        async resetPassword(resetPasswordDto) {
            const { refNum, otp, newPassword, confirmPassword } = resetPasswordDto;
            if (newPassword !== confirmPassword) {
                throw new common_1.BadRequestException('New password and confirm password do not match');
            }
            // Find school admin by refNum
            const admin = await this.prisma.schoolAdmin.findFirst({
                where: {
                    school: {
                        refNum: refNum,
                    },
                    isActive: true,
                },
            });
            if (!admin) {
                throw new common_1.NotFoundException('School admin not found');
            }
            // Verify OTP
            const otpRecord = await this.prisma.passwordResetOtp.findFirst({
                where: {
                    schoolAdminId: admin.id,
                    otp,
                    isUsed: false,
                    expiresAt: {
                        gte: new Date(),
                    },
                },
            });
            if (!otpRecord) {
                throw new common_1.BadRequestException('Invalid or expired OTP');
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            // Update password and mark OTP as used
            await this.prisma.$transaction([
                this.prisma.schoolAdmin.update({
                    where: { id: admin.id },
                    data: {
                        password: hashedPassword,
                        isFirstLogin: false,
                    },
                }),
                this.prisma.passwordResetOtp.update({
                    where: { id: otpRecord.id },
                    data: { isUsed: true },
                }),
            ]);
            return {
                message: 'Password reset successfully. Please login with your new password.',
            };
        }
    };
    return SchoolAdminAuthService = _classThis;
})();
exports.SchoolAdminAuthService = SchoolAdminAuthService;
//# sourceMappingURL=auth.service.js.map