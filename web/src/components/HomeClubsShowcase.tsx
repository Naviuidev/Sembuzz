const CLUB_CHAT_MESSAGES = [
  { from: 'admin', text: 'Welcome to Art History Club chat 👋' },
  { from: 'student', text: 'Excited for the guest lecture this week!' },
  { from: 'student', text: 'Can someone share the room number?' },
  { from: 'admin', text: 'Room 204 — see you there at 4 PM.' },
];

export function HomeClubsShowcase() {
  return (
    <div className="home-clubs-showcase">
      <div className="home-clubs-showcase-layer home-clubs-showcase-chat">
        <div className="home-clubs-chat-mock">
          <div className="home-clubs-chat-header">
            <div className="home-clubs-chat-avatar">AH</div>
            <div>
              <strong>Art History Club</strong>
              <span>24 members · Club chat</span>
            </div>
          </div>
          <div className="home-clubs-chat-body">
            {CLUB_CHAT_MESSAGES.map((msg, i) => (
              <div
                key={i}
                className={`home-clubs-chat-bubble home-clubs-chat-bubble-${msg.from}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="home-clubs-chat-input" aria-hidden>
            <span>Message the club…</span>
            <i className="bi bi-send-fill" />
          </div>
        </div>
      </div>

      <div className="home-clubs-showcase-layer home-clubs-showcase-notify">
        <img
          src="/hero/admin-notifications.png"
          alt="SemBuzz club join request notifications for admins"
          className="home-clubs-showcase-img"
        />
      </div>
    </div>
  );
}
