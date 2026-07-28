"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
let CategoriesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoriesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoriesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll(schoolId) {
            return this.prisma.category.findMany({
                where: { schoolId },
                include: {
                    subcategories: {
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });
        }
        async findOne(id, schoolId) {
            const category = await this.prisma.category.findFirst({
                where: { id, schoolId },
                include: {
                    subcategories: {
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!category) {
                throw new common_1.NotFoundException(`Category with id ${id} not found`);
            }
            return category;
        }
        async create(schoolId, createCategoryDto) {
            const { name, subcategories } = createCategoryDto;
            // Check if category with same name already exists for this school (case-insensitive)
            const existing = await this.prisma.category.findFirst({
                where: {
                    schoolId,
                    name: {
                        equals: name,
                    },
                },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Category with name "${name}" already exists`);
            }
            // Create category with optional subcategories
            return this.prisma.category.create({
                data: {
                    schoolId,
                    name,
                    subcategories: subcategories && subcategories.length > 0
                        ? {
                            create: subcategories.map((subName) => ({ name: subName })),
                        }
                        : undefined,
                },
                include: {
                    subcategories: true,
                },
            });
        }
        async update(id, schoolId, updateCategoryDto) {
            const category = await this.findOne(id, schoolId);
            // Check if new name conflicts with existing category
            if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
                const existing = await this.prisma.category.findFirst({
                    where: {
                        schoolId,
                        name: {
                            equals: updateCategoryDto.name,
                        },
                        id: { not: id },
                    },
                });
                if (existing) {
                    throw new common_1.BadRequestException(`Category with name "${updateCategoryDto.name}" already exists`);
                }
            }
            return this.prisma.category.update({
                where: { id },
                data: updateCategoryDto,
                include: {
                    subcategories: true,
                },
            });
        }
        async remove(id, schoolId) {
            const category = await this.findOne(id, schoolId);
            return this.prisma.category.delete({
                where: { id },
            });
        }
        // SubCategory methods
        async createSubCategory(schoolId, createSubCategoryDto) {
            const { name, categoryId } = createSubCategoryDto;
            // Verify category belongs to school
            const category = await this.findOne(categoryId, schoolId);
            // Check if subcategory with same name already exists in this category (case-insensitive)
            const existing = await this.prisma.subCategory.findFirst({
                where: {
                    categoryId,
                    name: {
                        equals: name,
                    },
                },
            });
            if (existing) {
                throw new common_1.BadRequestException(`SubCategory with name "${name}" already exists in this category`);
            }
            return this.prisma.subCategory.create({
                data: {
                    categoryId,
                    name,
                },
            });
        }
        async updateSubCategory(id, schoolId, updateSubCategoryDto) {
            const subCategory = await this.prisma.subCategory.findUnique({
                where: { id },
                include: { category: true },
            });
            if (!subCategory) {
                throw new common_1.NotFoundException(`SubCategory with id ${id} not found`);
            }
            // Verify category belongs to school
            if (subCategory.category.schoolId !== schoolId) {
                throw new common_1.NotFoundException(`SubCategory with id ${id} not found`);
            }
            // Check if new name conflicts with existing subcategory in same category
            if (updateSubCategoryDto.name && updateSubCategoryDto.name !== subCategory.name) {
                const existing = await this.prisma.subCategory.findFirst({
                    where: {
                        categoryId: subCategory.categoryId,
                        name: {
                            equals: updateSubCategoryDto.name,
                        },
                        id: { not: id },
                    },
                });
                if (existing) {
                    throw new common_1.BadRequestException(`SubCategory with name "${updateSubCategoryDto.name}" already exists in this category`);
                }
            }
            return this.prisma.subCategory.update({
                where: { id },
                data: updateSubCategoryDto,
            });
        }
        async removeSubCategory(id, schoolId) {
            const subCategory = await this.prisma.subCategory.findUnique({
                where: { id },
                include: { category: true },
            });
            if (!subCategory) {
                throw new common_1.NotFoundException(`SubCategory with id ${id} not found`);
            }
            // Verify category belongs to school
            if (subCategory.category.schoolId !== schoolId) {
                throw new common_1.NotFoundException(`SubCategory with id ${id} not found`);
            }
            return this.prisma.subCategory.delete({
                where: { id },
            });
        }
    };
    return CategoriesService = _classThis;
})();
exports.CategoriesService = CategoriesService;
//# sourceMappingURL=categories.service.js.map