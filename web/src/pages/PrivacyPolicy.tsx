import { Link } from 'react-router-dom';
import { LegalPageLayout } from '../components/LegalPageLayout';

const PRIVACY_SECTIONS = [
  {
    icon: 'bi-person-vcard',
    title: 'Information we collect',
    body: 'We collect account information (name, email, encrypted password), student verification details when required, and non-personal engagement data such as likes, saves, comments, and ad interactions.',
  },
  {
    icon: 'bi-gear',
    title: 'How we use information',
    body: 'We use data to provide secure login, display school-specific content, measure engagement, improve functionality, and analyze trends in aggregate form.',
  },
  {
    icon: 'bi-share',
    title: 'Information sharing',
    body: 'We do not sell or rent personal data. Aggregate engagement metrics may be shared in non-identifiable form.',
  },
  {
    icon: 'bi-person-dash',
    title: 'Account deletion',
    body: 'Users may delete accounts at any time. Login credentials are removed upon deletion. Aggregated analytics may remain.',
  },
  {
    icon: 'bi-shield-exclamation',
    title: "Children's privacy",
    body: 'SemBuzz is intended for college and university students and does not knowingly collect information from children under 13.',
  },
];

export function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      titleLine2="how we protect your data"
      intro="SemBuzz respects your privacy. This policy explains how we collect, use, and protect information when you use our platform."
      footer={
        <>
          Questions? Contact <a href="mailto:contact@sdmlllc.com">contact@sdmlllc.com</a> or visit our{' '}
          <Link to="/#contact-us">contact page</Link>.
        </>
      }
    >
      <div className="legal-page-sections">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.title} className="legal-page-section">
            <div className="legal-page-section-icon">
              <i className={`bi ${section.icon}`} aria-hidden />
            </div>
            <div>
              <h2>{section.title}</h2>
              <p className="mb-0">{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </LegalPageLayout>
  );
}
