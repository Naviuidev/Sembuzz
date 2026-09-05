import { useState, type ReactNode } from 'react';

export const HERO_ADMIN_SCREENSHOT = '/hero/admin-panel.png';
export const HERO_MOBILE_SCREENSHOT = '/hero/mobile-app.png';
export const HERO_ADMIN_NOTIFICATIONS = '/hero/admin-notifications.png';

function ScreenshotLayer({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed && fallback) return <div className={className}>{fallback}</div>;
  if (failed) return null;
  return (
    <div className={className}>
      <img src={src} alt={alt} className="home-hero-showcase-img" onError={() => setFailed(true)} />
    </div>
  );
}

export function HomeHeroShowcase() {
  return (
    <div className="home-hero-showcase">
      <ScreenshotLayer
        src={HERO_ADMIN_SCREENSHOT}
        alt="SemBuzz school admin privacy dashboard"
        className="home-hero-showcase-layer home-hero-showcase-admin"
      />
      <ScreenshotLayer
        src={HERO_MOBILE_SCREENSHOT}
        alt="SemBuzz mobile campus feed"
        className="home-hero-showcase-layer home-hero-showcase-mobile"
      />
      <ScreenshotLayer
        src={HERO_ADMIN_NOTIFICATIONS}
        alt="SemBuzz admin action needed notifications"
        className="home-hero-showcase-layer home-hero-showcase-notify"
      />
    </div>
  );
}
