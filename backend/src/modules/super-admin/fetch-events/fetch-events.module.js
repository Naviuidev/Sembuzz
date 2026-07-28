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
exports.FetchEventsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const fetch_events_controller_1 = require("./fetch-events.controller");
const fetch_events_public_controller_1 = require("./fetch-events-public.controller");
const fetch_events_service_1 = require("./fetch-events.service");
const event_candidate_extractor_service_1 = require("./services/event-candidate-extractor.service");
const university_event_validation_service_1 = require("./services/university-event-validation.service");
const web_scraper_service_1 = require("./services/web-scraper.service");
const gpt_extractor_service_1 = require("./services/gpt-extractor.service");
const sync_service_1 = require("./services/sync.service");
const university_sync_job_service_1 = require("./services/university-sync-job.service");
const university_events_timezone_service_1 = require("./services/university-events-timezone.service");
const playwright_renderer_service_1 = require("./services/playwright-renderer.service");
const fetch_events_public_aggregate_controller_js_1 = require("./fetch-events-public-aggregate.controller.js");
let FetchEventsModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule,
                // Reuse the same JWT config as other super-admin sub-modules so SuperAdminGuard works.
                jwt_1.JwtModule.register({
                    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                    signOptions: { expiresIn: '24h' },
                }),
            ],
            controllers: [fetch_events_controller_1.FetchEventsController, fetch_events_public_controller_1.FetchEventsPublicController, fetch_events_public_aggregate_controller_js_1.FetchEventsPublicAggregateController],
            providers: [
                university_events_timezone_service_1.UniversityEventsTimezoneService,
                event_candidate_extractor_service_1.EventCandidateExtractorService,
                university_event_validation_service_1.UniversityEventValidationService,
                playwright_renderer_service_1.PlaywrightRendererService,
                web_scraper_service_1.WebScraperService,
                gpt_extractor_service_1.GptExtractorService,
                sync_service_1.SyncService,
                university_sync_job_service_1.UniversitySyncJobService,
                fetch_events_service_1.FetchEventsService,
            ],
            exports: [fetch_events_service_1.FetchEventsService, playwright_renderer_service_1.PlaywrightRendererService, university_events_timezone_service_1.UniversityEventsTimezoneService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FetchEventsModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FetchEventsModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return FetchEventsModule = _classThis;
})();
exports.FetchEventsModule = FetchEventsModule;
//# sourceMappingURL=fetch-events.module.js.map