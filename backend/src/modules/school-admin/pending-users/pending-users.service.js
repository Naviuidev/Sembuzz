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
exports.PendingUsersService = void 0;
const common_1 = require("@nestjs/common");
let PendingUsersService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PendingUsersService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PendingUsersService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        emailService;
        jwtService;
        constructor(prisma, emailService, jwtService) {
            this.prisma = prisma;
            this.emailService = emailService;
            this.jwtService = jwtService;
        }
        async findPendingForSchool(schoolId) {
            return this.prisma.user.findMany({
                where: { schoolId, status: 'pending_approval' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    profilePicUrl: true,
                    verificationDocUrl: true,
                    additionalVerificationDocUrl: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        async approve(userId, schoolId) {
            const user = await this.prisma.user.findFirst({
                where: { id: userId, schoolId },
                include: { school: { select: { name: true } } },
            });
            if (!user) {
                throw new common_1.NotFoundException('Pending user not found');
            }
            if (user.status !== 'pending_approval') {
                throw new common_1.BadRequestException('User is not pending approval');
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const token = this.jwtService.sign({ sub: user.id, purpose: 'approval_email_verify' }, { expiresIn: '7d' });
            const verifyLink = `${frontendUrl}/verify-approval?token=${encodeURIComponent(token)}`;
            const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
            console.log('[PendingUsersService] Sending approval email to', user.email, 'with verify link');
            try {
                await this.emailService.sendApprovalEmailWithVerifyLink(user.email, userName, user.school.name, verifyLink);
            }
            catch (err) {
                console.error('[PendingUsersService] Approval email failed:', err);
                throw new common_1.BadRequestException('User was not approved. We couldn\'t send the approval email. Please try again.');
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { status: 'active' },
            });
            return { success: true };
        }
        async reject(userId, schoolId) {
            const user = await this.prisma.user.findFirst({
                where: { id: userId, schoolId },
                include: { school: { select: { name: true } } },
            });
            if (!user) {
                throw new common_1.NotFoundException('Pending user not found');
            }
            if (user.status !== 'pending_approval') {
                throw new common_1.BadRequestException('User is not pending approval');
            }
            const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
            try {
                await this.emailService.sendRejectionEmailToUser(user.email, userName, user.school.name);
            }
            catch (err) {
                console.error('[PendingUsersService] Rejection email failed:', err);
                throw new common_1.BadRequestException('We couldn\'t send the rejection email. Please try again.');
            }
            await this.prisma.user.delete({
                where: { id: userId },
            });
            return { success: true };
        }
        async requestDocs(userId, schoolId) {
            const user = await this.prisma.user.findFirst({
                where: { id: userId, schoolId },
                include: { school: { select: { name: true } } },
            });
            if (!user) {
                throw new common_1.NotFoundException('Pending user not found');
            }
            if (user.status !== 'pending_approval') {
                throw new common_1.BadRequestException('User is not pending approval');
            }
            const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
            try {
                await this.emailService.sendDocumentRequestToUser(user.email, userName, user.school.name);
            }
            catch (err) {
                console.error('[PendingUsersService] requestDocs email failed:', err);
                throw new common_1.BadRequestException('We couldn\'t send the document request email. Please try again or approve/deny directly.');
            }
            return { success: true };
        }
        async askReupload(userId, schoolId, message, type = 'reupload') {
            const user = await this.prisma.user.findFirst({
                where: { id: userId, schoolId },
                include: { school: { select: { name: true } } },
            });
            if (!user) {
                throw new common_1.NotFoundException('Pending user not found');
            }
            if (user.status !== 'pending_approval') {
                throw new common_1.BadRequestException('User is not pending approval');
            }
            const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
            const trimmedMessage = (message || '').trim();
            if (!trimmedMessage) {
                throw new common_1.BadRequestException('Please provide a message to send to the student.');
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const token = this.jwtService.sign({ sub: user.id, type, purpose: 'update_verification_doc' }, { expiresIn: '7d' });
            const updateDocLink = `${frontendUrl}/update-verification-doc?token=${encodeURIComponent(token)}`;
            console.log('[PendingUsersService] Reupload email link generated:', updateDocLink.substring(0, 80) + '...');
            try {
                await this.emailService.sendReuploadRequestToUser(user.email, userName, user.school.name, trimmedMessage, type, updateDocLink);
            }
            catch (err) {
                console.error('[PendingUsersService] askReupload email failed:', err);
                throw new common_1.BadRequestException('We couldn\'t send the reupload request email. Please try again.');
            }
            return { success: true };
        }
    };
    return PendingUsersService = _classThis;
})();
exports.PendingUsersService = PendingUsersService;
//# sourceMappingURL=pending-users.service.js.map