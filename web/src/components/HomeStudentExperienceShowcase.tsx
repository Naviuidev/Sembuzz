type ExperienceVariant = 'feed' | 'engage' | 'notify';

type HomeStudentExperienceShowcaseProps = {
  variant: ExperienceVariant;
};

export function HomeStudentExperienceShowcase({ variant }: HomeStudentExperienceShowcaseProps) {
  return (
    <div className="home-student-showcase">
      <div className="home-student-showcase-web">
        <div className="home-student-browser-bar" aria-hidden>
          <span />
          <span />
          <span />
          <div className="home-student-browser-url">sembuzz.com/events</div>
        </div>
        <div className="home-student-web-screen">
          {variant === 'feed' && (
            <>
              <div className="home-student-web-toolbar">
                <span className="active">All Schools</span>
                <span>Career</span>
                <input type="text" readOnly value="Search campus…" aria-hidden />
              </div>
              <div className="home-student-web-card">
                <span className="home-student-web-meta">Campus Events · 2h ago</span>
                <h4>Spring Career Fair — March 18</h4>
                <div className="home-student-web-hero" aria-hidden />
                <p>Meet 40+ employers in the student union this Tuesday.</p>
              </div>
            </>
          )}
          {variant === 'engage' && (
            <div className="home-student-web-card home-student-web-card-engage">
              <span className="home-student-web-meta">Research · 1d ago</span>
              <h4>Undergraduate research applications open</h4>
              <p>Deadline April 1 — apply through the department portal.</p>
              <div className="home-student-web-actions">
                <span><i className="bi bi-heart-fill" /> 24</span>
                <span><i className="bi bi-chat" /> 8</span>
                <span className="saved"><i className="bi bi-bookmark-fill" /> Saved</span>
              </div>
              <div className="home-student-web-comment">
                <strong>Jordan</strong> Does this include engineering labs?
              </div>
            </div>
          )}
          {variant === 'notify' && (
            <div className="home-student-notify-list">
              <div className="home-student-notify-item unread">
                <i className="bi bi-bell-fill" />
                <div>
                  <strong>Career Fair reminder</strong>
                  <span>Tomorrow at 10 AM · Student Union</span>
                </div>
              </div>
              <div className="home-student-notify-item unread">
                <i className="bi bi-chat-dots-fill" />
                <div>
                  <strong>New message in CS Study Group</strong>
                  <span>Alex: Anyone have notes from lecture?</span>
                </div>
              </div>
              <div className="home-student-notify-item">
                <i className="bi bi-check-circle-fill" />
                <div>
                  <strong>Club join request approved</strong>
                  <span>Art History Club · You can now chat</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="home-student-showcase-phone">
        <img
          src="/hero/mobile-app.png"
          alt="SemBuzz mobile campus feed"
          className="home-student-phone-img"
        />
      </div>
    </div>
  );
}
