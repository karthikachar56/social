'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Zap, 
  User, 
  Mail, 
  Phone, 
  Upload, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  LogOut,
  ArrowRight
} from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    avatar: '',
    phone: ''
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Prefill the form once user data is loaded
  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        router.push('/login');
      } else if (user) {
        setForm({
          name: user.name || '',
          avatar: user.avatar || '',
          phone: user.phone || ''
        });
        
        // If the user already has a phone number, redirect them back to home
        if (user.phone) {
          router.push('/');
        }
      }
    }
  }, [authLoading, token, user, router]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Max size is 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          });
          const data = await res.json();
          if (res.ok) {
            setForm(prev => ({ ...prev, avatar: data.url }));
          } else {
            setError(data.error || 'Failed to upload photo.');
          }
        } catch (uploadError) {
          setError('Photo upload failed. Connection error.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read file.');
      setUploading(false);
    }
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.name.trim()) {
      setError('Display name is required.');
      return;
    }

    if (!form.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        updateUser(data.user);
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save profile details.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="text-2xl font-black gradient-text">EventHub</h1>
          </div>
          <p className="text-slate-500 text-xs mt-2">Complete your profile to access all platform features</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-purple-100 shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Set Up Your Profile</h2>
          <p className="text-slate-500 text-sm mb-6">Tell us a bit more about yourself before continuing.</p>

          {/* Success Banner */}
          {success && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully! Welcome to the community. 🎉</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Uploader */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative group">
                <div 
                  onClick={handleTriggerUpload}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg cursor-pointer overflow-hidden border-4 border-white transition group-hover:opacity-90 relative"
                >
                  {form.avatar ? (
                    <img src={form.avatar} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{form.name ? form.name[0].toUpperCase() : 'U'}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={handleTriggerUpload}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-750 transition"
                  title="Upload profile image"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Profile Photo (Optional)</span>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name" 
                  required
                  className="input-field !pl-10 text-sm"
                />
              </div>
            </div>

            {/* Email Input (Locked/Disabled) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address (Locked)</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="input-field !pl-10 !pr-10 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed text-sm"
                  title="Email address cannot be changed."
                />
                <Lock className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="tel" 
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. +1 555-0199" 
                  required
                  className="input-field !pl-10 text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting || uploading}
              className="btn-primary w-full justify-center flex items-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving Profile...
                </>
              ) : (
                <>
                  <span>Save and Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign Out Trigger */}
          <div className="mt-6 pt-6 border-t border-slate-200/50 text-center">
            <button 
              onClick={logout} 
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 font-semibold transition"
              title="Sign out of this account"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out of account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
