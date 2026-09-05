type HomeAdsShowcaseProps = {
  variant: 'sponsored' | 'banner';
};

export function HomeAdsShowcase({ variant }: HomeAdsShowcaseProps) {
  return (
    <div className="home-ads-showcase">
      <div className="home-ads-phone">
        <div className="home-ads-phone-notch" aria-hidden />
        <div className="home-ads-phone-screen">
          <div className="home-ads-feed-chips" aria-hidden>
            <span className="active">Latest</span>
            <span>Popular</span>
          </div>

          {variant === 'sponsored' ? (
            <div className="home-ads-feed-card home-ads-feed-card-sponsored">
              <div className="home-ads-ad-row">
                <span className="home-ads-ad-badge">Ad</span>
                <span className="home-ads-ad-label">Sponsored</span>
              </div>
              <div className="home-ads-sponsored-hero">
                <span>Internship Fair 2026</span>
              </div>
              <div className="home-ads-feed-meta">
                <div className="home-ads-feed-logo">U</div>
                <span>Your campus</span>
              </div>
              <h4 className="home-ads-feed-title">Meet employers hiring on campus this week</h4>
              <p className="home-ads-feed-desc">
                Browse roles, RSVP for info sessions, and connect with recruiters — all from
                your feed.
              </p>
            </div>
          ) : (
            <div className="home-ads-feed-card home-ads-feed-card-news">
              <div className="home-ads-feed-meta">
                <div className="home-ads-feed-logo">U</div>
                <span>Campus Events · 2h ago</span>
              </div>
              <h4 className="home-ads-feed-title">Friends of Art History Guest Lecture</h4>
              <div className="home-ads-news-hero" aria-hidden />
              <p className="home-ads-feed-desc home-ads-feed-desc-short">
                Join us Thursday at 4 PM in Room 204 for a special guest lecture.
              </p>
              <div className="home-ads-inline-banner">
                <span className="home-ads-inline-banner-tag">Ad Banner</span>
                <div className="home-ads-inline-banner-art">
                  <strong>Campus Coffee Co.</strong>
                  <span>20% off for students · Show app at checkout</span>
                </div>
              </div>
            </div>
          )}

          <div className="home-ads-phone-nav" aria-hidden>
            <i className="bi bi-house" />
            <i className="bi bi-chat" />
            <i className="bi bi-bookmark" />
            <i className="bi bi-person" />
          </div>
        </div>
      </div>
    </div>
  );
}
