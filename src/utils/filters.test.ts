import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTextSimilarity,
  findSimilarPost,
  getDeadlineStatus,
  filterPosts,
} from './filters.ts';
import { Post, FilterState } from '../types/index.ts';

test('computeTextSimilarity calculates word overlap accurately', () => {
  const text1 = 'Mid term examination schedule for 6th semester Computer Science students';
  const text2 = 'Examination schedule mid term for 6th semester CS students announced';
  const similarity = computeTextSimilarity(text1, text2);
  assert.ok(similarity > 0.4, `Expected similarity > 0.4, got ${similarity}`);

  const dissimilar = computeTextSimilarity('Football tournament registration', 'Physics practical exam schedule');
  assert.ok(dissimilar < 0.1, `Expected similarity < 0.1, got ${dissimilar}`);
});

test('findSimilarPost flags duplicate submissions', () => {
  const existing: Post[] = [
    {
      id: 'p1',
      title: 'Submit Practical Files before Friday',
      description: 'All 6th sem students must submit laboratory manuals to Prof. Sharma.',
      category: 'general',
      authorId: 'u1',
      authorName: 'Dr. Sharma',
      authorEmail: 's@college.edu',
      authorRole: 'faculty',
      branch: 'CSE',
      semester: '6',
      section: 'All',
      priority: 'important',
      isPinned: false,
      status: 'published',
      publishDate: new Date().toISOString(),
      attachments: [],
      viewsCount: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const duplicateCheck = findSimilarPost(
    'Submit practical files before friday',
    'Laboratory manual submission reminder',
    existing
  );
  assert.equal(duplicateCheck.isDuplicate, true);

  const uniqueCheck = findSimilarPost(
    'Annual Sports Fest 2026',
    'Join inter-college athletics tournament',
    existing
  );
  assert.equal(uniqueCheck.isDuplicate, false);
});

test('getDeadlineStatus categorizes urgency correctly', () => {
  const now = 1770000000000;

  // 12 hours from now -> Urgent (< 24h)
  const urgentDeadline = new Date(now + 12 * 3600 * 1000).toISOString();
  const urgentStatus = getDeadlineStatus(urgentDeadline, now);
  assert.equal(urgentStatus.isUrgent, true);
  assert.equal(urgentStatus.isOverdue, false);

  // 2 days from now -> Soon (< 3d)
  const soonDeadline = new Date(now + 48 * 3600 * 1000).toISOString();
  const soonStatus = getDeadlineStatus(soonDeadline, now);
  assert.equal(soonStatus.isSoon, true);
  assert.equal(soonStatus.isUrgent, false);

  // 2 days ago -> Overdue
  const pastDeadline = new Date(now - 48 * 3600 * 1000).toISOString();
  const pastStatus = getDeadlineStatus(pastDeadline, now);
  assert.equal(pastStatus.isOverdue, true);
});

test('filterPosts correctly sorts pinned items and filters by branch', () => {
  const posts: Post[] = [
    {
      id: 'p1',
      title: 'Regular Notice',
      category: 'notices',
      description: 'Some text',
      authorId: 'u1',
      authorName: 'Faculty',
      authorEmail: 'f@edu',
      authorRole: 'faculty',
      branch: 'CSE',
      semester: '6',
      section: 'All',
      priority: 'normal',
      isPinned: false,
      status: 'published',
      publishDate: '2026-04-01T10:00:00Z',
      attachments: [],
      viewsCount: 0,
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'p2',
      title: 'Pinned Urgent Circular',
      category: 'notices',
      description: 'Crucial exam notice',
      authorId: 'u2',
      authorName: 'Admin',
      authorEmail: 'a@edu',
      authorRole: 'admin',
      branch: 'All',
      semester: 'All',
      section: 'All',
      priority: 'urgent',
      isPinned: true,
      status: 'published',
      publishDate: '2026-03-01T10:00:00Z', // older date, but pinned
      attachments: [],
      viewsCount: 0,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'p3',
      title: 'ECE Specific Event',
      category: 'events',
      description: 'Robotics Workshop',
      authorId: 'u3',
      authorName: 'Dr. Priya',
      authorEmail: 'p@edu',
      authorRole: 'faculty',
      branch: 'ECE',
      semester: '4',
      section: 'All',
      priority: 'important',
      isPinned: false,
      status: 'published',
      publishDate: '2026-04-02T10:00:00Z',
      attachments: [],
      viewsCount: 0,
      createdAt: '2026-04-02T10:00:00Z',
      updatedAt: '2026-04-02T10:00:00Z',
    },
  ];

  const defaultFilters: FilterState = {
    searchQuery: '',
    category: 'all',
    branch: 'CSE',
    semester: 'All',
    section: 'All',
    priority: 'all',
    dateFilter: 'all',
    showPinnedOnly: false,
    showBookmarkedOnly: false,
    status: 'published',
  };

  const cseResults = filterPosts(posts, defaultFilters);
  // Pinned item (branch: 'All') must come first, followed by CSE item. ECE item should be filtered out.
  assert.equal(cseResults.length, 2);
  assert.equal(cseResults[0].id, 'p2'); // Pinned first
  assert.equal(cseResults[1].id, 'p1');
});
