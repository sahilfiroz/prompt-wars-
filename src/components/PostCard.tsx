/**
 * Campus Pulse - Post Card Component
 * Modular, accessible display for every collegiate update.
 */

import React from 'react';
import {
  Pin,
  Bookmark,
  Paperclip,
  Clock,
  User,
  ArrowRight,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { Post, PriorityLevel, PostCategory } from '../types/index.ts';
import { getDeadlineStatus } from '../utils/filters.ts';

interface PostCardProps {
  post: Post;
  isBookmarked: boolean;
  isRead: boolean;
  onToggleBookmark: (postId: string) => void;
  onSelectPost: (post: Post) => void;
}

const CATEGORY_STYLES: Record<PostCategory, { bg: string; text: string; label: string }> = {
  notices: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Notice' },
  events: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'Event' },
  assignments: { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-700', label: 'Assignment' },
  notes: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Study Material' },
  general: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', label: 'General' },
  timetable: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', label: 'Timetable' },
  documents: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Official Document' },
  opportunities: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-700', label: 'Opportunity' },
};

const PRIORITY_BADGES: Record<PriorityLevel, { bg: string; text: string; label: string }> = {
  urgent: { bg: 'bg-red-600 text-white', text: 'text-red-600', label: 'Urgent' },
  important: { bg: 'bg-amber-500 text-white', text: 'text-amber-600', label: 'Important' },
  normal: { bg: 'bg-slate-200 text-slate-700', text: 'text-slate-500', label: 'Normal' },
  low: { bg: 'bg-slate-100 text-slate-500', text: 'text-slate-400', label: 'Low' },
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onSelectPost,
}) => {
  const catStyle = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.general;
  const prioBadge = PRIORITY_BADGES[post.priority] || PRIORITY_BADGES.normal;

  const deadlineStatus = post.deadline ? getDeadlineStatus(post.deadline) : null;

  const formattedDate = new Date(post.publishDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      className={`group bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
        post.isPinned
          ? 'border-red-300 shadow-md shadow-red-100/60 ring-1 ring-red-200'
          : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300'
      } ${!isRead ? 'bg-gradient-to-br from-white via-white to-red-50/20' : ''}`}
    >
      {/* Top Meta Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pinned Badge */}
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                Pinned
              </span>
            )}

            {/* Category Tag */}
            <span
              className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${catStyle.bg}`}
            >
              {catStyle.label}
            </span>

            {/* Priority Pill if Urgent or Important */}
            {post.priority !== 'normal' && (
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${prioBadge.bg}`}
              >
                {prioBadge.label}
              </span>
            )}

            {/* Target Branch / Sem */}
            {(post.branch !== 'All' || post.semester !== 'All') && (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {post.branch !== 'All' ? post.branch : 'All Branches'}
                {post.semester !== 'All' ? ` • Sem ${post.semester}` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Read/Unread dot */}
            {!isRead && (
              <span
                title="Unread Update"
                className="w-2.5 h-2.5 rounded-full bg-red-600 ring-4 ring-red-100 mr-1"
              />
            )}

            {/* Bookmark button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(post.id);
              }}
              title={isBookmarked ? 'Remove Bookmark' : 'Save for later'}
              className={`p-1.5 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-amber-500 hover:bg-amber-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectPost(post)}
          className="font-bold text-base text-slate-900 group-hover:text-red-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
        >
          {post.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
          {post.description}
        </p>

        {/* Special Details: Deadline countdown */}
        {deadlineStatus && post.deadline && (
          <div
            className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              deadlineStatus.isOverdue
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : deadlineStatus.isUrgent
                ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{deadlineStatus.formatted}</span>
          </div>
        )}

        {/* Event details preview */}
        {post.eventDetails && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">Venue: {post.eventDetails.venue}</span>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
        {/* Author & Date */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
            {post.authorName.charAt(0)}
          </div>
          <div className="min-w-0 truncate">
            <p className="font-semibold text-slate-800 truncate">{post.authorName}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {post.authorDepartment || 'College'} • {formattedDate}
            </p>
          </div>
        </div>

        {/* Attachments & Read More */}
        <div className="flex items-center gap-2 shrink-0">
          {post.attachments && post.attachments.length > 0 && (
            <span
              title={`${post.attachments.length} attachment(s)`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200"
            >
              <Paperclip className="w-3 h-3 text-red-500" />
              <span>{post.attachments.length}</span>
            </span>
          )}

          <button
            onClick={() => onSelectPost(post)}
            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 group-hover:translate-x-0.5 transition-all p-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
