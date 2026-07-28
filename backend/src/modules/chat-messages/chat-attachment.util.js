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
exports.CHAT_ATTACHMENT_URL_PREFIX = exports.MAX_CHAT_ATTACHMENT_BYTES = exports.CHAT_ATTACHMENTS_DIR = void 0;
exports.chatAttachmentTypeFromMime = chatAttachmentTypeFromMime;
exports.assertValidChatAttachmentUrl = assertValidChatAttachmentUrl;
exports.chatAttachmentMulterOptions = chatAttachmentMulterOptions;
exports.buildChatAttachmentResponse = buildChatAttachmentResponse;
exports.parseChatMessagePayload = parseChatMessagePayload;
exports.chatMessagePreviewText = chatMessagePreviewText;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
exports.CHAT_ATTACHMENTS_DIR = path.join(process.cwd(), 'uploads', 'chat-attachments');
exports.MAX_CHAT_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
exports.CHAT_ATTACHMENT_URL_PREFIX = '/uploads/chat-attachments/';
const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const PDF_MIME = 'application/pdf';
function chatAttachmentTypeFromMime(mime) {
    if (IMAGE_MIMES.has(mime))
        return 'image';
    if (mime === PDF_MIME)
        return 'pdf';
    return null;
}
function assertValidChatAttachmentUrl(url) {
    const value = url?.trim();
    if (!value)
        return null;
    if (!value.startsWith(exports.CHAT_ATTACHMENT_URL_PREFIX)) {
        throw new common_1.BadRequestException('Invalid attachment URL.');
    }
    if (value.includes('..')) {
        throw new common_1.BadRequestException('Invalid attachment URL.');
    }
    return value;
}
function chatAttachmentMulterOptions() {
    return {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                if (!fs.existsSync(exports.CHAT_ATTACHMENTS_DIR)) {
                    fs.mkdirSync(exports.CHAT_ATTACHMENTS_DIR, { recursive: true });
                }
                cb(null, exports.CHAT_ATTACHMENTS_DIR);
            },
            filename: (_req, file, cb) => {
                const ext = path.extname(file.originalname) || '';
                cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
            },
        }),
        limits: { fileSize: exports.MAX_CHAT_ATTACHMENT_BYTES },
        fileFilter: (_req, file, cb) => {
            if (!chatAttachmentTypeFromMime(file.mimetype)) {
                cb(new common_1.BadRequestException('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.'), false);
                return;
            }
            cb(null, true);
        },
    };
}
function buildChatAttachmentResponse(file) {
    const attachmentType = chatAttachmentTypeFromMime(file.mimetype);
    if (!attachmentType) {
        throw new common_1.BadRequestException('Unsupported file type.');
    }
    return {
        url: `${exports.CHAT_ATTACHMENT_URL_PREFIX}${file.filename}`,
        attachmentType,
        attachmentName: file.originalname || file.filename,
    };
}
function parseChatMessagePayload(dto) {
    const body = (dto.body ?? '').trim();
    const attachmentUrl = assertValidChatAttachmentUrl(dto.attachmentUrl);
    const attachmentType = dto.attachmentType?.trim();
    const attachmentName = dto.attachmentName?.trim() || null;
    if (!body && !attachmentUrl) {
        throw new common_1.BadRequestException('Message must include text or an attachment.');
    }
    if (attachmentUrl) {
        if (attachmentType !== 'image' && attachmentType !== 'pdf') {
            throw new common_1.BadRequestException('attachmentType must be image or pdf when attachmentUrl is set.');
        }
    }
    else if (attachmentType || attachmentName) {
        throw new common_1.BadRequestException('attachmentUrl is required when sending an attachment.');
    }
    return {
        body,
        attachmentUrl,
        attachmentType: attachmentUrl ? attachmentType : null,
        attachmentName: attachmentUrl ? attachmentName : null,
        replyToMessageId: dto.replyToMessageId?.trim() || null,
    };
}
function chatMessagePreviewText(body, attachmentType, attachmentName) {
    const text = body.trim();
    if (text)
        return text;
    if (attachmentType === 'image')
        return 'Photo';
    if (attachmentType === 'pdf')
        return attachmentName ? `PDF: ${attachmentName}` : 'PDF document';
    return '';
}
//# sourceMappingURL=chat-attachment.util.js.map