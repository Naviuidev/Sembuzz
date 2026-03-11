import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdsAdminNavbar } from '../components/AdsAdminNavbar';
import { AdsAdminSidebar } from '../components/AdsAdminSidebar';
import { adsAdminBannerAdsService } from '../services/ads-admin-banner-ads.service';
import { adsAdminSponsoredAdsService } from '../services/ads-admin-sponsored-ads.service';
import { imageSrc } from '../utils/image';
import { formatInCST, utcToCSTDatetimeLocalString, cstDatetimeLocalStringToUTC } from '../utils/cst-date';

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

function formatScheduleDate(d: Date): string {
  return formatInCST(d);
}

type AdAnalyticsTab = 'banner' | 'sponsored';

export const AdsAdminAdsAnalytics = () => {
  const [tab, setTab] = useState<AdAnalyticsTab>('banner');
  const [dateRangePreset, setDateRangePreset] = useState('7');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterBannerAdId, setFilterBannerAdId] = useState('');
  const [filterSponsoredAdId, setFilterSponsoredAdId] = useState('');
  const [graphView, setGraphView] = useState<'line' | 'bar' | 'donut'>('line');
  const [reactivateType, setReactivateType] = useState<'banner' | 'sponsored'>('banner');
  const [deleteConfirmType, setDeleteConfirmType] = useState<'banner' | 'sponsored'>('banner');
  const [chartTooltip, setChartTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [reactivateAdId, setReactivateAdId] = useState<string | null>(null);
  const [reactivateStartAt, setReactivateStartAt] = useState('');
  const [reactivateEndAt, setReactivateEndAt] = useState('');
  const [reactivateUrl, setReactivateUrl] = useState('');
  const [reactivateSubmitting, setReactivateSubmitting] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);
  const [showActiveBlockModal, setShowActiveBlockModal] = useState(false);
  const [deleteConfirmAdId, setDeleteConfirmAdId] = useState<string | null>(null);
  const [deleteDeleting, setDeleteDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toggleOffConfirm, setToggleOffConfirm] = useState<{ ad: AdRow; type: 'banner' | 'sponsored' } | null>(null);
  const [toggleOffSubmitting, setToggleOffSubmitting] = useState(false);

  const queryClient = useQueryClient();

  type AdRow = { id: string; startAt: string; endAt: string; externalLink?: string | null };

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: bannerList = [] } = useQuery({
    queryKey: ['ads-admin', 'banner-ads', 'list'],
    queryFn: () => adsAdminBannerAdsService.list(),
    enabled: tab === 'banner',
  });

  const { data: sponsoredList = [] } = useQuery({
    queryKey: ['ads-admin', 'sponsored-ads', 'list'],
    queryFn: () => adsAdminSponsoredAdsService.list(),
    enabled: tab === 'sponsored',
  });

  const { dateFrom: queryDateFrom, dateTo: queryDateTo } = useMemo(() => {
    if (dateRangePreset === 'custom') {
      if (filterDateFrom && filterDateTo) return { dateFrom: filterDateFrom, dateTo: filterDateTo };
      return { dateFrom: undefined, dateTo: undefined };
    }
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const days = parseInt(dateRangePreset, 10) || 7;
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    return {
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    };
  }, [dateRangePreset, filterDateFrom, filterDateTo]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['ads-admin', 'banner-ads', 'analytics', queryDateFrom ?? '', queryDateTo ?? '', filterBannerAdId],
    queryFn: () =>
      adsAdminBannerAdsService.getAnalytics({
        dateFrom: queryDateFrom,
        dateTo: queryDateTo,
        bannerAdId: filterBannerAdId || undefined,
      }),
    enabled: tab === 'banner',
  });

  const { data: sponsoredAnalytics, isLoading: sponsoredAnalyticsLoading } = useQuery({
    queryKey: ['ads-admin', 'sponsored-ads', 'analytics', queryDateFrom ?? '', queryDateTo ?? '', filterSponsoredAdId],
    queryFn: () =>
      adsAdminSponsoredAdsService.getAnalytics({
        dateFrom: queryDateFrom,
        dateTo: queryDateTo,
        sponsoredAdId: filterSponsoredAdId || undefined,
      }),
    enabled: tab === 'sponsored',
  });

  const totals = analytics?.totals ?? { views: 0, clicks: 0 };
  const adsWithCounts = analytics?.ads ?? [];
  const byDayRaw = analytics?.byDay ?? [];
  const totalViews = totals.views;
  const totalClicks = totals.clicks;

  const sponsoredTotals = sponsoredAnalytics?.totals ?? { views: 0, clicks: 0 };
  const sponsoredAdsWithCounts = sponsoredAnalytics?.ads ?? [];
  const sponsoredByDayRaw = sponsoredAnalytics?.byDay ?? [];

  // Fill byDay with date range when empty so line chart always has a timeline
  const byDay = useMemo(() => {
    if (byDayRaw.length > 0) return byDayRaw;
    if (!queryDateFrom || !queryDateTo) return [];
    const days: Array<{ date: string; views: number; clicks: number }> = [];
    const from = new Date(queryDateFrom + 'T00:00:00');
    const to = new Date(queryDateTo + 'T00:00:00');
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      days.push({ date: d.toISOString().slice(0, 10), views: 0, clicks: 0 });
    }
    return days;
  }, [byDayRaw, queryDateFrom, queryDateTo]);

  const sponsoredByDay = useMemo(() => {
    if (sponsoredByDayRaw.length > 0) return sponsoredByDayRaw;
    if (!queryDateFrom || !queryDateTo) return [];
    const days: Array<{ date: string; views: number; clicks: number }> = [];
    const from = new Date(queryDateFrom + 'T00:00:00');
    const to = new Date(queryDateTo + 'T00:00:00');
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      days.push({ date: d.toISOString().slice(0, 10), views: 0, clicks: 0 });
    }
    return days;
  }, [sponsoredByDayRaw, queryDateFrom, queryDateTo]);

  const openReactivateModal = (ad: { id: string; startAt: string; endAt: string; externalLink?: string | null }, type: 'banner' | 'sponsored') => {
    const start = new Date(ad.startAt);
    const end = new Date(ad.endAt);
    setReactivateType(type);
    setReactivateAdId(ad.id);
    setReactivateStartAt(utcToCSTDatetimeLocalString(start));
    setReactivateEndAt(utcToCSTDatetimeLocalString(end));
    setReactivateUrl(ad.externalLink ?? '');
    setReactivateError(null);
  };

  const closeReactivateModal = () => {
    setReactivateAdId(null);
    setReactivateStartAt('');
    setReactivateEndAt('');
    setReactivateUrl('');
    setReactivateError(null);
  };

  const submitReactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactivateAdId) return;
    setReactivateError(null);
    const start = cstDatetimeLocalStringToUTC(reactivateStartAt);
    const end = cstDatetimeLocalStringToUTC(reactivateEndAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setReactivateError('Invalid date/time.');
      return;
    }
    if (end <= start) {
      setReactivateError('End date/time must be after start date/time.');
      return;
    }
    const nowDate = new Date();
    if (end <= nowDate) {
      setReactivateError('End date/time must be in the future so the ad can show in the feed.');
      return;
    }
    setReactivateSubmitting(true);
    try {
      if (reactivateType === 'banner') {
        await adsAdminBannerAdsService.update(reactivateAdId, {
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          externalLink: reactivateUrl.trim() || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ['ads-admin', 'banner-ads'] });
        await queryClient.refetchQueries({ queryKey: ['ads-admin', 'banner-ads'] });
      } else {
        await adsAdminSponsoredAdsService.update(reactivateAdId, {
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          externalLink: reactivateUrl.trim() || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ['ads-admin', 'sponsored-ads'] });
        await queryClient.refetchQueries({ queryKey: ['ads-admin', 'sponsored-ads'] });
      }
      closeReactivateModal();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (err as { response: { data: { message: string } } }).response.data.message
        : 'Failed to update. Please try again.';
      setReactivateError(msg);
    } finally {
      setReactivateSubmitting(false);
    }
  };

  const handleStatusToggle = (ad: AdRow, type: 'banner' | 'sponsored') => {
    const start = new Date(ad.startAt);
    const end = new Date(ad.endAt);
    const isActive = now >= start && now <= end;
    if (isActive) {
      setToggleOffConfirm({ ad, type });
    } else {
      openReactivateModal(ad, type);
    }
  };

  const confirmToggleOff = async () => {
    if (!toggleOffConfirm) return;
    const { ad, type } = toggleOffConfirm;
    setToggleOffSubmitting(true);
    try {
      if (type === 'banner') {
        await adsAdminBannerAdsService.endNow(ad.id);
        await queryClient.invalidateQueries({ queryKey: ['ads-admin', 'banner-ads'] });
        await queryClient.refetchQueries({ queryKey: ['ads-admin', 'banner-ads'] });
      } else {
        await adsAdminSponsoredAdsService.endNow(ad.id);
        await queryClient.invalidateQueries({ queryKey: ['ads-admin', 'sponsored-ads'] });
        await queryClient.refetchQueries({ queryKey: ['ads-admin', 'sponsored-ads'] });
      }
      setToggleOffConfirm(null);
    } catch {
      // keep modal open on error
    } finally {
      setToggleOffSubmitting(false);
    }
  };

  const handleDeleteClick = (ad: AdRow, type: 'banner' | 'sponsored') => {
    const start = new Date(ad.startAt);
    const end = new Date(ad.endAt);
    const isActive = now >= start && now <= end;
    if (isActive) {
      setShowActiveBlockModal(true);
    } else {
      setDeleteError(null);
      setDeleteConfirmType(type);
      setDeleteConfirmAdId(ad.id);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmAdId) return;
    setDeleteError(null);
    setDeleteDeleting(true);
    try {
      if (deleteConfirmType === 'banner') {
        await adsAdminBannerAdsService.delete(deleteConfirmAdId);
        queryClient.invalidateQueries({ queryKey: ['ads-admin', 'banner-ads'] });
      } else {
        await adsAdminSponsoredAdsService.delete(deleteConfirmAdId);
        queryClient.invalidateQueries({ queryKey: ['ads-admin', 'sponsored-ads'] });
      }
      setDeleteConfirmAdId(null);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (err as { response: { data: { message: string } } }).response.data.message
        : 'Failed to delete. Please try again.';
      setDeleteError(msg);
    } finally {
      setDeleteDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eef1f5' }}>
      <AdsAdminNavbar />
      <div className="d-flex">
        <AdsAdminSidebar />
        <div style={{ flex: 1, padding: '1.5rem 2rem', minWidth: 0 }}>
          <div className="mb-4">
            <h1 className="h4 mb-1" style={{ color: '#1a1f2e', fontWeight: 600 }}>
              Ads Analytics
            </h1>
            <p className="small text-muted mb-0">
              View analytics for banner ads and sponsored ads.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              className="btn rounded-3 border-0 d-flex align-items-center gap-2 px-4 py-3"
              style={{
                backgroundColor: tab === 'banner' ? 'rgba(13, 202, 240, 0.2)' : '#fff',
                color: tab === 'banner' ? '#087990' : '#6c757d',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
              onClick={() => setTab('banner')}
            >
              <i className="bi bi-image" style={{ fontSize: '1.25rem' }} />
              <span className="fw-semibold">Banner Ads Analytics</span>
            </button>
            <button
              type="button"
              className="btn rounded-3 border-0 d-flex align-items-center gap-2 px-4 py-3"
              style={{
                backgroundColor: tab === 'sponsored' ? 'rgba(25, 135, 84, 0.2)' : '#fff',
                color: tab === 'sponsored' ? '#0f5132' : '#6c757d',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
              onClick={() => setTab('sponsored')}
            >
              <i className="bi bi-badge-ad" style={{ fontSize: '1.25rem' }} />
              <span className="fw-semibold">Sponsored Ads Analytics</span>
            </button>
          </div>

          {tab === 'sponsored' && (
            <>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: 180 }} value={filterSponsoredAdId} onChange={(e) => setFilterSponsoredAdId(e.target.value)}>
                    <option value="">All sponsored ads</option>
                    {sponsoredList.map((ad: { id: string; title?: string | null; startAt: string }) => (
                      <option key={ad.id} value={ad.id}>{ad.title || `Ad ${new Date(ad.startAt).toLocaleDateString()}`}</option>
                    ))}
                  </select>
                  <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: 140 }} value={dateRangePreset} onChange={(e) => setDateRangePreset(e.target.value)}>
                    {DATE_RANGE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                  {dateRangePreset === 'custom' && (
                    <>
                      <input type="date" className="form-control form-control-sm" style={{ width: 140 }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                      <span className="text-muted">–</span>
                      <input type="date" className="form-control form-control-sm" style={{ width: 140 }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                    </>
                  )}
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <div className="rounded-3 p-3 flex-grow-1" style={{ minWidth: 140, maxWidth: 220, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-muted">Views</span>
                    <i className="bi bi-eye-fill text-primary" style={{ fontSize: '1.1rem' }} />
                  </div>
                  <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>{sponsoredTotals.views}</div>
                </div>
                <div className="rounded-3 p-3 flex-grow-1" style={{ minWidth: 140, maxWidth: 220, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-muted">Clicks</span>
                    <i className="bi bi-cursor-fill text-success" style={{ fontSize: '1.1rem' }} />
                  </div>
                  <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>{sponsoredTotals.clicks}</div>
                </div>
              </div>
              <div className="rounded-3 overflow-hidden mb-4" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                <div className="px-3 py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ backgroundColor: '#f8f9fa' }}>
                  <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>Engagement overview</h2>
                  <div className="d-flex align-items-center gap-1">
                    {(['line', 'bar', 'donut'] as const).map((view) => (
                      <button key={view} type="button" className="btn btn-sm d-flex align-items-center gap-2 rounded-2 border-0" style={{ backgroundColor: graphView === view ? 'rgba(25, 135, 84, 0.15)' : 'transparent', color: graphView === view ? '#0f5132' : '#6c757d', fontWeight: graphView === view ? 600 : 400 }} onClick={() => setGraphView(view)}>
                        {view === 'line' && <i className="bi bi-graph-up" />}
                        {view === 'bar' && <i className="bi bi-bar-chart-fill" />}
                        {view === 'donut' && <i className="bi bi-pie-chart-fill" />}
                        <span className="text-capitalize">{view}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 position-relative" onMouseLeave={() => setChartTooltip(null)}>
                  {chartTooltip && (
                    <div className="position-fixed px-2 py-1 small rounded shadow-sm border" style={{ left: chartTooltip.x + 12, top: chartTooltip.y + 12, backgroundColor: '#1a1f2e', color: '#fff', zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap' }}>{chartTooltip.text}</div>
                  )}
                  {sponsoredAnalyticsLoading ? (
                    <p className="text-muted text-center py-4 mb-0 small">Loading…</p>
                  ) : (
                    <>
                      {graphView === 'line' && sponsoredByDay.length > 0 && (() => {
                        const maxVal = Math.max(...sponsoredByDay.map((d) => d.views + d.clicks), 1);
                        const w = 400, h = 220, pad = { top: 16, right: 16, bottom: 24, left: 40 };
                        const n = sponsoredByDay.length;
                        const x = (i: number) => pad.left + (n > 1 ? (i / (n - 1)) : 0.5) * (w - pad.left - pad.right);
                        const y = (v: number) => h - pad.bottom - (v / maxVal) * (h - pad.top - pad.bottom);
                        const viewsPoints = sponsoredByDay.map((d, i) => `${x(i)},${y(d.views)}`).join(' ');
                        const clicksPoints = sponsoredByDay.map((d, i) => `${x(i)},${y(d.clicks)}`).join(' ');
                        return (
                          <div className="d-flex flex-column align-items-center">
                            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 500, height: 220 }} className="mb-2">
                              <polyline points={viewsPoints} fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points={clicksPoints} fill="none" stroke="#198754" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              {sponsoredByDay.map((d, i) => (
                                <g key={d.date}>
                                  <circle cx={x(i)} cy={y(d.views)} r="4" fill="#0d6efd" onMouseEnter={(e) => setChartTooltip({ text: `${d.date}: Views ${d.views}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)} />
                                  <circle cx={x(i)} cy={y(d.clicks)} r="4" fill="#198754" onMouseEnter={(e) => setChartTooltip({ text: `${d.date}: Clicks ${d.clicks}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)} />
                                </g>
                              ))}
                              {sponsoredByDay.map((d, i) => (<text key={d.date} x={x(i)} y={h - 4} textAnchor="middle" className="small" fill="#6c757d" style={{ fontSize: 10 }}>{d.date.slice(5)}</text>))}
                            </svg>
                            <div className="d-flex gap-4 small">
                              <span><span style={{ width: 8, height: 8, backgroundColor: '#0d6efd', display: 'inline-block', borderRadius: 2, marginRight: 4 }} />Views <strong>{sponsoredTotals.views}</strong></span>
                              <span><span style={{ width: 8, height: 8, backgroundColor: '#198754', display: 'inline-block', borderRadius: 2, marginRight: 4 }} />Clicks <strong>{sponsoredTotals.clicks}</strong></span>
                            </div>
                          </div>
                        );
                      })()}
                      {graphView === 'line' && sponsoredByDay.length === 0 && <p className="text-muted text-center py-4 mb-0 small">Select a date range to see the line chart.</p>}
                      {graphView === 'bar' && (
                        <div className="mb-4">
                          <div className="small text-muted mb-2 fw-medium">Totals</div>
                          <div className="d-flex align-items-end gap-4" style={{ height: 200 }}>
                            {[
                              { label: 'Views', value: sponsoredTotals.views, color: '#0d6efd' },
                              { label: 'Clicks', value: sponsoredTotals.clicks, color: '#198754' },
                            ].map(({ label, value, color }) => {
                              const maxVal = Math.max(sponsoredTotals.views, sponsoredTotals.clicks, 1);
                              const pct = (value / maxVal) * 100;
                              return (
                                <div key={label} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: 0 }} onMouseEnter={(e) => setChartTooltip({ text: `${label}: ${value}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)}>
                                  <div className="rounded-2 w-100" style={{ height: 180, backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                                    <div className="rounded-2" style={{ width: '70%', minHeight: value > 0 ? 8 : 0, height: `${Math.max(pct, value > 0 ? 2 : 0)}%`, backgroundColor: color }} />
                                  </div>
                                  <div className="small fw-semibold mt-2" style={{ color: '#1a1f2e' }}>{value}</div>
                                  <span className="small text-muted">{label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {graphView === 'donut' && (() => {
                        const total = sponsoredTotals.views + sponsoredTotals.clicks || 1;
                        const pctV = (sponsoredTotals.views / total) * 100;
                        const pctC = (sponsoredTotals.clicks / total) * 100;
                        const r = 80, cx = 100, cy = 100, stroke = 24, circumference = 2 * Math.PI * (r - stroke / 2), dash = (p: number) => (p / 100) * circumference, offset2 = dash(pctV);
                        return (
                          <div className="d-flex flex-wrap align-items-center justify-content-center gap-4">
                            <div className="position-relative" style={{ width: 200, height: 200 }}>
                              <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                                <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#e9ecef" strokeWidth={stroke} />
                                <g style={{ cursor: 'pointer' }} onMouseEnter={(e) => setChartTooltip({ text: `Views: ${sponsoredTotals.views} (${pctV.toFixed(0)}%)`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)}>
                                  <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#0d6efd" strokeWidth={stroke} strokeDasharray={`${dash(pctV)} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                                </g>
                                <g style={{ cursor: 'pointer' }} onMouseEnter={(e) => setChartTooltip({ text: `Clicks: ${sponsoredTotals.clicks} (${pctC.toFixed(0)}%)`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)}>
                                  <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#198754" strokeWidth={stroke} strokeDasharray={`${dash(pctC)} ${circumference}`} strokeDashoffset={-offset2} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                                </g>
                              </svg>
                              <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1a1f2e' }}>{total}</div>
                                <div className="small text-muted">Total</div>
                              </div>
                            </div>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#0d6efd' }} />
                                <span className="small">Views <strong>{sponsoredTotals.views}</strong> ({pctV.toFixed(0)}%)</span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#198754' }} />
                                <span className="small">Clicks <strong>{sponsoredTotals.clicks}</strong> ({pctC.toFixed(0)}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-3 overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                <div className="px-3 py-2 border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
                  <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>Sponsored ad performance</h2>
                  <p className="small text-muted mb-0 mt-1">Views and clicks per sponsored ad. Toggle inactive ads on to reactivate with new schedule and URL.</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa', color: '#6c757d', fontSize: '0.8125rem' }}>
                      <tr>
                        <th style={{ fontWeight: 600 }}>Ad</th>
                        <th style={{ fontWeight: 600, minWidth: 180 }}>Scheduled at</th>
                        <th style={{ fontWeight: 600, width: 100 }}>Status</th>
                        <th style={{ fontWeight: 600 }}>Attached URL</th>
                        <th style={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Views</th>
                        <th style={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Clicks</th>
                        <th style={{ fontWeight: 600, width: 56 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sponsoredAdsWithCounts.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-muted py-4">No sponsored ads in this range.</td></tr>
                      ) : (
                        sponsoredAdsWithCounts.map((ad) => {
                          const start = new Date(ad.startAt);
                          const end = new Date(ad.endAt);
                          const isActive = now >= start && now <= end;
                          let firstImg: string | null = null;
                          try {
                            if (ad.imageUrls) {
                              const arr = JSON.parse(ad.imageUrls) as unknown;
                              if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') firstImg = arr[0];
                            }
                          } catch { /* ignore */ }
                          return (
                            <tr key={ad.id}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="rounded-2 overflow-hidden flex-shrink-0" style={{ width: 80, height: 44, backgroundColor: '#e9ecef' }}>
                                    {firstImg ? <img src={imageSrc(firstImg)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><i className="bi bi-badge-ad text-muted" /></div>}
                                  </div>
                                  <span className="small text-muted">{ad.title ?? 'Sponsored ad'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  <div className="text-muted">Start:</div>
                                  <div style={{ color: '#1a1f2e', fontWeight: 500 }}>{formatScheduleDate(start)}</div>
                                  <div className="text-muted mt-1">End:</div>
                                  <div style={{ color: '#1a1f2e', fontWeight: 500 }}>{formatScheduleDate(end)}</div>
                                </div>
                              </td>
                              <td>
                                <div className="form-check form-switch mb-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id={`sp-status-${ad.id}`}
                                    checked={isActive}
                                    onChange={() => handleStatusToggle({ id: ad.id, startAt: ad.startAt, endAt: ad.endAt, externalLink: ad.externalLink }, 'sponsored')}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <label className="form-check-label small" htmlFor={`sp-status-${ad.id}`} style={{ cursor: 'pointer' }}>
                                    {isActive ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                {ad.externalLink ? (
                                  <a href={ad.externalLink} target="_blank" rel="noopener noreferrer" className="small text-truncate d-inline-block" style={{ maxWidth: 180 }} title={ad.externalLink}>{ad.externalLink}</a>
                                ) : (
                                  <span className="small text-muted">—</span>
                                )}
                              </td>
                              <td className="text-end"><span style={{ fontWeight: 600, color: '#1a1f2e' }}>{ad.views}</span></td>
                              <td className="text-end"><span style={{ fontWeight: 600, color: '#1a1f2e' }}>{ad.clicks}</span></td>
                              <td className="text-end">
                                <button type="button" className="btn btn-link btn-sm text-danger p-0 border-0" onClick={() => handleDeleteClick(ad, 'sponsored')} title="Delete" aria-label="Delete"><i className="bi bi-trash" style={{ fontSize: '1.1rem' }} /></button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'banner' && (
            <>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', minWidth: 180 }}
                    value={filterBannerAdId}
                    onChange={(e) => setFilterBannerAdId(e.target.value)}
                  >
                    <option value="">All banner ads</option>
                    {bannerList.map((ad: { id: string; startAt: string; endAt: string }) => (
                      <option key={ad.id} value={ad.id}>
                        Banner {new Date(ad.startAt).toLocaleDateString()} – {new Date(ad.endAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', minWidth: 140 }}
                    value={dateRangePreset}
                    onChange={(e) => setDateRangePreset(e.target.value)}
                  >
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {dateRangePreset === 'custom' && (
                    <>
                      <input type="date" className="form-control form-control-sm" style={{ width: 140 }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                      <span className="text-muted">–</span>
                      <input type="date" className="form-control form-control-sm" style={{ width: 140 }} value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                    </>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <div className="rounded-3 p-3 flex-grow-1" style={{ minWidth: 140, maxWidth: 220, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-muted">Views</span>
                    <i className="bi bi-eye-fill text-primary" style={{ fontSize: '1.1rem' }} />
                  </div>
                  <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>{totalViews}</div>
                </div>
                <div className="rounded-3 p-3 flex-grow-1" style={{ minWidth: 140, maxWidth: 220, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-muted">Clicks</span>
                    <i className="bi bi-cursor-fill text-success" style={{ fontSize: '1.1rem' }} />
                  </div>
                  <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>{totalClicks}</div>
                </div>
              </div>

              <div className="rounded-3 overflow-hidden mb-4" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                <div className="px-3 py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ backgroundColor: '#f8f9fa' }}>
                  <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>Engagement overview</h2>
                  <div className="d-flex align-items-center gap-1">
                    {(['line', 'bar', 'donut'] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        className="btn btn-sm d-flex align-items-center gap-2 rounded-2 border-0"
                        style={{
                          backgroundColor: graphView === view ? 'rgba(13, 202, 240, 0.15)' : 'transparent',
                          color: graphView === view ? '#087990' : '#6c757d',
                          fontWeight: graphView === view ? 600 : 400,
                        }}
                        onClick={() => setGraphView(view)}
                      >
                        {view === 'line' && <i className="bi bi-graph-up" />}
                        {view === 'bar' && <i className="bi bi-bar-chart-fill" />}
                        {view === 'donut' && <i className="bi bi-pie-chart-fill" />}
                        <span className="text-capitalize">{view}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 position-relative" onMouseLeave={() => setChartTooltip(null)}>
                  {chartTooltip && (
                    <div
                      className="position-fixed px-2 py-1 small rounded shadow-sm border"
                      style={{ left: chartTooltip.x + 12, top: chartTooltip.y + 12, backgroundColor: '#1a1f2e', color: '#fff', zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap' }}
                    >
                      {chartTooltip.text}
                    </div>
                  )}
                  {analyticsLoading ? (
                    <p className="text-muted text-center py-4 mb-0 small">Loading…</p>
                  ) : (
                    <>
                      {graphView === 'line' && byDay.length > 0 && (() => {
                        const maxVal = Math.max(...byDay.map((d) => d.views + d.clicks), 1);
                        const w = 400;
                        const h = 220;
                        const pad = { top: 16, right: 16, bottom: 24, left: 40 };
                        const n = byDay.length;
                        const x = (i: number) => pad.left + (n > 1 ? (i / (n - 1)) : 0.5) * (w - pad.left - pad.right);
                        const y = (v: number) => h - pad.bottom - (v / maxVal) * (h - pad.top - pad.bottom);
                        const viewsPoints = byDay.map((d, i) => `${x(i)},${y(d.views)}`).join(' ');
                        const clicksPoints = byDay.map((d, i) => `${x(i)},${y(d.clicks)}`).join(' ');
                        return (
                          <div className="d-flex flex-column align-items-center">
                            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 500, height: 220 }} className="mb-2">
                              <polyline points={viewsPoints} fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points={clicksPoints} fill="none" stroke="#198754" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              {byDay.map((d, i) => (
                                <g key={d.date}>
                                  <circle cx={x(i)} cy={y(d.views)} r="4" fill="#0d6efd" onMouseEnter={(e) => setChartTooltip({ text: `${d.date}: Views ${d.views}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)} />
                                  <circle cx={x(i)} cy={y(d.clicks)} r="4" fill="#198754" onMouseEnter={(e) => setChartTooltip({ text: `${d.date}: Clicks ${d.clicks}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)} />
                                </g>
                              ))}
                              {byDay.map((d, i) => (
                                <text key={d.date} x={x(i)} y={h - 4} textAnchor="middle" className="small" fill="#6c757d" style={{ fontSize: 10 }}>{d.date.slice(5)}</text>
                              ))}
                            </svg>
                            <div className="d-flex gap-4 small">
                              <span><span style={{ width: 8, height: 8, backgroundColor: '#0d6efd', display: 'inline-block', borderRadius: 2, marginRight: 4 }} />Views <strong>{totalViews}</strong></span>
                              <span><span style={{ width: 8, height: 8, backgroundColor: '#198754', display: 'inline-block', borderRadius: 2, marginRight: 4 }} />Clicks <strong>{totalClicks}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                      {graphView === 'line' && byDay.length === 0 && <p className="text-muted text-center py-4 mb-0 small">Select a date range to see the line chart.</p>}

                      {graphView === 'bar' && (
                        <div className="mb-4">
                          <div className="small text-muted mb-2 fw-medium">Totals</div>
                          <div className="d-flex align-items-end gap-4" style={{ height: 200 }}>
                            {[
                              { label: 'Views', value: totalViews, color: '#0d6efd' },
                              { label: 'Clicks', value: totalClicks, color: '#198754' },
                            ].map(({ label, value, color }) => {
                              const maxVal = Math.max(totalViews, totalClicks, 1);
                              const pct = (value / maxVal) * 100;
                              return (
                                <div key={label} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: 0 }} onMouseEnter={(e) => setChartTooltip({ text: `${label}: ${value}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)}>
                                  <div className="rounded-2 w-100" style={{ height: 180, backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
                                    <div className="rounded-2" style={{ width: '70%', minHeight: value > 0 ? 8 : 0, height: `${Math.max(pct, value > 0 ? 2 : 0)}%`, backgroundColor: color }} />
                                  </div>
                                  <div className="small fw-semibold mt-2" style={{ color: '#1a1f2e' }}>{value}</div>
                                  <span className="small text-muted">{label}</span>
                                </div>
                              );
                            })}
                          </div>
                          {adsWithCounts.length > 0 && (
                            <div className="mt-4">
                              <div className="small text-muted mb-2 fw-medium">By banner ad</div>
                              <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                                {adsWithCounts.slice(0, 15).map((ad) => {
                                  const maxTotal = Math.max(...adsWithCounts.map((a) => a.views + a.clicks), 1);
                                  const total = ad.views + ad.clicks;
                                  const widthPct = (total / maxTotal) * 100;
                                  return (
                                    <div key={ad.id} className="d-flex align-items-center gap-2">
                                      <div className="rounded overflow-hidden flex-shrink-0" style={{ width: 48, height: 32, backgroundColor: '#e9ecef' }}>
                                        <img src={imageSrc(ad.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                      <span className="small text-muted" style={{ minWidth: 100 }}>{new Date(ad.startAt).toLocaleDateString()} – {new Date(ad.endAt).toLocaleDateString()}</span>
                                      <div className="flex-grow-1 rounded-2 d-flex" style={{ height: 24, backgroundColor: '#e9ecef', overflow: 'hidden', minWidth: 60 }}>
                                        {ad.views > 0 && <div style={{ width: `${(ad.views / (total || 1)) * widthPct}%`, backgroundColor: '#0d6efd', minWidth: 2 }} onMouseEnter={(e) => setChartTooltip({ text: `Views: ${ad.views}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)} />}
                                        {ad.clicks > 0 && <div style={{ width: `${(ad.clicks / (total || 1)) * widthPct}%`, backgroundColor: '#198754', minWidth: 2 }} onMouseEnter={(e) => setChartTooltip({ text: `Clicks: ${ad.clicks}`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)} />}
                                      </div>
                                      <span className="small text-muted" style={{ minWidth: 44, textAlign: 'right' }}>{total}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {graphView === 'donut' && (() => {
                        const total = totalViews + totalClicks || 1;
                        const pctV = (totalViews / total) * 100;
                        const pctC = (totalClicks / total) * 100;
                        const r = 80;
                        const cx = 100;
                        const cy = 100;
                        const stroke = 24;
                        const circumference = 2 * Math.PI * (r - stroke / 2);
                        const dash = (p: number) => (p / 100) * circumference;
                        const offset2 = dash(pctV);
                        return (
                          <div className="d-flex flex-wrap align-items-center justify-content-center gap-4">
                            <div className="position-relative" style={{ width: 200, height: 200 }}>
                              <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                                <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#e9ecef" strokeWidth={stroke} />
                                <g style={{ cursor: 'pointer' }} onMouseEnter={(e) => setChartTooltip({ text: `Views: ${totalViews} (${pctV.toFixed(0)}%)`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)}>
                                  <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#0d6efd" strokeWidth={stroke} strokeDasharray={`${dash(pctV)} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                                </g>
                                <g style={{ cursor: 'pointer' }} onMouseEnter={(e) => setChartTooltip({ text: `Clicks: ${totalClicks} (${pctC.toFixed(0)}%)`, x: e.clientX, y: e.clientY })} onMouseLeave={() => setChartTooltip(null)}>
                                  <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#198754" strokeWidth={stroke} strokeDasharray={`${dash(pctC)} ${circumference}`} strokeDashoffset={-offset2} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                                </g>
                              </svg>
                              <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1a1f2e' }}>{total}</div>
                                <div className="small text-muted">Total</div>
                              </div>
                            </div>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#0d6efd' }} />
                                <span className="small">Views <strong>{totalViews}</strong> ({pctV.toFixed(0)}%)</span>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#198754' }} />
                                <span className="small">Clicks <strong>{totalClicks}</strong> ({pctC.toFixed(0)}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-3 overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}>
                <div className="px-3 py-2 border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
                  <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>Banner ad performance</h2>
                  <p className="small text-muted mb-0 mt-1">Views and clicks per banner ad in the selected date range. Toggle inactive ads on to reactivate with new schedule and URL.</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa', color: '#6c757d', fontSize: '0.8125rem' }}>
                      <tr>
                        <th style={{ fontWeight: 600 }}>Banner</th>
                        <th style={{ fontWeight: 600, minWidth: 180 }}>Scheduled at</th>
                        <th style={{ fontWeight: 600, width: 100 }}>Status</th>
                        <th style={{ fontWeight: 600 }}>Attached URL</th>
                        <th style={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Views</th>
                        <th style={{ fontWeight: 600, width: 90, textAlign: 'right' }}>Clicks</th>
                        <th style={{ fontWeight: 600, width: 56 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {adsWithCounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">No banner ads in this range.</td>
                        </tr>
                      ) : (
                        adsWithCounts.map((ad) => {
                          const start = new Date(ad.startAt);
                          const end = new Date(ad.endAt);
                          const isActive = now >= start && now <= end;
                          return (
                            <tr key={ad.id}>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  <div className="rounded-2 overflow-hidden flex-shrink-0" style={{ width: 80, height: 44, backgroundColor: '#e9ecef' }}>
                                    <img src={imageSrc(ad.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  <div className="text-muted">Start:</div>
                                  <div style={{ color: '#1a1f2e', fontWeight: 500 }}>{formatScheduleDate(start)}</div>
                                  <div className="text-muted mt-1">End:</div>
                                  <div style={{ color: '#1a1f2e', fontWeight: 500 }}>{formatScheduleDate(end)}</div>
                                </div>
                              </td>
                              <td>
                                <div className="form-check form-switch mb-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id={`status-${ad.id}`}
                                    checked={isActive}
                                    onChange={() => handleStatusToggle(ad, 'banner')}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <label className="form-check-label small" htmlFor={`status-${ad.id}`} style={{ cursor: 'pointer' }}>
                                    {isActive ? 'Active' : 'Inactive'}
                                  </label>
                                </div>
                              </td>
                              <td>
                                {ad.externalLink ? (
                                  <a href={ad.externalLink} target="_blank" rel="noopener noreferrer" className="small text-truncate d-inline-block" style={{ maxWidth: 180 }} title={ad.externalLink}>
                                    {ad.externalLink}
                                  </a>
                                ) : (
                                  <span className="small text-muted">—</span>
                                )}
                              </td>
                              <td className="text-end"><span style={{ fontWeight: 600, color: '#1a1f2e' }}>{ad.views}</span></td>
                              <td className="text-end"><span style={{ fontWeight: 600, color: '#1a1f2e' }}>{ad.clicks}</span></td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-danger p-0 border-0"
                                  onClick={() => handleDeleteClick(ad, 'banner')}
                                  title="Delete banner ad"
                                  aria-label="Delete banner ad"
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '1.1rem' }} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {toggleOffConfirm && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-3">
                  <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a1f2e' }}>Turn off {toggleOffConfirm.type === 'sponsored' ? 'sponsored' : 'banner'} ad?</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => !toggleOffSubmitting && setToggleOffConfirm(null)} disabled={toggleOffSubmitting} />
                  </div>
                  <div className="modal-body pt-2">
                    <p className="mb-0">By turning off this ad, it will <strong>no longer be displayed</strong> to users. You can turn it back on later with a new schedule from this page.</p>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setToggleOffConfirm(null)} disabled={toggleOffSubmitting}>Cancel</button>
                    <button type="button" className="btn btn-warning btn-sm" onClick={confirmToggleOff} disabled={toggleOffSubmitting}>
                      {toggleOffSubmitting ? 'Turning off…' : 'Turn off ad'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reactivateAdId && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-3">
                  <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a1f2e' }}>{reactivateType === 'sponsored' ? 'Reactivate sponsored ad' : 'Reactivate banner ad'}</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={closeReactivateModal} />
                  </div>
                  <form onSubmit={submitReactivate}>
                    <div className="modal-body pt-2">
                      <p className="small text-muted mb-3">Set new start and end date/time and optional URL. The same {reactivateType === 'sponsored' ? 'sponsored' : 'banner'} ad will be shown again without uploading a new image.</p>
                      {reactivateError && <div className="alert alert-danger py-2 small mb-3">{reactivateError}</div>}
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Start date & time <span className="text-muted fw-normal">(CST)</span></label>
                        <input type="datetime-local" className="form-control form-control-sm" value={reactivateStartAt} onChange={(e) => setReactivateStartAt(e.target.value)} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">End date & time <span className="text-muted fw-normal">(CST)</span></label>
                        <input type="datetime-local" className="form-control form-control-sm" value={reactivateEndAt} onChange={(e) => setReactivateEndAt(e.target.value)} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Attached URL (optional)</label>
                        <input type="url" className="form-control form-control-sm" placeholder="https://..." value={reactivateUrl} onChange={(e) => setReactivateUrl(e.target.value)} />
                      </div>
                    </div>
                    <div className="modal-footer border-0 pt-0">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeReactivateModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={reactivateSubmitting}>
                        {reactivateSubmitting ? 'Posting…' : 'Post ad'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {showActiveBlockModal && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-3">
                  <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a1f2e' }}>Cannot delete active ad</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowActiveBlockModal(false)} />
                  </div>
                  <div className="modal-body pt-2">
                    <p className="mb-0">The current ad is in active status. Make sure to set the ad to inactive first, then only the ad can be deleted.</p>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowActiveBlockModal(false)}>OK</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deleteConfirmAdId && (
            <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-3">
                  <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title" style={{ fontWeight: 600, color: '#1a1f2e' }}>{deleteConfirmType === 'sponsored' ? 'Delete sponsored ad' : 'Delete banner ad'}</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => { setDeleteConfirmAdId(null); setDeleteError(null); }} />
                  </div>
                  <div className="modal-body pt-2">
                    <p className="mb-0">Delete this {deleteConfirmType === 'sponsored' ? 'sponsored' : 'banner'} ad? This action cannot be undone.</p>
                    {deleteError && <div className="alert alert-danger py-2 small mt-3 mb-0">{deleteError}</div>}
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setDeleteConfirmAdId(null); setDeleteError(null); }} disabled={deleteDeleting}>Cancel</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteConfirm} disabled={deleteDeleting}>
                      {deleteDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
