import { BadRequestException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  EVENT_APPROVED_LIST_STATUSES,
  EVENT_PENDING_APPROVAL_STATUSES,
  EVENT_STATUS,
} from './event-publishing.constants';

type Tx = Prisma.TransactionClient;

export function isLivePostEditTarget(status: string): boolean {
  return (EVENT_APPROVED_LIST_STATUSES as readonly string[]).includes(status);
}

export async function assertNoPendingEditForOriginal(
  prisma: PrismaClient | Tx,
  originalEventId: string,
): Promise<void> {
  const existing = await prisma.event.findFirst({
    where: {
      resubmitFromEventId: originalEventId,
      status: { in: [...EVENT_PENDING_APPROVAL_STATUSES] },
    },
    select: { id: true },
  });
  if (existing) {
    throw new BadRequestException(
      'An edit for this post is already waiting for category admin approval.',
    );
  }
}

/** Copy post content from a pending revision onto the live event row (preserves id, likes, comments). */
export async function applyPendingRevisionToLiveEvent(
  tx: Tx,
  liveEventId: string,
  pending: {
    title: string;
    description: string | null;
    externalLink: string | null;
    eventDate: Date | null;
    eventStartTime: string | null;
    eventEndTime: string | null;
    eventLocation: string | null;
    actionButtons: string | null;
    commentsEnabled: boolean;
    imageUrls: string | null;
    subCategoryId: string;
    categoryId: string;
    publishAt: Date | null;
  },
): Promise<void> {
  await tx.event.update({
    where: { id: liveEventId },
    data: {
      title: pending.title,
      description: pending.description,
      externalLink: pending.externalLink,
      eventDate: pending.eventDate,
      eventStartTime: pending.eventStartTime,
      eventEndTime: pending.eventEndTime,
      eventLocation: pending.eventLocation,
      actionButtons: pending.actionButtons,
      commentsEnabled: pending.commentsEnabled,
      imageUrls: pending.imageUrls,
      subCategoryId: pending.subCategoryId,
      categoryId: pending.categoryId,
      publishAt: pending.publishAt,
    },
  });
}

export async function supersedePendingRevision(tx: Tx, pendingEventId: string): Promise<void> {
  await tx.event.update({
    where: { id: pendingEventId },
    data: { status: EVENT_STATUS.SUPERSEDED },
  });
}
