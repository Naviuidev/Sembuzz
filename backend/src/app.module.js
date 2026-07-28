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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const published_blogs_service_1 = require("./published-blogs.service");
const events_public_controller_1 = require("./events-public.controller");
const google_auth_controller_1 = require("./google-auth.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const meetings_module_1 = require("./modules/meetings/meetings.module");
const super_admin_module_1 = require("./modules/super-admin/super-admin.module");
const school_admin_module_1 = require("./modules/school-admin/school-admin.module");
const category_admin_module_1 = require("./modules/category-admin/category-admin.module");
const subcategory_admin_module_1 = require("./modules/subcategory-admin/subcategory-admin.module");
const ads_admin_module_1 = require("./modules/ads-admin/ads-admin.module");
const user_module_1 = require("./modules/user/user.module");
const contact_module_1 = require("./modules/contact/contact.module");
const admin_action_items_module_1 = require("./modules/admin-action-items/admin-action-items.module");
let AppModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                }),
                prisma_module_1.PrismaModule,
                meetings_module_1.MeetingsModule,
                super_admin_module_1.SuperAdminModule,
                school_admin_module_1.SchoolAdminModule,
                category_admin_module_1.CategoryAdminModule,
                subcategory_admin_module_1.SubCategoryAdminModule,
                ads_admin_module_1.AdsAdminModule,
                user_module_1.UserModule,
                contact_module_1.ContactModule,
                admin_action_items_module_1.AdminActionItemsModule,
            ],
            controllers: [app_controller_1.AppController, google_auth_controller_1.GoogleAuthController, events_public_controller_1.EventsPublicController],
            providers: [app_service_1.AppService, published_blogs_service_1.PublishedBlogsService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AppModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AppModule = _classThis;
})();
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map