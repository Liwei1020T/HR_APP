/**
 * Type definitions for the HR App API
 */

// ===== Auth Types =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'employee' | 'hr' | 'admin' | 'superadmin';
  is_active: boolean;
  created_at: string;
  department?: string;
}

// ===== Channel Types =====
export interface Channel {
  id: number;
  name: string;
  description: string;
  channel_type: string;
  is_private: boolean;
  created_by: number;
  created_at: string;
  creator_name: string;
  member_count: number;
  is_member?: boolean;
}

export interface ChannelCreate {
  name: string;
  description?: string;
  channel_type: string;
  is_private: boolean;
}

export interface ChannelMember {
  id: number;
  user_id: number;
  channel_id: number;
  role: 'member' | 'moderator';
  joined_at: string;
  user_name: string;
  user_email: string;
}

// ===== Feedback Types =====
export interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  is_anonymous: boolean;
  submitted_by: number;
  submitted_by_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: number;
  title: string;
  content: string;
  category: 'workplace' | 'benefits' | 'management' | 'culture' | 'compensation' | 'training' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  is_anonymous: boolean;
  submitted_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  submitter_name?: string;
  assignee_name?: string;
  comment_count: number;
}

export interface FeedbackComment {
  id: number;
  feedback_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user_name: string;
}

export interface FeedbackCreate {
  title: string;
  description: string;
  category: string;
  is_anonymous?: boolean;
}

// ===== Notification Types =====
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_entity_type?: string;
  related_entity_id?: number;
}

// ===== Announcement Types =====
export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  is_active: boolean;
  expires_at?: string | null;
  created_by: number;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  creator?: {
    id: number;
    email: string;
    full_name: string;
  };
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  category: string;
  is_pinned?: boolean;
  expires_at?: string;
}

// ===== File Types =====
export interface FileUpload {
  id: number;
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  storage_path: string;
  entity_type?: string;
  entity_id?: number;
  uploaded_by: number;
  uploaded_at: string;
  uploader_name: string;
}

// ===== Admin Types =====
export interface SystemMetrics {
  total_users: number;
  active_users: number;
  total_channels: number;
  public_channels: number;
  private_channels: number;
  total_feedback: number;
  pending_feedback: number;
  in_progress_feedback: number;
  resolved_feedback: number;
  total_announcements: number;
  active_announcements: number;
  total_notifications: number;
  unread_notifications: number;
  total_files: number;
  storage_used_mb: number;
}

export interface UserMetrics {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  feedback_submitted: number;
  feedback_assigned: number;
  channels_joined: number;
  files_uploaded: number;
  last_login?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
}

// ===== Pagination Types =====
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ===== API Error Types =====
export interface ApiError {
  detail: string;
}
