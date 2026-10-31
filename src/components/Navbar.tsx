/**
 * Campus Pulse - Global Navigation Header
 */

import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  Search,
  Menu,
  Shield,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { NotificationItem } from '../types/index.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenCreatePost: () => void;
  onToggleSidebar: () => void;
  notifications: NotificationItem[];
  bookmarkedCount: number;
  unreadCount: number;
  onSelectPostById: (id: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenCreatePost,
  onToggleSidebar,
  notifications,
  bookmarkedCount,
  onSelectPostById,
  globalSearch,
  setGlobalSearch,
}) => {
  const { user, isAuthenticated, logout, isFaculty } = useAuth();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Sidebar Toggle & Brand */}
          <div className="flex items-center gap-3">
            {/* Sidebar Menu Toggle Button */}
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus:outline-none"
              aria-label="Toggle sections menu"
              title="Open Campus Sections Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              aria-label="Campus Pulse Home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-700 via-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-red-600/25 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
                    CAMPUS PULSE
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                  Centralized College Portal
                </p>
              </div>
            </button>
          </div>

          {/* Center: Global Quick Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search circulars, assignments, events, notes..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (activeTab === 'home' && e.target.value.trim().length > 0) {
                    setActiveTab('all');
                  }
                }}
                className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bookmarks Filter Quick Button */}
            <button
              onClick={() => setActiveTab('all')}
              title="Saved Updates"
              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors relative"
              aria-label="Bookmarks"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarkedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                title="Notifications"
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-600" />
                      <span className="font-bold text-sm text-slate-800">Campus Alerts</span>
                    </div>
                    <span className="text-xs bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                      {notifications.length} new
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-500">No new notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (notif.postId) onSelectPostById(notif.postId);
                            setNotifDropdownOpen(false);
                          }}
                          className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                notif.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {notif.category}
                            </span>
                            <span className="text-[10px] text-slate-400">Just now</span>
                          </div>
                          <p className="font-semibold text-xs text-slate-800 mt-1.5">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Post Action for Faculty / Admin */}
            {isFaculty && (
              <button
                onClick={onOpenCreatePost}
                className="hidden sm:inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs shadow-red-600/30 transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            )}

            {/* Auth Dropdown */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs border border-red-200">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-bold text-slate-800 line-clamp-1">{user.name}</p>
                    <p className="text-[10px] text-red-600 uppercase font-semibold">{user.role}</p>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-xs text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                        {user.role}
                      </span>
                    </div>

                    {isFaculty && (
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        <span>Faculty & Admin Portal</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
