/**
 * Campus Pulse - Security & Validation Utilities
 * Enforces OWASP guidelines, input sanitization, and strict RBAC checks.
 */

import { UserRole, Post, User } from '../types/index.ts';

// Allowed MIME types for attachments
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/csv',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Sanitizes untrusted user strings against XSS injection.
 * Strips script tags, javascript: pseudo-protocols, and dangerous HTML delimiters.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Generates a sanitized, safe filename preventing path traversal (e.g., ../../../etc/passwd).
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'document.pdf';
  // Strip paths, dots prefixes, and non-whitelisted characters
  const baseName = filename.replace(/^.*[\\/]/, '');
  const clean = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Disallow hidden files or double dots
  return clean.replace(/^\.+/, '').replace(/\.{2,}/g, '.') || 'attachment';
}

/**
 * Validates an uploaded file's metadata against security bounds.
 */
export function validateAttachment(file: { name: string; size: number; mimeType: string }): {
  valid: boolean;
  error?: string;
} {
  if (!file || !file.name) {
    return { valid: false, error: 'File name is missing.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // Prevent dangerous file extensions
  const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js', '.py', '.vbs', '.msi'];
  const lowerName = file.name.toLowerCase();
  for (const ext of dangerousExts) {
    if (lowerName.endsWith(ext)) {
      return { valid: false, error: `Executable or script files are strictly prohibited (${ext}).` };
    }
  }

  // Check MIME type against whitelist
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.mimeType}. Allowed: PDF, Word, PPT, Excel, Images, Text.`,
    };
  }

  return { valid: true };
}

/**
 * Checks if a user has sufficient authorization to edit a specific post.
 * Rule: Superadmins and Admins can edit any post. Faculty can only edit their own posts.
 * Public/Students can never edit.
 */
export function canUserEditPost(user: User | null | undefined, post: Post): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'superadmin' || user.role === 'admin') return true;
  if (user.role === 'faculty' && post.authorId === user.id) return true;
  return false;
}

/**
 * Checks if a user has sufficient authorization to delete a specific post.
 * Rule: Superadmins and Admins can delete any post. Faculty can only delete their own posts.
 * Public/Students can never delete.
 */
export function canUserDeletePost(user: User | null | undefined, post: Post): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'superadmin' || user.role === 'admin') return true;
  if (user.role === 'faculty' && post.authorId === user.id) return true;
  return false;
}

/**
 * Checks if a user has permission to publish official posts.
 */
export function canUserPublish(user: User | null | undefined): boolean {
  if (!user || !user.isActive) return false;
  return ['faculty', 'admin', 'superadmin'].includes(user.role);
}

/**
 * Checks if a user has administrative control (can manage other users/audit logs).
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  return !!user && user.isActive && user.role === 'superadmin';
}
