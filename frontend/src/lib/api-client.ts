import { api } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Channel,
  ChannelMember,
  ChannelMessage,
  Feedback,
  FeedbackComment,
  FeedbackCreate,
  Notification,
  Announcement,
  AnnouncementCreate,
  FileUpload,
  SystemMetrics,
  AuditLog,
  BirthdayEvent,
  BirthdayRegistration,
  DirectConversation,
  DirectMessage,
  DirectConversationRecipient,
} from './types';

// ===== Auth API =====
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<{ id: number; email: string; full_name: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

// ===== Users API =====
export const usersApi = {
  getAll: async (): Promise<{ users: User[]; total: number }> => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { full_name?: string; department?: string; date_of_birth?: string | null }): Promise<User> => {
    const payload = {
      ...data,
      date_of_birth: data.date_of_birth ?? undefined,
    };
    const response = await api.patch<User>('/users/profile', payload);
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/users/profile/password', data);
    return response.data;
  },
};

// ===== Channels API =====
export const channelsApi = {
  getAll: async (): Promise<{ channels: Channel[]; total: number }> => {
    const response = await api.get('/channels');
    return response.data;
  },

  getById: async (id: number): Promise<Channel> => {
    const response = await api.get<Channel>(`/channels/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string; channel_type: string; is_private?: boolean }): Promise<Channel> => {
    const response = await api.post<Channel>('/channels', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Channel>): Promise<Channel> => {
    const response = await api.patch<Channel>(`/channels/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/channels/${id}`);
  },

  getMembers: async (id: number): Promise<{ members: ChannelMember[]; total: number }> => {
    const response = await api.get(`/channels/${id}/members`);
    return response.data;
  },

  getMessages: async (id: number): Promise<{ messages: ChannelMessage[] }> => {
    const response = await api.get(`/channels/${id}/messages`);
    return response.data;
  },

  sendMessage: async (
    id: number,
    content: string,
    options?: { isAnnouncement?: boolean; attachments?: number[] }
  ): Promise<ChannelMessage> => {
    const response = await api.post<ChannelMessage>(`/channels/${id}/messages`, {
      content,
      is_announcement: options?.isAnnouncement ?? false,
      attachments: options?.attachments,
    });
    return response.data;
  },

  pinMessage: async (
    channelId: number,
    messageId: number,
    isPinned: boolean
  ): Promise<ChannelMessage> => {
    const response = await api.post<ChannelMessage>(
      `/channels/${channelId}/messages/${messageId}/pin`,
      { is_pinned: isPinned }
    );
    return response.data;
  },
};

// ===== Memberships API =====
export const membershipsApi = {
  join: async (channelId: number): Promise<ChannelMember> => {
    const response = await api.post<ChannelMember>('/memberships/join', { channel_id: channelId });
    return response.data;
  },

  leave: async (channelId: number): Promise<void> => {
    await api.post('/memberships/leave', { channel_id: channelId });
  },

  getMyChannels: async (): Promise<{ channels: Channel[]; total: number }> => {
    const response = await api.get('/memberships/my-channels');
    return response.data;
  },
};

// ===== Feedback API =====
export const feedbackApi = {
  getAll: async (params?: { status?: string; category?: string }): Promise<{ feedback: Feedback[]; total: number }> => {
    const response = await api.get('/feedback', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Feedback> => {
    const response = await api.get<Feedback>(`/feedback/${id}`);
    return response.data;
  },

  create: async (data: FeedbackCreate): Promise<Feedback> => {
    const response = await api.post<Feedback>('/feedback', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Feedback>): Promise<Feedback> => {
    const response = await api.patch<Feedback>(`/feedback/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/feedback/${id}`);
  },

  getComments: async (id: number): Promise<{ comments: FeedbackComment[]; total: number }> => {
    const response = await api.get(`/feedback/${id}/comments`);
    return response.data;
  },

  addComment: async (
    id: number,
    data: { comment: string; is_internal?: boolean; attachments?: number[] }
  ): Promise<FeedbackComment> => {
    const response = await api.post<FeedbackComment>(`/feedback/${id}/comments`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Feedback> => {
    const response = await api.patch<Feedback>(`/feedback/${id}/status`, { status });
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/feedback/stats');
    return response.data;
  },
};

// ===== Notifications API =====
export const notificationsApi = {
  getAll: async (params?: { is_read?: boolean; type?: string }): Promise<{ notifications: Notification[]; total: number; unread_count: number }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ marked: number }> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  deleteAll: async (): Promise<{ deleted: number }> => {
    const response = await api.delete('/notifications/delete-all');
    return response.data;
  },
};

// ===== Direct Conversations API =====
export const directConversationsApi = {
  getAll: async (params?: { skip?: number; limit?: number }): Promise<{ conversations: DirectConversation[]; total: number }> => {
    const response = await api.get('/direct-conversations', { params });
    return response.data;
  },

  startConversation: async (data: { target_user_ids: number[]; topic?: string }): Promise<DirectConversation> => {
    const response = await api.post<DirectConversation>('/direct-conversations', data);
    return response.data;
  },

  getMessages: async (
    conversationId: number,
    params?: { skip?: number; limit?: number }
  ): Promise<{ messages: DirectMessage[] }> => {
    const response = await api.get(`/direct-conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  sendMessage: async (
    conversationId: number,
    data: { content: string; attachments?: number[] }
  ): Promise<DirectMessage> => {
    const response = await api.post<DirectMessage>(`/direct-conversations/${conversationId}/messages`, data);
    return response.data;
  },

  markRead: async (
    conversationId: number,
    lastReadMessageId?: number | null
  ): Promise<{ success: boolean; last_read_message_id: number | null }> => {
    const payload =
      typeof lastReadMessageId === 'undefined'
        ? {}
        : { last_read_message_id: lastReadMessageId };
    const response = await api.patch(`/direct-conversations/${conversationId}/read-receipt`, payload);
    return response.data;
  },

  getRecipients: async (
    params?: { q?: string }
  ): Promise<{ users: DirectConversationRecipient[] }> => {
    const response = await api.get('/direct-conversations/recipients', { params });
    return response.data;
  },
};

// ===== Birthday API =====
export const birthdayApi = {
  getEvents: async (): Promise<{ events: BirthdayEvent[] }> => {
    const response = await api.get('/birthday/events');
    return response.data;
  },

  createOrUpdateEvent: async (data: {
    year: number;
    month: number;
    event_date: string;
    title: string;
    description?: string;
    location?: string;
  }): Promise<BirthdayEvent> => {
    const response = await api.post<BirthdayEvent>('/birthday/events', data);
    return response.data;
  },

  getEventById: async (eventId: number): Promise<BirthdayEvent> => {
    const response = await api.get<BirthdayEvent>(`/birthday/events/${eventId}`);
    return response.data;
  },

  getRegistrations: async (
    eventId: number
  ): Promise<{ registrations: BirthdayRegistration[] }> => {
    const response = await api.get(`/birthday/events/${eventId}/registrations`);
    return response.data;
  },

  submitRsvp: async (
    eventId: number,
    rsvpStatus: 'going' | 'not_going'
  ): Promise<BirthdayRegistration> => {
    const response = await api.post<BirthdayRegistration>(
      `/birthday/events/${eventId}/rsvp`,
      { rsvp_status: rsvpStatus }
    );
    return response.data;
  },
};

// ===== Announcements API =====
export const announcementsApi = {
  getAll: async (params?: { category?: string; is_pinned?: boolean }): Promise<{ announcements: Announcement[]; total: number; pinned_count: number }> => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Announcement> => {
    const response = await api.get<Announcement>(`/announcements/${id}`);
    return response.data;
  },

  create: async (data: AnnouncementCreate): Promise<Announcement> => {
    const response = await api.post<Announcement>('/announcements', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Announcement>): Promise<Announcement> => {
    const response = await api.patch<Announcement>(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/announcements/stats');
    return response.data;
  },
};

// ===== Files API =====
export const filesApi = {
  upload: async (file: File, entityType?: string, entityId?: number): Promise<FileUpload> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId) params.append('entity_id', entityId.toString());

    const response = await api.post<FileUpload>(`/files/upload?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/files/${id}`, { responseType: 'blob' });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/files/${id}`);
  },

  getMyFiles: async (): Promise<{ files: FileUpload[]; total: number }> => {
    const response = await api.get('/files/my-files');
    return response.data;
  },

  getEntityFiles: async (entityType: string, entityId: number): Promise<{ files: FileUpload[]; total: number }> => {
    const response = await api.get(`/files/by-entity/${entityType}/${entityId}`);
    return response.data;
  },
};

// ===== Admin API =====
export const adminApi = {
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const response = await api.get<SystemMetrics>('/admin/metrics');
    return response.data;
  },

  getAllUsers: async (): Promise<{ users: User[]; total: number }> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  assignFeedback: async (feedbackId: number, assigneeId: number): Promise<any> => {
    const response = await api.patch(`/admin/feedback/${feedbackId}/assign`, {
      assigned_to: assigneeId,
    });
    return response.data;
  },

  updateUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await api.patch<User>(`/admin/users/${userId}/status`, { is_active: isActive });
    return response.data;
  },

  updateUserRole: async (userId: number, role: string): Promise<User> => {
    const response = await api.patch<User>(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  getAuditLogs: async (params?: { page?: number; page_size?: number; user_id?: number; action?: string }): Promise<{ logs: AuditLog[]; total: number; page: number; page_size: number }> => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  getFeedbackStats: async (): Promise<any> => {
    const response = await api.get('/admin/feedback-stats');
    return response.data;
  },
};
