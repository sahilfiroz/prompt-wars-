/**
 * Campus Pulse - Faculty & Administrative Control Center
 * Manages post lifecycle, departmental analytics, RBAC user provisioning, and audit logs.
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { Post, User, AuditLog, PostCategory } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../services/api.ts';
import { canUserEditPost, canUserDeletePost } from '../utils/security.ts';

interface AdminDashboardProps {
  posts: Post[];
  onOpenCreatePost: () => void;
  onEditPost: (post: Post) => void;
  onPostDeleted: (postId: string) => void;
  onPostArchived: (updated: Post) => void;
  onSelectPost: (post: Post) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  posts,
  onOpenCreatePost,
  onEditPost,
  onPostDeleted,
  onPostArchived,
  onSelectPost,
}) => {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'users' | 'audit'>('posts');
  const [postSearch, setPostSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New user form state (Super Admin only)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'faculty' | 'admin'>('faculty');
  const [newUserDept, setNewUserDept] = useState('Computer Science');
  const [userMsg, setUserMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'analytics' || !analytics) {
        const stats = await api.getAnalytics();
        setAnalytics(stats);
      }
      if (activeTab === 'users' && isSuperAdmin) {
        const fetchedUsers = await api.getUsers();
        setUsersList(fetchedUsers);
      }
      if (activeTab === 'audit' && isAdmin) {
        const fetchedLogs = await api.getAuditLogs();
        setAuditLogs(fetchedLogs);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await api.deletePost(id);
      onPostDeleted(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  const handleArchivePost = async (id: string) => {
    try {
      const archived = await api.archivePost(id);
      onPostArchived(archived);
    } catch (err: any) {
      alert(err.message || 'Failed to archive post.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    try {
      const created = await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        department: newUserDept,
      });
      setUsersList((prev) => [created, ...prev]);
      setNewUserName('');
      setNewUserEmail('');
      setUserMsg(`Successfully created account for ${created.name}`);
    } catch (err: any) {
      setUserMsg(`Error: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    try {
      const updated = await api.updateUser(targetUser.id, { isActive: !targetUser.isActive });
      setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  // Filtered posts for management
  const displayedPosts = posts.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.branch.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-red-500/30 text-red-300 ring-1 ring-red-400/40">
                Institutional Administration
              </span>
              <span className="text-xs text-slate-400">Authenticated: {user?.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Faculty & Departmental Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Welcome back, <strong>{user?.name}</strong>. Manage circular broadcasts, upload study files, inspect engagement metrics, and enforce campus policies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreatePost}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-lg shadow-red-600/40 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Update</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'posts'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Manage Circulars ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics & Reach</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Faculty Accounts</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security Audit Trail</span>
          </button>
        )}
      </div>

      {/* TAB 1: MANAGE POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, author, branch..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 text-xs font-semibold text-slate-700 py-2 px-3 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="notices">Notices</option>
                <option value="events">Events</option>
                <option value="assignments">Assignments</option>
                <option value="notes">Notes</option>
                <option value="general">General</option>
                <option value="timetable">Timetable</option>
                <option value="documents">Documents</option>
                <option value="opportunities">Opportunities</option>
              </select>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Views</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {displayedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No circulars found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    displayedPosts.map((p) => {
                      const canEdit = canUserEditPost(user, p);
                      const canDelete = canUserDeletePost(user, p);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs">
                            <button
                              onClick={() => onSelectPost(p)}
                              className="font-bold text-slate-900 hover:text-red-600 text-left line-clamp-1 truncate"
                            >
                              {p.title}
                            </button>
                            <p className="text-[10px] text-slate-400">
                              By {p.authorName} • {new Date(p.publishDate).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="capitalize text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-slate-600">
                              {p.branch} • Sem {p.semester}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                p.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-700'
                                  : p.priority === 'important'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                p.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : p.status === 'draft'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {p.viewsCount || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectPost(p)}
                                title="View Details"
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {canEdit && (
                                <button
                                  onClick={() => onEditPost(p)}
                                  title="Edit Post"
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {canEdit && p.status !== 'archived' && (
                                <button
                                  onClick={() => handleArchivePost(p.id)}
                                  title="Archive Post"
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => setDeleteConfirmId(p.id)}
                                  title="Delete Post"
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Permanently Delete Circular?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              This action cannot be undone. All linked student read states and attachments will be revoked.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & REACH */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analytics ? (
            <>
              {/* Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Published Updates
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {analytics.totalPosts}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                    {analytics.activePosts} Active on Feed
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Student Reads
                  </p>
                  <p className="text-3xl font-extrabold text-red-600 mt-1">
                    {analytics.totalViews}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 inline-block">
                    Verified Engagement
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Active Faculty Publishers
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {analytics.facultyCount}
                  </p>
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                    All Departments
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pending Drafts
                  </p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-1">
                    {analytics.draftPosts}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 inline-block">
                    {analytics.archivedPosts} Archived
                  </span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                <h3 className="font-bold text-sm text-slate-900 mb-4">
                  Information Volume by Category
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(analytics.categoryCounts || {}).map(([cat, count]) => (
                    <div key={cat} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs uppercase font-bold text-slate-500">{cat}</p>
                      <p className="text-xl font-extrabold text-slate-900 mt-1">{count as number}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">Loading analytics...</div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT (SUPER ADMIN) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-6">
          {/* New User Creation Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              <span>Provision Institutional Faculty Account</span>
            </h3>

            {userMsg && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">
                {userMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="Full Name (e.g. Dr. Meera Reddy)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white"
              />
              <input
                type="email"
                required
                placeholder="Institutional Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white font-semibold"
              >
                <option value="faculty">Faculty Member</option>
                <option value="admin">Administrator (Exam/Academic)</option>
              </select>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Provision Account
              </button>
            </form>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Toggle Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] uppercase font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-md">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.department || 'General'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`text-xs font-bold px-3 py-1 rounded-xl transition-colors ${
                              u.isActive
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-xs text-slate-800">Tamper-Proof Platform Audit Log</h3>
            </div>
            <button onClick={loadData} className="p-1 text-slate-500 hover:text-red-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Audit Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
