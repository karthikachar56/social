'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Zap, 
  LayoutDashboard, 
  CalendarPlus, 
  FilePlus, 
  List, 
  LogOut, 
  ArrowLeft,
  Calendar,
  Newspaper,
  User,
  Activity,
  Plus,
  Trash2,
  Check,
  X,
  Menu,
  ImagePlus,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  MapPin
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, role, token, loading: authLoading, logout } = useAuth();

  // Navigation and data states
  const [page, setPage] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [postsFilter, setPostsFilter] = useState('all');

  // Submit states
  const [submitLoading, setSubmitLoading] = useState({ event: false, news: false });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '', loading: false });

  // Upload progress indicators
  const [eventUploading, setEventUploading] = useState(false);
  const [newsUploading, setNewsUploading] = useState(false);
  const [eventDrag, setEventDrag] = useState(false);
  const [newsDrag, setNewsDrag] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', location: '', category: 'General', image: '', tags: [] });
  const [newsForm, setNewsForm] = useState({ title: '', content: '', summary: '', category: 'General', image: '', tags: [] });

  const eventFileInputRef = useRef(null);
  const newsFileInputRef = useRef(null);
  const eventTagInputRef = useRef(null);
  const newsTagInputRef = useRef(null);

  // Auth routing verification
  useEffect(() => {
    if (!authLoading) {
      if (!token || role !== 'admin') {
        router.push('/admin/login');
      } else {
        loadAllData();
      }
    }
  }, [authLoading, token, role]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => { setToast(prev => ({ ...prev, show: false })); }, 3500);
  };

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [evRes, nwRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/news')
      ]);

      if (evRes.ok && nwRes.ok) {
        const evData = await evRes.json();
        const nwData = await nwRes.json();
        setEvents(evData);
        setNews(nwData);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Stats computation
  const yourEventsCount = events.filter(e => e.adminId === user?.id || e.adminId === user?._id).length;
  const yourNewsCount = news.filter(n => n.adminId === user?.id || n.adminId === user?._id).length;

  const recentItems = [
    ...events.map(e => ({ ...e, _type: 'event' })),
    ...news.map(n => ({ ...n, _type: 'news' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageTitle = {
    dashboard: 'Dashboard',
    'add-event': 'Create Event',
    'add-news': 'Publish News',
    'my-posts': 'All Posts'
  }[page] || '';

  const pageSubtitle = {
    dashboard: `Welcome back, ${user?.name || ''}`,
    'add-event': 'Fill in the details below',
    'add-news': 'Write and publish your article',
    'my-posts': 'Manage all events and news'
  }[page] || '';

  // File Upload Handlers (converts file to base64 string first)
  const _doUpload = async (file, type) => {
    if (type === 'event') setEventUploading(true);
    else setNewsUploading(true);

    try {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large. Max size is 5MB.', 'error');
        if (type === 'event') setEventUploading(false);
        else setNewsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        
        // Upload via backend API
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok) {
            if (type === 'event') setEventForm(prev => ({ ...prev, image: uploadData.url }));
            else setNewsForm(prev => ({ ...prev, image: uploadData.url }));
            showToast('Photo prepared! ✓', 'success');
          } else {
            showToast(uploadData.error || 'Failed to upload photo.', 'error');
          }
        } catch {
          showToast('Photo upload connection failed.', 'error');
        } finally {
          if (type === 'event') setEventUploading(false);
          else setNewsUploading(false);
        }
      };
      
      reader.onerror = () => {
        showToast('Failed to read local file.', 'error');
        if (type === 'event') setEventUploading(false);
        else setNewsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      showToast('File uploading failure.', 'error');
      if (type === 'event') setEventUploading(false);
      else setNewsUploading(false);
    }
  };

  const uploadEventFile = (e) => {
    const file = e.target.files[0];
    if (file) _doUpload(file, 'event');
    e.target.value = '';
  };

  const uploadNewsFile = (e) => {
    const file = e.target.files[0];
    if (file) _doUpload(file, 'news');
    e.target.value = '';
  };

  const handleEventDrop = (e) => {
    e.preventDefault();
    setEventDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) _doUpload(file, 'event');
    else showToast('Please drop an image file.', 'error');
  };

  const handleNewsDrop = (e) => {
    e.preventDefault();
    setNewsDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) _doUpload(file, 'news');
    else showToast('Please drop an image file.', 'error');
  };

  // Tags Managers
  const addEventTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim().replace(/,/g, '');
      if (val && !eventForm.tags.includes(val)) {
        setEventForm(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      e.target.value = '';
    }
  };

  const addNewsTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim().replace(/,/g, '');
      if (val && !newsForm.tags.includes(val)) {
        setNewsForm(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      e.target.value = '';
    }
  };

  // Submit methods
  const submitEvent = async (e) => {
    e.preventDefault();
    setSubmitLoading(prev => ({ ...prev, event: true }));
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(prev => [data, ...prev]);
        showToast('Event published successfully! 🎉', 'success');
        resetEventForm();
        setPage('my-posts');
      } else {
        showToast(data.error || 'Failed to publish event.', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setSubmitLoading(prev => ({ ...prev, event: false }));
    }
  };

  const submitNews = async (e) => {
    e.preventDefault();
    setSubmitLoading(prev => ({ ...prev, news: true }));
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newsForm)
      });
      const data = await res.json();
      if (res.ok) {
        setNews(prev => [data, ...prev]);
        showToast('News article published! 📰', 'success');
        resetNewsForm();
        setPage('my-posts');
      } else {
        showToast(data.error || 'Failed to publish news.', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    } finally {
      setSubmitLoading(prev => ({ ...prev, news: false }));
    }
  };

  // Deletion logic
  const handleDeleteItem = (type, id) => {
    setDeleteModal({ open: true, type, id, loading: false });
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const { type, id } = deleteModal;
    try {
      const url = type === 'event' ? `/api/events/${id}` : `/api/news/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (type === 'event') setEvents(prev => prev.filter(e => e._id !== id));
        else setNews(prev => prev.filter(n => n._id !== id));
        showToast('Deleted successfully.', 'success');
        setDeleteModal({ open: false, type: '', id: '', loading: false });
      } else {
        showToast(data.error || 'Deletion failed.', 'error');
      }
    } catch {
      showToast('Network error during deletion.', 'error');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const resetEventForm = () => {
    setEventForm({ title: '', description: '', date: '', time: '', location: '', category: 'General', image: '', tags: [] });
  };

  const resetNewsForm = () => {
    setNewsForm({ title: '', content: '', summary: '', category: 'General', image: '', tags: [] });
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  };

  if (authLoading || !user || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 relative">
      
      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div onClick={() => setMobileMenu(false)} className="fixed inset-0 bg-black/60 z-40 md:hidden"></div>
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar w-64 flex-shrink-0 min-h-screen flex flex-col p-4 fixed md:sticky top-0 left-0 z-50 transform ${
        mobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } transition-transform duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/10">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-white">EventHub</span>
          <span className="text-xs text-slate-500 ml-auto bg-white px-2 py-0.5 border border-slate-200 rounded-full">Admin</span>
        </div>

        {/* Admin Info */}
        <div className="mb-6 px-3 py-3 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/5 border border-purple-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <Link href="/" className="nav-item w-full mb-3 border border-slate-200 hover:border-purple-600/50 text-slate-500 hover:text-white transition flex items-center">
            <ArrowLeft className="w-4 h-4 flex-shrink-0" /> Back to Site
          </Link>
          <div className="border-t border-slate-200 mb-3"></div>
          
          <button onClick={() => { setPage('dashboard'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> Dashboard
          </button>
          
          <button onClick={() => { setPage('add-event'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'add-event' ? 'active' : ''}`}>
            <CalendarPlus className="w-4 h-4 flex-shrink-0" /> Add Event
          </button>
          
          <button onClick={() => { setPage('add-news'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'add-news' ? 'active' : ''}`}>
            <FilePlus className="w-4 h-4 flex-shrink-0" /> Add News
          </button>
          
          <button onClick={() => { setPage('my-posts'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'my-posts' ? 'active' : ''}`}>
            <List className="w-4 h-4 flex-shrink-0" /> All Posts
            <span className="ml-auto text-[10px] bg-purple-900/30 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
              {events.length + news.length}
            </span>
          </button>
        </nav>

        {/* Logout */}
        <button onClick={logout} className="nav-item w-full mt-4 border border-red-900/30 text-red-400 hover:bg-red-950/10 hover:text-red-300">
          <LogOut className="w-4 h-4 flex-shrink-0" /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-grow min-h-screen flex flex-col min-w-0 w-full pl-0 md:pl-0">
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-white text-lg">{pageTitle}</h1>
            <p className="text-xs text-slate-500">{pageSubtitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-500">Today</div>
              <div className="text-xs font-semibold text-slate-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow shadow-purple-500/20">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* ======================== DASHBOARD ======================== */}
          {page === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Total Events</span>
                  </div>
                  <div className="text-3xl font-black text-white">{events.length}</div>
                  <div className="text-[10px] text-slate-500 mt-1">all admins</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-900/30 border border-pink-500/20 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-pink-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Total News</span>
                  </div>
                  <div className="text-3xl font-black text-white">{news.length}</div>
                  <div className="text-[10px] text-slate-500 mt-1">all admins</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Your Events</span>
                  </div>
                  <div className="text-3xl font-black text-white">{yourEventsCount}</div>
                  <div className="text-[10px] text-slate-500 mt-1">posted by you</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-900/30 border border-green-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Your News</span>
                  </div>
                  <div className="text-3xl font-black text-white">{yourNewsCount}</div>
                  <div className="text-[10px] text-slate-500 mt-1">posted by you</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setPage('add-event')} className="glass rounded-xl p-6 text-left hover:border-purple-500/40 transition group relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center mb-4 group-hover:bg-purple-900/50 transition">
                    <CalendarPlus className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">Create Event</h3>
                  <p className="text-sm text-slate-500">Add a new event visible to all users on the platform.</p>
                </button>

                <button onClick={() => setPage('add-news')} className="glass rounded-xl p-6 text-left hover:border-pink-500/40 transition group relative overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-pink-900/30 flex items-center justify-center mb-4 group-hover:bg-pink-900/50 transition">
                    <FilePlus className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">Publish News</h3>
                  <p className="text-sm text-slate-500">Share the latest news and updates with your community.</p>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="glass rounded-xl p-6 border border-purple-500/10">
                <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" /> Recent Activity
                </h2>
                {recentItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <p>No posts yet. Start by creating an event or news article.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentItems.slice(0, 8).map(item => (
                      <div key={item._id} className="flex items-center gap-4 py-3 border-b border-slate-200/50 last:border-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item._type === 'event' ? 'bg-purple-900/30 text-purple-400' : 'bg-pink-900/30 text-pink-400'
                        }`}>
                          {item._type === 'event' ? <Calendar className="w-4.5 h-4.5" /> : <Newspaper className="w-4.5 h-4.5" />}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500">{item.adminName} • {timeAgo(item.createdAt)}</p>
                        </div>
                        
                        <span className={`badge uppercase text-[9px] font-bold ${
                          item._type === 'event' ? 'badge-event' : 'badge-news'
                        }`}>
                          {item._type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================== ADD EVENT ======================== */}
          {page === 'add-event' && (
            <div className="max-w-2xl">
              <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white mb-4 transition group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </button>
              
              <div className="glass rounded-2xl p-6 sm:p-8 border border-purple-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center">
                    <CalendarPlus className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg">Create New Event</h2>
                    <p className="text-xs text-slate-500">This event will be visible to all users on EventHub</p>
                  </div>
                </div>

                <form onSubmit={submitEvent} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Event Title <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder="Enter event title" 
                        className="input-field" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date <span className="text-red-400">*</span></label>
                      <input 
                        type="date" 
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="input-field" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Time</label>
                      <input 
                        type="time" 
                        value={eventForm.time}
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        className="input-field" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</label>
                      <input 
                        type="text" 
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="e.g. Main Auditorium" 
                        className="input-field" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                      <select 
                        value={eventForm.category}
                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                        className="select-field"
                      >
                        <option value="General">General</option>
                        <option value="Academic">Academic</option>
                        <option value="Sports">Sports</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Technology">Technology</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Conference">Conference</option>
                        <option value="Social">Social</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description <span class="text-red-400">*</span></label>
                      <textarea 
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        placeholder="Describe the event in detail..." 
                        className="input-field" 
                        rows="5" 
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Photo <span className="text-slate-600 normal-case font-normal">(optional — click or drag from your device)</span></label>
                      
                      {/* Drag-Drop Zone */}
                      <div 
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                          eventDrag ? 'border-purple-500 bg-purple-900/10' : 'border-slate-200 hover:border-purple-600/50'
                        }`}
                        onClick={() => eventFileInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setEventDrag(true); }}
                        onDragLeave={() => setEventDrag(false)}
                        onDrop={handleEventDrop}
                      >
                        {!eventForm.image ? (
                          <div>
                            <div className="w-12 h-12 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                              <ImagePlus className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-sm text-white font-medium mb-1">Click to upload or drag & drop</p>
                            <p className="text-xs text-slate-500">JPG, PNG, GIF, WEBP — max 5MB</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <img src={eventForm.image} alt="Event Preview" className="h-40 w-full object-cover rounded-lg" />
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setEventForm(prev => ({ ...prev, image: '' })); }} 
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {eventUploading && (
                          <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                            <svg className="w-6 h-6 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <input 
                        ref={eventFileInputRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={uploadEventFile} 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags <span className="text-slate-600 normal-case font-normal">(type and press Enter or comma)</span></label>
                      <div className="tag-input-container" onClick={() => eventTagInputRef.current.focus()}>
                        {eventForm.tags.map((tag, i) => (
                          <span key={tag} className="tag-pill">
                            <span>#{tag}</span>
                            <button 
                              type="button" 
                              onClick={() => setEventForm(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }))} 
                              className="hover:text-red-300 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input 
                          ref={eventTagInputRef} 
                          type="text" 
                          placeholder={eventForm.tags.length === 0 ? "Add tags..." : ""} 
                          onKeyDown={addEventTag}
                          className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 flex-1 min-w-20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary" disabled={submitLoading.event || eventUploading}>
                      {submitLoading.event ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : <Check className="w-4 h-4" />}
                      <span>{submitLoading.event ? 'Publishing...' : 'Publish Event'}</span>
                    </button>
                    
                    <button type="button" onClick={resetEventForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-white hover:border-slate-600 text-sm transition">
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================== ADD NEWS ======================== */}
          {page === 'add-news' && (
            <div className="max-w-2xl">
              <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white mb-4 transition group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </button>
              
              <div className="glass rounded-2xl p-6 sm:p-8 border border-pink-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-pink-900/30 border border-pink-500/20 flex items-center justify-center">
                    <FilePlus className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h2 class="font-bold text-white text-lg">Publish News Article</h2>
                    <p className="text-xs text-slate-500">This article will be visible to all users on EventHub</p>
                  </div>
                </div>

                <form onSubmit={submitNews} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">News Title <span class="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        value={newsForm.title}
                        onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                        placeholder="Enter headline" 
                        className="input-field" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                      <select 
                        value={newsForm.category}
                        onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                        className="select-field"
                      >
                        <option value="General">General</option>
                        <option value="Announcement">Announcement</option>
                        <option value="Achievement">Achievement</option>
                        <option value="Sports">Sports</option>
                        <option value="Academic">Academic</option>
                        <option value="Technology">Technology</option>
                        <option value="Culture">Culture</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Photo <span className="text-slate-600 normal-case font-normal">(optional — click or drag from your device)</span></label>
                      
                      {/* Drag-Drop Zone */}
                      <div 
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                          newsDrag ? 'border-pink-500 bg-pink-900/10' : 'border-slate-200 hover:border-pink-500/50'
                        }`}
                        onClick={() => newsFileInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setNewsDrag(true); }}
                        onDragLeave={() => setNewsDrag(false)}
                        onDrop={handleNewsDrop}
                      >
                        {!newsForm.image ? (
                          <div>
                            <div className="w-12 h-12 rounded-xl bg-pink-900/20 border border-pink-500/20 flex items-center justify-center mx-auto mb-3">
                              <ImagePlus className="w-6 h-6 text-pink-400" />
                            </div>
                            <p className="text-sm text-white font-medium mb-1">Click to upload or drag & drop</p>
                            <p className="text-xs text-slate-500">JPG, PNG, GIF, WEBP — max 5MB</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <img src={newsForm.image} alt="News Preview" className="h-40 w-full object-cover rounded-lg" />
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); setNewsForm(prev => ({ ...prev, image: '' })); }} 
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-600 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {newsUploading && (
                          <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                            <svg className="w-6 h-6 animate-spin text-pink-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <input 
                        ref={newsFileInputRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={uploadNewsFile} 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Summary <span className="text-slate-600 normal-case font-normal">(optional — short card preview)</span></label>
                      <input 
                        type="text" 
                        value={newsForm.summary}
                        onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                        placeholder="A short preview sentence..." 
                        className="input-field" 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Content <span class="text-red-400">*</span></label>
                      <textarea 
                        value={newsForm.content}
                        onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                        placeholder="Write the full news article here..." 
                        className="input-field" 
                        rows="8" 
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags <span className="text-slate-600 normal-case font-normal">(type and press Enter or comma)</span></label>
                      <div className="tag-input-container" onClick={() => newsTagInputRef.current.focus()}>
                        {newsForm.tags.map((tag, i) => (
                          <span key={tag} className="tag-pill">
                            <span>#{tag}</span>
                            <button 
                              type="button" 
                              onClick={() => setNewsForm(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }))} 
                              className="hover:text-red-300 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input 
                          ref={newsTagInputRef} 
                          type="text" 
                          placeholder={newsForm.tags.length === 0 ? "Add tags..." : ""} 
                          onKeyDown={addNewsTag}
                          className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 flex-1 min-w-20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="btn-primary" disabled={submitLoading.news || newsUploading} style={{ background: 'linear-gradient(135deg,#DB2777,#EC4899)' }}>
                      {submitLoading.news ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : <Check className="w-4 h-4" />}
                      <span>{submitLoading.news ? 'Publishing...' : 'Publish Article'}</span>
                    </button>
                    
                    <button type="button" onClick={resetNewsForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-white hover:border-slate-600 text-sm transition">
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================== ALL POSTS ======================== */}
          {page === 'my-posts' && (
            <div className="space-y-6">
              {/* Filter tabs */}
              <div className="flex items-center gap-2">
                <button onClick={() => setPostsFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  postsFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-500 border border-slate-200 hover:border-purple-600/50'
                }`}>
                  All ({events.length + news.length})
                </button>
                
                <button onClick={() => setPostsFilter('events')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  postsFilter === 'events' ? 'bg-purple-600 text-white' : 'text-slate-500 border border-slate-200 hover:border-purple-600/50'
                }`}>
                  Events ({events.length})
                </button>
                
                <button onClick={() => setPostsFilter('news')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  postsFilter === 'news' ? 'bg-pink-600 text-white' : 'text-slate-500 border border-slate-200 hover:border-pink-500/50'
                }`}>
                  News ({news.length})
                </button>
              </div>

              {/* Events Manager Grid */}
              {(postsFilter === 'all' || postsFilter === 'events') && (
                <div className="glass rounded-2xl overflow-hidden border border-purple-500/10">
                  <div className="p-5 border-b border-slate-200/50 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h2 className="font-bold text-white">Events</h2>
                    <span className="text-xs bg-purple-900/30 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full ml-auto">
                      {events.length} total
                    </span>
                  </div>
                  
                  {events.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No events yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-200/50 bg-slate-100/50">
                      {events.map(ev => (
                        <div key={ev._id} className="p-4 sm:p-5 hover:bg-white/[0.01] transition">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {ev.image ? (
                                <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                              ) : (
                                <Calendar className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white text-sm truncate">{ev.title}</h3>
                                <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full">{ev.category}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">{ev.description}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(ev.date)}</span>
                                {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ev.adminName}</span>
                                <span>{timeAgo(ev.createdAt)}</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleDeleteItem('event', ev._id)} 
                              className="btn-danger flex-shrink-0 self-center"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* News Manager Grid */}
              {(postsFilter === 'all' || postsFilter === 'news') && (
                <div className="glass rounded-2xl overflow-hidden border border-pink-500/10">
                  <div className="p-5 border-b border-slate-200/50 flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-pink-400" />
                    <h2 className="font-bold text-white">News Articles</h2>
                    <span className="text-xs bg-pink-900/30 text-pink-300 border border-pink-500/20 px-2.5 py-0.5 rounded-full ml-auto">
                      {news.length} total
                    </span>
                  </div>
                  
                  {news.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No news articles yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-200/50 bg-slate-100/50">
                      {news.map(item => (
                        <div key={item._id} className="p-4 sm:p-5 hover:bg-white/[0.01] transition">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-pink-900/20 border border-pink-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <Newspaper className="w-5 h-5 text-pink-400" />
                              )}
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                                <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full">{item.category}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">{item.summary || item.content}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.adminName}</span>
                                <span>{timeAgo(item.createdAt)}</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleDeleteItem('news', item._id)} 
                              className="btn-danger flex-shrink-0 self-center"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success shadow-lg' : 'toast-error shadow-lg'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full border border-red-500/20 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            
            <h3 className="font-bold text-white text-lg text-center mb-2">
              Delete <span className="capitalize">{deleteModal.type}</span>?
            </h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              This action cannot be undone. The item and all its comments will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ open: false, type: '', id: '', loading: false })}
                className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-white text-sm transition"
              >
                Cancel
              </button>
              
              <button 
                onClick={confirmDelete}
                className="flex-grow px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition shadow-md shadow-red-600/20"
                disabled={deleteModal.loading}
              >
                {deleteModal.loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

