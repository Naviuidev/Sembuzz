type HomeAnalyticsShowcaseProps = {
  variant: 'engagement' | 'ads';
};

export function HomeAnalyticsShowcase({ variant }: HomeAnalyticsShowcaseProps) {
  if (variant === 'ads') {
    return (
      <div className="home-analytics-showcase">
        <div className="home-analytics-dashboard">
          <div className="home-analytics-dash-header">
            <div className="home-analytics-dash-title">
              <i className="bi bi-graph-up-arrow" aria-hidden />
              <div>
                <strong>Ads analytics</strong>
                <span>Last 30 days · Banner &amp; sponsored</span>
              </div>
            </div>
            <span className="home-analytics-dash-pill">Last 30 days</span>
          </div>

          <div className="home-analytics-stat-row">
            <div className="home-analytics-stat home-analytics-stat-views">
              <span className="home-analytics-stat-label">Total views</span>
              <strong>8,420</strong>
              <span className="home-analytics-stat-delta">+18% vs prior period</span>
            </div>
            <div className="home-analytics-stat home-analytics-stat-clicks">
              <span className="home-analytics-stat-label">Total clicks</span>
              <strong>612</strong>
              <span className="home-analytics-stat-delta">7.3% click-through rate</span>
            </div>
          </div>

          <div className="home-analytics-chart-wrap">
            <div className="home-analytics-chart-legend">
              <span><i className="home-analytics-dot home-analytics-dot-views" /> Views</span>
              <span><i className="home-analytics-dot home-analytics-dot-clicks" /> Clicks</span>
            </div>
            <svg className="home-analytics-line-chart" viewBox="0 0 320 120" aria-hidden>
              <polyline
                className="home-analytics-line home-analytics-line-views"
                points="0,88 40,72 80,76 120,52 160,48 200,36 240,28 280,22 320,18"
              />
              <polyline
                className="home-analytics-line home-analytics-line-clicks"
                points="0,98 40,92 80,88 120,78 160,72 200,64 240,58 280,52 320,46"
              />
            </svg>
          </div>

          <div className="home-analytics-table">
            <div className="home-analytics-table-head">
              <span>Campaign</span>
              <span>Views</span>
              <span>Clicks</span>
            </div>
            <div className="home-analytics-table-row">
              <span>Campus Coffee — Banner</span>
              <span>3,240</span>
              <span>284</span>
            </div>
            <div className="home-analytics-table-row">
              <span>Internship Fair — Sponsored</span>
              <span>5,180</span>
              <span>328</span>
            </div>
          </div>
        </div>

        <div className="home-analytics-showcase-phone">
          <img
            src="/hero/mobile-app.png"
            alt="SemBuzz mobile feed where ad views and clicks are tracked"
            className="home-analytics-showcase-phone-img"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="home-analytics-showcase">
      <div className="home-analytics-dashboard">
        <div className="home-analytics-dash-header">
          <div className="home-analytics-dash-title">
            <i className="bi bi-bar-chart-line" aria-hidden />
            <div>
              <strong>News engagement</strong>
              <span>All campus news · Last 7 days</span>
            </div>
          </div>
          <span className="home-analytics-dash-pill">Last 7 days</span>
        </div>

        <div className="home-analytics-stat-row home-analytics-stat-row-4">
          <div className="home-analytics-stat">
            <span className="home-analytics-stat-label">Posts</span>
            <strong>42</strong>
          </div>
          <div className="home-analytics-stat home-analytics-stat-likes">
            <span className="home-analytics-stat-label">Likes</span>
            <strong>1,248</strong>
          </div>
          <div className="home-analytics-stat home-analytics-stat-comments">
            <span className="home-analytics-stat-label">Comments</span>
            <strong>186</strong>
          </div>
          <div className="home-analytics-stat home-analytics-stat-saved">
            <span className="home-analytics-stat-label">Saved</span>
            <strong>324</strong>
          </div>
        </div>

        <div className="home-analytics-chart-wrap home-analytics-donut-wrap">
          <div
            className="home-analytics-donut"
            style={{
              background:
                'conic-gradient(#ef4444 0 42%, #3b82f6 42% 68%, #22c55e 68% 100%)',
            }}
            aria-hidden
          />
          <ul className="home-analytics-donut-legend list-unstyled mb-0">
            <li><span className="home-analytics-dot home-analytics-dot-likes" /> Likes 42%</li>
            <li><span className="home-analytics-dot home-analytics-dot-comments" /> Comments 26%</li>
            <li><span className="home-analytics-dot home-analytics-dot-saved" /> Saved 32%</li>
          </ul>
        </div>

        <div className="home-analytics-table">
          <div className="home-analytics-table-head">
            <span>Top posts</span>
            <span>Likes</span>
            <span>Saved</span>
          </div>
          <div className="home-analytics-table-row">
            <span>Career fair registration open</span>
            <span>312</span>
            <span>89</span>
          </div>
          <div className="home-analytics-table-row">
            <span>Guest lecture — Art History</span>
            <span>248</span>
            <span>64</span>
          </div>
        </div>
      </div>
    </div>
  );
}
