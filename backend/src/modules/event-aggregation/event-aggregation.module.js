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
exports.EventAggregationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const fetch_events_module_1 = require("../super-admin/fetch-events/fetch-events.module");
const scraped_events_admin_controller_1 = require("./events/scraped-events-admin.controller");
const scraped_events_service_1 = require("./events/scraped-events.service");
const scraped_event_sources_admin_controller_1 = require("./event-sources/scraped-event-sources-admin.controller");
const scraped_event_sources_service_1 = require("./event-sources/scraped-event-sources.service");
const scraped_sync_admin_controller_1 = require("./sync/scraped-sync-admin.controller");
const scraped_sync_service_1 = require("./sync/scraped-sync.service");
const scraped_html_loader_service_1 = require("./scrapers/scraped-html-loader.service");
const json_event_upload_admin_controller_1 = require("./json-upload/json-event-upload-admin.controller");
const json_event_upload_service_1 = require("./json-upload/json-event-upload.service");
let EventAggregationModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule,
                fetch_events_module_1.FetchEventsModule,
                jwt_1.JwtModule.register({
                    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                    signOptions: { expiresIn: '24h' },
                }),
            ],
            controllers: [
                scraped_events_admin_controller_1.ScrapedEventsAdminController,
                scraped_event_sources_admin_controller_1.ScrapedEventSourcesAdminController,
                scraped_sync_admin_controller_1.ScrapedSyncAdminController,
                json_event_upload_admin_controller_1.JsonEventUploadAdminController,
            ],
            providers: [
                scraped_events_service_1.ScrapedEventsService,
                scraped_event_sources_service_1.ScrapedEventSourcesService,
                scraped_html_loader_service_1.ScrapedHtmlLoaderService,
                scraped_sync_service_1.ScrapedSyncService,
                json_event_upload_service_1.JsonEventUploadService,
            ],
            exports: [
                scraped_events_service_1.ScrapedEventsService,
                scraped_event_sources_service_1.ScrapedEventSourcesService,
                scraped_sync_service_1.ScrapedSyncService,
                json_event_upload_service_1.JsonEventUploadService,
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var EventAggregationModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EventAggregationModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return EventAggregationModule = _classThis;
})();
exports.EventAggregationModule = EventAggregationModule;
//# sourceMappingURL=event-aggregation.module.js.map