/**
 * Campus Pulse - Authentication Modal
 * Institutional credentials login with quick one-click demo role switcher.
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Shield,
  KeyRound,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_PRESETS = [
  {
    roleName: 'Dean / Super Admin',
    email: 'superadmin@college.edu',
    password: 'Admin@123',
    badge: 'Full Platform Access',
    color: 'border-purple-300 bg-purple-50 text-purple-900',
  },
  {
    roleName: 'Exam Controller (Admin)',
    email: 'admin@college.edu',
    password: 'Admin@123',
    badge: 'Exam Circulars & Moderation',
    color: 'border-blue-300 bg-blue-50 text-blue-900',
  },
  {
    roleName: 'Dr. Sharma (CSE Faculty)',
    email: 'sharma.cse@college.edu',
    password: 'Faculty@123',
    badge: 'Assignments & Lab Notes',
    color: 'border-rose-300 bg-rose-50 text-rose-900',
  },
  {
    roleName: 'Dr. Priya (ECE Faculty)',
    email: 'priya.ece@college.edu',
    password: 'Faculty@123',
    badge: 'Course Material Publisher',
    color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  {
    roleName: 'Rohan (Student Account)',
    email: 'student@college.edu',
    password: 'Student@123',
    badge: 'Saved Bookmarks & Tracking',
    color: 'border-amber-300 bg-amber-50 text-amber-900',
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        const msg = await requestPasswordReset(email);
        setSuccessMsg(msg);
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {isForgotPassword ? 'Reset Password' : 'Institutional Sign In'}
              </h3>
              <p className="text-[11px] text-slate-500">Authorized Faculty & Admin Access</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick One-Click Demo Switcher */}
        {!isForgotPassword && (
          <div className="px-6 pt-4 pb-2 bg-slate-50/80 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>Instant Demo Roles</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.email}
                  type="button"
                  onClick={() => handleSelectPreset(preset.email, preset.password)}
                  className={`text-left p-2 rounded-xl border text-xs transition-all hover:scale-[1.01] flex items-center justify-between ${preset.color}`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold truncate">{preset.roleName}</p>
                    <p className="text-[10px] opacity-80 truncate">{preset.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold bg-white/70 px-2 py-0.5 rounded-md shrink-0">
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@college.edu"
                className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[11px] font-semibold text-red-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-red-600/30 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
          >
            {isLoading
              ? 'Verifying Credentials...'
              : isForgotPassword
              ? 'Send Reset Link'
              : 'Sign In to Campus Pulse'}
          </button>

          {isForgotPassword && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 pt-1"
            >
              Back to Login
            </button>
          )}

          <p className="text-[11px] text-slate-500 text-center pt-2 leading-relaxed">
            Students and visitors can freely view all official notices without an account. Only authorized faculty and administrative staff may log in to manage or publish circulars.
          </p>
        </form>
      </div>
    </div>
  );
};
