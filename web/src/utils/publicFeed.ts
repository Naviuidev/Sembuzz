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
  parts.sort((a, b) => {
    const dt = b.t - a.t;
    if (dt !== 0) return dt;
    return pri[a.k] - pri[b.k];
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
 * Latest: one timeline by posted time (news / sponsored / banner interleaved by createdAt).
 * Popular: events stay sorted by engagement; sponsored/banner every N/M; leftovers woven in, not stacked at end.
 */
export function buildPublicFeedItems(
  sortedEvents: ApprovedEventPublic[],
  sponsoredAds: SponsoredAdPublic[],
  bannerAds: BannerAdPublic[],
  feedSort: 'latest' | 'popular',
): PublicFeedItem[] {
  if (feedSort === 'latest') {
    return mergeChronological(sortedEvents, sponsoredAds, bannerAds);
  }

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
