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
exports.UpcomingPostsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
/** Parse YYYY-MM-DD as a calendar date (noon UTC) so the stored DATE is correct in any server timezone. */
function parseDateOnly(isoDateStr) {
    const d = new Date(isoDateStr.trim() + 'T12:00:00.000Z');
    if (Number.isNaN(d.getTime()))
        throw new Error('Invalid date');
    return d;
}
let UpcomingPostsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UpcomingPostsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UpcomingPostsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async create(schoolId, dto) {
            await this.validateCategorySubCategory(schoolId, dto.categoryId, dto.subCategoryId);
            const dateStr = dto.scheduledTo ?? dto.scheduledDate;
            if (!dateStr || typeof dateStr !== 'string') {
                throw new common_1.BadRequestException('scheduledTo or scheduledDate is required (ISO 8601 date, e.g. YYYY-MM-DD).');
            }
            const imageUrlsJson = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
            let scheduledTo;
            try {
                scheduledTo = parseDateOnly(dateStr);
            }
            catch {
                throw new common_1.BadRequestException('scheduledTo must be a valid ISO 8601 date string (e.g. YYYY-MM-DD).');
            }
            try {
                return await this.prisma.upcomingPost.create({
                    data: {
                        schoolId,
                        categoryId: dto.categoryId,
                        subCategoryId: dto.subCategoryId,
                        title: dto.title,
                        description: dto.description ?? null,
                        imageUrls: imageUrlsJson,
                        scheduledTo,
                    },
                    include: {
                        school: { select: { id: true, name: true, image: true } },
                        category: { select: { id: true, name: true } },
                        subCategory: { select: { id: true, name: true } },
                    },
                });
            }
            catch (e) {
                const errMsg = e && typeof e === 'object' && 'message' in e ? String(e.message) : '';
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    const msg = (e.meta?.message ?? e.message);
                    if (e.code === 'P2002')
                        throw new common_1.BadRequestException('A post with this data already exists.');
                    if (e.code === 'P2003' || /scheduledDate|scheduledTo|column|field list/i.test(msg)) {
                        throw new common_1.BadRequestException('Database schema may be out of date. Run: npx prisma migrate deploy (from backend folder with MySQL running).');
                    }
                }
                if (/scheduledDate|scheduledTo|Unknown column|doesn't have a default/i.test(errMsg)) {
                    throw new common_1.BadRequestException('Database schema may be out of date. Run: npx prisma migrate deploy (from backend folder with MySQL running).');
                }
                throw e;
            }
        }
        async findAllForSchool(schoolId) {
            return this.prisma.upcomingPost.findMany({
                where: { schoolId },
                include: {
                    category: { select: { id: true, name: true } },
                    subCategory: { select: { id: true, name: true } },
                },
                orderBy: [{ scheduledTo: 'asc' }, { createdAt: 'desc' }],
            });
        }
        async findOne(id, schoolId) {
            const post = await this.prisma.upcomingPost.findFirst({
                where: { id, schoolId },
                include: {
                    school: { select: { id: true, name: true, image: true } },
                    category: { select: { id: true, name: true } },
                    subCategory: { select: { id: true, name: true } },
                },
            });
            if (!post)
                throw new common_1.NotFoundException('Upcoming post not found');
            return post;
        }
        async update(id, schoolId, dto) {
            const existing = await this.prisma.upcomingPost.findFirst({ where: { id, schoolId } });
            if (!existing)
                throw new common_1.NotFoundException('Upcoming post not found');
            if (dto.categoryId != null || dto.subCategoryId != null) {
                await this.validateCategorySubCategory(schoolId, dto.categoryId ?? existing.categoryId, dto.subCategoryId ?? existing.subCategoryId);
            }
            const data = {};
            if (dto.title !== undefined)
                data.title = dto.title;
            if (dto.description !== undefined)
                data.description = dto.description || null;
            if (dto.categoryId !== undefined)
                data.categoryId = dto.categoryId;
            if (dto.subCategoryId !== undefined)
                data.subCategoryId = dto.subCategoryId;
            if (dto.imageUrls !== undefined) {
                data.imageUrls = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
            }
            if (dto.scheduledTo !== undefined) {
                try {
                    data.scheduledTo = parseDateOnly(dto.scheduledTo);
                }
                catch {
                    throw new common_1.BadRequestException('scheduledTo must be a valid ISO 8601 date string (e.g. YYYY-MM-DD).');
                }
            }
            return this.prisma.upcomingPost.update({
                where: { id },
                data,
                include: {
                    school: { select: { id: true, name: true, image: true } },
                    category: { select: { id: true, name: true } },
                    subCategory: { select: { id: true, name: true } },
                },
            });
        }
        async remove(id, schoolId) {
            const existing = await this.prisma.upcomingPost.findFirst({ where: { id, schoolId } });
            if (!existing)
                throw new common_1.NotFoundException('Upcoming post not found');
            await this.prisma.upcomingPost.delete({ where: { id } });
            return { deleted: true };
        }
        async validateCategorySubCategory(schoolId, categoryId, subCategoryId) {
            const cat = await this.prisma.category.findFirst({
                where: { id: categoryId, schoolId },
                include: { subcategories: { where: { id: subCategoryId }, select: { id: true } } },
            });
            if (!cat)
                throw new common_1.BadRequestException('Category not found');
            if (!cat.subcategories.length)
                throw new common_1.BadRequestException('Subcategory not found or does not belong to category');
        }
    };
    return UpcomingPostsService = _classThis;
})();
exports.UpcomingPostsService = UpcomingPostsService;
//# sourceMappingURL=upcoming-posts.service.js.map