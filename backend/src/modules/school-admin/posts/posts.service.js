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
exports.SchoolAdminPostsService = void 0;
const common_1 = require("@nestjs/common");
let SchoolAdminPostsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SchoolAdminPostsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SchoolAdminPostsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAllForSchool(schoolId) {
            return this.prisma.event.findMany({
                where: { schoolId },
                include: {
                    subCategory: {
                        select: {
                            id: true,
                            name: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                    subCategoryAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findOne(id, schoolId) {
            const event = await this.prisma.event.findFirst({
                where: { id, schoolId },
                include: {
                    subCategory: {
                        select: {
                            id: true,
                            name: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                    subCategoryAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            if (!event) {
                throw new common_1.NotFoundException('Post not found');
            }
            return event;
        }
        async delete(id, schoolId) {
            const event = await this.prisma.event.findFirst({
                where: { id, schoolId },
            });
            if (!event) {
                throw new common_1.NotFoundException('Post not found');
            }
            await this.prisma.event.delete({ where: { id } });
            return { deleted: true };
        }
        async update(id, schoolId, data) {
            const event = await this.prisma.event.findFirst({
                where: { id, schoolId },
                include: {
                    subCategory: {
                        select: {
                            id: true,
                            name: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                    subCategoryAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            if (!event) {
                throw new common_1.NotFoundException('Post not found');
            }
            const updateData = {};
            if (data.title !== undefined)
                updateData.title = data.title;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.externalLink !== undefined)
                updateData.externalLink = data.externalLink || null;
            if (data.commentsEnabled !== undefined)
                updateData.commentsEnabled = data.commentsEnabled;
            if (data.imageUrls !== undefined) {
                const arr = Array.isArray(data.imageUrls) ? data.imageUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
                updateData.imageUrls = arr.length > 0 ? JSON.stringify(arr) : null;
            }
            const updated = await this.prisma.event.update({
                where: { id },
                data: updateData,
                include: {
                    subCategory: {
                        select: {
                            id: true,
                            name: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                    subCategoryAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            return updated;
        }
    };
    return SchoolAdminPostsService = _classThis;
})();
exports.SchoolAdminPostsService = SchoolAdminPostsService;
//# sourceMappingURL=posts.service.js.map