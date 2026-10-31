/**
 * Campus Pulse - Urgent Announcement Banner
 * Highlights critical circulars, holiday notices, and impending deadlines.
 */

import React from 'react';
import { AlertTriangle, ChevronRight, X, Sparkles } from 'lucide-react';
import { Post } from '../types/index.ts';

interface UrgentBannerProps {
  urgentPosts: Post[];
  onSelectPost: (post: Post) => void;
}

export const UrgentBanner: React.FC<UrgentBannerProps> = ({ urgentPosts, onSelectPost }) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || urgentPosts.length === 0) return null;

  const currentUrgent = urgentPosts[0];

  return (
    <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-md relative overflow-hidden transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-rose-100 ring-1 ring-white/30 shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-300 animate-pulse" />
            <span className="hidden xs:inline">Urgent</span>
          </span>
          <p className="text-xs sm:text-sm font-medium truncate text-white/95">
            <span className="font-bold mr-1">{currentUrgent.title}:</span>
            <span className="opacity-90">{currentUrgent.description}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onSelectPost(currentUrgent)}
            className="inline-flex items-center gap-1 bg-white text-rose-800 hover:bg-rose-50 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs transition-all hover:scale-105"
          >
            <span>Read</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
