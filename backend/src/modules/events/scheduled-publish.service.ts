import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';
import { EVENT_STATUS } from './event-publishing.constants';

@Injectable()
export class ScheduledPublishService {
  private readonly logger = new Logger(ScheduledPublishService.name);

  constructor(
    private prisma: PrismaService,
    private pushNotifications: PushNotificationService,
  ) {}

  /** Every minute: mark overdue pending posts and publish due scheduled posts. */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledEvents(): Promise<void> {
    const now = new Date();
    try {
      await this.markScheduleMissed(now);
      await this.publishDueScheduled(now);
    } catch (err) {
      this.logger.error('Scheduled publish tick failed', err);
    }
  }

  private async markScheduleMissed(now: Date): Promise<void> {
    const result = await this.prisma.event.updateMany({
      where: {
        status: EVENT_STATUS.PENDING,
        publishAt: { lte: now },
      },
      data: { status: EVENT_STATUS.SCHEDULE_MISSED },
    });
    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} event(s) as schedule_missed`);
    }
  }

  private async publishDueScheduled(now: Date): Promise<void> {
    const due = await this.prisma.event.findMany({
      where: {
        status: EVENT_STATUS.SCHEDULED,
        publishAt: { lte: now },
      },
      include: {
        school: { select: { name: true, image: true } },
      },
      take: 50,
    });

    for (const event of due) {
      const updated = await this.prisma.event.update({
        where: { id: event.id },
        data: {
          status: EVENT_STATUS.PUBLISHED,
          publishedAt: now,
        },
        include: {
          school: { select: { name: true, image: true } },
        },
      });

      void this.pushNotifications
        .notifyUsersForApprovedEvent({
          id: updated.id,
          schoolId: updated.schoolId,
          subCategoryId: updated.subCategoryId,
          title: updated.title,
          schoolName: updated.school?.name ?? undefined,
          schoolLogoUrl: updated.school?.image ?? null,
        })
        .catch((err) => {
          this.logger.error(`Push notify failed for scheduled event ${updated.id}`, err);
        });
    }

    if (due.length > 0) {
      this.logger.log(`Published ${due.length} scheduled event(s)`);
    }
  }
}
