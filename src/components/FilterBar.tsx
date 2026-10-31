/**
 * Campus Pulse - Filter & Search Toolbar
 * Provides quick searching, department/semester/section filters, and status toggles.
 */

import React from 'react';
import { Search, RotateCcw, Bookmark, Pin } from 'lucide-react';
import { FilterState } from '../types/index.ts';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCount: number;
}

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'MBA'];
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const SECTIONS = ['All', 'A', 'B', 'C'];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, totalCount }) => {
  const handleReset = () => {
    setFilters({
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
  };

  const isFiltered =
    filters.searchQuery ||
    filters.branch !== 'All' ||
    filters.semester !== 'All' ||
    filters.section !== 'All' ||
    filters.showPinnedOnly ||
    filters.showBookmarkedOnly ||
    filters.status !== 'published';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 mb-6">
      {/* Top Search & Toggles */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search circulars, subjects, faculty names, venues..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full bg-slate-50 text-sm text-slate-900 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, showPinnedOnly: !prev.showPinnedOnly }))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filters.showPinnedOnly
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            <span>Pinned Only</span>
          </button>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, showBookmarkedOnly: !prev.showBookmarkedOnly }))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filters.showBookmarkedOnly
                ? 'bg-red-50 text-red-900 border-red-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-red-600" />
            <span>Saved Only</span>
          </button>

          {/* Archived vs Active toggle */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                status: prev.status === 'published' ? 'archived' : 'published',
              }))
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filters.status === 'archived'
                ? 'bg-purple-50 text-purple-900 border-purple-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{filters.status === 'archived' ? 'Viewing Archived' : 'View Archive'}</span>
          </button>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Filters Grid - Branch, Semester, Section (No Priority) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        {/* Branch */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Department / Branch
          </label>
          <select
            value={filters.branch}
            onChange={(e) => setFilters((prev) => ({ ...prev, branch: e.target.value }))}
            className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:outline-none transition-colors"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b === 'All' ? 'All Departments' : b}
              </option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Semester
          </label>
          <select
            value={filters.semester}
            onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value }))}
            className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:outline-none transition-colors"
          >
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Semesters' : `Semester ${s}`}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Section
          </label>
          <select
            value={filters.section}
            onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
            className="w-full bg-slate-50 text-xs font-semibold text-slate-800 py-2.5 px-3 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:outline-none transition-colors"
          >
            {SECTIONS.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 'All' ? 'All Sections' : `Section ${sec}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100">
        <span>
          Showing <strong>{totalCount}</strong> published update{totalCount === 1 ? '' : 's'}
        </span>
        {filters.status === 'archived' && (
          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
            Archive Mode Active
          </span>
        )}
      </div>
    </div>
  );
};
