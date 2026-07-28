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
exports.FeaturesService = void 0;
const common_1 = require("@nestjs/common");
let FeaturesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FeaturesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeaturesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll() {
            try {
                return await this.prisma.feature.findMany({
                    orderBy: { createdAt: 'asc' },
                });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error('[SuperAdmin Features] findAll error:', message, err);
                throw new common_1.HttpException({ statusCode: 500, message: 'Failed to load features' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async findByCode(code) {
            return this.prisma.feature.findUnique({
                where: { code },
            });
        }
        async findById(id) {
            return this.prisma.feature.findUnique({
                where: { id },
            });
        }
        async create(createFeatureDto) {
            // Check if feature with same code already exists
            const existing = await this.findByCode(createFeatureDto.code);
            if (existing) {
                throw new common_1.ConflictException(`Feature with code ${createFeatureDto.code} already exists`);
            }
            return this.prisma.feature.create({
                data: {
                    code: createFeatureDto.code,
                    name: createFeatureDto.name,
                },
            });
        }
        async update(id, updateFeatureDto) {
            const feature = await this.findById(id);
            if (!feature) {
                throw new common_1.NotFoundException(`Feature with id ${id} not found`);
            }
            return this.prisma.feature.update({
                where: { id },
                data: updateFeatureDto,
            });
        }
        async remove(id) {
            const feature = await this.findById(id);
            if (!feature) {
                throw new common_1.NotFoundException(`Feature with id ${id} not found`);
            }
            // Check if feature is being used by any schools
            const schoolFeatures = await this.prisma.schoolFeature.findMany({
                where: { featureId: id },
            });
            if (schoolFeatures.length > 0) {
                throw new common_1.ConflictException(`Cannot delete feature. It is currently assigned to ${schoolFeatures.length} school(s)`);
            }
            return this.prisma.feature.delete({
                where: { id },
            });
        }
        async seedFeatures() {
            const features = [
                { code: 'NEWS', name: 'News' },
                { code: 'EVENTS', name: 'Events' },
                { code: 'ADS', name: 'Advertisements' },
                { code: 'INSTAGRAM', name: 'Instagram Feed' },
                { code: 'ANALYTICS', name: 'Analytics' },
                { code: 'EMERGENCY', name: 'Emergency Notifications' },
                { code: 'GROUP_MESSAGING', name: 'Group messages' },
                { code: 'INDIVIDUAL_MESSAGING', name: 'Individual messages' },
            ];
            for (const feature of features) {
                await this.prisma.feature.upsert({
                    where: { code: feature.code },
                    update: {},
                    create: feature,
                });
            }
            return this.findAll();
        }
    };
    return FeaturesService = _classThis;
})();
exports.FeaturesService = FeaturesService;
//# sourceMappingURL=features.service.js.map