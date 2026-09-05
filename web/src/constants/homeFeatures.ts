/** Homepage feature sections — order matches Home.tsx layout */
export const HOME_FEATURE_SECTIONS = [
  { id: 'admin-portals', label: 'Admin Portals', icon: 'bi-grid-1x2' },
  { id: 'campus-blogs', label: 'Campus Blogs', icon: 'bi-journal-text' },
  { id: 'social-apps', label: 'Social Share & Apps', icon: 'bi-grid-3x3-gap' },
  { id: 'messaging', label: 'Campus Messaging', icon: 'bi-chat-dots' },
  { id: 'student-verification', label: 'Student Verification', icon: 'bi-shield-check' },
  { id: 'student-experience', label: 'Student Experience', icon: 'bi-phone' },
  { id: 'upcoming-news', label: 'Upcoming News', icon: 'bi-clock-history' },
  { id: 'clubs-and-chats', label: 'Official Campus Clubs', icon: 'bi-people' },
  { id: 'campus-ads', label: 'Campus Advertising', icon: 'bi-megaphone' },
  { id: 'analytics', label: 'Analytics & Insights', icon: 'bi-bar-chart-line' },
] as const;

export type HomeFeatureSectionId = (typeof HOME_FEATURE_SECTIONS)[number]['id'];
