import * as XLSX from 'xlsx';
import { GenericSelectorScraper } from '../src/modules/event-aggregation/scrapers/providers/generic.scraper';
import { universityEventRangeOverlapsWindow } from '../src/modules/super-admin/fetch-events/services/university-events-timezone.service';

const xlsxPath = process.argv[2];
const limit = Number(process.argv[3] || 40);

if (!xlsxPath) {
  console.error('Usage: npx tsx scripts/probe-client-urls.ts <path-to.xlsx> [sample-size]');
  process.exit(1);
}

const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Sheet1'], {
  defval: '',
});
const all = rows
  .map((r) => ({
    school: String(r.school).slice(0, 50),
    url: String(r.final_url || r.input_url || '').trim(),
  }))
  .filter((r) => r.url.startsWith('http'));

const pick = new Set<number>();
for (let i = 0; i < all.length; i += Math.ceil(all.length / limit)) pick.add(i);
const sample = [...pick].sort((a, b) => a - b).map((i) => all[i]).filter(Boolean);

const win = {
  timeZone: 'America/New_York',
  firstDayInclusive: '2026-05-01',
  lastDayInclusive: '2026-05-31',
};
const scraper = new GenericSelectorScraper();
scraper.setDateZone('America/New_York');

type ProbeRow = { school: string; url: string };

type ProbeResult = ProbeRow & {
  status: string;
  parsed: number;
  inMonth: number;
  mode: 'generic' | 'localist' | 'uwm' | 'none' | '-';
  ms: number;
};

async function probe(row: ProbeRow): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(row.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 SembuzzBot', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(18_000),
    });
    if (!res.ok) {
      return { ...row, status: `HTTP_${res.status}`, parsed: 0, inMonth: 0, mode: '-' as const, ms: Date.now() - t0 };
    }
    const html = await res.text();
    const { drafts, extractionMode } = scraper.extractEvents(html, {});
    let inMonth = 0;
    for (const d of drafts) {
      if (d.startDate && universityEventRangeOverlapsWindow(d.startDate, d.endDate, win)) inMonth++;
    }
    return {
      ...row,
      status: 'ok',
      parsed: drafts.length,
      inMonth,
      mode: extractionMode,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return {
      ...row,
      status: (e as Error).message?.slice(0, 50) || 'error',
      parsed: 0,
      inMonth: 0,
      mode: '-' as const,
      ms: Date.now() - t0,
    };
  }
}

async function main() {
  console.log(`Probing ${sample.length} of ${all.length} URLs from Sheet1...\n`);
  const results: ProbeResult[] = [];
  for (const row of sample) {
    results.push(await probe(row));
    await new Promise((r) => setTimeout(r, 250));
  }

  const works = results.filter((r) => r.status === 'ok' && r.inMonth > 0);
  const zero = results.filter((r) => r.status === 'ok' && r.inMonth === 0);
  const fail = results.filter((r) => r.status !== 'ok');

  console.log(`WORKS (in-month events): ${works.length}`);
  works.sort((a, b) => b.inMonth - a.inMonth).forEach((r) =>
    console.log(`  ${String(r.inMonth).padStart(3)} | ${r.mode.padEnd(8)} | ${r.school} | ${r.url}`),
  );

  console.log(`\nZERO (fetched, no May events): ${zero.length}`);
  zero.forEach((r) =>
    console.log(`  parsed=${r.parsed} mode=${r.mode} | ${r.school} | ${r.url}`),
  );

  console.log(`\nFAIL (network/block): ${fail.length}`);
  fail.forEach((r) => console.log(`  ${r.status} | ${r.school} | ${r.url}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
