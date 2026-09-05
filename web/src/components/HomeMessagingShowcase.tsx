type MessagingVariant = 'direct' | 'group' | 'club';

type HomeMessagingShowcaseProps = {
  variant: MessagingVariant;
};

const DIRECT_MESSAGES = [
  { from: 'them', text: 'Hey — are you going to the career fair?' },
  { from: 'me', text: 'Yes! Meeting at the student union at 10.' },
  { from: 'them', text: 'Perfect, see you there 👍' },
];

const GROUP_MESSAGES = [
  { from: 'admin', text: 'Welcome to CS Study Group — intro yourself!' },
  { from: 'student', text: 'Junior, focusing on algorithms this term.' },
  { from: 'student', text: 'Anyone have notes from last lecture?' },
];

const CLUB_MESSAGES = [
  { from: 'admin', text: 'Guest lecture moved to Room 204.' },
  { from: 'student', text: 'Thanks for the update!' },
  { from: 'admin', text: 'See everyone Thursday at 4 PM.' },
];

const CONFIG: Record<
  MessagingVariant,
  { title: string; subtitle: string; messages: typeof DIRECT_MESSAGES; input: string }
> = {
  direct: {
    title: 'Alex Rivera',
    subtitle: 'Direct message · 1:1',
    messages: DIRECT_MESSAGES,
    input: 'Message Alex…',
  },
  group: {
    title: 'CS Study Group',
    subtitle: '18 members · Student group',
    messages: GROUP_MESSAGES,
    input: 'Message the group…',
  },
  club: {
    title: 'Art History Club',
    subtitle: '24 members · Club chat',
    messages: CLUB_MESSAGES,
    input: 'Message the club…',
  },
};

export function HomeMessagingShowcase({ variant }: HomeMessagingShowcaseProps) {
  const config = CONFIG[variant];

  return (
    <div className="home-messaging-showcase">
      <div className="home-messaging-chat-mock">
        <div className="home-messaging-chat-header">
          <div className="home-messaging-chat-avatar">
            {variant === 'direct' ? 'AR' : variant === 'group' ? 'CS' : 'AH'}
          </div>
          <div>
            <strong>{config.title}</strong>
            <span>{config.subtitle}</span>
          </div>
        </div>
        <div className="home-messaging-chat-body">
          {config.messages.map((msg, i) => (
            <div
              key={i}
              className={`home-messaging-chat-bubble home-messaging-chat-bubble-${
                msg.from === 'me' || msg.from === 'student' ? 'student' : 'admin'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div className="home-messaging-chat-input" aria-hidden>
          <span>{config.input}</span>
          <i className="bi bi-send-fill" />
        </div>
      </div>

      {variant === 'club' && (
        <div className="home-messaging-notify-layer">
          <img
            src="/hero/admin-notifications.png"
            alt="Club join request notifications for admins"
            className="home-messaging-notify-img"
          />
        </div>
      )}
    </div>
  );
}
