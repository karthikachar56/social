'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Zap, Mail, Lock, AlertCircle, ArrowLeft, ArrowRight, CalendarPlus, Newspaper, Users } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const demoAdmins = [
    { name: 'Alex Johnson',   email: 'alex@eventhub.com' },
    { name: 'Sarah Williams', email: 'sarah@eventhub.com' },
    { name: 'Mike Chen',      email: 'mike@eventhub.com' },
    { name: 'Emma Davis',     email: 'emma@eventhub.com' },
    { name: 'James Brown',    email: 'james@eventhub.com' },
    { name: 'Priya Patel',    email: 'priya@eventhub.com' },
  ];

  const handleLogin = async (emailToUse, passwordToUse) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          password: passwordToUse
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      if (data.role !== 'admin') {
        setError('Unauthorized access. This account does not possess admin privileges.');
        setLoading(false);
        return;
      }

      // Context log in
      login(data.token, 'admin', data.user);
      router.push('/admin/dashboard');
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(form.email, form.password);
  };

  const quickLogin = (admin) => {
    setForm({ email: admin.email, password: 'admin123' });
    handleLogin(admin.email, 'admin123');
  };

  return (
    <div className="min-h-screen flex w-full">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 p-16 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.3) 0%, #0F0F1A 70%)' }}>
        <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22rgba(124,58,237,0.1)%22 stroke-width=%220.5%22/><circle cx=%2250%22 cy=%2250%22 r=%2230%22 fill=%22none%22 stroke=%22rgba(124,58,237,0.1)%22 stroke-width=%220.5%22/><circle cx=%2250%22 cy=%2250%22 r=%2220%22 fill=%22none%22 stroke=%22rgba(124,58,237,0.1)%22 stroke-width=%220.5%22/></svg>')] center/cover"></div>
        
        <div className="relative text-center animate-bounce duration-1000" style={{ animationDuration: '4s' }}>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
            <Zap className="w-12 h-12 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black mb-3 gradient-text">EventHub Admin</h1>
          <p className="text-slate-400 text-lg max-w-sm">Manage events and news. Keep your community informed and engaged.</p>
        </div>
        
        {/* Features */}
        <div className="relative mt-12 space-y-3 w-full max-w-xs text-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-purple-900/50 border border-purple-700/50 flex items-center justify-center flex-shrink-0">
              <CalendarPlus className="w-4 h-4 text-purple-400" />
            </div>
            <span>Create and manage events with full details</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-pink-900/50 border border-pink-700/50 flex items-center justify-center flex-shrink-0">
              <Newspaper className="w-4 h-4 text-pink-400" />
            </div>
            <span>Publish news articles visible to all users</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-700/50 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <span>6 admin accounts with individual attribution</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0F0F1A]">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black gradient-text">EventHub Admin</h1>
          </div>

          <div className="glass rounded-2xl p-8 border border-purple-500/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1 font-sans">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-6 font-sans">Sign in to your admin account</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@eventhub.com" 
                    required
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password" 
                    required
                    className="input-field pl-10 pr-10 text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition text-xs font-semibold"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full justify-center flex items-center gap-2 mt-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : null}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick Login Credentials */}
            <div className="mt-8 pt-6 border-t border-[#2A2A4A]/50">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Login — Demo Admins</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAdmins.map(admin => (
                  <button 
                    key={admin.email}
                    onClick={() => quickLogin(admin)} 
                    className="text-left px-3 py-2 rounded-lg border border-[#2A2A4A] hover:border-purple-600 hover:bg-purple-900/10 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {admin.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-300 truncate group-hover:text-white transition">{admin.name}</p>
                        <p className="text-[9px] text-slate-600 truncate">{admin.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 mt-3 text-center">
                All demo accounts use password: <span className="text-slate-500 font-mono">admin123</span>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600 mt-6">
            <Link href="/" className="text-purple-400 hover:text-purple-300 transition inline-flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to EventHub
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
