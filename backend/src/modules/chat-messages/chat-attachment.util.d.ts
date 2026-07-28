export declare const CHAT_ATTACHMENTS_DIR: string;
export declare const MAX_CHAT_ATTACHMENT_BYTES: number;
export declare const CHAT_ATTACHMENT_URL_PREFIX = "/uploads/chat-attachments/";
export type ChatAttachmentType = 'image' | 'pdf';
export declare function chatAttachmentTypeFromMime(mime: string): ChatAttachmentType | null;
export declare function assertValidChatAttachmentUrl(url: string | undefined | null): string | null;
export declare function chatAttachmentMulterOptions(): {
    storage: import("multer").StorageEngine;
    limits: {
        fileSize: number;
    };
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => void;
};
export declare function buildChatAttachmentResponse(file: Express.Multer.File): {
    url: string;
    attachmentType: ChatAttachmentType;
    attachmentName: string;
};
export declare function parseChatMessagePayload(dto: {
    body?: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
    replyToMessageId?: string;
}): {
    body: string;
    attachmentUrl: string | null;
    attachmentType: ChatAttachmentType | null;
    attachmentName: string | null;
    replyToMessageId: string | null;
};
export declare function chatMessagePreviewText(body: string, attachmentType: string | null, attachmentName: string | null): string;
