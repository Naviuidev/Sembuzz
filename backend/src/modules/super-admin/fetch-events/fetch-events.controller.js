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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
exports.FetchEventsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const super_admin_guard_1 = require("../guards/super-admin.guard");
/** Rosters may be .xlsx (larger than CSV); keep a modest cap. */
const CSV_MAX_SIZE = 12 * 1024 * 1024; // 12MB
let FetchEventsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('super-admin/fetch-events'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _uploadCsv_decorators;
    let _uploadUrl_decorators;
    let _syncAll_decorators;
    let _syncOne_decorators;
    let _listSources_decorators;
    let _listBatches_decorators;
    let _syncBatch_decorators;
    let _deleteBatch_decorators;
    let _listSyncJobs_decorators;
    let _getSyncJob_decorators;
    let _listRuns_decorators;
    let _toggleSource_decorators;
    let _deleteSource_decorators;
    let _listEvents_decorators;
    let _deleteEvent_decorators;
    var FetchEventsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _uploadCsv_decorators = [(0, common_1.Post)('upload-csv'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.memoryStorage(),
                    limits: { fileSize: CSV_MAX_SIZE },
                }))];
            _uploadUrl_decorators = [(0, common_1.Post)('upload-url')];
            _syncAll_decorators = [(0, common_1.Post)('sync')];
            _syncOne_decorators = [(0, common_1.Post)('sources/:id/sync')];
            _listSources_decorators = [(0, common_1.Get)('sources')];
            _listBatches_decorators = [(0, common_1.Get)('batches')];
            _syncBatch_decorators = [(0, common_1.Post)('batches/:batchId/sync')];
            _deleteBatch_decorators = [(0, common_1.Delete)('batches/:batchId')];
            _listSyncJobs_decorators = [(0, common_1.Get)('sync-jobs')];
            _getSyncJob_decorators = [(0, common_1.Get)('sync-jobs/:id')];
            _listRuns_decorators = [(0, common_1.Get)('runs')];
            _toggleSource_decorators = [(0, common_1.Patch)('sources/:id')];
            _deleteSource_decorators = [(0, common_1.Delete)('sources/:id')];
            _listEvents_decorators = [(0, common_1.Get)('events')];
            _deleteEvent_decorators = [(0, common_1.Delete)('events/:id')];
            __esDecorate(this, null, _uploadCsv_decorators, { kind: "method", name: "uploadCsv", static: false, private: false, access: { has: obj => "uploadCsv" in obj, get: obj => obj.uploadCsv }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadUrl_decorators, { kind: "method", name: "uploadUrl", static: false, private: false, access: { has: obj => "uploadUrl" in obj, get: obj => obj.uploadUrl }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _syncAll_decorators, { kind: "method", name: "syncAll", static: false, private: false, access: { has: obj => "syncAll" in obj, get: obj => obj.syncAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _syncOne_decorators, { kind: "method", name: "syncOne", static: false, private: false, access: { has: obj => "syncOne" in obj, get: obj => obj.syncOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listSources_decorators, { kind: "method", name: "listSources", static: false, private: false, access: { has: obj => "listSources" in obj, get: obj => obj.listSources }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listBatches_decorators, { kind: "method", name: "listBatches", static: false, private: false, access: { has: obj => "listBatches" in obj, get: obj => obj.listBatches }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _syncBatch_decorators, { kind: "method", name: "syncBatch", static: false, private: false, access: { has: obj => "syncBatch" in obj, get: obj => obj.syncBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteBatch_decorators, { kind: "method", name: "deleteBatch", static: false, private: false, access: { has: obj => "deleteBatch" in obj, get: obj => obj.deleteBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listSyncJobs_decorators, { kind: "method", name: "listSyncJobs", static: false, private: false, access: { has: obj => "listSyncJobs" in obj, get: obj => obj.listSyncJobs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSyncJob_decorators, { kind: "method", name: "getSyncJob", static: false, private: false, access: { has: obj => "getSyncJob" in obj, get: obj => obj.getSyncJob }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listRuns_decorators, { kind: "method", name: "listRuns", static: false, private: false, access: { has: obj => "listRuns" in obj, get: obj => obj.listRuns }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _toggleSource_decorators, { kind: "method", name: "toggleSource", static: false, private: false, access: { has: obj => "toggleSource" in obj, get: obj => obj.toggleSource }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteSource_decorators, { kind: "method", name: "deleteSource", static: false, private: false, access: { has: obj => "deleteSource" in obj, get: obj => obj.deleteSource }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listEvents_decorators, { kind: "method", name: "listEvents", static: false, private: false, access: { has: obj => "listEvents" in obj, get: obj => obj.listEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteEvent_decorators, { kind: "method", name: "deleteEvent", static: false, private: false, access: { has: obj => "deleteEvent" in obj, get: obj => obj.deleteEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FetchEventsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        // -------- CSV / URL ingest --------
        async uploadCsv(file) {
            if (!file)
                throw new common_1.BadRequestException('Spreadsheet file is required');
            const buffer = file.buffer ?? file.buffer;
            if (!buffer)
                throw new common_1.BadRequestException('Could not read CSV');
            return this.service.ingestCsv(buffer, file.originalname);
        }
        async uploadUrl(body) {
            return this.service.addUrlSource(body.universityName || '', body.url || '');
        }
        // -------- Sync --------
        async syncAll() {
            return this.service.syncAll();
        }
        async syncOne(id) {
            return this.service.syncOne(id);
        }
        // -------- Sources --------
        async listSources() {
            return this.service.listSources();
        }
        // -------- CSV batches --------
        async listBatches() {
            return this.service.listBatches();
        }
        async syncBatch(batchId) {
            return this.service.syncBatch(batchId);
        }
        async deleteBatch(batchId) {
            return this.service.deleteBatch(batchId);
        }
        async listSyncJobs(limit) {
            return this.service.listSyncJobs(limit ? Number(limit) : undefined);
        }
        async getSyncJob(id) {
            return this.service.getSyncJob(id);
        }
        // -------- Sync runs (Phenom-style history) --------
        async listRuns(limit) {
            return this.service.listRecentRuns(limit ? Number(limit) : undefined);
        }
        async toggleSource(id, body) {
            return this.service.toggleSourceActive(id, body.isActive !== false);
        }
        async deleteSource(id) {
            return this.service.deleteSource(id);
        }
        // -------- Events --------
        async listEvents(search, category, sourceId, upcoming, latest, trending, dateUtc, sort, order, page, pageSize) {
            return this.service.listEvents({
                search,
                category,
                sourceId,
                upcoming: upcoming === '1' || upcoming === 'true',
                latest: latest === '1' || latest === 'true',
                trending: trending === '1' || trending === 'true',
                onDateUtc: dateUtc?.trim() || undefined,
                sort: sort || undefined,
                order: order || undefined,
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
        }
        async deleteEvent(id) {
            return this.service.deleteEvent(id);
        }
    };
    return FetchEventsController = _classThis;
})();
exports.FetchEventsController = FetchEventsController;
//# sourceMappingURL=fetch-events.controller.js.map