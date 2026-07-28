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
exports.SubCategoryAdminModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const events_module_1 = require("./events/events.module");
const queries_module_1 = require("./queries/queries.module");
const blogs_module_1 = require("./blogs/blogs.module");
const subcategory_admin_club_group_chat_requests_module_1 = require("./club-group-chat-requests/subcategory-admin-club-group-chat-requests.module");
const subcategory_admin_club_group_memberships_module_1 = require("./club-group-memberships/subcategory-admin-club-group-memberships.module");
const subcategory_admin_club_group_chats_module_1 = require("./club-group-chats/subcategory-admin-club-group-chats.module");
const subcategory_admin_direct_chats_module_1 = require("./direct-chats/subcategory-admin-direct-chats.module");
const subcategory_admin_student_chat_groups_module_1 = require("./student-chat-groups/subcategory-admin-student-chat-groups.module");
let SubCategoryAdminModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                auth_module_1.SubCategoryAdminAuthModule,
                events_module_1.EventsModule,
                queries_module_1.SubCategoryAdminQueriesModule,
                blogs_module_1.SubCategoryAdminBlogsModule,
                subcategory_admin_club_group_chat_requests_module_1.SubCategoryAdminClubGroupChatRequestsModule,
                subcategory_admin_club_group_memberships_module_1.SubCategoryAdminClubGroupMembershipsModule,
                subcategory_admin_club_group_chats_module_1.SubCategoryAdminClubGroupChatsModule,
                subcategory_admin_direct_chats_module_1.SubCategoryAdminDirectChatsModule,
                subcategory_admin_student_chat_groups_module_1.SubCategoryAdminStudentChatGroupsModule,
            ],
            exports: [auth_module_1.SubCategoryAdminAuthModule],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return SubCategoryAdminModule = _classThis;
})();
exports.SubCategoryAdminModule = SubCategoryAdminModule;
//# sourceMappingURL=subcategory-admin.module.js.map