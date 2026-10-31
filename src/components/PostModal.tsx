/**
 * Campus Pulse - Post Reader & Detail Modal
 * Features Category-specific widgets, file download previews, and AI Summarization.
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Paperclip,
  Bookmark,
  Share2,
  Sparkles,
  Download,
  Printer,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Building,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Post, Attachment } from '../types/index.ts';
import { getDeadlineStatus } from '../utils/filters.ts';
import { api } from '../services/api.ts';

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (postId: string) => void;
  onPostUpdated: (updatedPost: Post) => void;
}

export const PostModal: React.FC<PostModalProps> = ({
  post,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onPostUpdated,
}) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(post?.aiSummary || null);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !post) return null;

  const deadlineStatus = post.deadline ? getDeadlineStatus(post.deadline) : null;
  const formattedPublishDate = new Date(post.publishDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const generated = await api.summarizeNotice(post.id);
      setSummary(generated);
      onPostUpdated({ ...post, aiSummary: generated });
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadAttachment = (att: Attachment) => {
    // Generate safe virtual download
    const link = document.createElement('a');
    link.href = att.url || '#';
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}?post=${post.id}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-100 text-red-700">
              {post.category}
            </span>
            {post.priority !== 'normal' && (
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  post.priority === 'urgent' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {post.priority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share link */}
            <button
              onClick={handleShare}
              title="Share update link"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Share2 className="w-4 h-4" />
              {copySuccess && (
                <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                  Copied!
                </span>
              )}
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              title="Print document"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Bookmark */}
            <button
              onClick={() => onToggleBookmark(post.id)}
              title={isBookmarked ? 'Remove Bookmark' : 'Save Update'}
              className={`p-2 rounded-xl transition-colors ${
                isBookmarked ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-6">
          {/* Title & Metadata */}
          <div>
            <h2 id="modal-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {post.title}
            </h2>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-slate-500 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-slate-800">{post.authorName}</span>
                <span>({post.authorDepartment || 'College'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Published: {formattedPublishDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                  Branch: {post.branch}
                </span>
                <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                  Semester: {post.semester}
                </span>
              </div>
            </div>
          </div>

          {/* AI Summarizer Panel */}
          <div className="bg-gradient-to-r from-red-50/80 via-rose-50/70 to-orange-50/60 rounded-2xl p-4 border border-red-100 relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-red-950">AI Quick Takeaway (30s Read)</span>
              </div>

              {!summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSummarizing ? 'Summarizing...' : 'Generate AI TL;DR'}</span>
                </button>
              )}
            </div>

            {summary ? (
              <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-red-100/70">
                {summary}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Click "Generate AI TL;DR" to extract the key actionable points, deadlines, and requirements using Gemini AI.
              </p>
            )}
          </div>

          {/* Category-Specific Widgets */}
          {post.category === 'events' && post.eventDetails && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-purple-900">
                <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                <span><strong>Venue:</strong> {post.eventDetails.venue}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-900">
                <Building className="w-4 h-4 text-purple-600 shrink-0" />
                <span><strong>Organiser:</strong> {post.eventDetails.organizer}</span>
              </div>
              {post.eventDetails.registrationLink && (
                <div className="sm:col-span-2 pt-2">
                  <a
                    href={post.eventDetails.registrationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    <span>Register for Event</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {post.category === 'assignments' && post.assignmentDetails && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <p className="text-blue-900 font-bold text-sm">{post.assignmentDetails.subject}</p>
                {post.assignmentDetails.maxMarks && (
                  <p className="text-blue-700 font-medium mt-0.5">Max Marks: {post.assignmentDetails.maxMarks}</p>
                )}
                {post.assignmentDetails.submissionEmail && (
                  <p className="text-slate-600 mt-1">Submit via: {post.assignmentDetails.submissionEmail}</p>
                )}
              </div>
              {deadlineStatus && (
                <div className="p-3 bg-white rounded-xl border border-blue-200 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Submission Window</p>
                  <p className={`font-extrabold text-sm ${deadlineStatus.isOverdue ? 'text-rose-600' : 'text-blue-700'}`}>
                    {deadlineStatus.formatted}
                  </p>
                </div>
              )}
            </div>
          )}

          {post.category === 'opportunities' && post.opportunityDetails && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2 text-xs text-teal-900">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-sm text-teal-950">{post.opportunityDetails.organization}</span>
                {post.opportunityDetails.stipendOrPackage && (
                  <span className="bg-teal-200/60 font-bold text-teal-800 px-2.5 py-1 rounded-md">
                    {post.opportunityDetails.stipendOrPackage}
                  </span>
                )}
              </div>
              {post.opportunityDetails.eligibility && (
                <p><strong>Eligibility:</strong> {post.opportunityDetails.eligibility}</p>
              )}
              {post.opportunityDetails.applyLink && (
                <div className="pt-2">
                  <a
                    href={post.opportunityDetails.applyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Description Content */}
          <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line">
            {post.description}
          </div>

          {/* Attachments Section */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-red-600" />
                <span>Official Attachments ({post.attachments.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-red-300 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="font-semibold text-xs text-slate-900 truncate">{att.name}</p>
                        <p className="text-[10px] text-slate-500">{(att.size / 1024).toFixed(0)} KB • Verified PDF</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadAttachment(att)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Views: {post.viewsCount || 1} campus members</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
