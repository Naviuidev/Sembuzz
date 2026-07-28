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
exports.CategoryAdminsService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let CategoryAdminsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        emailService;
        constructor(prisma, emailService) {
            this.prisma = prisma;
            this.emailService = emailService;
        }
        async generateTemporaryPassword() {
            // Generate a random password
            return crypto.randomBytes(8).toString('hex');
        }
        async findAll(schoolId) {
            return this.prisma.categoryAdmin.findMany({
                where: { schoolId },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    categories: {
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
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
                orderBy: { createdAt: 'desc' },
            });
        }
        async findOne(id, schoolId) {
            const categoryAdmin = await this.prisma.categoryAdmin.findFirst({
                where: { id, schoolId },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    categories: {
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
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
            if (!categoryAdmin) {
                throw new common_1.NotFoundException(`Category admin with id ${id} not found`);
            }
            return categoryAdmin;
        }
        async create(schoolId, createCategoryAdminDto) {
            const { name, email, categoryId } = createCategoryAdminDto;
            // Get school to validate domain
            const school = await this.prisma.school.findUnique({
                where: { id: schoolId },
                select: { domain: true, name: true },
            });
            if (!school) {
                throw new common_1.NotFoundException('School not found');
            }
            if (!school.domain) {
                throw new common_1.BadRequestException('School domain is not set. Please contact super admin.');
            }
            // Validate that email domain matches the school domain
            const emailDomain = email.split('@')[1];
            if (!emailDomain || emailDomain.toLowerCase() !== school.domain.toLowerCase()) {
                throw new common_1.BadRequestException(`Category admin email domain (${emailDomain || 'invalid'}) must match the school domain (${school.domain})`);
            }
            // Verify category belongs to this school
            const category = await this.prisma.category.findFirst({
                where: {
                    id: categoryId,
                    schoolId,
                },
            });
            if (!category) {
                throw new common_1.NotFoundException(`Category with id ${categoryId} not found or does not belong to this school`);
            }
            // Check if email already exists
            const existingAdmin = await this.prisma.categoryAdmin.findUnique({
                where: { email },
            });
            if (existingAdmin) {
                throw new common_1.BadRequestException('Category admin email already exists');
            }
            // Generate temporary password
            const tempPassword = await this.generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            // Create category admin in transaction
            let result;
            try {
                result = await this.prisma.$transaction(async (tx) => {
                    const categoryAdmin = await tx.categoryAdmin.create({
                        data: {
                            name,
                            email,
                            password: hashedPassword,
                            categoryId,
                            schoolId,
                        },
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
                    // Create junction table entry
                    await tx.categoryAdminCategory.create({
                        data: {
                            id: crypto.randomBytes(16).toString('hex'),
                            categoryAdminId: categoryAdmin.id,
                            categoryId,
                        },
                    });
                    return categoryAdmin;
                });
                // Try to send email (don't fail if email fails)
                let emailSent = false;
                let emailError = null;
                try {
                    await this.emailService.sendCategoryAdminOnboardingEmail(email, name, school.name, category.name, tempPassword);
                    emailSent = true;
                }
                catch (error) {
                    console.error('Failed to send category admin onboarding email:', error);
                    emailError = error?.message || 'Failed to send email';
                }
                return {
                    ...result,
                    tempPassword,
                    emailSent,
                    emailError,
                };
            }
            catch (error) {
                // Handle database errors
                if (error.message?.includes("Unknown column")) {
                    throw new common_1.BadRequestException('Database migration required. Please run migrations to add category admin tables.');
                }
                throw error;
            }
        }
        async updateCategories(id, schoolId, updateDto) {
            const categoryAdmin = await this.findOne(id, schoolId);
            // Verify all categories belong to this school
            const categories = await this.prisma.category.findMany({
                where: {
                    id: { in: updateDto.categoryIds },
                    schoolId,
                },
                select: { id: true, name: true },
            });
            if (categories.length !== updateDto.categoryIds.length) {
                throw new common_1.BadRequestException('One or more categories do not belong to this school');
            }
            // Get current categories
            const currentCategories = await this.prisma.categoryAdminCategory.findMany({
                where: { categoryAdminId: id },
                include: {
                    category: {
                        select: { id: true, name: true },
                    },
                },
            });
            const currentCategoryIds = currentCategories.map((cc) => cc.categoryId);
            const newCategoryIds = updateDto.categoryIds;
            // Find added and removed categories
            const addedCategoryIds = newCategoryIds.filter((id) => !currentCategoryIds.includes(id));
            const removedCategoryIds = currentCategoryIds.filter((id) => !newCategoryIds.includes(id));
            // Update in transaction
            const result = await this.prisma.$transaction(async (tx) => {
                // Remove old categories
                if (removedCategoryIds.length > 0) {
                    await tx.categoryAdminCategory.deleteMany({
                        where: {
                            categoryAdminId: id,
                            categoryId: { in: removedCategoryIds },
                        },
                    });
                }
                // Add new categories
                if (addedCategoryIds.length > 0) {
                    await tx.categoryAdminCategory.createMany({
                        data: addedCategoryIds.map((categoryId) => ({
                            id: crypto.randomBytes(16).toString('hex'),
                            categoryAdminId: id,
                            categoryId,
                        })),
                    });
                }
                // Update primary categoryId if needed (use first category as primary)
                if (newCategoryIds.length > 0 && !newCategoryIds.includes(categoryAdmin.categoryId)) {
                    await tx.categoryAdmin.update({
                        where: { id },
                        data: { categoryId: newCategoryIds[0] },
                    });
                }
                // Return updated category admin with all relations
                const updated = await tx.categoryAdmin.findFirst({
                    where: { id, schoolId },
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        categories: {
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
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
                return updated;
            });
            if (!result) {
                throw new common_1.NotFoundException(`Category admin with id ${id} not found after update`);
            }
            // Send email notification if there are changes
            if (addedCategoryIds.length > 0 || removedCategoryIds.length > 0) {
                const addedCategories = categories
                    .filter((c) => addedCategoryIds.includes(c.id))
                    .map((c) => c.name);
                const removedCategories = currentCategories
                    .filter((cc) => removedCategoryIds.includes(cc.categoryId))
                    .map((cc) => cc.category.name);
                // Fetch school name separately if not included in result
                let schoolName = '';
                if (result.school) {
                    schoolName = result.school.name;
                }
                else {
                    const school = await this.prisma.school.findUnique({
                        where: { id: result.schoolId },
                        select: { name: true },
                    });
                    schoolName = school?.name || '';
                }
                try {
                    await this.emailService.sendCategoryAdminCategoriesUpdatedEmail(result.email, result.name, schoolName, addedCategories, removedCategories);
                }
                catch (error) {
                    console.error('Failed to send category update email:', error);
                    // Don't fail the request if email fails
                }
            }
            return result;
        }
        async remove(id, schoolId) {
            const categoryAdmin = await this.findOne(id, schoolId);
            return this.prisma.categoryAdmin.delete({
                where: { id },
            });
        }
        async ban(id, schoolId) {
            const admin = await this.findOne(id, schoolId);
            if (!admin.isActive) {
                throw new common_1.BadRequestException('Category admin is already banned');
            }
            return this.prisma.categoryAdmin.update({
                where: { id },
                data: { isActive: false },
            });
        }
        async unban(id, schoolId) {
            const admin = await this.findOne(id, schoolId);
            if (admin.isActive) {
                throw new common_1.BadRequestException('Category admin is not banned');
            }
            return this.prisma.categoryAdmin.update({
                where: { id },
                data: { isActive: true },
            });
        }
    };
    return CategoryAdminsService = _classThis;
})();
exports.CategoryAdminsService = CategoryAdminsService;
//# sourceMappingURL=category-admins.service.js.map