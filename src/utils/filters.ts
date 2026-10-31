/**
 * Campus Pulse - Filtering, Sorting & Search Logic
 * Pure functions decoupled from React UI for fast testing and predictable state.
 */

import { Post, FilterState, PriorityLevel } from '../types/index.ts';

/**
 * Normalizes text for case-insensitive keyword searches.
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Computes Jaccard word-similarity coefficient between two strings (0.0 to 1.0).
 * Used for instant duplicate post warnings before submitting.
 */
export function computeTextSimilarity(textA: string, textB: string): number {
  const setA = new Set(tokenizeText(textA));
  const setB = new Set(tokenizeText(textB));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Checks for potentially duplicate active posts.
 * Threshold: similarity score >= 0.45 or identical title.
 */
export function findSimilarPost(
  newTitle: string,
  newDescription: string,
  existingPosts: Post[],
  excludePostId?: string
): { isDuplicate: boolean; similarPost?: Post; similarityScore: number } {
  const combinedNew = `${newTitle} ${newDescription}`.trim();
  if (!combinedNew) return { isDuplicate: false, similarityScore: 0 };

  let highestScore = 0;
  let mostSimilar: Post | undefined = undefined;

  for (const post of existingPosts) {
    if (excludePostId && post.id === excludePostId) continue;
    if (post.status === 'archived') continue;

    const combinedExisting = `${post.title} ${post.description}`.trim();

    // Exact title match
    if (post.title.trim().toLowerCase() === newTitle.trim().toLowerCase()) {
      return { isDuplicate: true, similarPost: post, similarityScore: 1.0 };
    }

    const score = computeTextSimilarity(combinedNew, combinedExisting);
    if (score > highestScore) {
      highestScore = score;
      mostSimilar = post;
    }
  }

  return {
    isDuplicate: highestScore >= 0.45,
    similarPost: mostSimilar,
    similarityScore: Math.round(highestScore * 100),
  };
}

/**
 * Calculates deadline urgency status based on current time.
 */
export function getDeadlineStatus(
  deadlineIso?: string,
  nowMs: number = Date.now()
): {
  isOverdue: boolean;
  isUrgent: boolean; // < 24 hours
  isSoon: boolean; // < 3 days
  daysRemaining: number;
  formatted: string;
} {
  if (!deadlineIso) {
    return { isOverdue: false, isUrgent: false, isSoon: false, daysRemaining: 999, formatted: 'No deadline' };
  }

  const target = new Date(deadlineIso).getTime();
  const diffMs = target - nowMs;
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const daysRemaining = Math.ceil(hoursRemaining / 24);

  if (diffMs < 0) {
    return {
      isOverdue: true,
      isUrgent: false,
      isSoon: false,
      daysRemaining,
      formatted: `Overdue by ${Math.abs(daysRemaining)} day(s)`,
    };
  }

  if (hoursRemaining <= 24) {
    const hours = Math.max(1, Math.floor(hoursRemaining));
    return {
      isOverdue: false,
      isUrgent: true,
      isSoon: true,
      daysRemaining: 1,
      formatted: `Due in ${hours} hour${hours > 1 ? 's' : ''}`,
    };
  }

  if (daysRemaining <= 3) {
    return {
      isOverdue: false,
      isUrgent: false,
      isSoon: true,
      daysRemaining,
      formatted: `Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
    };
  }

  return {
    isOverdue: false,
    isUrgent: false,
    isSoon: false,
    daysRemaining,
    formatted: `Due in ${daysRemaining} days`,
  };
}

/**
 * Filters and sorts posts based on user filters.
 */
export function filterPosts(
  posts: Post[],
  filters: FilterState,
  bookmarkedIds: Set<string> = new Set()
): Post[] {
  return posts
    .filter((post) => {
      // Status filter
      if (post.status !== filters.status) return false;

      // Category filter
      if (filters.category !== 'all' && post.category !== filters.category) {
        return false;
      }

      // Branch filter: 'All' matches any post, otherwise specific branch match
      if (filters.branch && filters.branch !== 'All') {
        if (post.branch !== 'All' && post.branch !== filters.branch) {
          return false;
        }
      }

      // Semester filter: 'All' matches any
      if (filters.semester && filters.semester !== 'All') {
        if (post.semester !== 'All' && post.semester !== filters.semester) {
          return false;
        }
      }

      // Section filter: 'All' matches any
      if (filters.section && filters.section !== 'All') {
        if (post.section !== 'All' && post.section !== filters.section) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority !== 'all' && post.priority !== filters.priority) {
        return false;
      }

      // Pinned only
      if (filters.showPinnedOnly && !post.isPinned) {
        return false;
      }

      // Bookmarked only
      if (filters.showBookmarkedOnly && !bookmarkedIds.has(post.id)) {
        return false;
      }

      // Search Query
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const query = filters.searchQuery.toLowerCase().trim();
        const inTitle = post.title.toLowerCase().includes(query);
        const inDesc = post.description.toLowerCase().includes(query);
        const inAuthor = post.authorName.toLowerCase().includes(query);
        const inSubject =
          post.assignmentDetails?.subject?.toLowerCase().includes(query) ||
          post.notesDetails?.subject?.toLowerCase().includes(query);
        const inVenue = post.eventDetails?.venue?.toLowerCase().includes(query);

        if (!inTitle && !inDesc && !inAuthor && !inSubject && !inVenue) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned items always come first unless disabled
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // Then sort latest first by publishDate
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
}
