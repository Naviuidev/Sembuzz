import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../contexts/UserAuthContext';
import type { SavedCollectionTab } from '../utils/savedCollections';

const SAVED_LINKS: { tab: SavedCollectionTab; label: string; hint: string }[] = [
  { tab: 'news', label: 'School news', hint: 'Saved posts from your school feed' },
  { tab: 'jobs', label: 'Jobs', hint: 'Saved external job posts' },
  { tab: 'offers', label: 'Offers', hint: 'Saved offers and discounts' },
  { tab: 'campaigns', label: 'Campaigns', hint: 'Saved campaigns and partner events' },
];

type Props = {
  activeSavedTab?: SavedCollectionTab | null;
  schoolExternalEnabled?: boolean;
  onActivateAllSchoolsFeed?: () => void;
};

export function EventsGlobalSecondarySidebar({
  activeSavedTab = null,
  schoolExternalEnabled = false,
  onActivateAllSchoolsFeed,
}: Props) {
  const navigate = useNavigate();
  const { user } = useUserAuth();

  return (
    <aside className="events-feed-secondary" aria-label="Feed options">
      <div className="events-feed-secondary-panel is-open">
        <div className="events-feed-secondary-panel-header d-none d-lg-block">
          <span className="events-feed-secondary-panel-title">Discover</span>
        </div>

        {user ? (
          <section className="events-feed-secondary-section events-feed-secondary-section--flush-top">
            <div className="d-flex flex-column gap-2">
              <button type="button" className="events-feed-secondary-tool" onClick={() => navigate('/saved')}>
                <i className="bi bi-bookmark" aria-hidden />
                <span>Bookmarks</span>
              </button>
              {schoolExternalEnabled && onActivateAllSchoolsFeed ? (
                <button type="button" className="events-feed-secondary-tool" onClick={onActivateAllSchoolsFeed}>
                  <i className="bi bi-building" aria-hidden />
                  <span>All schools</span>
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="events-feed-secondary-section">
          <h3 className="events-feed-secondary-heading">Feed</h3>
          <button
            type="button"
            className="events-feed-secondary-tool"
            onClick={() => navigate('/events', { state: { bottomNav: 'home' } })}
          >
            <i className="bi bi-house-door" aria-hidden />
            <span>Home</span>
          </button>
          <button
            type="button"
            className="events-feed-secondary-tool mt-2"
            onClick={() => navigate('/events', { state: { bottomNav: 'search' } })}
          >
            <i className="bi bi-search" aria-hidden />
            <span>Search</span>
          </button>
        </section>

        {user ? (
          <section className="events-feed-secondary-section">
            <h3 className="events-feed-secondary-heading">Saved</h3>
            <div className="events-feed-secondary-category-list">
              {SAVED_LINKS.map((link) => (
                <button
                  key={link.tab}
                  type="button"
                  className={`events-feed-secondary-category${activeSavedTab === link.tab ? ' is-active' : ''}`}
                  onClick={() => navigate(`/saved?tab=${link.tab}`)}
                  title={link.hint}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="events-feed-secondary-section">
            <p className="events-feed-secondary-muted mb-2">Sign in to save school news, jobs, offers, and campaigns.</p>
            <button
              type="button"
              className="events-feed-secondary-btn events-feed-secondary-btn-primary"
              onClick={() => navigate('/events', { state: { openAuth: 'login' } })}
            >
              Sign in
            </button>
          </section>
        )}

        {user ? (
          <section className="events-feed-secondary-section">
            <h3 className="events-feed-secondary-heading">Account</h3>
            <button
              type="button"
              className="events-feed-secondary-tool"
              onClick={() => navigate('/notifications')}
            >
              <i className="bi bi-bell" aria-hidden />
              <span>Notifications</span>
            </button>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
