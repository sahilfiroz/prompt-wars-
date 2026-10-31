/**
 * Campus Pulse - Interactive Academic Timetable & Examination Datesheet View
 * Features real-time schedule filtering by branch, semester, section, and day,
 * along with examination datesheets and official circular downloads.
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Download,
  MapPin,
  User,
  BookOpen,
  FileSpreadsheet,
  AlertCircle,
  Printer,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Post } from '../types/index.ts';

interface TimetableViewProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

const BRANCHES = [
  { id: 'CSE', name: 'Computer Science (CSE)' },
  { id: 'IT', name: 'Information Tech (IT)' },
  { id: 'ECE', name: 'Electronics & Comm (ECE)' },
  { id: 'ME', name: 'Mechanical Engg (ME)' },
  { id: 'CE', name: 'Civil Engg (CE)' },
  { id: 'EE', name: 'Electrical Engg (EE)' },
];

const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ClassSlot {
  time: string;
  subject: string;
  code: string;
  room: string;
  faculty: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
}

interface ExamSlot {
  date: string;
  day: string;
  time: string;
  code: string;
  subject: string;
  room: string;
}

// Dynamic schedule generator based on branch and semester
function getBranchSemesterSchedule(
  branch: string,
  semester: string,
  day: string
): ClassSlot[] {
  // Course curriculum mapping
  const branchCurriculum: Record<
    string,
    Record<string, { subjects: string[]; lab: string; faculty: string[]; rooms: string[] }>
  > = {
    CSE: {
      '6': {
        subjects: ['Machine Learning', 'Cloud Computing', 'Compiler Design', 'Cyber Security', 'Software Engineering'],
        lab: 'Neural Networks & Deep Learning Lab',
        faculty: ['Dr. Rajesh Sharma', 'Prof. Ananya Sen', 'Dr. Vivek Varma', 'Dr. Priya Nair'],
        rooms: ['LH-302', 'LH-304', 'Turing Lab 2'],
      },
      '4': {
        subjects: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management', 'Theory of Computation'],
        lab: 'Operating Systems & DBMS Lab',
        faculty: ['Prof. Kapoor', 'Dr. Varma', 'Prof. Roy', 'Dr. Sharma'],
        rooms: ['LH-201', 'LH-202', 'Ada Lab 1'],
      },
    },
    IT: {
      '6': {
        subjects: ['Web Technologies', 'Cloud Architecture', 'Distributed Systems', 'Information Security'],
        lab: 'Full-Stack Web Dev Lab',
        faculty: ['Dr. M. Sen', 'Prof. Banerjee', 'Dr. Alok Nath', 'Prof. Swati'],
        rooms: ['IT-LH1', 'IT-LH2', 'Silicon Lab'],
      },
    },
    ECE: {
      '6': {
        subjects: ['Digital Signal Processing', 'Antenna & Wave Propagation', 'VLSI Design', 'Embedded Systems'],
        lab: 'DSP & Microcontroller Lab',
        faculty: ['Dr. Ramanathan', 'Prof. Meenakshi', 'Dr. Sandeep', 'Prof. Joshi'],
        rooms: ['EC-401', 'EC-402', 'Maxwell Lab'],
      },
    },
    ME: {
      '6': {
        subjects: ['Heat & Mass Transfer', 'Machine Design-II', 'Fluid Machinery', 'Internal Combustion Engines'],
        lab: 'CAD/CAM & Simulation Lab',
        faculty: ['Dr. K.P. Singh', 'Prof. Ahluwalia', 'Dr. B. Das', 'Prof. Mishra'],
        rooms: ['ME-101', 'ME-102', 'Workshop Block B'],
      },
    },
    CE: {
      '6': {
        subjects: ['Structural Analysis-II', 'Geotechnical Engineering', 'Environmental Engineering', 'Transportation Engg'],
        lab: 'Geotech & Soil Mechanics Lab',
        faculty: ['Dr. Sengupta', 'Prof. R.K. Yadav', 'Dr. Choudhury', 'Prof. Gupta'],
        rooms: ['CE-201', 'CE-202', 'Survey Lab'],
      },
    },
    EE: {
      '6': {
        subjects: ['Power Systems-II', 'Control Systems Engineering', 'Power Electronics', 'Electrical Machines-II'],
        lab: 'Power Systems & Drives Lab',
        faculty: ['Dr. P. Mukherjee', 'Prof. T. Reddy', 'Dr. A. Verma', 'Prof. Bose'],
        rooms: ['EE-301', 'EE-302', 'Tesla Lab'],
      },
    },
  };

  // Default fallback for any semester
  const fallbackSubjects = [
    `${branch}-${semester}01 Core Foundations`,
    `${branch}-${semester}02 Advanced Systems`,
    `${branch}-${semester}03 Applied Analysis`,
    `${branch}-${semester}04 Professional Elective`,
  ];

  const config =
    branchCurriculum[branch]?.[semester] || {
      subjects: fallbackSubjects,
      lab: `${branch} Applied Research Lab`,
      faculty: ['Dr. Senior Professor', 'Prof. Associate Faculty', 'Dr. Assistant Professor'],
      rooms: ['Block-A LH-101', 'Computing Lab 3'],
    };

  const { subjects, lab, faculty, rooms } = config;

  if (day === 'Saturday') {
    return [
      {
        time: '09:30 - 11:30 AM',
        subject: 'Co-Curricular / Technical Club Activities',
        code: `${branch}-ACT`,
        room: 'Student Activity Centre',
        faculty: 'Faculty Mentors',
        type: 'Lecture',
      },
      {
        time: '11:45 - 01:15 PM',
        subject: 'Industry Expert Guest Lecture / Seminar',
        code: `${branch}-SEM`,
        room: 'Main Auditorium',
        faculty: 'Visiting Fellows',
        type: 'Lecture',
      },
    ];
  }

  if (day === 'Friday') {
    return [
      {
        time: '09:00 - 10:00 AM',
        subject: subjects[0],
        code: `${branch}-${semester}01`,
        room: rooms[0],
        faculty: faculty[0],
        type: 'Lecture',
      },
      {
        time: '10:00 - 11:00 AM',
        subject: subjects[1],
        code: `${branch}-${semester}02`,
        room: rooms[0],
        faculty: faculty[1 % faculty.length],
        type: 'Lecture',
      },
      {
        time: '11:15 - 01:15 PM',
        subject: lab,
        code: `${branch}-${semester}05L`,
        room: rooms[rooms.length - 1],
        faculty: faculty[0],
        type: 'Lab',
      },
      {
        time: '02:00 - 03:30 PM',
        subject: 'Project Phase Mentorship & Review',
        code: `${branch}-PRJ`,
        room: 'Department Seminar Hall',
        faculty: 'Department Committee',
        type: 'Tutorial',
      },
    ];
  }

  // Monday to Thursday standard layout
  return [
    {
      time: '09:00 - 10:00 AM',
      subject: subjects[0],
      code: `${branch}-${semester}01`,
      room: rooms[0],
      faculty: faculty[0],
      type: 'Lecture',
    },
    {
      time: '10:00 - 11:00 AM',
      subject: subjects[1],
      code: `${branch}-${semester}02`,
      room: rooms[0],
      faculty: faculty[1 % faculty.length],
      type: 'Lecture',
    },
    {
      time: '11:15 - 12:15 PM',
      subject: subjects[2] || subjects[0],
      code: `${branch}-${semester}03`,
      room: rooms[1 % rooms.length],
      faculty: faculty[2 % faculty.length],
      type: 'Lecture',
    },
    {
      time: '01:30 - 03:30 PM',
      subject: day === 'Wednesday' ? lab : subjects[3] || 'Technical Seminar & Soft Skills',
      code: `${branch}-${semester}04`,
      room: day === 'Wednesday' ? rooms[rooms.length - 1] : rooms[0],
      faculty: faculty[0],
      type: day === 'Wednesday' ? 'Lab' : 'Tutorial',
    },
  ];
}

// Dynamic exam datesheet generator
function getExamDatesheet(branch: string, semester: string): ExamSlot[] {
  const dates = [
    { date: '10 Nov 2026', day: 'Tuesday' },
    { date: '13 Nov 2026', day: 'Friday' },
    { date: '17 Nov 2026', day: 'Tuesday' },
    { date: '20 Nov 2026', day: 'Friday' },
    { date: '24 Nov 2026', day: 'Tuesday' },
  ];

  const subjects = [
    { code: `${branch}-${semester}01`, title: 'Core Principles & Theory' },
    { code: `${branch}-${semester}02`, title: 'Applied Engineering Systems' },
    { code: `${branch}-${semester}03`, title: 'Advanced Design & Computing' },
    { code: `${branch}-${semester}04`, title: 'Professional Elective-I' },
    { code: `${branch}-${semester}05`, title: 'Open Interdisciplinary Elective' },
  ];

  return dates.map((d, i) => ({
    date: d.date,
    day: d.day,
    time: '10:00 AM - 01:00 PM (Morning Shift)',
    code: subjects[i].code,
    subject: subjects[i].title,
    room: `Exam Centre Block ${String.fromCharCode(65 + (i % 3))}, Hall ${101 + i * 2}`,
  }));
}

export const TimetableView: React.FC<TimetableViewProps> = ({ posts, onSelectPost }) => {
  const [viewMode, setViewMode] = useState<'timetable' | 'datesheet'>('timetable');
  const [selectedBranch, setSelectedBranch] = useState('CSE');
  const [selectedSemester, setSelectedSemester] = useState('6');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('Monday');

  const timetablePosts = posts.filter((p) => p.category === 'timetable');
  const currentSchedule = getBranchSemesterSchedule(selectedBranch, selectedSemester, selectedDay);
  const examDatesheet = getExamDatesheet(selectedBranch, selectedSemester);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Mode Switcher: Class Timetable vs Exam Datesheet */}
      <div className="bg-white rounded-2xl border-2 border-slate-200/90 p-2 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('timetable')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timetable'
                ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Class Timetable</span>
          </button>

          <button
            onClick={() => setViewMode('datesheet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'datesheet'
                ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Exam Datesheet</span>
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          title="Print schedule"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save View</span>
        </button>
      </div>

      {/* Official Timetable Circulars Bar */}
      {timetablePosts.length > 0 && (
        <div className="bg-gradient-to-br from-red-50/80 via-white to-orange-50/60 rounded-3xl p-5 border-2 border-red-200/90 shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-800 mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            <span>Official University Timetable & Datesheet Circulars</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timetablePosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="p-3.5 rounded-2xl bg-white hover:bg-red-50/50 border border-red-100 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-bold text-xs text-slate-900 group-hover:text-red-700 truncate">
                    {post.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Issued: {new Date(post.publishDate).toLocaleDateString()} • {post.attachments.length} attachment(s)
                  </p>
                </div>
                <span className="text-xs font-bold text-red-700 bg-red-100/80 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 group-hover:bg-red-700 group-hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Matrix Panel */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm p-5 sm:p-6">
        {/* Top Controls: Branch, Semester, Section Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                {viewMode === 'timetable' ? 'Weekly Lecture Schedule' : 'Semester Examination Datesheet'}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {selectedBranch} • Sem {selectedSemester} (Sec {selectedSection})
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              {viewMode === 'timetable'
                ? `Active Lecture Timetable: ${selectedBranch} - Semester ${selectedSemester}`
                : `Official Exam Datesheet: ${selectedBranch} - Semester ${selectedSemester}`}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Branch Selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-50 text-xs font-bold text-slate-800 py-2 px-3 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-none"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Semester Selector */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-50 text-xs font-bold text-slate-800 py-2 px-3 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-none"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>

            {/* Section Selector */}
            {viewMode === 'timetable' && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-slate-50 text-xs font-bold text-slate-800 py-2 px-3 rounded-xl border border-slate-200 focus:border-red-500 focus:outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            )}
          </div>
        </div>

        {/* MODE 1: CLASS TIMETABLE */}
        {viewMode === 'timetable' && (
          <div>
            {/* Day Selector Pills */}
            <div className="flex items-center gap-2 py-4 overflow-x-auto border-b border-slate-100">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedDay === day
                      ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Timetable Period Grid */}
            <div className="space-y-3 mt-4">
              {currentSchedule.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No lectures scheduled for {selectedDay}.
                </div>
              ) : (
                currentSchedule.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white hover:from-red-50/40 hover:to-white border border-slate-200/90 transition-all gap-3 shadow-2xs group"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                          slot.type === 'Lab'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : slot.type === 'Tutorial'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider">{slot.type}</span>
                        <span className="text-xs font-extrabold">{idx + 1}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-700 transition-colors">
                            {slot.subject}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {slot.code}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-red-600" />
                            {slot.room}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3.5 h-3.5 text-orange-600" />
                            {slot.faculty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 text-red-800 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        <span>{slot.time}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODE 2: EXAM DATESHEET */}
        {viewMode === 'datesheet' && (
          <div className="mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">End-Term Examination Guidelines</p>
                <p className="mt-0.5 text-amber-800">
                  Students must carry their college identity cards and hall tickets. Entry into the examination
                  hall closes 15 minutes before exam commencement.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 rounded-l-xl">Date & Day</th>
                    <th className="py-3 px-4">Timing & Shift</th>
                    <th className="py-3 px-4">Paper Code</th>
                    <th className="py-3 px-4">Subject Title</th>
                    <th className="py-3 px-4 rounded-r-xl">Exam Venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examDatesheet.map((exam, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{exam.date}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{exam.day}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-bold">
                          {exam.time}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-red-700">{exam.code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{exam.subject}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{exam.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
