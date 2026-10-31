/**
 * Campus Pulse - Official Documents & College Forms Repository
 */

import React from 'react';
import { FileText, Download, ShieldCheck, ExternalLink, Calendar, Search } from 'lucide-react';
import { Post } from '../types/index.ts';

interface DocumentsViewProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

const OFFICIAL_FORMS = [
  {
    title: 'Bonafide Certificate Application Form',
    category: 'Form',
    dept: 'Academic Registrar',
    filename: 'Bonafide_Certificate_Form.pdf',
    size: '140 KB',
  },
  {
    title: 'Hostel Leave & Outpass Authorization Slip',
    category: 'Form',
    dept: 'Chief Warden Office',
    filename: 'Hostel_Leave_Slip.pdf',
    size: '110 KB',
  },
  {
    title: 'No-Dues / Final Clearance Application Form',
    category: 'Form',
    dept: 'Accounts & Library',
    filename: 'No_Dues_Form_2026.pdf',
    size: '180 KB',
  },
  {
    title: 'Re-Evaluation & Answer Script Inspection Request',
    category: 'Examination',
    dept: 'Exam Controller Cell',
    filename: 'Re_Evaluation_Application.pdf',
    size: '220 KB',
  },
  {
    title: 'Railway & Bus Concession Pass Verification Form',
    category: 'Student Welfare',
    dept: 'Dean Student Affairs',
    filename: 'Student_Concession_Form.pdf',
    size: '150 KB',
  },
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({ posts, onSelectPost }) => {
  const docPosts = posts.filter((p) => p.category === 'documents');

  const handleDownloadVirtual = (filename: string) => {
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KQ2FtcHVzIFB1bHNlIC0gT2ZmaWNpYWwgQ29sbGVnZSBGb3JtIERvd25sb2FkLgplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAyCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDIgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjEyMwAKJSVFT0YK';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Published Official Documents from Database */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Official Collegiate Circulars & Academic Calendars
            </h2>
            <p className="text-xs text-slate-500">
              Verified documents issued by the Dean's Office, Examination Cell, and Registrar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  {post.documentDetails?.docType || 'Circular'}
                </span>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-800 mt-1 truncate">
                  {post.title}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Issued by: {post.authorName} ({post.authorDepartment || 'College'})
                </p>
              </div>

              <span className="text-xs font-bold text-amber-700 shrink-0 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200">
                <Download className="w-3.5 h-3.5" />
                <span>View</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Downloadable College Forms Catalog */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <h3 className="font-extrabold text-base text-slate-900 mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-600" />
          <span>Student Application Forms & Proformas</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Directly download and print official institutional application templates.
        </p>

        <div className="space-y-2.5">
          {OFFICIAL_FORMS.map((form, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-red-50/40 border border-slate-100 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <p className="font-bold text-xs text-slate-800 truncate">{form.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {form.dept} • {form.size} • Verified PDF Form
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadVirtual(form.filename)}
                className="inline-flex items-center gap-1.5 bg-white text-red-700 border border-red-200 hover:bg-red-50 font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
