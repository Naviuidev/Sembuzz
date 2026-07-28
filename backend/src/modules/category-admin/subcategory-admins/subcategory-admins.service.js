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
exports.SubCategoryAdminsService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let SubCategoryAdminsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminsService = _classThis = _classDescriptor.value;
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
            return crypto.randomBytes(8).toString('hex');
        }
        /** All category IDs this category admin has access to (primary + junction table). */
        async getCategoryAdminCategoryIds(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: categoryAdminId },
                select: { categoryId: true, categories: { select: { categoryId: true } } },
            });
            if (!admin)
                return [];
            return [admin.categoryId, ...(admin.categories?.map((c) => c.categoryId) ?? [])].filter(Boolean);
        }
        async findAll(categoryId, categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0) {
                throw new common_1.UnauthorizedException('You do not have access to any category');
            }
            return this.prisma.subCategoryAdmin.findMany({
                where: { categoryId: { in: categoryIds } },
                include: {
                    subCategory: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    subCategories: {
                        include: {
                            subCategory: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
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
                orderBy: { createdAt: 'desc' },
            });
        }
        async findOne(id, categoryId, categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0) {
                throw new common_1.UnauthorizedException('You do not have access to any category');
            }
            const subCategoryAdmin = await this.prisma.subCategoryAdmin.findFirst({
                where: { id, categoryId: { in: categoryIds } },
                include: {
                    subCategory: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    subCategories: {
                        include: {
                            subCategory: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
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
            if (!subCategoryAdmin) {
                throw new common_1.NotFoundException(`Subcategory admin with id ${id} not found`);
            }
            return subCategoryAdmin;
        }
        async create(categoryId, categoryAdminId, createSubCategoryAdminDto) {
            const { name, email, subCategoryId } = createSubCategoryAdminDto;
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0) {
                throw new common_1.UnauthorizedException('You do not have access to any category');
            }
            // Subcategory must belong to one of the admin's categories
            const subCategory = await this.prisma.subCategory.findFirst({
                where: {
                    id: subCategoryId,
                    categoryId: { in: categoryIds },
                },
                include: { category: { select: { id: true, name: true } } },
            });
            if (!subCategory) {
                throw new common_1.NotFoundException(`Subcategory with id ${subCategoryId} not found or does not belong to your categories`);
            }
            const categoryAdmin = await this.prisma.categoryAdmin.findUnique({
                where: { id: categoryAdminId },
                include: {
                    school: {
                        select: { domain: true, name: true, id: true },
                    },
                },
            });
            if (!categoryAdmin) {
                throw new common_1.UnauthorizedException('Category admin not found');
            }
            if (!categoryAdmin.school.domain) {
                throw new common_1.BadRequestException('School domain is not set. Please contact super admin.');
            }
            const emailDomain = email.split('@')[1];
            if (!emailDomain || emailDomain.toLowerCase() !== categoryAdmin.school.domain.toLowerCase()) {
                throw new common_1.BadRequestException(`Subcategory admin email domain (${emailDomain || 'invalid'}) must match the school domain (${categoryAdmin.school.domain})`);
            }
            // Check if email already exists
            const existingAdmin = await this.prisma.subCategoryAdmin.findUnique({
                where: { email },
            });
            if (existingAdmin) {
                throw new common_1.BadRequestException('Subcategory admin email already exists');
            }
            // Generate temporary password
            const tempPassword = await this.generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            // Create subcategory admin in transaction
            let result;
            try {
                result = await this.prisma.$transaction(async (tx) => {
                    const subCategoryAdmin = await tx.subCategoryAdmin.create({
                        data: {
                            name,
                            email,
                            password: hashedPassword,
                            subCategoryId,
                            categoryId: subCategory.categoryId,
                            schoolId: categoryAdmin.schoolId,
                        },
                        include: {
                            subCategory: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
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
                    await tx.subCategoryAdminSubCategory.create({
                        data: {
                            id: crypto.randomBytes(16).toString('hex'),
                            subCategoryAdminId: subCategoryAdmin.id,
                            subCategoryId,
                        },
                    });
                    return subCategoryAdmin;
                });
                // Try to send email (don't fail if email fails)
                let emailSent = false;
                let emailError = null;
                try {
                    await this.emailService.sendSubCategoryAdminOnboardingEmail(email, name, categoryAdmin.school.name, subCategory.category.name, subCategory.name, tempPassword);
                    emailSent = true;
                }
                catch (error) {
                    console.error('Failed to send subcategory admin onboarding email:', error);
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
                if (error.message?.includes("Unknown column")) {
                    throw new common_1.BadRequestException('Database migration required. Please run migrations to add subcategory admin tables.');
                }
                throw error;
            }
        }
        async updateSubCategories(id, categoryId, categoryAdminId, updateDto) {
            const subCategoryAdmin = await this.findOne(id, categoryId, categoryAdminId);
            // Verify all subcategories belong to the subcategory admin's category
            const subCategories = await this.prisma.subCategory.findMany({
                where: {
                    id: { in: updateDto.subCategoryIds },
                    categoryId: subCategoryAdmin.categoryId,
                },
                select: { id: true, name: true },
            });
            if (subCategories.length !== updateDto.subCategoryIds.length) {
                throw new common_1.BadRequestException('One or more subcategories do not belong to this category');
            }
            // Get current subcategories
            const currentSubCategories = await this.prisma.subCategoryAdminSubCategory.findMany({
                where: { subCategoryAdminId: id },
                include: {
                    subCategory: {
                        select: { id: true, name: true },
                    },
                },
            });
            const currentSubCategoryIds = currentSubCategories.map((cs) => cs.subCategoryId);
            const newSubCategoryIds = updateDto.subCategoryIds;
            // Find added and removed subcategories
            const addedSubCategoryIds = newSubCategoryIds.filter((id) => !currentSubCategoryIds.includes(id));
            const removedSubCategoryIds = currentSubCategoryIds.filter((id) => !newSubCategoryIds.includes(id));
            // Update in transaction
            const result = await this.prisma.$transaction(async (tx) => {
                // Remove old subcategories
                if (removedSubCategoryIds.length > 0) {
                    await tx.subCategoryAdminSubCategory.deleteMany({
                        where: {
                            subCategoryAdminId: id,
                            subCategoryId: { in: removedSubCategoryIds },
                        },
                    });
                }
                // Add new subcategories
                if (addedSubCategoryIds.length > 0) {
                    await tx.subCategoryAdminSubCategory.createMany({
                        data: addedSubCategoryIds.map((subCategoryId) => ({
                            id: crypto.randomBytes(16).toString('hex'),
                            subCategoryAdminId: id,
                            subCategoryId,
                        })),
                    });
                }
                // Update primary subCategoryId if needed (use first subcategory as primary)
                if (newSubCategoryIds.length > 0 && !newSubCategoryIds.includes(subCategoryAdmin.subCategoryId)) {
                    await tx.subCategoryAdmin.update({
                        where: { id },
                        data: { subCategoryId: newSubCategoryIds[0] },
                    });
                }
                // Return updated subcategory admin with all relations
                const updated = await tx.subCategoryAdmin.findFirst({
                    where: { id, categoryId: subCategoryAdmin.categoryId },
                    include: {
                        subCategory: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        subCategories: {
                            include: {
                                subCategory: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
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
                return updated;
            });
            if (!result) {
                throw new common_1.NotFoundException(`Subcategory admin with id ${id} not found after update`);
            }
            // Send email notification if there are changes
            if (addedSubCategoryIds.length > 0 || removedSubCategoryIds.length > 0) {
                const addedSubCategories = subCategories
                    .filter((s) => addedSubCategoryIds.includes(s.id))
                    .map((s) => s.name);
                const removedSubCategories = currentSubCategories
                    .filter((cs) => removedSubCategoryIds.includes(cs.subCategoryId))
                    .map((cs) => cs.subCategory.name);
                // Get school and category names from result or fetch separately
                let schoolName = '';
                let categoryName = '';
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
                if (result.category) {
                    categoryName = result.category.name;
                }
                else {
                    const category = await this.prisma.category.findUnique({
                        where: { id: result.categoryId },
                        select: { name: true },
                    });
                    categoryName = category?.name || '';
                }
                try {
                    await this.emailService.sendSubCategoryAdminSubCategoriesUpdatedEmail(result.email, result.name, schoolName, categoryName, addedSubCategories, removedSubCategories);
                }
                catch (error) {
                    console.error('Failed to send subcategory update email:', error);
                    // Don't fail the request if email fails
                }
            }
            return result;
        }
        async remove(id, categoryId, categoryAdminId) {
            await this.findOne(id, categoryId, categoryAdminId);
            return this.prisma.subCategoryAdmin.delete({
                where: { id },
            });
        }
    };
    return SubCategoryAdminsService = _classThis;
})();
exports.SubCategoryAdminsService = SubCategoryAdminsService;
//# sourceMappingURL=subcategory-admins.service.js.map