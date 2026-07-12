import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

export const CHAT_ATTACHMENTS_DIR = path.join(process.cwd(), 'uploads', 'chat-attachments');
export const MAX_CHAT_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
export const CHAT_ATTACHMENT_URL_PREFIX = '/uploads/chat-attachments/';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const PDF_MIME = 'application/pdf';

export type ChatAttachmentType = 'image' | 'pdf';

export function chatAttachmentTypeFromMime(mime: string): ChatAttachmentType | null {
  if (IMAGE_MIMES.has(mime)) return 'image';
  if (mime === PDF_MIME) return 'pdf';
  return null;
}

export function assertValidChatAttachmentUrl(url: string | undefined | null) {
  const value = url?.trim();
  if (!value) return null;
  if (!value.startsWith(CHAT_ATTACHMENT_URL_PREFIX)) {
    throw new BadRequestException('Invalid attachment URL.');
  }
  if (value.includes('..')) {
    throw new BadRequestException('Invalid attachment URL.');
  }
  return value;
}

export function chatAttachmentMulterOptions() {
  return {
    storage: diskStorage({
      destination: (_req: unknown, _file: Express.Multer.File, cb: (e: Error | null, d: string) => void) => {
        if (!fs.existsSync(CHAT_ATTACHMENTS_DIR)) {
          fs.mkdirSync(CHAT_ATTACHMENTS_DIR, { recursive: true });
        }
        cb(null, CHAT_ATTACHMENTS_DIR);
      },
      filename: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, n: string) => void) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: MAX_CHAT_ATTACHMENT_BYTES },
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
      if (!chatAttachmentTypeFromMime(file.mimetype)) {
        cb(new BadRequestException('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.'), false);
        return;
      }
      cb(null, true);
    },
  };
}

export function buildChatAttachmentResponse(file: Express.Multer.File) {
  const attachmentType = chatAttachmentTypeFromMime(file.mimetype);
  if (!attachmentType) {
    throw new BadRequestException('Unsupported file type.');
  }
  return {
    url: `${CHAT_ATTACHMENT_URL_PREFIX}${file.filename}`,
    attachmentType,
    attachmentName: file.originalname || file.filename,
  };
}

export function parseChatMessagePayload(dto: {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  replyToMessageId?: string;
}) {
  const body = (dto.body ?? '').trim();
  const attachmentUrl = assertValidChatAttachmentUrl(dto.attachmentUrl);
  const attachmentType = dto.attachmentType?.trim() as ChatAttachmentType | undefined;
  const attachmentName = dto.attachmentName?.trim() || null;

  if (!body && !attachmentUrl) {
    throw new BadRequestException('Message must include text or an attachment.');
  }
  if (attachmentUrl) {
    if (attachmentType !== 'image' && attachmentType !== 'pdf') {
      throw new BadRequestException('attachmentType must be image or pdf when attachmentUrl is set.');
    }
  } else if (attachmentType || attachmentName) {
    throw new BadRequestException('attachmentUrl is required when sending an attachment.');
  }

  return {
    body,
    attachmentUrl,
    attachmentType: attachmentUrl ? attachmentType! : null,
    attachmentName: attachmentUrl ? attachmentName : null,
    replyToMessageId: dto.replyToMessageId?.trim() || null,
  };
}

export function chatMessagePreviewText(
  body: string,
  attachmentType: string | null,
  attachmentName: string | null,
): string {
  const text = body.trim();
  if (text) return text;
  if (attachmentType === 'image') return 'Photo';
  if (attachmentType === 'pdf') return attachmentName ? `PDF: ${attachmentName}` : 'PDF document';
  return '';
}
