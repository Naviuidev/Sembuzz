import type { ApprovedEventPublic, SponsoredAdPublic, BannerAdPublic } from '../services/public-events.service';

export const FEED_SPONSORED_EVERY_N = 5;
export const FEED_BANNER_EVERY_M = 8;

export type PublicFeedItem =
  | { type: 'event'; event: ApprovedEventPublic }
  | { type: 'sponsored'; ad: SponsoredAdPublic }
  | { type: 'banner'; banner: BannerAdPublic };

function tsEvent(e: ApprovedEventPublic): number {
  return new Date(e.createdAt || e.updatedAt).getTime();
}
function tsSponsored(a: SponsoredAdPublic): number {
  return new Date(a.createdAt || a.startAt).getTime();
}
function tsBanner(b: BannerAdPublic): number {
  return new Date(b.createdAt || b.startAt).getTime();
}

/** Slides used by Inshorts (banners stripped). Same shape as `feedItems.filter(type !== 'banner')`. */
export type NonBannerFeedItem = Exclude<PublicFeedItem, { type: 'banner' }>;

/**
 * Inshorts only renders inline banners on **event** cards (not sponsored-only slides).
 * At most **one** banner per event slide: the next banner in feed order goes on the **next** event
 * card after the anchor (forward in feed order), not stacked on the same card.
 */
export function assignBannersToEventSlides(
  feedItems: PublicFeedItem[],
  slides: NonBannerFeedItem[],
): Map<number, BannerAdPublic> {
  const eventSlideIndices: number[] = [];
  slides.forEach((item, i) => {
    if (item.type === 'event') eventSlideIndices.push(i);
  });
  const bySlide = new Map<number, BannerAdPublic>();
  if (eventSlideIndices.length === 0) return bySlide;

  let slideIdx = 0;
  let lastEventSlideIdx = -1;

  for (const item of feedItems) {
    if (item.type === 'banner') {
      const anchor = lastEventSlideIdx >= 0 ? lastEventSlideIdx : eventSlideIndices[0];
      let startEi = eventSlideIndices.indexOf(anchor);
      if (startEi < 0) startEi = 0;

      let placed = false;
      for (let k = 0; k < eventSlideIndices.length; k++) {
        const ei = startEi + k;
        if (ei >= eventSlideIndices.length) break;
        const si = eventSlideIndices[ei];
        if (!bySlide.has(si)) {
          bySlide.set(si, item.banner);
          placed = true;
          break;
        }
      }
      if (!placed) {
        for (let k = 0; k < startEi; k++) {
          const si = eventSlideIndices[k];
          if (!bySlide.has(si)) {
            bySlide.set(si, item.banner);
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        bySlide.set(eventSlideIndices[startEi], item.banner);
      }
    } else {
      if (item.type === 'event') lastEventSlideIdx = slideIdx;
      slideIdx += 1;
    }
  }
  return bySlide;
}

/** Single timeline: news + sponsored + banners by posted time (newest first). */
function mergeChronological(
  sortedEvents: ApprovedEventPublic[],
  sponsoredAds: SponsoredAdPublic[],
  bannerAds: BannerAdPublic[],
): PublicFeedItem[] {
  type Tag =
    | { k: 'e'; t: number; event: ApprovedEventPublic }
    | { k: 's'; t: number; ad: SponsoredAdPublic }
    | { k: 'b'; t: number; banner: BannerAdPublic };
  const parts: Tag[] = [];
  for (const event of sortedEvents) {
    parts.push({ k: 'e', t: tsEvent(event), event });
  }
  for (const ad of sponsoredAds) {
    parts.push({ k: 's', t: tsSponsored(ad), ad });
  }
  for (const banner of bannerAds) {
    parts.push({ k: 'b', t: tsBanner(banner), banner });
  }
  const pri = { e: 0, s: 1, b: 2 };
  const idOf = (p: Tag): string => {
    if (p.k === 'e') return p.event.id;
    if (p.k === 's') return p.ad.id;
    return p.banner.id;
  };
  /** Newest first (latest tab). Stable tie-break: type priority, then id. */
  parts.sort((a, b) => {
    const dt = b.t - a.t;
    if (dt !== 0) return dt;
    const tp = pri[a.k] - pri[b.k];
    if (tp !== 0) return tp;
    return idOf(a).localeCompare(idOf(b));
  });
  return parts.map((p) => {
    if (p.k === 'e') return { type: 'event' as const, event: p.event };
    if (p.k === 's') return { type: 'sponsored' as const, ad: p.ad };
    return { type: 'banner' as const, banner: p.banner };
  });
}

function sponsorEveryForN(n: number): number {
  if (n >= FEED_SPONSORED_EVERY_N) return FEED_SPONSORED_EVERY_N;
  if (n === 1) return 1;
  return Math.max(2, Math.ceil(n / 2));
}

function bannerEveryForN(n: number): number {
  if (n >= FEED_BANNER_EVERY_M) return FEED_BANNER_EVERY_M;
  if (n === 1) return 1;
  return Math.max(2, Math.ceil(n / 2));
}

/** Zip remaining sponsored + banner for insertion helpers. */
function alternateRest(
  restSponsored: SponsoredAdPublic[],
  restBanner: BannerAdPublic[],
): PublicFeedItem[] {
  const out: PublicFeedItem[] = [];
  let si = 0;
  let bi = 0;
  while (si < restSponsored.length || bi < restBanner.length) {
    if (si < restSponsored.length) {
      out.push({ type: 'sponsored', ad: restSponsored[si] });
      si += 1;
    }
    if (bi < restBanner.length) {
      out.push({ type: 'banner', banner: restBanner[bi] });
      bi += 1;
    }
  }
  return out;
}

/** Spread leftover ads through the feed instead of one block at the bottom (Popular). */
function weaveRestIntoBase(base: PublicFeedItem[], rest: PublicFeedItem[]): PublicFeedItem[] {
  if (rest.length === 0) return base;
  const nOut = base.length;
  const insertEvery = Math.max(1, Math.ceil(nOut / (rest.length + 1)));
  const result: PublicFeedItem[] = [];
  let r = 0;
  let since = 0;
  for (const item of base) {
    result.push(item);
    since += 1;
    if (r < rest.length && since >= insertEvery) {
      result.push(rest[r]);
      r += 1;
      since = 0;
    }
  }
  while (r < rest.length) {
    result.push(rest[r]);
    r += 1;
  }
  return result;
}

/**
 * Builds the feed with sponsored + banner slots every N/M news events, **cycling** ad lists with modulo
 * so the same ads can appear multiple times as the user scrolls.
 * **Latest vs Popular:** only the order of `sortedEvents` differs (caller sorts by newest vs engagement).
 * `mergeChronological` is kept for ads-only feeds (no events).
 * Inshorts maps inline banners onto **event** slides only (`assignBannersToEventSlides`).
 */
function buildInsertionFeed(
  sortedEvents: ApprovedEventPublic[],
  sponsoredAds: SponsoredAdPublic[],
  bannerAds: BannerAdPublic[],
): PublicFeedItem[] {
  const n = sortedEvents.length;

  if (n === 0) {
    if (sponsoredAds.length === 0 && bannerAds.length === 0) return [];
    return mergeChronological([], sponsoredAds, bannerAds);
  }

  const sponsorEvery = sponsorEveryForN(n);
  const bannerEvery = bannerEveryForN(n);
  const out: PublicFeedItem[] = [];
  let sIdx = 0;
  let bIdx = 0;

  for (let i = 0; i < n; i++) {
    out.push({ type: 'event', event: sortedEvents[i] });
    const count = i + 1;
    if (count % sponsorEvery === 0 && sponsoredAds.length > 0) {
      out.push({ type: 'sponsored', ad: sponsoredAds[sIdx % sponsoredAds.length] });
      sIdx += 1;
    }
    if (count % bannerEvery === 0 && bannerAds.length > 0) {
      out.push({ type: 'banner', banner: bannerAds[bIdx % bannerAds.length] });
      bIdx += 1;
    }
  }

  const hasSponsoredId = (id: string) => out.some((x) => x.type === 'sponsored' && x.ad.id === id);
  const hasBannerId = (id: string) => out.some((x) => x.type === 'banner' && x.banner.id === id);

  const restSponsored = [...sponsoredAds]
    .filter((a) => !hasSponsoredId(a.id))
    .sort((a, b) => tsSponsored(b) - tsSponsored(a));
  const restBanner = [...bannerAds]
    .filter((b) => !hasBannerId(b.id))
    .sort((a, b) => tsBanner(b) - tsBanner(a));

  const rest = alternateRest(restSponsored, restBanner);
  return weaveRestIntoBase(out, rest);
}

export function buildPublicFeedItems(
  sortedEvents: ApprovedEventPublic[],
  sponsoredAds: SponsoredAdPublic[],
  bannerAds: BannerAdPublic[],
  _feedSort: 'latest' | 'popular',
): PublicFeedItem[] {
  return buildInsertionFeed(sortedEvents, sponsoredAds, bannerAds);
}
