/**
 * Campus Pulse - Main Application Container
 * Full-stack collegiate information and communications portal.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Paperclip,
  Pin,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';

import { Post, FilterState, PostCategory, NotificationItem } from './types/index.ts';
import { api } from './services/api.ts';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { filterPosts, getDeadlineStatus } from './utils/filters.ts';

import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { UrgentBanner } from './components/UrgentBanner.tsx';
import { PostCard } from './components/PostCard.tsx';
import { PostModal } from './components/PostModal.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { CreatePostModal } from './components/CreatePostModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { TimetableView } from './components/TimetableView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';

function MainApp() {
  const { user, isAuthenticated, isFaculty } = useAuth();

  // Primary State
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [readPostIds, setReadPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Search & Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    branch: 'All',
    semester: 'All',
    section: 'All',
    priority: 'all',
    dateFilter: 'all',
    showPinnedOnly: false,
    showBookmarkedOnly: false,
    status: 'published',
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedPosts, fetchedNotifs, fetchedBookmarks, fetchedReads] = await Promise.all([
        api.getPosts(),
        api.getNotifications(),
        api.getBookmarks(),
        api.getReadPosts(),
      ]);

      setPosts(fetchedPosts);
      setNotifications(fetchedNotifs);
      setBookmarkedIds(new Set(fetchedBookmarks));
      setReadPostIds(new Set(fetchedReads));
    } catch (err: any) {
      console.error('Error fetching portal data:', err);
      setLoadError(err.message || 'Failed to connect to Campus Pulse server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Interactions
  const handleToggleBookmark = async (postId: string) => {
    try {
      const updated = await api.toggleBookmark(postId);
      setBookmarkedIds(new Set(updated));
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handleSelectPost = async (post: Post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);

    // Mark as read
    if (!readPostIds.has(post.id)) {
      try {
        const updated = await api.markAsRead(post.id);
        setReadPostIds(new Set(updated));
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  const handlePostSaved = (savedPost: Post) => {
    setPosts((prev) => {
      const index = prev.findIndex((p) => p.id === savedPost.id);
      if (index > -1) {
        const copy = [...prev];
        copy[index] = savedPost;
        return copy;
      }
      return [savedPost, ...prev];
    });
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handlePostArchived = (archivedPost: Post) => {
    handlePostSaved(archivedPost);
  };

  // Filtered dataset for Current Tab
  const categoryForTab = activeTab === 'all' || activeTab === 'home' || activeTab === 'dashboard'
    ? 'all'
    : (activeTab as PostCategory);

  const effectiveFilters: FilterState = {
    ...filters,
    category: categoryForTab !== 'all' ? categoryForTab : filters.category,
  };

  const filteredPosts = filterPosts(posts, effectiveFilters, bookmarkedIds);

  const urgentPosts = posts.filter((p) => p.priority === 'urgent' && p.status === 'published');
  const deadlinePosts = posts.filter(
    (p) => p.deadline && p.status === 'published' && !getDeadlineStatus(p.deadline).isOverdue
  );
  const pinnedPosts = posts.filter((p) => p.isPinned && p.status === 'published');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Global Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If switching to all or specific category, reset category filter
          if (tab !== 'all' && tab !== 'home' && tab !== 'dashboard') {
            setFilters((prev) => ({ ...prev, category: 'all' }));
          }
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenCreatePost={() => {
          setEditingPost(null);
          setIsCreateModalOpen(true);
        }}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        notifications={notifications}
        bookmarkedCount={bookmarkedIds.size}
        unreadCount={posts.length - readPostIds.size}
        onSelectPostById={(id) => {
          const match = posts.find((p) => p.id === id);
          if (match) handleSelectPost(match);
        }}
        globalSearch={filters.searchQuery}
        setGlobalSearch={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
      />

      {/* 2. Urgent Announcement Ticker Banner */}
      <UrgentBanner urgentPosts={urgentPosts} onSelectPost={handleSelectPost} />

      {/* 3. Main Split Layout: Left Menu Sidebar + Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Persistent Desktop & Drawer Mobile Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'all' && tab !== 'home' && tab !== 'dashboard') {
              setFilters((prev) => ({ ...prev, category: 'all' }));
            }
          }}
          posts={posts}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenCreatePost={() => {
            setEditingPost(null);
            setIsCreateModalOpen(true);
          }}
          bookmarkedCount={bookmarkedIds.size}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
        {loadError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{loadError}</span>
            <button
              onClick={fetchInitialData}
              className="font-bold underline hover:text-rose-900"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Hero Collegiate Header */}
            <div className="bg-gradient-to-r from-stone-950 via-[#7c2d12] to-[#9a3412] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-[#9a3412]/30">
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-rose-300 text-xs font-semibold mb-4 ring-1 ring-white/15">
                  <GraduationCap className="w-4 h-4 text-rose-400" />
                  <span>Official College Digital Noticeboard</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Campus Pulse
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-2.5 leading-relaxed font-normal">
                  Everything happening on campus, all in one centralized place. No more missed notices, buried WhatsApp files, or overlooked examination deadlines.
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button
                    onClick={() => setActiveTab('all')}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <span>View All Updates</span>
                    <span className="bg-red-700/80 px-2 py-0.5 rounded-md text-[11px]">
                      {posts.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-rose-300" />
                    <span>Check Today's Timetable</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines Widget */}
            {deadlinePosts.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-600" />
                    <h3 className="font-extrabold text-base text-slate-900">
                      Upcoming Deadlines & Submissions
                    </h3>
                  </div>
                  <span className="text-xs bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-full">
                    Active Watchlist
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {deadlinePosts.slice(0, 3).map((item) => {
                    const status = getDeadlineStatus(item.deadline);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectPost(item)}
                        className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                            <span className="uppercase text-red-600">{item.category}</span>
                            <span className={status.isUrgent ? 'text-rose-600' : 'text-slate-500'}>
                              {status.formatted}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                            {item.title}
                          </h4>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
                          <span>{item.branch}</span>
                          <span className="text-red-600 font-semibold">View Details →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Latest Announcements Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Latest Updates Feed</h2>
                  <p className="text-xs text-slate-500">Official updates sorted latest-first</p>
                </div>

                <button
                  onClick={() => setActiveTab('all')}
                  className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <span>View All ({posts.length})</span>
                  <span>→</span>
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Loading campus updates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.slice(0, 6).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isBookmarked={bookmarkedIds.has(post.id)}
                      isRead={readPostIds.has(post.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onSelectPost={handleSelectPost}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ALL UPDATES (CENTRALIZED FEED WITH FILTERS) */}
        {activeTab === 'all' && (
          <div className="animate-in fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">All Campus Updates</h1>
                <p className="text-xs text-slate-500">
                  Chronological institutional stream across all faculties and departments.
                </p>
              </div>

              {isFaculty && (
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Update</span>
                </button>
              )}
            </div>

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalCount={filteredPosts.length}
            />

            {isLoading ? (
              <div className="text-center py-16 text-slate-400 text-xs">Filtering updates...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">No updates match your criteria</h3>
                <p className="text-xs text-slate-500 mt-1">Try relaxing filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isBookmarked={bookmarkedIds.has(post.id)}
                    isRead={readPostIds.has(post.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onSelectPost={handleSelectPost}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="animate-in fade-in space-y-4">
            <div className="mb-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Academic & Exam Timetable</h1>
              <p className="text-xs text-slate-500">
                Official lecture slots, laboratory batches, and mid-term examination datesheets.
              </p>
            </div>
            <TimetableView posts={posts} onSelectPost={handleSelectPost} />
          </div>
        )}

        {/* VIEW 4: IMPORTANT DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="animate-in fade-in space-y-4">
            <div className="mb-2">
              <h1 className="text-2xl font-extrabold text-slate-900">
                Official Documents & Forms
              </h1>
              <p className="text-xs text-slate-500">
                Download verified college forms, anti-ragging affidavits, and academic calendars.
              </p>
            </div>
            <DocumentsView posts={posts} onSelectPost={handleSelectPost} />
          </div>
        )}

        {/* VIEW 5: SPECIFIC CATEGORIES (NOTICES, EVENTS, ASSIGNMENTS, NOTES, GENERAL) */}
        {['notices', 'events', 'assignments', 'notes', 'general'].includes(
          activeTab
        ) && (
          <div className="animate-in fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 capitalize">
                  {activeTab === 'notes' ? 'Notes & Study Material' : activeTab}
                </h1>
                <p className="text-xs text-slate-500">
                  Showing all official records published under this section.
                </p>
              </div>

              {isFaculty && (
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish in {activeTab}</span>
                </button>
              )}
            </div>

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalCount={filteredPosts.length}
            />

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">
                  No records found in this category
                </h3>
                <p className="text-xs text-slate-500 mt-1">Check back later or adjust filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isBookmarked={bookmarkedIds.has(post.id)}
                    isRead={readPostIds.has(post.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onSelectPost={handleSelectPost}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: FACULTY / ADMIN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <AdminDashboard
            posts={posts}
            onOpenCreatePost={() => {
              setEditingPost(null);
              setIsCreateModalOpen(true);
            }}
            onEditPost={(p) => {
              setEditingPost(p);
              setIsCreateModalOpen(true);
            }}
            onPostDeleted={handlePostDeleted}
            onPostArchived={handlePostArchived}
            onSelectPost={handleSelectPost}
          />
        )}
      </main>
    </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
              CP
            </div>
            <span className="font-extrabold text-slate-800">Campus Pulse</span>
            <span>• College Information & Communication Portal</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Security: Zero Insecure Defaults</span>
            <span>• Role-Based Access Control</span>
            <span>• Version 1.0 Production</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PostModal
        post={selectedPost}
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        isBookmarked={selectedPost ? bookmarkedIds.has(selectedPost.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onPostUpdated={handlePostSaved}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostSaved={handlePostSaved}
        editPost={editingPost}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
