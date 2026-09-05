import { Link } from 'react-router-dom';
import { LegalPageLayout } from '../components/LegalPageLayout';

const TERMS_ITEMS = [
  {
    icon: 'bi-person-gear',
    title: 'Eligibility',
    desc: 'Users must be at least 13 years old.',
  },
  {
    icon: 'bi-shield-check',
    title: 'Accounts & Security',
    desc: 'Users are responsible for maintaining confidentiality of login credentials.',
  },
  {
    icon: 'bi-check-circle',
    title: 'Acceptable Use',
    desc: 'Users may not hack, disrupt, misuse, or violate laws using the Platform.',
  },
  {
    icon: 'bi-info-circle',
    title: 'Limitation of Liability',
    desc: "The Platform is provided 'as is' without warranties.",
  },
  {
    icon: 'bi-envelope',
    title: 'Contact',
    desc: 'For terms-related questions, contact ',
    email: 'contact@sdmlllc.com',
  },
];

export function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      titleLine2="your agreement with SemBuzz"
      intro="By accessing or using SemBuzz, you agree to these Terms & Conditions."
      footer={
        <>
          See also our <Link to="/privacy">Privacy Policy</Link> and{' '}
          <Link to="/#community-guidelines">Community Guidelines</Link>.
        </>
      }
    >
      <div className="legal-page-terms-grid">
        {TERMS_ITEMS.map((item) => (
          <article key={item.title} className="legal-page-term">
            <div className="legal-page-term-icon">
              <i className={`bi ${item.icon}`} aria-hidden />
            </div>
            <div>
              <h2>{item.title}</h2>
              <p className="mb-0">
                {item.desc}
                {'email' in item && item.email && (
                  <a href={`mailto:${item.email}`}>{item.email}</a>
                )}
              </p>
            </div>
          </article>
        ))}
      </div>
    </LegalPageLayout>
  );
}
