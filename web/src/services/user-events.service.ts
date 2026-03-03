import { api } from '../config/api';

export interface EngagementResponse {
  likes: Record<string, number>;
  commentCounts: Record<string, number>;
  likedByMe: string[];
  savedByMe: string[];
}

export interface EventCommentResponse {
  id: string;
  eventId: string;
  userId: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; profilePicUrl: string | null };
}

export const userEventsService = {
  getEngagement: async (eventIds: string[]): Promise<EngagementResponse> => {
    if (eventIds.length === 0) {
      return { likes: {}, commentCounts: {}, likedByMe: [], savedByMe: [] };
    }
    const response = await api.get<EngagementResponse>('/user/events/engagement', {
      params: { eventIds: eventIds.join(',') },
    });
    return response.data;
  },

  toggleLike: async (
    eventId: string,
  ): Promise<{ liked: boolean; count: number }> => {
    const response = await api.post<{ liked: boolean; count: number }>(
      `/user/events/${eventId}/like`,
    );
    return response.data;
  },

  getComments: async (
    eventId: string,
  ): Promise<EventCommentResponse[]> => {
    const response = await api.get<EventCommentResponse[]>(
      `/user/events/${eventId}/comments`,
    );
    return response.data;
  },

  addComment: async (
    eventId: string,
    text: string,
  ): Promise<{ comment: EventCommentResponse; commentCount: number }> => {
    const response = await api.post<{
      comment: EventCommentResponse;
      commentCount: number;
    }>(`/user/events/${eventId}/comments`, { text });
    return response.data;
  },

  deleteComment: async (
    _eventId: string,
    commentId: string,
  ): Promise<{ commentCount: number }> => {
    const response = await api.delete<{ commentCount: number }>(
      `/user/event-comment/${commentId}`,
    );
    return response.data;
  },

  toggleSave: async (eventId: string): Promise<{ saved: boolean }> => {
    const response = await api.post<{ saved: boolean }>(
      `/user/events/${eventId}/save`,
    );
    return response.data;
  },

  getSavedEvents: async (): Promise<SavedEventItem[]> => {
    const response = await api.get<SavedEventItem[]>('/user/events/saved');
    return response.data;
  },

  getLikedEvents: async (): Promise<LikedEventItem[]> => {
    const response = await api.get<LikedEventItem[]>('/user/events/list/liked');
    return response.data;
  },
};

export interface SavedEventItem {
  id: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  imageUrls: string | null;
  school?: { name: string; image: string | null; city?: string } | null;
  subCategory: { id: string; name: string };
  savedAt: string;
}

export interface LikedEventItem {
  id: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  imageUrls: string | null;
  school?: { name: string; image: string | null; city?: string } | null;
  subCategory: { id: string; name: string };
  likedAt: string;
}
