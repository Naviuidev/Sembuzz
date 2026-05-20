import { Injectable } from '@nestjs/common';
import { ExtractedEvent } from './gpt-extractor.service';
import {
  type UniversityIngestionWindow,
  universityEventRangeOverlapsWindow,
} from './university-events-timezone.service';

@Injectable()
export class UniversityEventValidationService {
  /**
   * Heuristic 0–100 score for QA dashboards. GPT may adjust slightly in payload;
   * we merge with Math.round((local + model) / 2) when model provides qaScore.
   */
  computeLocalConfidence(ev: ExtractedEvent, seedUrl: string): number {
    let s = 0;
    if (ev.title && ev.title.length >= 4) s += 22;
    if (ev.startDate) s += 28;
    if (ev.detailUrl && this.isLikelyValidHttpUrl(ev.detailUrl)) s += 22;
    if (ev.detailUrl && this.isSameSiteOrSubdomain(seedUrl, ev.detailUrl)) s += 8;
    if (ev.imageUrl && this.isLikelyValidHttpUrl(ev.imageUrl)) s += 12;
    if (ev.venue && ev.venue.length > 2) s += 8;
    if (ev.rawDateText && ev.rawDateText.length > 2) s += 4;
    return Math.min(100, s);
  }

  mergeConfidence(local: number, modelQa?: number | null): number {
    if (modelQa == null || !Number.isFinite(modelQa)) return local;
    const m = Math.max(0, Math.min(100, Math.round(modelQa)));
    return Math.max(0, Math.min(100, Math.round((local + m) / 2)));
  }

  /**
   * Hard gate before DB write: event **range** must overlap the sync calendar month in `win.timeZone`.
   * Multi-month listings must set `endDate` so May appears inside a March–June range.
   */
  shouldPersist(ev: ExtractedEvent, win: UniversityIngestionWindow, seedUrl: string): { ok: boolean; reason?: string } {
    if (!ev.title || ev.title.trim().length < 3) return { ok: false, reason: 'title' };
    if (!ev.detailUrl || !this.isLikelyValidHttpUrl(ev.detailUrl)) return { ok: false, reason: 'detailUrl' };
    if (!ev.startDate) return { ok: false, reason: 'startDate' };
    const start = new Date(ev.startDate);
    if (Number.isNaN(start.getTime())) return { ok: false, reason: 'startDate_parse' };
    const end = ev.endDate ? new Date(ev.endDate) : null;
    if (ev.endDate) {
      if (end == null || Number.isNaN(end.getTime())) return { ok: false, reason: 'endDate_parse' };
      if (end.getTime() < start.getTime()) return { ok: false, reason: 'end_before_start' };
    }
    if (!universityEventRangeOverlapsWindow(start, end, win)) {
      return { ok: false, reason: 'outside_window' };
    }
    if (!this.isSameSiteOrSubdomain(seedUrl, ev.detailUrl)) {
      return { ok: false, reason: 'detail_offsite' };
    }
    if (ev.imageUrl && !this.isLikelyValidHttpUrl(ev.imageUrl)) return { ok: false, reason: 'imageUrl' };
    return { ok: true };
  }

  private isLikelyValidHttpUrl(s: string): boolean {
    try {
      const u = new URL(s);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  }

  private isSameSiteOrSubdomain(seedUrl: string, targetUrl: string): boolean {
    let a: string;
    let b: string;
    try {
      a = new URL(seedUrl).hostname.replace(/^www\./i, '').toLowerCase();
      b = new URL(targetUrl).hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      return false;
    }
    return b === a || b.endsWith(`.${a}`);
  }
}
