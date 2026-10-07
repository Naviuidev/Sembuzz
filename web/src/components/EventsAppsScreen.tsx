import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { SchoolSocialAccountPublic } from '../services/user-school-social.service';
import { imageSrc, isImageIconValue } from '../utils/image';

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  google: '#4285F4',
  instagram: '#E4405F',
  x: '#000000',
  tiktok: '#000000',
  pinterest: '#BD081C',
  whatsapp: '#25D366',
  telegram: '#26A5E4',
  reddit: '#FF4500',
  snapchat: '#FFFC00',
  linktree: '#43E660',
  weebly: '#1cb0a1',
};

const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'bi-facebook',
  linkedin: 'bi-linkedin',
  youtube: 'bi-youtube',
  google: 'bi-google',
  instagram: 'bi-instagram',
  x: 'bi-twitter-x',
  tiktok: 'bi-tiktok',
  pinterest: 'bi-pinterest',
  whatsapp: 'bi-whatsapp',
  telegram: 'bi-telegram',
  reddit: 'bi-reddit',
  snapchat: 'bi-snapchat',
  linktree: 'bi-link-45deg',
  weebly: 'bi-globe2',
};

const SEMBUZZ_SOCIAL_LINKS = [
  { href: 'https://www.linkedin.com/company/sembuzzsdmlhq/posts/?feedView=all', label: 'LinkedIn', icon: 'bi-linkedin', color: '#0a66c2' },
  { href: 'https://www.facebook.com/people/Sembuzzofficial/61555782134710/?ref=1', label: 'Facebook', icon: 'bi-facebook', color: '#1877f2' },
  { href: 'https://www.instagram.com/sembuzzofficial?igsh=MWRxaHRldjZ1N3Z2cg==', label: 'Instagram', icon: 'bi-instagram', color: '#e4405f' },
] as const;

type ClubGroup = {
  key: string;
  icon: string;
  pageName: string;
  accounts: SchoolSocialAccountPublic[];
};

type Props = {
  animationKey: number;
  schoolName: string | null;
  signedIn: boolean;
  schoolSocialAccounts: SchoolSocialAccountPublic[];
  messagingSection: ReactNode;
};

function ClubIcon({ icon }: { icon: string }) {
  if (isImageIconValue(icon)) {
    return <img src={imageSrc(icon)} alt="" />;
  }
  if (icon.startsWith('fa-')) {
    return <i className={icon} aria-hidden />;
  }
  return <i className={`bi ${icon}`} aria-hidden />;
}

export function EventsAppsScreen({
  animationKey,
  schoolName,
  signedIn,
  schoolSocialAccounts,
  messagingSection,
}: Props) {
  const displaySchool = schoolName?.trim() || 'SemBuzz';

  const clubGroups = useMemo(() => {
    const groups = schoolSocialAccounts.reduce<ClubGroup[]>((acc, account) => {
      const key = `${account.pageName}|${account.icon}`;
      const existing = acc.find((g) => g.key === key);
      if (existing) existing.accounts.push(account);
      else acc.push({ key, icon: account.icon, pageName: account.pageName, accounts: [account] });
      return acc;
    }, []);
    return groups.sort((a, b) => a.pageName.localeCompare(b.pageName));
  }, [schoolSocialAccounts]);

  const hasSchoolSocial = signedIn && clubGroups.length > 0;

  return (
    <div className="events-apps">
      <header className="events-apps-hero">
        <div className="events-apps-hero__glow" aria-hidden />
        <p className="events-apps-hero__eyebrow">Connect</p>
        <h1 className="events-apps-hero__title" key={animationKey}>
          <span className="events-apps-hero__title-text">{displaySchool}</span>
        </h1>
        <p className="events-apps-hero__subtitle">
          {hasSchoolSocial
            ? 'Club pages, group chats, and your school’s social links in one place.'
            : 'Follow SemBuzz and discover school clubs when you sign in.'}
        </p>
      </header>

      <section className="events-apps-section" aria-labelledby="events-apps-messaging-heading">
        <h2 id="events-apps-messaging-heading" className="events-apps-section__title">
          <i className="bi bi-chat-dots" aria-hidden />
          Messaging
        </h2>
        <div className="events-apps-card events-apps-card--messaging">{messagingSection}</div>
      </section>

      <section className="events-apps-section" aria-labelledby="events-apps-social-heading">
        <h2 id="events-apps-social-heading" className="events-apps-section__title">
          <i className="bi bi-share" aria-hidden />
          {hasSchoolSocial ? 'School clubs & social' : 'Follow SemBuzz'}
        </h2>

        {hasSchoolSocial ? (
          <div className="events-apps-clubs">
            {clubGroups.map((group) => (
              <article key={group.key} className="events-apps-club-card">
                <div className="events-apps-club-card__head">
                  <span className="events-apps-club-card__logo">
                    <ClubIcon icon={group.icon} />
                  </span>
                  <div className="events-apps-club-card__meta">
                    <h3 className="events-apps-club-card__name">{group.pageName || 'Club'}</h3>
                    <p className="events-apps-club-card__hint">{group.accounts.length} link{group.accounts.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <div className="events-apps-social-row">
                  {group.accounts.map((acc) => {
                    const iconColor = PLATFORM_COLORS[acc.platformId] ?? '#6366f1';
                    const platformIcon = PLATFORM_ICONS[acc.platformId] ?? 'bi-link-45deg';
                    return (
                      <a
                        key={acc.id}
                        href={acc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="events-apps-social-btn"
                        style={{ '--social-color': iconColor } as CSSProperties}
                        aria-label={acc.platformName}
                        title={acc.platformName}
                      >
                        <i className={`bi ${platformIcon}`} aria-hidden />
                        <span className="events-apps-social-btn__label">{acc.platformName}</span>
                      </a>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="events-apps-card">
            <p className="events-apps-card__lead">
              {signedIn
                ? 'Your school has not added club social links yet. Meanwhile, connect with SemBuzz.'
                : 'Sign in to see your school’s club directory and social accounts.'}
            </p>
            <div className="events-apps-social-row events-apps-social-row--large">
              {SEMBUZZ_SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="events-apps-social-btn events-apps-social-btn--brand"
                  style={{ '--social-color': link.color } as CSSProperties}
                  aria-label={link.label}
                  title={link.label}
                >
                  <i className={`bi ${link.icon}`} aria-hidden />
                  <span className="events-apps-social-btn__label">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
