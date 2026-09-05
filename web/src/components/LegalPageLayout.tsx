import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';

type LegalPageLayoutProps = {
  title: string;
  titleLine2?: string;
  intro: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function LegalPageLayout({ title, titleLine2, intro, children, footer }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen legal-page">
      <Navbar />
      <main className="legal-page-main">
        <section className="legal-page-hero">
          <div className="home-hero-bg" aria-hidden>
            <div className="home-hero-wave home-hero-wave-black" />
            <div className="home-hero-wave home-hero-wave-white" />
            <div className="home-hero-wave home-hero-wave-gray" />
          </div>

          <div className="container position-relative legal-page-container">
            <header className="legal-page-header text-center mx-auto">
              <p className="legal-page-eyebrow mb-2">Legal</p>
              <h1 className="legal-page-title">
                <span className="legal-page-title-line">{title}</span>
                {titleLine2 && <span className="legal-page-title-line">{titleLine2}</span>}
              </h1>
              <p className="legal-page-effective mb-2">Effective Date: January 1, 2026</p>
              <p className="legal-page-intro mb-0">{intro}</p>
            </header>

            <div className="legal-page-card">
              {children}
              {footer && <div className="legal-page-contact mb-0">{footer}</div>}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
