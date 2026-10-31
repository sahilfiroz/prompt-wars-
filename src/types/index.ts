/**
 * Campus Pulse - Domain Types & Data Contracts
 * Secure, production-grade schema for college communications.
 */

export type UserRole = 'student' | 'faculty' | 'admin' | 'superadmin';

export type PostCategory =
  | 'notices'
  | 'events'
  | 'assignments'
  | 'notes'
  | 'general'
  | 'timetable'
  | 'documents'
  | 'opportunities';

export type PriorityLevel = 'low' | 'normal' | 'important' | 'urgent';

export type PostStatus = 'draft' | 'published' | 'archived';

export interface Attachment {
  id: string;
  name: string;
  size: number; // in bytes
  mimeType: string;
  url: string; // Data URL or asset path
  uploadedAt: string;
}

export interface Post {
  id: string;
  title: string;
  category: PostCategory;
  description: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  authorDepartment?: string;
  branch: string; // 'All' | 'CSE' | 'ECE' | 'ME' | 'CE' | 'EE' | 'IT' | etc.
  semester: string; // 'All' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  section: string; // 'All' | 'A' | 'B' | 'C'
  priority: PriorityLevel;
  isPinned: boolean;
  status: PostStatus;
  publishDate: string; // ISO date
  expiryDate?: string; // ISO date
  deadline?: string; // ISO date for assignments, registration, etc.
  attachments: Attachment[];
  viewsCount: number;
  aiSummary?: string;
  // Specific category metadata
  eventDetails?: {
    venue: string;
    eventDate: string;
    organizer: string;
    registrationLink?: string;
    registrationDeadline?: string;
  };
  assignmentDetails?: {
    subject: string;
    maxMarks?: number;
    submissionEmail?: string;
  };
  notesDetails?: {
    subject: string;
    academicYear?: string;
    fileType?: string; // 'PDF' | 'PPT' | 'DOC' | 'ZIP'
  };
  documentDetails?: {
    docType: 'form' | 'circular' | 'calendar' | 'guideline' | 'syllabus';
    issuedBy: string;
  };
  opportunityDetails?: {
    organization: string;
    stipendOrPackage?: string;
    eligibility?: string;
    applyLink?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuditLog {
  id: string;
  action: string; // e.g., 'POST_CREATED', 'POST_DELETED', 'USER_ROLE_CHANGED', 'USER_LOGIN'
  userId: string;
  userName: string;
  userRole: UserRole;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: PostCategory;
  priority: PriorityLevel;
  targetBranch: string;
  targetSemester: string;
  postId?: string;
  createdAt: string;
  isRead?: boolean;
}

export interface FilterState {
  searchQuery: string;
  category: PostCategory | 'all';
  branch: string;
  semester: string;
  section: string;
  priority: PriorityLevel | 'all';
  dateFilter: 'all' | 'today' | 'this_week' | 'this_month';
  showPinnedOnly: boolean;
  showBookmarkedOnly: boolean;
  status: PostStatus;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
