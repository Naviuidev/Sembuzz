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
exports.CategoryAdminModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const banner_ads_module_1 = require("./banner-ads/banner-ads.module");
const sponsored_ads_module_1 = require("./sponsored-ads/sponsored-ads.module");
const categories_module_1 = require("./categories/categories.module");
const events_module_1 = require("./events/events.module");
const category_admin_blogs_module_1 = require("./blogs/category-admin-blogs.module");
const queries_module_1 = require("./queries/queries.module");
const category_admin_club_group_memberships_module_1 = require("./club-group-memberships/category-admin-club-group-memberships.module");
const category_admin_club_group_chats_module_1 = require("./club-group-chats/category-admin-club-group-chats.module");
const category_admin_direct_chats_module_1 = require("./direct-chats/category-admin-direct-chats.module");
const category_admin_club_group_chat_requests_module_1 = require("./club-group-chat-requests/category-admin-club-group-chat-requests.module");
const subcategory_admins_module_1 = require("./subcategory-admins/subcategory-admins.module");
let CategoryAdminModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                auth_module_1.CategoryAdminAuthModule,
                banner_ads_module_1.CategoryAdminBannerAdsModule,
                sponsored_ads_module_1.CategoryAdminSponsoredAdsModule,
                categories_module_1.CategoryAdminCategoriesModule,
                events_module_1.CategoryAdminEventsModule,
                category_admin_blogs_module_1.CategoryAdminBlogsModule,
                queries_module_1.CategoryAdminQueriesModule,
                category_admin_club_group_memberships_module_1.CategoryAdminClubGroupMembershipsModule,
                category_admin_club_group_chats_module_1.CategoryAdminClubGroupChatsModule,
                category_admin_direct_chats_module_1.CategoryAdminDirectChatsModule,
                category_admin_club_group_chat_requests_module_1.CategoryAdminClubGroupChatRequestsModule,
                subcategory_admins_module_1.SubCategoryAdminsModule,
            ],
            exports: [
                auth_module_1.CategoryAdminAuthModule,
                banner_ads_module_1.CategoryAdminBannerAdsModule,
                sponsored_ads_module_1.CategoryAdminSponsoredAdsModule,
                categories_module_1.CategoryAdminCategoriesModule,
                events_module_1.CategoryAdminEventsModule,
                category_admin_blogs_module_1.CategoryAdminBlogsModule,
                queries_module_1.CategoryAdminQueriesModule,
                category_admin_club_group_memberships_module_1.CategoryAdminClubGroupMembershipsModule,
                category_admin_club_group_chats_module_1.CategoryAdminClubGroupChatsModule,
                category_admin_direct_chats_module_1.CategoryAdminDirectChatsModule,
                subcategory_admins_module_1.SubCategoryAdminsModule,
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return CategoryAdminModule = _classThis;
})();
exports.CategoryAdminModule = CategoryAdminModule;
//# sourceMappingURL=category-admin.module.js.map