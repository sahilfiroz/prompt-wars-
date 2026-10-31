/**
 * Campus Pulse - Full-Stack Express Server Entry Point
 * Implements Top-Level Request Deserialization, Defensive Payload Ingestion,
 * Strict RBAC, Gemini AI Resilient Fallback, and Vite Middlewares.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  incrementPostViews,
  getStoredUserByEmail,
  getStoredUserById,
  getUsers,
  createUser,
  updateUser,
  getNotifications,
  getUserBookmarks,
  toggleUserBookmark,
  getUserReadPosts,
  markPostAsRead,
  addAuditLog,
  getAuditLogs,
  getPortalAnalytics,
} from './server/db.ts';
import {
  authenticateToken,
  requireRole,
  verifyPassword,
  hashPassword,
  createSessionToken,
  AuthenticatedRequest,
} from './server/auth.ts';
import {
  sanitizeInput,
  sanitizeFilename,
  validateAttachment,
  canUserEditPost,
  canUserDeletePost,
  canUserPublish,
  isSuperAdmin,
} from './src/utils/security.ts';
import { findSimilarPost } from './src/utils/filters.ts';
import { summarizeNoticeWithAi, checkSemanticDuplicateWithAi } from './server/gemini.ts';
import { PostCategory, PriorityLevel, PostStatus } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // 1. TOP-LEVEL REQUEST DESERIALIZATION (Ordering Guarantee)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Attach Authentication Context
  app.use(authenticateToken((id) => getStoredUserById(id)));

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // POST /api/auth/login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const email = sanitizeInput(body.email).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const storedUser = getStoredUserByEmail(email);
    if (!storedUser) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (!storedUser.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact the administrator.' });
    }

    const isMatch = verifyPassword(password, storedUser.salt, storedUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    updateUser(storedUser.id, { lastLoginAt: new Date().toISOString() });

    const { passwordHash, salt, ...safeUser } = storedUser;
    const token = createSessionToken(safeUser);

    addAuditLog({
      action: 'USER_LOGIN',
      userId: safeUser.id,
      userName: safeUser.name,
      userRole: safeUser.role,
      details: `Successful login via credential provider for ${safeUser.email}`,
      ipAddress: req.ip,
    });

    return res.json({
      user: safeUser,
      token,
      message: 'Login successful.',
    });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.json({ user: req.user });
  });

  // POST /api/auth/reset-password-request (simulated secure institutional recovery flow)
  app.post('/api/auth/reset-password-request', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const email = sanitizeInput(body.email).toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Institutional email is required.' });
    }

    const user = getStoredUserByEmail(email);
    if (user) {
      addAuditLog({
        action: 'PASSWORD_RESET_REQUESTED',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        details: `Password reset instruction requested for ${email}`,
        ipAddress: req.ip,
      });
    }

    // Always respond with neutral message to prevent user enumeration
    return res.json({
      message: 'If an authorized account is associated with this email, reset instructions have been sent.',
    });
  });

  // ==========================================
  // POSTS & CONTENT ROUTES
  // ==========================================

  // GET /api/posts
  app.get('/api/posts', (req: Request, res: Response) => {
    const allPosts = getPosts();
    return res.json({ posts: allPosts });
  });

  // GET /api/posts/:id
  app.get('/api/posts/:id', (req: Request, res: Response) => {
    const post = getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    incrementPostViews(post.id);
    return res.json({ post: { ...post, viewsCount: (post.viewsCount || 0) + 1 } });
  });

  // POST /api/posts (Faculty / Admin / Superadmin only)
  app.post('/api/posts', requireRole(['faculty', 'admin', 'superadmin']), (req: AuthenticatedRequest, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const user = req.user!;

    const title = sanitizeInput(body.title);
    const description = sanitizeInput(body.description);
    const category = (body.category || 'general') as PostCategory;
    const branch = sanitizeInput(body.branch) || 'All';
    const semester = sanitizeInput(body.semester) || 'All';
    const section = sanitizeInput(body.section) || 'All';
    const priority = (body.priority || 'normal') as PriorityLevel;
    const status = (body.status || 'published') as PostStatus;
    const isPinned = Boolean(body.isPinned);
    const publishDate = body.publishDate || new Date().toISOString();
    const expiryDate = body.expiryDate || undefined;
    const deadline = body.deadline || undefined;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    // Validate attachments
    const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
    const sanitizedAttachments = [];

    for (const rawAtt of rawAttachments) {
      if (!rawAtt || typeof rawAtt !== 'object') continue;
      const cleanName = sanitizeFilename(rawAtt.name);
      const validation = validateAttachment({
        name: cleanName,
        size: Number(rawAtt.size) || 0,
        mimeType: rawAtt.mimeType || 'application/octet-stream',
      });

      if (!validation.valid) {
        return res.status(400).json({ error: `Attachment error: ${validation.error}` });
      }

      sanitizedAttachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        size: Number(rawAtt.size) || 0,
        mimeType: rawAtt.mimeType,
        url: rawAtt.url || '',
        uploadedAt: new Date().toISOString(),
      });
    }

    const newPost = createPost({
      title,
      description,
      category,
      authorId: user.id,
      authorName: user.name,
      authorEmail: user.email,
      authorRole: user.role,
      authorDepartment: user.department,
      branch,
      semester,
      section,
      priority,
      isPinned,
      status,
      publishDate,
      expiryDate,
      deadline,
      attachments: sanitizedAttachments,
      eventDetails: body.eventDetails,
      assignmentDetails: body.assignmentDetails,
      notesDetails: body.notesDetails,
      documentDetails: body.documentDetails,
      opportunityDetails: body.opportunityDetails,
    });

    addAuditLog({
      action: status === 'draft' ? 'POST_DRAFTED' : 'POST_PUBLISHED',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: `${status === 'draft' ? 'Saved draft' : 'Published post'} "${title}" in category [${category}]`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ post: newPost, message: 'Post created successfully.' });
  });

  // PUT /api/posts/:id (Author or Admin/Superadmin only)
  app.put('/api/posts/:id', requireRole(['faculty', 'admin', 'superadmin']), (req: AuthenticatedRequest, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const user = req.user!;
    const post = getPostById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Enforce strict ownership / admin authorization
    if (!canUserEditPost(user, post)) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    const updates: Partial<typeof post> = {};
    if (body.title) updates.title = sanitizeInput(body.title);
    if (body.description) updates.description = sanitizeInput(body.description);
    if (body.category) updates.category = body.category;
    if (body.branch) updates.branch = sanitizeInput(body.branch);
    if (body.semester) updates.semester = sanitizeInput(body.semester);
    if (body.section) updates.section = sanitizeInput(body.section);
    if (body.priority) updates.priority = body.priority;
    if (body.status) updates.status = body.status;
    if (typeof body.isPinned === 'boolean') updates.isPinned = body.isPinned;
    if (body.publishDate) updates.publishDate = body.publishDate;
    if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate;
    if (body.deadline !== undefined) updates.deadline = body.deadline;
    if (body.eventDetails) updates.eventDetails = body.eventDetails;
    if (body.assignmentDetails) updates.assignmentDetails = body.assignmentDetails;
    if (body.notesDetails) updates.notesDetails = body.notesDetails;
    if (body.documentDetails) updates.documentDetails = body.documentDetails;
    if (body.opportunityDetails) updates.opportunityDetails = body.opportunityDetails;

    // Attachments handling
    if (Array.isArray(body.attachments)) {
      updates.attachments = body.attachments;
    }

    const updated = updatePost(post.id, updates);

    addAuditLog({
      action: 'POST_UPDATED',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: `Updated post "${post.title}" (ID: ${post.id})`,
      ipAddress: req.ip,
    });

    return res.json({ post: updated, message: 'Post updated successfully.' });
  });

  // DELETE /api/posts/:id (Author or Admin/Superadmin only)
  app.delete('/api/posts/:id', requireRole(['faculty', 'admin', 'superadmin']), (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const post = getPostById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!canUserDeletePost(user, post)) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    deletePost(post.id);

    addAuditLog({
      action: 'POST_DELETED',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: `Permanently deleted post "${post.title}" (ID: ${post.id})`,
      ipAddress: req.ip,
    });

    return res.json({ message: 'Post permanently deleted.' });
  });

  // POST /api/posts/:id/archive
  app.post('/api/posts/:id/archive', requireRole(['faculty', 'admin', 'superadmin']), (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const post = getPostById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!canUserEditPost(user, post)) {
      return res.status(403).json({ error: 'You are not authorized to archive this post.' });
    }

    const updated = updatePost(post.id, { status: 'archived' });

    addAuditLog({
      action: 'POST_ARCHIVED',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      details: `Archived post "${post.title}"`,
      ipAddress: req.ip,
    });

    return res.json({ post: updated, message: 'Post archived.' });
  });

  // POST /api/posts/check-duplicate (Runs local Jaccard check + Gemini AI semantic evaluation)
  app.post('/api/posts/check-duplicate', requireRole(['faculty', 'admin', 'superadmin']), async (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const title = sanitizeInput(body.title);
    const description = sanitizeInput(body.description);
    const excludeId = body.excludeId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required for duplicate verification.' });
    }

    const activePosts = getPosts().filter((p) => p.status === 'published');
    const localCheck = findSimilarPost(title, description, activePosts, excludeId);

    if (localCheck.isDuplicate) {
      return res.json({
        isDuplicate: true,
        similarityScore: localCheck.similarityScore,
        similarPostTitle: localCheck.similarPost?.title,
        reason: `High textual similarity (${localCheck.similarityScore}%) detected with an existing active notice.`,
      });
    }

    // If Gemini key is available, attempt semantic similarity evaluation
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        const existingTitles = activePosts.map((p) => p.title);
        const aiCheck = await checkSemanticDuplicateWithAi(title, description, existingTitles);
        if (aiCheck.isDuplicate) {
          return res.json({
            isDuplicate: true,
            similarityScore: 85,
            similarPostTitle: aiCheck.matchedTitle,
            reason: aiCheck.reason || 'AI identified that this announcement conveys identical information to an existing circular.',
          });
        }
      } catch (err) {
        console.warn('[Duplicate Check] AI check failed or skipped:', err);
      }
    }

    return res.json({ isDuplicate: false, similarityScore: localCheck.similarityScore });
  });

  // POST /api/posts/:id/ai-summarize
  app.post('/api/posts/:id/ai-summarize', async (req: Request, res: Response) => {
    const post = getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.aiSummary) {
      return res.json({ summary: post.aiSummary });
    }

    try {
      const summary = await summarizeNoticeWithAi(post.title, post.description);
      updatePost(post.id, { aiSummary: summary });
      return res.json({ summary });
    } catch (err: any) {
      // Graceful fallback if Gemini API is unavailable or unconfigured
      const fallbackSummary = `• Notice: ${post.title}\n• Issued by: ${post.authorName} (${post.authorDepartment || 'College'})\n• Action: Review full document and note deadlines.`;
      return res.json({ summary: fallbackSummary, note: 'Generated via template fallback.' });
    }
  });

  // ==========================================
  // NOTIFICATIONS, BOOKMARKS & READ STATUS
  // ==========================================

  app.get('/api/notifications', (_req: Request, res: Response) => {
    return res.json({ notifications: getNotifications() });
  });

  app.get('/api/bookmarks', (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr-student'; // Allow student default session
    return res.json({ bookmarks: getUserBookmarks(userId) });
  });

  app.post('/api/bookmarks/toggle', (req: AuthenticatedRequest, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const userId = req.user?.id || 'usr-student';
    const postId = body.postId;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required.' });
    }

    const updated = toggleUserBookmark(userId, postId);
    return res.json({ bookmarks: updated });
  });

  app.get('/api/read-posts', (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr-student';
    return res.json({ readPosts: getUserReadPosts(userId) });
  });

  app.post('/api/read-posts/mark', (req: AuthenticatedRequest, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const userId = req.user?.id || 'usr-student';
    const postId = body.postId;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required.' });
    }

    const updated = markPostAsRead(userId, postId);
    return res.json({ readPosts: updated });
  });

  // ==========================================
  // ANALYTICS & AUDIT LOGS
  // ==========================================

  app.get('/api/analytics', requireRole(['faculty', 'admin', 'superadmin']), (_req: Request, res: Response) => {
    return res.json({ analytics: getPortalAnalytics() });
  });

  app.get('/api/audit-logs', requireRole(['admin', 'superadmin']), (_req: Request, res: Response) => {
    return res.json({ logs: getAuditLogs() });
  });

  // ==========================================
  // SUPER ADMIN USER MANAGEMENT
  // ==========================================

  app.get('/api/users', requireRole(['superadmin']), (_req: Request, res: Response) => {
    return res.json({ users: getUsers() });
  });

  app.post('/api/users', requireRole(['superadmin']), (req: AuthenticatedRequest, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const adminUser = req.user!;

    const name = sanitizeInput(body.name);
    const email = sanitizeInput(body.email).toLowerCase();
    const role = body.role || 'faculty';
    const department = sanitizeInput(body.department);
    const designation = sanitizeInput(body.designation);
    const password = body.password || 'Faculty@123';

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and institutional email are required.' });
    }

    if (getStoredUserByEmail(email)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const { hash, salt } = hashPassword(password);
    const newUser = createUser({
      name,
      email,
      role,
      department,
      designation,
      isActive: true,
      passwordHash: hash,
      salt,
    });

    addAuditLog({
      action: 'USER_CREATED',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      details: `Created new ${role} account for ${name} (${email})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ user: newUser, message: 'User provisioned successfully.' });
  });

  app.patch('/api/users/:id', requireRole(['superadmin']), (req: AuthenticatedRequest, res: Response) => {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const adminUser = req.user!;
    const targetId = req.params.id;

    // Prevent superadmin from deactivating themselves
    if (targetId === adminUser.id && body.isActive === false) {
      return res.status(400).json({ error: 'Superadmin cannot deactivate their own account.' });
    }

    const updates: any = {};
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
    if (body.role) updates.role = body.role;
    if (body.department) updates.department = sanitizeInput(body.department);
    if (body.designation) updates.designation = sanitizeInput(body.designation);

    const updated = updateUser(targetId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    addAuditLog({
      action: 'USER_MODIFIED',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      details: `Modified account properties for user ID ${targetId}`,
      ipAddress: req.ip,
    });

    return res.json({ user: updated, message: 'User updated successfully.' });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Unhandled Error]:', err);
    res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
  });

  // ==========================================
  // VITE INTEGRATION (DEV & PROD)
  // ==========================================

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Campus Pulse] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Campus Pulse] Fatal server startup error:', err);
  process.exit(1);
});
