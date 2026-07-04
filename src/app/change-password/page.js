'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Zap, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ChangePassword() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ show: false, text: '', type: 'success' });

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [authLoading, token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ show: false, text: '', type: 'success' });

    if (form.newPassword.length < 6) {
      setMsg({ show: true, text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMsg({ show: true, text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ show: true, text: 'Password changed successfully! Redirecting...', type: 'success' });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setMsg({ show: true, text: data.error || 'Failed to change password.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ show: true, text: 'Network error. Try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 animate-pulse">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <p className="text-slate-500 text-sm font-semibold tracking-wider uppercase animate-pulse">Loading EventHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black gradient-text">EventHub</h1>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8 border border-purple-200 shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Change Password</h2>
          <p className="text-slate-500 text-sm mb-6">Update your account credentials securely</p>

          {msg.show && (
            <div className={`mb-4 px-4 py-3 rounded-xl border text-xs flex items-center gap-2 ${
              msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type={showPass.current ? 'text' : 'password'} 
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  placeholder="••••••••" 
                  required
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-600 transition"
                >
                  {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type={showPass.new ? 'text' : 'password'} 
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••" 
                  required
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-600 transition"
                >
                  {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Retype New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type={showPass.confirm ? 'text' : 'password'} 
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••" 
                  required
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-purple-600 transition"
                >
                  {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full justify-center flex items-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Updating...
                </>
              ) : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-purple-600 transition text-sm text-slate-500">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
