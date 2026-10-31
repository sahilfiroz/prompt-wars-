/**
 * Campus Pulse - Reusable Post Creation & Editor Modal
 * Features Multi-Attachment upload, Duplicate Warning Detection, and Live Preview.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileCheck,
  AlertTriangle,
  Eye,
  Edit3,
  Calendar,
  Clock,
  Pin,
  Sparkles,
  CheckCircle2,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { Post, PostCategory, PriorityLevel, PostStatus, Attachment } from '../types/index.ts';
import { api } from '../services/api.ts';
import { validateAttachment, sanitizeFilename } from '../utils/security.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSaved: (post: Post) => void;
  editPost?: Post | null;
}

const CATEGORIES: { id: PostCategory; label: string }[] = [
  { id: 'notices', label: 'Official Notice' },
  { id: 'events', label: 'College Event' },
  { id: 'assignments', label: 'Assignment' },
  { id: 'notes', label: 'Study Material / Notes' },
  { id: 'general', label: 'General Update' },
  { id: 'timetable', label: 'Timetable Announcement' },
  { id: 'documents', label: 'Important Document' },
  { id: 'opportunities', label: 'Student Opportunity' },
];

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'MBA'];
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const SECTIONS = ['All', 'A', 'B', 'C'];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostSaved,
  editPost,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PostCategory>('notices');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('All');
  const [semester, setSemester] = useState('All');
  const [section, setSection] = useState('All');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Category specific fields
  const [eventVenue, setEventVenue] = useState('');
  const [eventOrganizer, setEventOrganizer] = useState('');
  const [eventRegLink, setEventRegLink] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState('');
  const [assignmentMarks, setAssignmentMarks] = useState<number>(20);
  const [notesSubject, setNotesSubject] = useState('');
  const [oppOrganization, setOppOrganization] = useState('');
  const [oppStipend, setOppStipend] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    similarityScore: number;
    similarPostTitle?: string;
    reason?: string;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setCategory(editPost.category);
      setDescription(editPost.description);
      setBranch(editPost.branch);
      setSemester(editPost.semester);
      setSection(editPost.section);
      setPriority(editPost.priority);
      setIsPinned(editPost.isPinned);
      setDeadline(editPost.deadline ? editPost.deadline.substring(0, 16) : '');
      setExpiryDate(editPost.expiryDate ? editPost.expiryDate.substring(0, 16) : '');
      setAttachments(editPost.attachments || []);

      if (editPost.eventDetails) {
        setEventVenue(editPost.eventDetails.venue || '');
        setEventOrganizer(editPost.eventDetails.organizer || '');
        setEventRegLink(editPost.eventDetails.registrationLink || '');
      }
      if (editPost.assignmentDetails) {
        setAssignmentSubject(editPost.assignmentDetails.subject || '');
        setAssignmentMarks(editPost.assignmentDetails.maxMarks || 20);
      }
      if (editPost.notesDetails) {
        setNotesSubject(editPost.notesDetails.subject || '');
      }
      if (editPost.opportunityDetails) {
        setOppOrganization(editPost.opportunityDetails.organization || '');
        setOppStipend(editPost.opportunityDetails.stipendOrPackage || '');
      }
    } else {
      // Defaults
      setTitle('');
      setCategory('notices');
      setDescription('');
      setBranch('All');
      setSemester('All');
      setSection('All');
      setPriority('normal');
      setIsPinned(false);
      setDeadline('');
      setExpiryDate('');
      setAttachments([]);
      setDuplicateWarning(null);
    }
  }, [editPost, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateAttachment({
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      });

      if (!validation.valid) {
        setErrorMsg(`Upload rejected: ${validation.error}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: sanitizeFilename(file.name),
          size: file.size,
          mimeType: file.type || 'application/pdf',
          url: base64Url,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAtt]);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleCheckDuplicate = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a title before checking for duplicates.');
      return;
    }
    setIsCheckingDuplicate(true);
    try {
      const res = await api.checkDuplicate(title, description, editPost?.id);
      setDuplicateWarning(res);
    } catch (err) {
      console.error('Duplicate check error:', err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (targetStatus: PostStatus) => {
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description are required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: any = {
      title,
      category,
      description,
      branch,
      semester,
      section,
      priority,
      isPinned,
      status: targetStatus,
      publishDate: new Date().toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      attachments,
    };

    if (category === 'events') {
      payload.eventDetails = {
        venue: eventVenue || 'Main Campus Auditorium',
        eventDate: deadline ? new Date(deadline).toISOString() : new Date().toISOString(),
        organizer: eventOrganizer || user?.department || 'College Council',
        registrationLink: eventRegLink || undefined,
      };
    } else if (category === 'assignments') {
      payload.assignmentDetails = {
        subject: assignmentSubject || 'Course Assignment',
        maxMarks: Number(assignmentMarks) || 20,
        submissionEmail: user?.email,
      };
    } else if (category === 'notes') {
      payload.notesDetails = {
        subject: notesSubject || 'Lecture Course',
        academicYear: '2025-2026',
        fileType: 'PDF',
      };
    } else if (category === 'opportunities') {
      payload.opportunityDetails = {
        organization: oppOrganization || 'College Placement Cell',
        stipendOrPackage: oppStipend || 'Competitive',
      };
    }

    try {
      let savedPost: Post;
      if (editPost) {
        savedPost = await api.updatePost(editPost.id, payload);
      } else {
        savedPost = await api.createPost(payload);
      }
      onPostSaved(savedPost);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save post. Please verify all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {editPost ? 'Edit Official Circular' : 'Create & Publish Campus Update'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Publishing as: <strong className="text-slate-800">{user?.name}</strong> ({user?.role})
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'editor' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'preview' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Live Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Duplicate Detection Warning Banner */}
          {duplicateWarning && duplicateWarning.isDuplicate && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs animate-in slide-in-from-top-1">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Duplicate Notice Warning ({duplicateWarning.similarityScore}% Similarity)</span>
              </div>
              <p className="text-slate-700">
                A similar announcement already exists:{' '}
                <strong className="text-slate-900">"{duplicateWarning.similarPostTitle}"</strong>
              </p>
              <p className="text-[11px] text-amber-800 mt-1 italic">{duplicateWarning.reason}</p>
            </div>
          )}

          {activeTab === 'editor' ? (
            <>
              {/* Title & Duplicate Checker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Post Title <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCheckDuplicate}
                    disabled={isCheckingDuplicate}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-0.5 rounded-md"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isCheckingDuplicate ? 'Analyzing...' : 'Check Duplicate'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g., End-Term Examination Schedule & Registration Portal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 text-sm font-semibold text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PostCategory)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="important">Important Priority</option>
                    <option value="urgent">Urgent Priority (Featured in Banner)</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Target Audience: Branch, Semester, Section */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Target Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2 px-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b === 'All' ? 'All Branches' : b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2 px-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        {s === 'All' ? 'All Semesters' : `Sem ${s}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2 px-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec === 'All' ? 'All Sections' : `Sec ${sec}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Description & Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide comprehensive details, instructions, room numbers, and rules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-900 p-3.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Category-Specific dynamic input sections */}
              {category === 'events' && (
                <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3 text-xs">
                  <h4 className="font-bold text-purple-900">Event Specific Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Venue (e.g. Auditorium / Lab 3)"
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      className="bg-white p-2 rounded-xl border border-purple-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Organiser (e.g. ACM Club / Robotics Cell)"
                      value={eventOrganizer}
                      onChange={(e) => setEventOrganizer(e.target.value)}
                      className="bg-white p-2 rounded-xl border border-purple-200 text-xs"
                    />
                    <input
                      type="url"
                      placeholder="Registration Link (https://...)"
                      value={eventRegLink}
                      onChange={(e) => setEventRegLink(e.target.value)}
                      className="sm:col-span-2 bg-white p-2 rounded-xl border border-purple-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {category === 'assignments' && (
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3 text-xs">
                  <h4 className="font-bold text-blue-900">Assignment Parameters</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Subject (e.g. Data Structures & Algorithms)"
                      value={assignmentSubject}
                      onChange={(e) => setAssignmentSubject(e.target.value)}
                      className="bg-white p-2 rounded-xl border border-blue-200 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Max Marks (e.g. 25)"
                      value={assignmentMarks}
                      onChange={(e) => setAssignmentMarks(Number(e.target.value))}
                      className="bg-white p-2 rounded-xl border border-blue-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Dates & Pinned Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Submission / Event Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-800 p-2 rounded-xl border border-slate-200 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Auto-Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-800 p-2 rounded-xl border border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pin to Top of Feed</span>
                  </label>
                </div>
              </div>

              {/* File Attachments Uploader */}
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-red-600" />
                    <span>Attach Official Documents / PDF (Max 10MB)</span>
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                    />
                  </label>
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{att.name}</span>
                          <span className="text-[10px] text-slate-400">
                            ({(att.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-2">
                    Supported: PDF, Word (.docx), PowerPoint (.pptx), Images. Script files (.exe, .sh) are prohibited.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Live Preview Screen */
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                  {category}
                </span>
                {priority !== 'normal' && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-white">
                    {priority}
                  </span>
                )}
                {isPinned && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Pinned Notice
                  </span>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-slate-900">{title || 'Untitled Update'}</h2>

              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {description || 'No description provided yet.'}
              </p>

              {attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">
                    Attachments ({attachments.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((a) => (
                      <span
                        key={a.id}
                        className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700"
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('published')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
