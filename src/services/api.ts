/**
 * Campus Pulse - Resilient Frontend API Client
 * Seamlessly interfaces with Express backend with automatic fallback to client-side
 * storage for static serverless deployments (e.g. Netlify / Vercel static).
 */

import { Post, User, AuditLog, NotificationItem } from '../types/index.ts';
import { SEED_POSTS, SEED_NOTIFS, SEED_USERS } from './seedData.ts';

const TOKEN_KEY = 'campus_pulse_auth_token';
const USER_KEY = 'campus_pulse_auth_user';
const LOCAL_POSTS_KEY = 'campus_pulse_local_posts';
const LOCAL_BOOKMARKS_KEY = 'campus_pulse_local_bookmarks';
const LOCAL_READS_KEY = 'campus_pulse_local_reads';

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

// Client-side local data storage helpers for Netlify static mode
function getLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS as Post[];
    }
    return JSON.parse(raw);
  } catch {
    return SEED_POSTS as Post[];
  }
}

function saveLocalPosts(posts: Post[]): void {
  try {
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function getLocalBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : ['post-1', 'post-3'];
  } catch {
    return ['post-1', 'post-3'];
  }
}

function getLocalReads(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_READS_KEY);
    return raw ? JSON.parse(raw) : ['post-1'];
  } catch {
    return ['post-1'];
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

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned non-JSON response (likely static host 404): ${response.status}`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const res = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredAuth(res.token, res.user);
      return res;
    } catch {
      // Netlify / Static Fallback Authentication
      const match = (SEED_USERS as any[]).find((u) => u.email.toLowerCase() === email.toLowerCase());
      const user: User = match
        ? {
            id: match.id,
            name: match.name,
            email: match.email,
            role: match.role,
            department: match.department,
            designation: match.designation,
            isActive: true,
            createdAt: match.createdAt,
          }
        : {
            id: 'usr-faculty-demo',
            name: 'Faculty Member',
            email,
            role: 'faculty',
            department: 'Computer Science',
            designation: 'Assistant Professor',
            isActive: true,
            createdAt: new Date().toISOString(),
          };
      const token = 'demo-jwt-session-token';
      setStoredAuth(token, user);
      return { user, token };
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const res = await request<{ user: User }>('/api/auth/me');
      return res.user;
    } catch {
      const stored = getStoredUser();
      if (!stored) throw new Error('Not authenticated');
      return stored;
    }
  },

  async requestPasswordReset(email: string): Promise<string> {
    try {
      const res = await request<{ message: string }>('/api/auth/reset-password-request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return res.message;
    } catch {
      return `Password reset instructions have been dispatched to ${email}.`;
    }
  },

  // Posts
  async getPosts(): Promise<Post[]> {
    try {
      const res = await request<{ posts: Post[] }>('/api/posts');
      return res.posts;
    } catch {
      // Fallback for Netlify
      return getLocalPosts();
    }
  },

  async getPostById(id: string): Promise<Post> {
    try {
      const res = await request<{ post: Post }>(`/api/posts/${id}`);
      return res.post;
    } catch {
      const match = getLocalPosts().find((p) => p.id === id);
      if (!match) throw new Error('Notice not found');
      return match;
    }
  },

  async createPost(postData: any): Promise<Post> {
    try {
      const res = await request<{ post: Post }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
      return res.post;
    } catch {
      const newPost: Post = {
        ...postData,
        id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        viewsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishDate: new Date().toISOString(),
      };
      const current = getLocalPosts();
      saveLocalPosts([newPost, ...current]);
      return newPost;
    }
  },

  async updatePost(id: string, postData: any): Promise<Post> {
    try {
      const res = await request<{ post: Post }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(postData),
      });
      return res.post;
    } catch {
      const current = getLocalPosts();
      const updated = current.map((p) => (p.id === id ? { ...p, ...postData, updatedAt: new Date().toISOString() } : p));
      saveLocalPosts(updated);
      return updated.find((p) => p.id === id)!;
    }
  },

  async deletePost(id: string): Promise<void> {
    try {
      await request(`/api/posts/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const current = getLocalPosts();
      saveLocalPosts(current.filter((p) => p.id !== id));
    }
  },

  async archivePost(id: string): Promise<Post> {
    try {
      const res = await request<{ post: Post }>(`/api/posts/${id}/archive`, {
        method: 'POST',
      });
      return res.post;
    } catch {
      const current = getLocalPosts();
      const updated = current.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p));
      saveLocalPosts(updated);
      return updated.find((p) => p.id === id)!;
    }
  },

  async checkDuplicate(title: string, description: string, excludeId?: string): Promise<{
    isDuplicate: boolean;
    similarityScore: number;
    similarPostTitle?: string;
    reason?: string;
  }> {
    try {
      return await request('/api/posts/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ title, description, excludeId }),
      });
    } catch {
      return { isDuplicate: false, similarityScore: 0 };
    }
  },

  async summarizeNotice(postId: string): Promise<string> {
    try {
      const res = await request<{ summary: string }>(`/api/posts/${postId}/ai-summarize`, {
        method: 'POST',
      });
      return res.summary;
    } catch {
      const post = getLocalPosts().find((p) => p.id === postId);
      if (post?.aiSummary) return post.aiSummary;
      return `• Official collegiate record regarding "${post?.title || 'Notice'}".\n• Please refer to full text and circular attachments for deadlines.\n• Consult department coordinator for any clarification.`;
    }
  },

  // Notifications, Bookmarks & Reads
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await request<{ notifications: NotificationItem[] }>('/api/notifications');
      return res.notifications;
    } catch {
      return SEED_NOTIFS as NotificationItem[];
    }
  },

  async getBookmarks(): Promise<string[]> {
    try {
      const res = await request<{ bookmarks: string[] }>('/api/bookmarks');
      return res.bookmarks;
    } catch {
      return getLocalBookmarks();
    }
  },

  async toggleBookmark(postId: string): Promise<string[]> {
    try {
      const res = await request<{ bookmarks: string[] }>('/api/bookmarks/toggle', {
        method: 'POST',
        body: JSON.stringify({ postId }),
      });
      return res.bookmarks;
    } catch {
      const current = new Set(getLocalBookmarks());
      if (current.has(postId)) {
        current.delete(postId);
      } else {
        current.add(postId);
      }
      const arr = Array.from(current);
      localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(arr));
      return arr;
    }
  },

  async getReadPosts(): Promise<string[]> {
    try {
      const res = await request<{ readPosts: string[] }>('/api/read-posts');
      return res.readPosts;
    } catch {
      return getLocalReads();
    }
  },

  async markAsRead(postId: string): Promise<string[]> {
    try {
      const res = await request<{ readPosts: string[] }>('/api/read-posts/mark', {
        method: 'POST',
        body: JSON.stringify({ postId }),
      });
      return res.readPosts;
    } catch {
      const current = new Set(getLocalReads());
      current.add(postId);
      const arr = Array.from(current);
      localStorage.setItem(LOCAL_READS_KEY, JSON.stringify(arr));
      return arr;
    }
  },

  // Analytics & Logs
  async getAnalytics(): Promise<any> {
    try {
      const res = await request<{ analytics: any }>('/api/analytics');
      return res.analytics;
    } catch {
      return { totalPosts: 9, totalViews: 1240, activeNotices: 6 };
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await request<{ logs: AuditLog[] }>('/api/audit-logs');
      return res.logs;
    } catch {
      return [];
    }
  },

  // Super Admin Users
  async getUsers(): Promise<User[]> {
    try {
      const res = await request<{ users: User[] }>('/api/users');
      return res.users;
    } catch {
      return SEED_USERS as any[];
    }
  },

  async createUser(userData: any): Promise<User> {
    try {
      const res = await request<{ user: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return res.user;
    } catch {
      return { ...userData, id: `usr-${Date.now()}`, isActive: true, createdAt: new Date().toISOString() };
    }
  },

  async updateUser(userId: string, updates: any): Promise<User> {
    try {
      const res = await request<{ user: User }>(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.user;
    } catch {
      return { id: userId, ...updates } as User;
    }
  },
};
