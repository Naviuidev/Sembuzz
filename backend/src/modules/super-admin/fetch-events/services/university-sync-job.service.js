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
exports.UniversitySyncJobService = void 0;
const common_1 = require("@nestjs/common");
let UniversitySyncJobService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UniversitySyncJobService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UniversitySyncJobService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        sync;
        config;
        logger = new common_1.Logger(UniversitySyncJobService.name);
        timer = null;
        tickInFlight = false;
        constructor(prisma, sync, config) {
            this.prisma = prisma;
            this.sync = sync;
            this.config = config;
        }
        onModuleInit() {
            if (this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') === '1') {
                this.logger.log('University sync job processor disabled (UNIVERSITY_SYNC_JOBS_DISABLED=1)');
                return;
            }
            const ms = Math.max(500, Number(this.config.get('UNIVERSITY_SYNC_JOB_TICK_MS')) || 1500);
            this.timer = setInterval(() => {
                void this.safeTick();
            }, ms);
            if (typeof this.timer.unref === 'function')
                this.timer.unref();
            this.logger.log(`University sync job worker polling every ${ms}ms`);
        }
        onModuleDestroy() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
        async enqueueBatch(batchId, sourceIds) {
            const job = await this.prisma.universitySyncJob.create({
                data: {
                    kind: 'csv_batch',
                    batchId,
                    sourceIds: sourceIds,
                    progressTotal: sourceIds.length,
                    message: 'Queued',
                },
            });
            return job.id;
        }
        async enqueueAllActive() {
            const rows = await this.prisma.universitySource.findMany({
                where: { isActive: true },
                orderBy: { lastSyncedAt: 'asc' },
                select: { id: true },
            });
            const sourceIds = rows.map((r) => r.id);
            if (sourceIds.length === 0) {
                const job = await this.prisma.universitySyncJob.create({
                    data: {
                        kind: 'all_active',
                        sourceIds: [],
                        progressTotal: 0,
                        progressDone: 0,
                        status: 'completed',
                        message: 'No active sources',
                        completedAt: new Date(),
                    },
                });
                return job.id;
            }
            const job = await this.prisma.universitySyncJob.create({
                data: {
                    kind: 'all_active',
                    sourceIds: sourceIds,
                    progressTotal: sourceIds.length,
                    message: 'Queued',
                },
            });
            return job.id;
        }
        async enqueueSingle(sourceId) {
            const job = await this.prisma.universitySyncJob.create({
                data: {
                    kind: 'single_source',
                    sourceIds: [sourceId],
                    progressTotal: 1,
                    message: 'Queued',
                },
            });
            return job.id;
        }
        async listJobs(limit = 40) {
            const safe = Math.min(100, Math.max(1, limit));
            return this.prisma.universitySyncJob.findMany({
                orderBy: { createdAt: 'desc' },
                take: safe,
            });
        }
        async getJob(id) {
            return this.prisma.universitySyncJob.findUnique({ where: { id } });
        }
        async safeTick() {
            if (this.tickInFlight)
                return;
            this.tickInFlight = true;
            try {
                await this.tick();
            }
            catch (e) {
                this.logger.error(`Sync job tick failed: ${e.message}`);
            }
            finally {
                this.tickInFlight = false;
            }
        }
        async tick() {
            const job = await this.prisma.universitySyncJob.findFirst({
                where: { status: 'pending' },
                orderBy: { createdAt: 'asc' },
            });
            if (!job)
                return;
            const locked = await this.prisma.universitySyncJob.updateMany({
                where: { id: job.id, status: 'pending' },
                data: { status: 'running', startedAt: new Date(), message: 'Running…' },
            });
            if (locked.count !== 1)
                return;
            const sourceIds = job.sourceIds;
            if (!Array.isArray(sourceIds) || sourceIds.length === 0 || !sourceIds.every((x) => typeof x === 'string')) {
                await this.failJob(job.id, 'Invalid or empty sourceIds JSON on job');
                return;
            }
            const ids = sourceIds;
            const rawPar = Number(this.config.get('UNIVERSITY_JOB_SOURCE_PARALLEL'));
            const concurrency = Number.isFinite(rawPar) && rawPar >= 1 ? Math.min(rawPar, 6) : 2;
            try {
                let done = 0;
                for (let i = 0; i < ids.length; i += concurrency) {
                    const slice = ids.slice(i, i + concurrency);
                    await Promise.all(slice.map(async (sid) => {
                        await this.prisma.universitySyncJob.update({
                            where: { id: job.id },
                            data: { currentSourceId: sid },
                        });
                        await this.sync.syncSource(sid);
                    }));
                    done += slice.length;
                    await this.prisma.universitySyncJob.update({
                        where: { id: job.id },
                        data: {
                            progressDone: done,
                            message: `Processed ${done}/${ids.length}`,
                        },
                    });
                }
                await this.prisma.universitySyncJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'completed',
                        progressDone: ids.length,
                        completedAt: new Date(),
                        message: 'Completed',
                        currentSourceId: null,
                    },
                });
            }
            catch (e) {
                await this.failJob(job.id, e.message || 'job failed');
            }
        }
        async failJob(id, err) {
            await this.prisma.universitySyncJob.update({
                where: { id },
                data: {
                    status: 'failed',
                    error: err.slice(0, 2000),
                    completedAt: new Date(),
                    message: 'Failed',
                    currentSourceId: null,
                },
            });
        }
    };
    return UniversitySyncJobService = _classThis;
})();
exports.UniversitySyncJobService = UniversitySyncJobService;
//# sourceMappingURL=university-sync-job.service.js.map