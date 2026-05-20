import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SyncService } from './sync.service';

@Injectable()
export class UniversitySyncJobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UniversitySyncJobService.name);
  private timer: NodeJS.Timeout | null = null;
  private tickInFlight = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') === '1') {
      this.logger.log('University sync job processor disabled (UNIVERSITY_SYNC_JOBS_DISABLED=1)');
      return;
    }
    const ms = Math.max(500, Number(this.config.get('UNIVERSITY_SYNC_JOB_TICK_MS')) || 1500);
    this.timer = setInterval(() => {
      void this.safeTick();
    }, ms);
    if (typeof this.timer.unref === 'function') this.timer.unref();
    this.logger.log(`University sync job worker polling every ${ms}ms`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async enqueueBatch(batchId: string, sourceIds: string[]): Promise<string> {
    const job = await this.prisma.universitySyncJob.create({
      data: {
        kind: 'csv_batch',
        batchId,
        sourceIds: sourceIds as unknown as Prisma.InputJsonValue,
        progressTotal: sourceIds.length,
        message: 'Queued',
      },
    });
    return job.id;
  }

  async enqueueAllActive(): Promise<string> {
    const rows = await this.prisma.universitySource.findMany({
      where: { isActive: true },
      orderBy: { lastSyncedAt: 'asc' },
      select: { id: true },
    });
    const sourceIds = rows.map((r) => r.id);
    if (sourceIds.length === 0) {
      const job = await this.prisma.universitySyncJob.create({
        data: {
          kind: 'all_active',
          sourceIds: [] as unknown as Prisma.InputJsonValue,
          progressTotal: 0,
          progressDone: 0,
          status: 'completed',
          message: 'No active sources',
          completedAt: new Date(),
        },
      });
      return job.id;
    }
    const job = await this.prisma.universitySyncJob.create({
      data: {
        kind: 'all_active',
        sourceIds: sourceIds as unknown as Prisma.InputJsonValue,
        progressTotal: sourceIds.length,
        message: 'Queued',
      },
    });
    return job.id;
  }

  async enqueueSingle(sourceId: string): Promise<string> {
    const job = await this.prisma.universitySyncJob.create({
      data: {
        kind: 'single_source',
        sourceIds: [sourceId] as unknown as Prisma.InputJsonValue,
        progressTotal: 1,
        message: 'Queued',
      },
    });
    return job.id;
  }

  async listJobs(limit = 40) {
    const safe = Math.min(100, Math.max(1, limit));
    return this.prisma.universitySyncJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: safe,
    });
  }

  async getJob(id: string) {
    return this.prisma.universitySyncJob.findUnique({ where: { id } });
  }

  private async safeTick() {
    if (this.tickInFlight) return;
    this.tickInFlight = true;
    try {
      await this.tick();
    } catch (e) {
      this.logger.error(`Sync job tick failed: ${(e as Error).message}`);
    } finally {
      this.tickInFlight = false;
    }
  }

  private async tick() {
    const job = await this.prisma.universitySyncJob.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    if (!job) return;

    const locked = await this.prisma.universitySyncJob.updateMany({
      where: { id: job.id, status: 'pending' },
      data: { status: 'running', startedAt: new Date(), message: 'Running…' },
    });
    if (locked.count !== 1) return;

    const sourceIds = job.sourceIds as unknown;
    if (!Array.isArray(sourceIds) || sourceIds.length === 0 || !sourceIds.every((x) => typeof x === 'string')) {
      await this.failJob(job.id, 'Invalid or empty sourceIds JSON on job');
      return;
    }

    const ids = sourceIds as string[];
    const rawPar = Number(this.config.get('UNIVERSITY_JOB_SOURCE_PARALLEL'));
    const concurrency = Number.isFinite(rawPar) && rawPar >= 1 ? Math.min(rawPar, 6) : 2;

    try {
      let done = 0;
      for (let i = 0; i < ids.length; i += concurrency) {
        const slice = ids.slice(i, i + concurrency);
        await Promise.all(
          slice.map(async (sid) => {
            await this.prisma.universitySyncJob.update({
              where: { id: job.id },
              data: { currentSourceId: sid },
            });
            await this.sync.syncSource(sid);
          }),
        );
        done += slice.length;
        await this.prisma.universitySyncJob.update({
          where: { id: job.id },
          data: {
            progressDone: done,
            message: `Processed ${done}/${ids.length}`,
          },
        });
      }

      await this.prisma.universitySyncJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          progressDone: ids.length,
          completedAt: new Date(),
          message: 'Completed',
          currentSourceId: null,
        },
      });
    } catch (e) {
      await this.failJob(job.id, (e as Error).message || 'job failed');
    }
  }

  private async failJob(id: string, err: string) {
    await this.prisma.universitySyncJob.update({
      where: { id },
      data: {
        status: 'failed',
        error: err.slice(0, 2000),
        completedAt: new Date(),
        message: 'Failed',
        currentSourceId: null,
      },
    });
  }
}
