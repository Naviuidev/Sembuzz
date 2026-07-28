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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GptExtractorService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const university_events_timezone_service_1 = require("./university-events-timezone.service");
const ALLOWED_CATEGORIES = [
    'Academic',
    'Cultural',
    'Sports',
    'Technical',
    'Workshop',
    'Festival',
    'Conference',
    'Seminar',
    'Webinar',
    'Other',
];
/** Fallback full-page path only when parser yields too few candidates. */
const MAX_TEXT_CHARS = 18_000;
const VALIDATE_BATCH_SIZE = 18;
const MAX_CANDIDATE_BLOCK = 900;
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
function parseRetryAfterSecondsFromMessage(message) {
    const m = message.match(/try again in ([\d.]+)\s*s\b/i) ||
        message.match(/retry after ([\d.]+)\s*s\b/i);
    if (!m)
        return null;
    const sec = parseFloat(m[1]);
    return Number.isFinite(sec) && sec >= 0 ? sec : null;
}
let GptExtractorService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GptExtractorService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            GptExtractorService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        logger = new common_1.Logger(GptExtractorService.name);
        openai = null;
        extractModel;
        constructor(config) {
            this.config = config;
            const fromEnv = this.config.get('OPENAI_UNIVERSITY_EXTRACT_MODEL')?.trim();
            this.extractModel = fromEnv && fromEnv.length > 0 ? fromEnv : 'gpt-4.1-mini';
            const apiKey = this.config.get('OPENAI_API_KEY');
            if (apiKey) {
                this.openai = new openai_1.default({ apiKey });
                this.logger.log(`University event extraction using model: ${this.extractModel}`);
            }
            else {
                this.logger.warn('OPENAI_API_KEY not set — GPT extraction will fail until configured.');
            }
            this.logger.log('University event sync window: current calendar month only in UNIVERSITY_EVENTS_TIMEZONE (default America/New_York)');
        }
        isReady() {
            return this.openai !== null;
        }
        /**
         * Parser-first path: GPT validates / normalizes pre-extracted rows only (small JSON payloads).
         */
        async validateCandidates(ctx) {
            if (!this.openai) {
                throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in .env');
            }
            if (ctx.candidates.length === 0)
                return [];
            const firstDay = ctx.firstDayInclusiveLocal;
            const lastDay = ctx.lastDayInclusiveLocal;
            const winSlice = {
                timeZone: ctx.timeZone,
                firstDayInclusive: firstDay,
                lastDayInclusive: lastDay,
            };
            const batches = [];
            for (let i = 0; i < ctx.candidates.length; i += VALIDATE_BATCH_SIZE) {
                batches.push(ctx.candidates.slice(i, i + VALIDATE_BATCH_SIZE));
            }
            const out = [];
            const maxRetries = Math.min(12, Math.max(1, Number(this.config.get('OPENAI_EXTRACT_MAX_RETRIES')) || 6));
            const baseDelayMs = Math.max(500, Number(this.config.get('OPENAI_EXTRACT_BASE_DELAY_MS')) || 2500);
            for (const batch of batches) {
                const payload = batch.map((c) => ({
                    id: c.id,
                    title: c.title,
                    rawBlockText: c.rawBlockText.slice(0, MAX_CANDIDATE_BLOCK),
                    rawDateText: c.rawDateText || '',
                    rawTimeText: c.rawTimeText || '',
                    detailUrl: c.detailUrl || '',
                    imageUrl: c.imageUrl || '',
                    sourcePageUrl: c.sourcePageUrl,
                }));
                const systemPrompt = `You validate and structure pre-extracted university EVENT candidates from HTML parsers (you do NOT see full web pages).

Output ONLY valid JSON: {"events":[...]}.

Each event MUST use this shape:
{
  "title": string,
  "description": string,
  "summary": string,
  "startDate": string|null,   // ISO 8601 — REQUIRED for every kept row
  "endDate": string|null,
  "rawDateText": string,
  "rawTimeText": string,
  "venue": string,
  "organizer": string,
  "category": one of ${JSON.stringify(ALLOWED_CATEGORIES)},
  "tags": string[],
  "registrationLink": string,
  "imageUrl": string,
  "detailUrl": string,
  "contactInfo": string,
  "qaScore": number           // 0-100 extraction confidence for THIS row
}

Rules:
- ONLY output real events whose **date range** overlaps local month ${firstDay} through ${lastDay} in ${ctx.timeZone} (INGESTION_*_UTC bounds define that month). Multi-day or cross-month programs **must** set both startDate and **endDate** (last day inclusive) so mid-month overlaps are not dropped.
- When inferring dates from ambiguous text, prefer interpretations consistent with ${ctx.timeZone}.
- DROP anything outside that month, past-month listings, next-month teasers, archived items, navigation, jobs, news, or anything that is not a dated public event in this month.
- Every kept row MUST have a non-null parseable startDate; keep the row only if **startDate…endDate** overlaps this month (set endDate for multi-day / cross-month listings).
- Prefer detailUrl/imageUrl from the candidate when they look correct; use absolute http(s) URLs only.
- Merge obvious duplicates (same event repeated) into one richer row.
- Do NOT invent events that are not supported by the candidate list.
- qaScore: high when title, date, detailUrl are solid; low when fields are missing or ambiguous.
- Respond with JSON only — no markdown, no code fences.`;
                const userPrompt = `UNIVERSITY: ${ctx.universityName}
SOURCE_URL: ${ctx.sourceUrl}
TIME_ZONE: ${ctx.timeZone}
TODAY_LOCAL (${ctx.timeZone}): ${ctx.todayLocalYmd}
FIRST_DAY_LOCAL_INCLUSIVE: ${firstDay}
LAST_DAY_LOCAL_INCLUSIVE: ${lastDay}
INGESTION_START_UTC: ${ctx.ingestionStartUtc}
INGESTION_END_EX_UTC: ${ctx.ingestionEndExclusiveUtc}

PARSER_CANDIDATES_JSON:
${JSON.stringify({ candidates: payload })}`;
                let response;
                let lastErr;
                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    try {
                        response = await this.openai.chat.completions.create({
                            model: this.extractModel,
                            temperature: 0.05,
                            max_tokens: 4096,
                            response_format: { type: 'json_object' },
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt },
                            ],
                        });
                        break;
                    }
                    catch (err) {
                        lastErr = err;
                        if (!this.isRetryableRateLimit(err) || attempt === maxRetries - 1) {
                            throw err;
                        }
                        const msg = err instanceof Error ? err.message : String(err);
                        const fromBody = parseRetryAfterSecondsFromMessage(msg);
                        const backoffMs = fromBody != null ? Math.ceil(fromBody * 1000) + 400 : baseDelayMs * Math.pow(2, attempt);
                        const capped = Math.min(backoffMs, 120_000);
                        this.logger.warn(`OpenAI rate limit / transient (${attempt + 1}/${maxRetries}), waiting ${capped}ms — ${msg.slice(0, 200)}`);
                        await sleep(capped);
                    }
                }
                if (!response)
                    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
                const content = response.choices[0]?.message?.content?.trim();
                if (!content)
                    continue;
                try {
                    const parsed = JSON.parse(content);
                    if (!parsed.events || !Array.isArray(parsed.events))
                        continue;
                    for (const raw of parsed.events) {
                        const e = this.coerce(raw, { sourceUrl: ctx.sourceUrl });
                        if (!e)
                            continue;
                        if (!this.extractedOverlapsWindow(e, winSlice))
                            continue;
                        out.push(e);
                    }
                }
                catch (err) {
                    this.logger.warn(`validateCandidates parse failed: ${err.message}`);
                }
            }
            return out;
        }
        /** Legacy fallback: condensed page text when parser coverage is too thin. */
        async extract(ctx) {
            if (!this.openai) {
                throw new Error('OpenAI API key is not configured. Set OPENAI_API_KEY in .env');
            }
            const trimmed = ctx.cleanedText.slice(0, MAX_TEXT_CHARS);
            const candidateImagesBlock = ctx.candidateImages.slice(0, 20).join('\n');
            const detailLinksBlock = ctx.detailLinks.slice(0, 30).join('\n');
            const firstDay = ctx.firstDayLocalYmd;
            const latestDay = ctx.lastDayLocalYmd;
            const winSlice = {
                timeZone: ctx.timeZone,
                firstDayInclusive: firstDay,
                lastDayInclusive: latestDay,
            };
            const chunkNote = ctx.chunkIndex && ctx.chunkTotal && ctx.chunkTotal > 1
                ? `\n- This is crawl chunk ${ctx.chunkIndex} of ${ctx.chunkTotal} from the same listing URL. Extract every event visible in THIS chunk only (other chunks are processed separately).`
                : '';
            const systemPrompt = `You are an information extraction engine. You read cleaned LISTING text (not raw HTML) and return ONLY university or organization EVENT listings as STRICT JSON.

Rules:
- Output an object with shape: {"events": [...]}.
- Each event item shape:
  {
    "title": string,
    "description": string,
    "summary": string,
    "startDate": string|null,
    "endDate": string|null,
    "rawDateText": string,
    "rawTimeText": string,
    "venue": string,
    "organizer": string,
    "category": one of ${JSON.stringify(ALLOWED_CATEGORIES)},
    "tags": string[],
    "registrationLink": string,
    "imageUrl": string,
    "detailUrl": string,
    "contactInfo": string,
    "qaScore": number
  }
- ONLY include events whose **date range** overlaps the **current calendar month** in ${ctx.timeZone} (local days ${firstDay} through ${latestDay} inclusive): use startDate for the first day and **endDate for the last day** when the listing is multi-day or spans months (e.g. March–June must have both so May sync can keep it).
- When the listing is a single day, omit endDate or set it equal to that day.
- When inferring partial dates, prefer interpretations consistent with ${ctx.timeZone}.
- startDate is REQUIRED for every emitted row.
- qaScore 0-100 reflects how confident you are in title + date + detailUrl.
- Do NOT invent events. If none, return {"events":[]}.
- PAGE_CONTENT may include "=== PAGE: <url> ===" blocks; dedupe repeated events across blocks.
- Use absolute URLs only.
- Respond with VALID JSON only — no markdown, no prose, no code fences.${chunkNote}`;
            const userPrompt = `UNIVERSITY: ${ctx.universityName}
SOURCE_URL: ${ctx.sourceUrl}
TIME_ZONE: ${ctx.timeZone}
TODAY_LOCAL (${ctx.timeZone}): ${ctx.todayLocalYmd}
FIRST_DAY_LOCAL_INCLUSIVE: ${firstDay}
LAST_DAY_LOCAL_INCLUSIVE: ${latestDay}
INGESTION_START_UTC: ${ctx.ingestionStartUtcIso}
INGESTION_END_EX_UTC: ${ctx.ingestionEndExclusiveUtcIso}

CANDIDATE_IMAGES:
${candidateImagesBlock || '(none)'}

DETAIL_LINKS:
${detailLinksBlock || '(none)'}

PAGE_CONTENT:
${trimmed}`;
            const maxOutTokens = Math.min(6144, Math.max(2200, Math.floor(trimmed.length / 8) + 1200));
            const maxRetries = Math.min(12, Math.max(1, Number(this.config.get('OPENAI_EXTRACT_MAX_RETRIES')) || 6));
            const baseDelayMs = Math.max(500, Number(this.config.get('OPENAI_EXTRACT_BASE_DELAY_MS')) || 2500);
            let response;
            let lastErr;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    response = await this.openai.chat.completions.create({
                        model: this.extractModel,
                        temperature: 0.1,
                        max_tokens: maxOutTokens,
                        response_format: { type: 'json_object' },
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt },
                        ],
                    });
                    break;
                }
                catch (err) {
                    lastErr = err;
                    if (!this.isRetryableRateLimit(err) || attempt === maxRetries - 1) {
                        throw err;
                    }
                    const msg = err instanceof Error ? err.message : String(err);
                    const fromBody = parseRetryAfterSecondsFromMessage(msg);
                    const backoffMs = fromBody != null ? Math.ceil(fromBody * 1000) + 400 : baseDelayMs * Math.pow(2, attempt);
                    const capped = Math.min(backoffMs, 120_000);
                    this.logger.warn(`OpenAI rate limit / transient (${attempt + 1}/${maxRetries}), waiting ${capped}ms — ${msg.slice(0, 200)}`);
                    await sleep(capped);
                }
            }
            if (!response)
                throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
            const content = response.choices[0]?.message?.content?.trim();
            if (!content)
                return [];
            try {
                const parsed = JSON.parse(content);
                if (!parsed.events || !Array.isArray(parsed.events))
                    return [];
                return parsed.events
                    .map((raw) => this.coerce(raw, ctx))
                    .filter((e) => e !== null)
                    .filter((e) => this.extractedOverlapsWindow(e, winSlice));
            }
            catch (err) {
                this.logger.warn(`Failed to parse GPT response for ${ctx.sourceUrl}: ${err.message}`);
                return [];
            }
        }
        coerce(raw, ctx) {
            if (!raw || typeof raw !== 'object')
                return null;
            const r = raw;
            const title = this.str(r.title);
            if (!title)
                return null;
            const category = (() => {
                const c = this.str(r.category);
                return ALLOWED_CATEGORIES.includes(c) ? c : 'Other';
            })();
            const tags = Array.isArray(r.tags)
                ? r.tags
                    .map((t) => this.str(t))
                    .filter((t) => t.length > 0)
                    .slice(0, 4)
                : [];
            const detailUrl = this.str(r.detailUrl) || ctx.sourceUrl;
            let modelQaScore;
            const qs = r.qaScore ?? r.confidence;
            if (typeof qs === 'number' && Number.isFinite(qs)) {
                modelQaScore = Math.max(0, Math.min(100, Math.round(qs)));
            }
            return {
                title: title.slice(0, 500),
                description: this.str(r.description).slice(0, 4000) || undefined,
                summary: this.str(r.summary).slice(0, 600) || undefined,
                startDate: this.iso(r.startDate),
                endDate: this.iso(r.endDate),
                rawDateText: this.str(r.rawDateText).slice(0, 255) || undefined,
                rawTimeText: this.str(r.rawTimeText).slice(0, 255) || undefined,
                venue: this.str(r.venue).slice(0, 500) || undefined,
                organizer: this.str(r.organizer).slice(0, 500) || undefined,
                category,
                tags,
                registrationLink: this.str(r.registrationLink).slice(0, 2048) || undefined,
                imageUrl: this.str(r.imageUrl).slice(0, 2048) || undefined,
                detailUrl: detailUrl.slice(0, 2048),
                contactInfo: this.str(r.contactInfo).slice(0, 500) || undefined,
                modelQaScore,
            };
        }
        str(v) {
            if (typeof v !== 'string')
                return '';
            return v.trim();
        }
        iso(v) {
            const s = this.str(v);
            if (!s)
                return null;
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d.toISOString();
        }
        extractedOverlapsWindow(e, win) {
            if (!e.startDate)
                return false;
            const s = new Date(e.startDate);
            if (isNaN(s.getTime()))
                return false;
            const end = e.endDate ? new Date(e.endDate) : null;
            if (end != null && isNaN(end.getTime()))
                return false;
            return (0, university_events_timezone_service_1.universityEventRangeOverlapsWindow)(s, end, win);
        }
        /** Keep rows whose local date range overlaps the sync calendar month in `win`. */
        filterExtractedByIngestionWindow(events, win) {
            return events.filter((e) => this.extractedOverlapsWindow(e, win));
        }
        isRetryableRateLimit(err) {
            if (!err || typeof err !== 'object')
                return false;
            const e = err;
            if (e.status === 429)
                return true;
            if (e.status === 503)
                return true;
            const msg = (e.message || '').toLowerCase();
            if (msg.includes('rate_limit') || msg.includes('rate limit'))
                return true;
            if (msg.includes('too many requests'))
                return true;
            return false;
        }
    };
    return GptExtractorService = _classThis;
})();
exports.GptExtractorService = GptExtractorService;
//# sourceMappingURL=gpt-extractor.service.js.map