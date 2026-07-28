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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
let EventsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EventsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EventsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        prisma;
        openai = null;
        constructor(config, prisma) {
            this.config = config;
            this.prisma = prisma;
            const apiKey = this.config.get('OPENAI_API_KEY');
            if (apiKey) {
                this.openai = new openai_1.default({ apiKey });
            }
        }
        async create(subCategoryAdminId, dto) {
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: subCategoryAdminId },
                select: { categoryId: true, schoolId: true },
            });
            if (!admin) {
                throw new common_1.ForbiddenException('Subcategory admin not found');
            }
            const imageUrlsJson = dto.imageUrls?.length
                ? JSON.stringify(dto.imageUrls)
                : null;
            try {
                return await this.prisma.event.create({
                    data: {
                        subCategoryAdminId,
                        subCategoryId: dto.subCategoryId,
                        categoryId: admin.categoryId,
                        schoolId: admin.schoolId,
                        title: dto.title.trim(),
                        description: dto.description ?? null,
                        externalLink: dto.externalLink ?? null,
                        commentsEnabled: dto.commentsEnabled ?? true,
                        imageUrls: imageUrlsJson,
                        status: 'pending',
                    },
                    include: {
                        subCategory: { select: { id: true, name: true } },
                    },
                });
            }
            catch (e) {
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (e.code === 'P2003') {
                        throw new common_1.BadRequestException('Invalid subcategory. Pick a subcategory you manage and try again.');
                    }
                    if (e.code === 'P2002') {
                        throw new common_1.BadRequestException('Duplicate event. Try again.');
                    }
                }
                throw e;
            }
        }
        async findPendingBySubCategoryAdmin(subCategoryAdminId) {
            return this.prisma.event.findMany({
                where: {
                    subCategoryAdminId,
                    status: 'pending',
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findRevertedBySubCategoryAdmin(subCategoryAdminId) {
            return this.prisma.event.findMany({
                where: {
                    subCategoryAdminId,
                    status: 'reverted',
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        async findApprovedBySubCategoryAdmin(subCategoryAdminId) {
            return this.prisma.event.findMany({
                where: {
                    subCategoryAdminId,
                    status: 'approved',
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        async analyzeBannerImage(imageBuffer, mimeType) {
            if (!this.openai) {
                throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in .env');
            }
            const base64 = imageBuffer.toString('base64');
            const mediaType = mimeType || 'image/jpeg';
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this banner/event image and extract or suggest:
1. title - A short, clear title for the event or content (one line).
2. description - A brief description (2-4 sentences). If no text is visible, describe what the image shows and suggest a generic description.
3. externalLink - If any URL or link is visible in the image, extract it. Otherwise return empty string "".

Respond ONLY with valid JSON in this exact format, no other text:
{"title":"...","description":"...","externalLink":"..."}`,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mediaType};base64,${base64}`,
                                },
                            },
                        ],
                    },
                ],
            });
            const content = response.choices[0]?.message?.content?.trim();
            if (!content) {
                return { title: '', description: '', externalLink: '' };
            }
            try {
                const parsed = JSON.parse(content);
                return {
                    title: typeof parsed.title === 'string' ? parsed.title : '',
                    description: typeof parsed.description === 'string' ? parsed.description : '',
                    externalLink: typeof parsed.externalLink === 'string' ? parsed.externalLink : '',
                };
            }
            catch {
                return { title: '', description: '', externalLink: '' };
            }
        }
    };
    return EventsService = _classThis;
})();
exports.EventsService = EventsService;
//# sourceMappingURL=events.service.js.map