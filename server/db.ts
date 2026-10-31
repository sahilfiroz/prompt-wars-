/**
 * Campus Pulse - Data Persistence Layer
 * Provides robust JSON-backed persistence with zero-crash payload hygiene,
 * sanitization, and full collegiate seed data.
 */

import fs from 'node:fs';
import path from 'node:path';
import { Post, User, AuditLog, NotificationItem } from '../src/types/index.ts';
import { hashPassword } from './auth.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'campus_pulse_db.json');

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  posts: Post[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  bookmarks: Record<string, string[]>; // userId -> postId[]
  readPosts: Record<string, string[]>; // userId -> postId[]
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

let dbCache: DatabaseSchema | null = null;

function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function getInitialSeedData(): DatabaseSchema {
  const superAdminPwd = hashPassword('Admin@123');
  const adminPwd = hashPassword('Admin@123');
  const facultyPwd = hashPassword('Faculty@123');
  const studentPwd = hashPassword('Student@123');

  const now = new Date();
  const todayIso = now.toISOString();
  const tomorrowIso = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const nextWeekIso = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const inTwoWeeksIso = new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString();

  const users: StoredUser[] = [
    {
      id: 'usr-superadmin',
      name: 'Dr. Rajesh Verma',
      email: 'superadmin@college.edu',
      role: 'superadmin',
      department: 'Dean Office',
      designation: 'Dean of Academic Affairs',
      isActive: true,
      createdAt: todayIso,
      passwordHash: superAdminPwd.hash,
      salt: superAdminPwd.salt,
    },
    {
      id: 'usr-admin',
      name: 'Prof. Ananya Sen',
      email: 'admin@college.edu',
      role: 'admin',
      department: 'Examination Cell',
      designation: 'Controller of Examinations',
      isActive: true,
      createdAt: todayIso,
      passwordHash: adminPwd.hash,
      salt: adminPwd.salt,
    },
    {
      id: 'usr-faculty-1',
      name: 'Dr. Arvind Sharma',
      email: 'sharma.cse@college.edu',
      role: 'faculty',
      department: 'Computer Science & Engineering',
      designation: 'Head of Department (CSE)',
      isActive: true,
      createdAt: todayIso,
      passwordHash: facultyPwd.hash,
      salt: facultyPwd.salt,
    },
    {
      id: 'usr-faculty-2',
      name: 'Dr. Priya Nair',
      email: 'priya.ece@college.edu',
      role: 'faculty',
      department: 'Electronics & Communication',
      designation: 'Associate Professor',
      isActive: true,
      createdAt: todayIso,
      passwordHash: facultyPwd.hash,
      salt: facultyPwd.salt,
    },
    {
      id: 'usr-faculty-3',
      name: 'Prof. Vikram Malhotra',
      email: 'vikram.me@college.edu',
      role: 'faculty',
      department: 'Mechanical Engineering',
      designation: 'Assistant Professor',
      isActive: true,
      createdAt: todayIso,
      passwordHash: facultyPwd.hash,
      salt: facultyPwd.salt,
    },
    {
      id: 'usr-student',
      name: 'Rohan Gupta',
      email: 'student@college.edu',
      role: 'student',
      department: 'Computer Science',
      designation: 'B.Tech CSE - 6th Semester',
      isActive: true,
      createdAt: todayIso,
      passwordHash: studentPwd.hash,
      salt: studentPwd.salt,
    },
  ];

  const posts: Post[] = [
    {
      id: 'post-1',
      title: 'End-Term Examination Form Submission & Fee Deadline Notification',
      category: 'notices',
      description: 'All undergraduate and postgraduate students are strictly instructed to submit their examination clearance forms for the Even Semester 2026. Students with pending semester fees must clear all dues at the Accounts Branch before the portal closes. Late submissions will attract a mandatory late fee of ₹500.',
      authorId: 'usr-admin',
      authorName: 'Prof. Ananya Sen',
      authorEmail: 'admin@college.edu',
      authorRole: 'admin',
      authorDepartment: 'Examination Cell',
      branch: 'All',
      semester: 'All',
      section: 'All',
      priority: 'urgent',
      isPinned: true,
      status: 'published',
      publishDate: todayIso,
      expiryDate: nextWeekIso,
      deadline: nextWeekIso,
      attachments: [
        {
          id: 'att-1',
          name: 'Exam_Circular_Even_Sem_2026.pdf',
          size: 1450000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KQ2FtcHVzIFB1bHNlIC0gT2ZmaWNpYWwgQ29sbGVnZSBFeGFtaW5hdGlvbiBDaXJjdWxhciAyMDI2LgplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDIgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjEyMwAKJSVFT0YK',
          uploadedAt: todayIso,
        },
      ],
      viewsCount: 342,
      aiSummary: '• Submit examination clearance forms and clear pending fees before deadline.\n• Accounts branch portal closes strictly next week.\n• ₹500 late penalty applies after deadline without exception.',
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-2',
      title: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
      category: 'events',
      description: 'The Department of Computer Science & Engineering presents HackCampus 2026. Form teams of 2 to 4 members to build real-world AI, Web3, and IoT solutions. Prize pool of ₹1,50,000 + internship interviews with sponsor companies. Free food, swag kits, and 24/7 high-speed lab connectivity provided.',
      authorId: 'usr-faculty-1',
      authorName: 'Dr. Arvind Sharma',
      authorEmail: 'sharma.cse@college.edu',
      authorRole: 'faculty',
      authorDepartment: 'Computer Science & Engineering',
      branch: 'All',
      semester: 'All',
      section: 'All',
      priority: 'important',
      isPinned: true,
      status: 'published',
      publishDate: todayIso,
      expiryDate: inTwoWeeksIso,
      deadline: nextWeekIso,
      attachments: [
        {
          id: 'att-2',
          name: 'HackCampus_Brochure_Rules.pdf',
          size: 2100000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KSGFja0NhbXB1cyAyMDI2IEJyb2NodXJlIGFuZCBSdWxlcyBTaGVldC4KZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAyIC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoxMjMKAiVFT0YK',
          uploadedAt: todayIso,
        },
      ],
      eventDetails: {
        venue: 'Main Auditorium & Turing Computing Labs',
        eventDate: inTwoWeeksIso,
        organizer: 'CSE Tech Council & Google Developer Student Club',
        registrationLink: 'https://hackcampus2026.college.edu',
        registrationDeadline: nextWeekIso,
      },
      viewsCount: 512,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-3',
      title: 'Machine Learning Lab Assignment 3: Convolutional Neural Networks',
      category: 'assignments',
      description: 'Implement a ResNet-style transfer learning pipeline using PyTorch for multi-class medical image classification. Include validation curves, confusion matrix, and a 4-page IEEE format report. Submit your Jupyter Notebook (.ipynb) and PDF report via the submission portal.',
      authorId: 'usr-faculty-1',
      authorName: 'Dr. Arvind Sharma',
      authorEmail: 'sharma.cse@college.edu',
      authorRole: 'faculty',
      authorDepartment: 'Computer Science & Engineering',
      branch: 'CSE',
      semester: '6',
      section: 'A',
      priority: 'urgent',
      isPinned: false,
      status: 'published',
      publishDate: todayIso,
      deadline: tomorrowIso,
      attachments: [
        {
          id: 'att-3',
          name: 'ML_Assignment_3_Guidelines.pdf',
          size: 890000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KTUwgTGFiIEFzc2lnbm1lbnQgMyBHdWlkZWxpbmVzICYgRGF0YXNldC4KZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgMgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAyIC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoxMjMKAiVFT0YK',
          uploadedAt: todayIso,
        },
      ],
      assignmentDetails: {
        subject: 'Machine Learning & Neural Networks',
        maxMarks: 25,
        submissionEmail: 'ml.submissions@college.edu',
      },
      viewsCount: 189,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-4',
      title: 'Digital Signal Processing Complete Unit 4 Notes & PYQ Solutions',
      category: 'notes',
      description: 'Comprehensive handwritten lecture notes covering FFT algorithms, Butterworth filter design, bilinear transformation, and step-by-step solved question papers from the past 5 university examinations (2021-2025).',
      authorId: 'usr-faculty-2',
      authorName: 'Dr. Priya Nair',
      authorEmail: 'priya.ece@college.edu',
      authorRole: 'faculty',
      authorDepartment: 'Electronics & Communication',
      branch: 'ECE',
      semester: '6',
      section: 'All',
      priority: 'normal',
      isPinned: false,
      status: 'published',
      publishDate: todayIso,
      attachments: [
        {
          id: 'att-4',
          name: 'DSP_Unit4_Handwritten_Notes.pdf',
          size: 4500000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KRGlnaXRhbCBTaWduYWwgUHJvY2Vzc2luZyBVbml0IDQgTm90ZXMuCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDIKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgMiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMTIzCgIlRU9GCg==',
          uploadedAt: todayIso,
        },
      ],
      notesDetails: {
        subject: 'Digital Signal Processing (EC-601)',
        academicYear: '2025-2026',
        fileType: 'PDF',
      },
      viewsCount: 275,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-5',
      title: 'Classes Suspended Post 2:00 PM for Campus Placement Orientation',
      category: 'general',
      description: 'All regular classroom lectures for 6th and 8th semester students across all engineering branches will be suspended tomorrow after 2:00 PM. All eligible students must assemble in the Central Seminar Hall for the mandatory Corporate Placement Briefing.',
      authorId: 'usr-superadmin',
      authorName: 'Dr. Rajesh Verma',
      authorEmail: 'superadmin@college.edu',
      authorRole: 'superadmin',
      authorDepartment: 'Dean Office',
      branch: 'All',
      semester: '6',
      section: 'All',
      priority: 'important',
      isPinned: false,
      status: 'published',
      publishDate: todayIso,
      attachments: [],
      viewsCount: 420,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-6',
      title: 'Updated Even Semester 2026 Academic Timetable & Lab Batches',
      category: 'timetable',
      description: 'The revised class timetable for B.Tech CSE, ECE, and ME (Semesters 4, 6, and 8) is now in effect. Friday afternoon lab hours have been reallocated to accommodate workshop sessions. Please download your branch sheet below.',
      authorId: 'usr-admin',
      authorName: 'Prof. Ananya Sen',
      authorEmail: 'admin@college.edu',
      authorRole: 'admin',
      authorDepartment: 'Examination Cell',
      branch: 'All',
      semester: 'All',
      section: 'All',
      priority: 'normal',
      isPinned: false,
      status: 'published',
      publishDate: todayIso,
      attachments: [
        {
          id: 'att-6',
          name: 'Even_Sem_2026_Master_Timetable.pdf',
          size: 1800000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KTWFzdGVyIFRpbWV0YWJsZSBFdmVuIFNlbWVzdGVyIDIwMjYuCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDIKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgMiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMTIzCgIlRU9GCg==',
          uploadedAt: todayIso,
        },
      ],
      viewsCount: 310,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-7',
      title: 'Official Academic Calendar 2026-2027 & Holiday Schedule',
      category: 'documents',
      description: 'Approved official academic calendar for the Academic Year 2026-2027 issued by the Office of the Dean. Contains mid-term examination dates, sports week, cultural fest dates, preparatory leave, and government gazetted holidays.',
      authorId: 'usr-superadmin',
      authorName: 'Dr. Rajesh Verma',
      authorEmail: 'superadmin@college.edu',
      authorRole: 'superadmin',
      authorDepartment: 'Dean Office',
      branch: 'All',
      semester: 'All',
      section: 'All',
      priority: 'normal',
      isPinned: false,
      status: 'published',
      publishDate: todayIso,
      attachments: [
        {
          id: 'att-7',
          name: 'Academic_Calendar_2026_2027.pdf',
          size: 1200000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KT2ZmaWNpYWwgQWNhZGVtaWMgQ2FsZW5kYXIgMjAyNi0yMDI3LgplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDIgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjEyMwAKJSVFT0YK',
          uploadedAt: todayIso,
        },
      ],
      documentDetails: {
        docType: 'calendar',
        issuedBy: 'Dean of Academic Affairs',
      },
      viewsCount: 490,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
    {
      id: 'post-8',
      title: 'ISRO Satellite Technology Summer Research Fellowship 2026',
      category: 'opportunities',
      description: 'Indian Space Research Organisation announces 8-week fully funded summer fellowship for 3rd year engineering students. Selected scholars receive ₹25,000 monthly stipend, campus accommodation, and direct mentorship from ISRO scientists.',
      authorId: 'usr-faculty-1',
      authorName: 'Dr. Arvind Sharma',
      authorEmail: 'sharma.cse@college.edu',
      authorRole: 'faculty',
      authorDepartment: 'Computer Science & Engineering',
      branch: 'All',
      semester: '6',
      section: 'All',
      priority: 'important',
      isPinned: false,
      status: 'published',
      publishDate: todayIso,
      deadline: nextWeekIso,
      attachments: [
        {
          id: 'att-8',
          name: 'ISRO_Fellowship_Notification_2026.pdf',
          size: 980000,
          mimeType: 'application/pdf',
          url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KSVNSTyBTdW1tZXIgUmVzZWFyY2ggRmVsbG93c2hpcCAyMDI2LgplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDIgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjEyMwAKJSVFT0YK',
          uploadedAt: todayIso,
        },
      ],
      opportunityDetails: {
        organization: 'ISRO / Space Applications Centre',
        stipendOrPackage: '₹25,000 / month + Accommodation',
        eligibility: 'B.Tech 6th Sem with CGPA ≥ 8.0 in CSE, ECE, or ME',
        applyLink: 'https://fellowships.isro.gov.in',
      },
      viewsCount: 680,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'Urgent Examination Form Submission',
      message: 'Examination clearance forms portal closes next week. Clear dues immediately.',
      category: 'notices',
      priority: 'urgent',
      targetBranch: 'All',
      targetSemester: 'All',
      postId: 'post-1',
      createdAt: todayIso,
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'HackCampus 2026 Registrations Open',
      message: '₹1.5L prize pool hackathon registration is now live.',
      category: 'events',
      priority: 'important',
      targetBranch: 'All',
      targetSemester: 'All',
      postId: 'post-2',
      createdAt: todayIso,
      isRead: false,
    },
    {
      id: 'notif-3',
      title: 'ML Lab Assignment 3 Deadline Approaching',
      message: 'Due tomorrow! Submit PyTorch CNN report & code.',
      category: 'assignments',
      priority: 'urgent',
      targetBranch: 'CSE',
      targetSemester: '6',
      postId: 'post-3',
      createdAt: todayIso,
      isRead: false,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      action: 'SYSTEM_BOOT',
      userId: 'usr-superadmin',
      userName: 'Dr. Rajesh Verma',
      userRole: 'superadmin',
      details: 'Campus Pulse portal database initialized with security benchmarks.',
      timestamp: todayIso,
    },
    {
      id: 'log-2',
      action: 'POST_PUBLISHED',
      userId: 'usr-admin',
      userName: 'Prof. Ananya Sen',
      userRole: 'admin',
      details: 'Published official notice: End-Term Examination Form Submission.',
      timestamp: todayIso,
    },
  ];

  return {
    users,
    posts,
    notifications,
    auditLogs,
    bookmarks: {
      'usr-student': ['post-1', 'post-2', 'post-8'],
    },
    readPosts: {
      'usr-student': ['post-1'],
    },
  };
}

function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;
  ensureDbDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(raw);
      return dbCache!;
    } catch (err) {
      console.error('[DB] Failed to read database file, re-seeding:', err);
    }
  }

  // Seed default data
  const seed = getInitialSeedData();
  dbCache = seed;
  saveDatabase();
  return seed;
}

function saveDatabase() {
  if (!dbCache) return;
  try {
    ensureDbDirectory();
    // Strict undefined stripping before disk serialization
    const cleanData = sanitizePayload(dbCache);
    fs.writeFileSync(DB_FILE, JSON.stringify(cleanData, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error persisting database to disk:', err);
  }
}

// Database helper functions

export function getUsers(): User[] {
  const db = loadDatabase();
  return db.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
}

export function getStoredUserById(id: string): StoredUser | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.id === id);
}

export function getStoredUserByEmail(email: string): StoredUser | undefined {
  const db = loadDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(userData: Omit<StoredUser, 'id' | 'createdAt'>): User {
  const db = loadDatabase();
  const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newUser: StoredUser = {
    ...userData,
    id,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase();

  const { passwordHash, salt, ...safe } = newUser;
  return safe;
}

export function updateUser(id: string, updates: Partial<StoredUser>): User | null {
  const db = loadDatabase();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updates,
  };
  saveDatabase();

  const { passwordHash, salt, ...safe } = db.users[index];
  return safe;
}

export function getPosts(): Post[] {
  const db = loadDatabase();
  return db.posts;
}

export function getPostById(id: string): Post | undefined {
  const db = loadDatabase();
  return db.posts.find((p) => p.id === id);
}

export function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount'>): Post {
  const db = loadDatabase();
  const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newPost: Post = sanitizePayload({
    ...postData,
    id,
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  db.posts.unshift(newPost);

  // Auto-generate a notification for the update
  const notif: NotificationItem = {
    id: `notif-${Date.now()}`,
    title: newPost.title,
    message: newPost.description.slice(0, 100) + '...',
    category: newPost.category,
    priority: newPost.priority,
    targetBranch: newPost.branch,
    targetSemester: newPost.semester,
    postId: newPost.id,
    createdAt: now,
    isRead: false,
  };
  db.notifications.unshift(notif);

  saveDatabase();
  return newPost;
}

export function updatePost(id: string, updates: Partial<Post>): Post | null {
  const db = loadDatabase();
  const index = db.posts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  db.posts[index] = sanitizePayload({
    ...db.posts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  saveDatabase();
  return db.posts[index];
}

export function deletePost(id: string): boolean {
  const db = loadDatabase();
  const initLen = db.posts.length;
  db.posts = db.posts.filter((p) => p.id !== id);
  if (db.posts.length !== initLen) {
    saveDatabase();
    return true;
  }
  return false;
}

export function incrementPostViews(id: string): void {
  const db = loadDatabase();
  const post = db.posts.find((p) => p.id === id);
  if (post) {
    post.viewsCount = (post.viewsCount || 0) + 1;
    saveDatabase();
  }
}

export function getNotifications(): NotificationItem[] {
  const db = loadDatabase();
  return db.notifications;
}

export function getUserBookmarks(userId: string): string[] {
  const db = loadDatabase();
  return db.bookmarks[userId] || [];
}

export function toggleUserBookmark(userId: string, postId: string): string[] {
  const db = loadDatabase();
  if (!db.bookmarks[userId]) {
    db.bookmarks[userId] = [];
  }
  const index = db.bookmarks[userId].indexOf(postId);
  if (index > -1) {
    db.bookmarks[userId].splice(index, 1);
  } else {
    db.bookmarks[userId].push(postId);
  }
  saveDatabase();
  return db.bookmarks[userId];
}

export function getUserReadPosts(userId: string): string[] {
  const db = loadDatabase();
  return db.readPosts[userId] || [];
}

export function markPostAsRead(userId: string, postId: string): string[] {
  const db = loadDatabase();
  if (!db.readPosts[userId]) {
    db.readPosts[userId] = [];
  }
  if (!db.readPosts[userId].includes(postId)) {
    db.readPosts[userId].push(postId);
    saveDatabase();
  }
  return db.readPosts[userId];
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const db = loadDatabase();
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  // Keep last 500 logs
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
  saveDatabase();
}

export function getAuditLogs(): AuditLog[] {
  const db = loadDatabase();
  return db.auditLogs;
}

export function getPortalAnalytics() {
  const db = loadDatabase();
  const totalPosts = db.posts.length;
  const activePosts = db.posts.filter((p) => p.status === 'published').length;
  const draftPosts = db.posts.filter((p) => p.status === 'draft').length;
  const archivedPosts = db.posts.filter((p) => p.status === 'archived').length;

  const categoryCounts = db.posts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = db.posts.reduce((acc, p) => {
    acc[p.priority] = (acc[p.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalViews = db.posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalUsers = db.users.length;
  const facultyCount = db.users.filter((u) => u.role === 'faculty').length;

  return {
    totalPosts,
    activePosts,
    draftPosts,
    archivedPosts,
    categoryCounts,
    priorityCounts,
    totalViews,
    totalUsers,
    facultyCount,
  };
}
