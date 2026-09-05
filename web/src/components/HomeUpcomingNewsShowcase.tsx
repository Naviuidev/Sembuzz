export function HomeUpcomingNewsShowcase() {
  return (
    <div className="home-upcoming-showcase">
      <div className="home-upcoming-admin">
        <div className="home-upcoming-admin-header">
          <strong>Schedule upcoming news</strong>
          <span>School Admin · Create post</span>
        </div>
        <div className="home-upcoming-admin-field">
          <label>Title</label>
          <span>Spring Career Fair — save the date</span>
        </div>
        <div className="home-upcoming-admin-field">
          <label>Show from</label>
          <span>Mar 1, 2026 · 9:00 AM</span>
        </div>
        <div className="home-upcoming-admin-field">
          <label>Publish on</label>
          <span>Mar 15, 2026 · 8:00 AM</span>
        </div>
        <div className="home-upcoming-admin-badge">
          <i className="bi bi-clock-history" aria-hidden />
          Teaser visible before full publish
        </div>
      </div>

      <div className="home-upcoming-feed">
        <div className="home-upcoming-teaser">
          <span className="home-upcoming-teaser-tag">Coming soon</span>
          <h4>Spring Career Fair — save the date</h4>
          <p>Full details publish March 15. Mark your calendar for the student union.</p>
          <span className="home-upcoming-teaser-date">Publishes Mar 15 · 8:00 AM</span>
        </div>
        <div className="home-upcoming-published">
          <span className="home-upcoming-published-tag">Live</span>
          <h4>Spring Career Fair — full details</h4>
          <p>40 employers, resume reviews, and on-the-spot interviews — March 18 in the union.</p>
        </div>
      </div>
    </div>
  );
}
