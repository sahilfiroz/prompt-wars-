/**
 * Campus Pulse - Sidebar Navigation Menu
 * Houses collegiate campus sections, item counts, and quick management links.
 * Styled with distinct panel borders, gradients, and clear visual separation.
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Shield,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Clock,
  PlusCircle,
  X,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { Post, PostCategory } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePost: () => void;
  bookmarkedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  posts,
  isOpen,
  onClose,
  onOpenCreatePost,
}) => {
  const { user, isFaculty } = useAuth();

  // Compute category counts
  const getCategoryCount = (category: PostCategory) => {
    return posts.filter((p) => p.category === category && p.status === 'published').length;
  };

  // Nav items (Opportunities removed as requested)
  const menuItems: {
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    color: string;
    badgeBg: string;
  }[] = [
    { id: 'home', label: 'Home / Overview', icon: LayoutDashboard, color: 'text-red-600', badgeBg: 'bg-red-50 text-red-700' },
    { id: 'all', label: 'All Updates Feed', icon: FileText, count: posts.length, color: 'text-slate-600', badgeBg: 'bg-slate-100 text-slate-700' },
    { id: 'notices', label: 'Official Notices', icon: Shield, count: getCategoryCount('notices'), color: 'text-red-600', badgeBg: 'bg-red-50 text-red-700' },
    { id: 'events', label: 'Campus Events', icon: Calendar, count: getCategoryCount('events'), color: 'text-orange-600', badgeBg: 'bg-orange-50 text-orange-700' },
    { id: 'assignments', label: 'Assignments', icon: CheckCircle2, count: getCategoryCount('assignments'), color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700' },
    { id: 'notes', label: 'Notes & Study Material', icon: GraduationCap, count: getCategoryCount('notes'), color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700' },
    { id: 'timetable', label: 'Timetable & Datesheets', icon: Clock, count: getCategoryCount('timetable'), color: 'text-red-600', badgeBg: 'bg-red-50 text-red-700' },
    { id: 'documents', label: 'Documents & Forms', icon: FileText, count: getCategoryCount('documents'), color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700' },
    { id: 'general', label: 'General Updates', icon: FileText, count: getCategoryCount('general'), color: 'text-slate-600', badgeBg: 'bg-slate-100 text-slate-700' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Clearly styled as an elevated panel on desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 border-r-2 border-slate-200/90 shadow-2xl lg:shadow-sm lg:rounded-3xl lg:border-2 lg:border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-10 lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)] lg:shrink-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Badge */}
        <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-100/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-800 via-red-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-red-700/25">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-wider uppercase text-slate-800">
                  Campus Sidebar
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-semibold text-slate-500">Quick Navigation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Post CTA for Faculty/Admin */}
        {isFaculty && (
          <div className="p-3 border-b border-slate-200/70 bg-red-50/60">
            <button
              onClick={() => {
                onOpenCreatePost();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-sm shadow-red-700/25 transition-all hover:scale-[1.01]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Circular</span>
            </button>
          </div>
        )}

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4">
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Main Portals
              </span>
              <span className="text-[10px] font-bold text-red-800 bg-red-100/70 px-2 py-0.5 rounded-full">
                {menuItems.length} Sections
              </span>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-sm font-bold ring-1 ring-red-700/30'
                        : 'text-slate-700 hover:bg-red-50/70 hover:text-red-700'
                    }`}
                  >
                    {/* Active Left Indicator Pill */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full shadow-xs" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0 pr-1 pl-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white border border-slate-200/80 text-slate-600 group-hover:text-red-600 group-hover:border-red-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : `${item.badgeBg} group-hover:bg-red-100 group-hover:text-red-800`
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Faculty / Administration Section */}
          {isFaculty && (
            <div className="pt-3 border-t border-slate-200/70">
              <div className="px-3 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-800">
                  Management Console
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-red-950 bg-red-100/60 hover:bg-red-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span>Faculty & Admin Portal</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-100/60 text-xs">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-red-700 font-semibold uppercase">{user.role}</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Connected" />
            </div>
          ) : (
            <div className="text-center py-1">
              <p className="text-[11px] text-slate-700 font-bold">Public Student Access</p>
              <p className="text-[10px] text-slate-500">Live Circulars & Timetables</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
