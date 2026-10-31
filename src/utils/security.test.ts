import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeInput,
  sanitizeFilename,
  validateAttachment,
  canUserEditPost,
  canUserDeletePost,
  canUserPublish,
} from './security.ts';
import { Post, User } from '../types/index.ts';

test('sanitizeInput strips dangerous script tags and event handlers', () => {
  const dirty = '<script>alert("hacked")</script>Hello <img src="x" onerror="steal()" />World';
  const clean = sanitizeInput(dirty);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('onerror='), false);
  assert.equal(clean.includes('Hello'), true);
  assert.equal(clean.includes('World'), true);
});

test('sanitizeFilename prevents path traversal and dangerous extensions', () => {
  assert.equal(sanitizeFilename('../../../etc/passwd'), 'passwd');
  assert.equal(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe'), 'cmd.exe');
  assert.equal(sanitizeFilename('Syllabus (2026) [Official].pdf'), 'Syllabus__2026___Official_.pdf');
});

test('validateAttachment rejects oversized or executable files', () => {
  // Reject .exe
  const exeResult = validateAttachment({
    name: 'malware.exe',
    size: 1024,
    mimeType: 'application/octet-stream',
  });
  assert.equal(exeResult.valid, false);

  // Reject oversized file > 10MB
  const bigResult = validateAttachment({
    name: 'giant.pdf',
    size: 15 * 1024 * 1024,
    mimeType: 'application/pdf',
  });
  assert.equal(bigResult.valid, false);

  // Accept valid PDF
  const validResult = validateAttachment({
    name: 'maths_assignment.pdf',
    size: 2 * 1024 * 1024,
    mimeType: 'application/pdf',
  });
  assert.equal(validResult.valid, true);
});

test('canUserEditPost enforces strict role ownership', () => {
  const mockPost: Post = {
    id: 'post-1',
    title: 'Test',
    category: 'notices',
    description: 'Notice text',
    authorId: 'faculty-1',
    authorName: 'Dr. Sharma',
    authorEmail: 'sharma@college.edu',
    authorRole: 'faculty',
    branch: 'CSE',
    semester: '6',
    section: 'A',
    priority: 'normal',
    isPinned: false,
    status: 'published',
    publishDate: new Date().toISOString(),
    attachments: [],
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const student: User = {
    id: 'student-1',
    name: 'Student',
    email: 'student@college.edu',
    role: 'student',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const facultyOwner: User = {
    id: 'faculty-1',
    name: 'Dr. Sharma',
    email: 'sharma@college.edu',
    role: 'faculty',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const facultyOther: User = {
    id: 'faculty-2',
    name: 'Prof. Other',
    email: 'other@college.edu',
    role: 'faculty',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const admin: User = {
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@college.edu',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  assert.equal(canUserEditPost(student, mockPost), false);
  assert.equal(canUserEditPost(facultyOther, mockPost), false);
  assert.equal(canUserEditPost(facultyOwner, mockPost), true);
  assert.equal(canUserEditPost(admin, mockPost), true);
  assert.equal(canUserDeletePost(facultyOther, mockPost), false);
  assert.equal(canUserDeletePost(facultyOwner, mockPost), true);
  assert.equal(canUserPublish(student), false);
  assert.equal(canUserPublish(facultyOwner), true);
});
