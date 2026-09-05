import { useEffect, useState } from 'react';

const SCROLL_HINT_THRESHOLD = 80;
const SCROLL_TOP_SHOW = 320;

export function HomeScrollAssist() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showScrollHint = scrollY < SCROLL_HINT_THRESHOLD;
  const showScrollTop = scrollY > SCROLL_TOP_SHOW;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <button
        type="button"
        className={`home-scroll-hint${showScrollHint ? ' is-visible' : ''}`}
        onClick={() => scrollToSection('admin-portals')}
        aria-label="Scroll to explore features"
      >
        <span className="home-scroll-hint-label">Explore</span>
        <span className="home-scroll-hint-arrow" aria-hidden>
          <i className="bi bi-chevron-down" />
        </span>
      </button>

      <button
        type="button"
        className={`home-scroll-top${showScrollTop ? ' is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <i className="bi bi-chevron-up" aria-hidden />
      </button>
    </>
  );
}
