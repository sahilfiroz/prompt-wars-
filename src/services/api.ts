/**
 * Campus Pulse - Frontend API Client
 * Securely communicates with Express backend with token injection and error handling.
 */

import { Post, User, AuditLog, NotificationItem, PostCategory } from '../types/index.ts';

const TOKEN_KEY = 'campus_pulse_auth_token';
const USER_KEY = 'campus_pulse_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAuth(res.token, res.user);
    return res;
  },

  async getCurrentUser(): Promise<User> {
    const res = await request<{ user: User }>('/api/auth/me');
    return res.user;
  },

  async requestPasswordReset(email: string): Promise<string> {
    const res = await request<{ message: string }>('/api/auth/reset-password-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return res.message;
  },

  // Posts
  async getPosts(): Promise<Post[]> {
    const res = await request<{ posts: Post[] }>('/api/posts');
    return res.posts;
  },

  async getPostById(id: string): Promise<Post> {
    const res = await request<{ post: Post }>(`/api/posts/${id}`);
    return res.post;
  },

  async createPost(postData: any): Promise<Post> {
    const res = await request<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return res.post;
  },

  async updatePost(id: string, postData: any): Promise<Post> {
    const res = await request<{ post: Post }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
    return res.post;
  },

  async deletePost(id: string): Promise<void> {
    await request(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async archivePost(id: string): Promise<Post> {
    const res = await request<{ post: Post }>(`/api/posts/${id}/archive`, {
      method: 'POST',
    });
    return res.post;
  },

  async checkDuplicate(title: string, description: string, excludeId?: string): Promise<{
    isDuplicate: boolean;
    similarityScore: number;
    similarPostTitle?: string;
    reason?: string;
  }> {
    return await request('/api/posts/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ title, description, excludeId }),
    });
  },

  async summarizeNotice(postId: string): Promise<string> {
    const res = await request<{ summary: string }>(`/api/posts/${postId}/ai-summarize`, {
      method: 'POST',
    });
    return res.summary;
  },

  // Notifications, Bookmarks & Reads
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await request<{ notifications: NotificationItem[] }>('/api/notifications');
    return res.notifications;
  },

  async getBookmarks(): Promise<string[]> {
    const res = await request<{ bookmarks: string[] }>('/api/bookmarks');
    return res.bookmarks;
  },

  async toggleBookmark(postId: string): Promise<string[]> {
    const res = await request<{ bookmarks: string[] }>('/api/bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
    return res.bookmarks;
  },

  async getReadPosts(): Promise<string[]> {
    const res = await request<{ readPosts: string[] }>('/api/read-posts');
    return res.readPosts;
  },

  async markAsRead(postId: string): Promise<string[]> {
    const res = await request<{ readPosts: string[] }>('/api/read-posts/mark', {
      method: 'POST',
      body: JSON.stringify({ postId }),
    });
    return res.readPosts;
  },

  // Analytics & Logs
  async getAnalytics(): Promise<any> {
    const res = await request<{ analytics: any }>('/api/analytics');
    return res.analytics;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await request<{ logs: AuditLog[] }>('/api/audit-logs');
    return res.logs;
  },

  // Super Admin Users
  async getUsers(): Promise<User[]> {
    const res = await request<{ users: User[] }>('/api/users');
    return res.users;
  },

  async createUser(userData: any): Promise<User> {
    const res = await request<{ user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.user;
  },

  async updateUser(userId: string, updates: any): Promise<User> {
    const res = await request<{ user: User }>(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.user;
  },
};
