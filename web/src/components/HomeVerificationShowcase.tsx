export function HomeVerificationShowcase() {
  return (
    <div className="home-verify-showcase">
      <div className="home-verify-card home-verify-card-signup">
        <div className="home-verify-card-label">Student signup</div>
        <div className="home-verify-field">
          <span>Campus email</span>
          <strong>alex.rivera@university.edu</strong>
        </div>
        <div className="home-verify-status home-verify-status-pending">
          <i className="bi bi-hourglass-split" aria-hidden />
          Pending review
        </div>
      </div>

      <div className="home-verify-card home-verify-card-admin">
        <div className="home-verify-card-label">School admin queue</div>
        <div className="home-verify-queue-item">
          <div className="home-verify-queue-avatar">AR</div>
          <div>
            <strong>Alex Rivera</strong>
            <span>alex.rivera@university.edu · ID uploaded</span>
          </div>
          <div className="home-verify-queue-actions">
            <span className="approve">Approve</span>
            <span className="reject">Reject</span>
          </div>
        </div>
        <div className="home-verify-queue-item muted">
          <div className="home-verify-queue-avatar">JM</div>
          <div>
            <strong>Jordan Lee</strong>
            <span>Auto-approved · matching domain</span>
          </div>
          <span className="home-verify-badge-approved">Verified</span>
        </div>
      </div>

      <div className="home-verify-card home-verify-card-access">
        <img
          src="/hero/mobile-app.png"
          alt="Verified student accessing campus feed"
          className="home-verify-phone-img"
        />
      </div>
    </div>
  );
}
