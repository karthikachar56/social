'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Zap, 
  Search, 
  Calendar, 
  Newspaper, 
  MapPin, 
  User, 
  ArrowRight, 
  Download, 
  Share2, 
  X, 
  LogOut,
  Sliders,
  CalendarX,
  LayoutDashboard,
  KeyRound,
  Bell,
  CheckCheck,
  MessageSquare,
  Camera,
  Phone,
  Lock,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

export default function Home() {
  const { user, role, token, loading: authLoading, logout, isLiked, toggleLike, updateUser, likedPosts } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventCategory, setEventCategory] = useState('all');
  const [newsCategory, setNewsCategory] = useState('all');
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [modal, setModal] = useState({ open: false, type: '', data: {} });
  const [stats, setStats] = useState({ admins: 6, events: 0, news: 0 });
  const [showToast, setShowToast] = useState(false);

  // Notifications States
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Modal Comments States
  const [modalComments, setModalComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentSending, setCommentSending] = useState(false);

  // Load comments when detail modal is opened
  useEffect(() => {
    if (modal.open && modal.data._id) {
      fetchModalComments(modal.data._id);
    }
  }, [modal.open, modal.data._id]);

  const fetchModalComments = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setModalComments(data);
      }
    } catch (e) {
      console.error('Fetch modal comments error:', e);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || commentSending) return;

    const content = commentInput.trim();
    setCommentInput('');
    setCommentSending(true);

    try {
      const res = await fetch(`/api/posts/${modal.data._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          postType: modal.type
        })
      });

      if (res.ok) {
        const newComm = await res.json();
        setModalComments(prev => [newComm, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSending(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Fetch notifications error:', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleMarkAsRead = async (notification) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: notification._id })
      });
      
      const myId = user?.id || user?._id;
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, readBy: [...(n.readBy || []), myId] } : n));
      
      if (notification.link) {
        router.push(notification.link);
      }
      setNotificationsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        const myId = user?.id || user?._id;
        setNotifications(prev => prev.map(n => ({ ...n, readBy: [...new Set([...(n.readBy || []), myId])] })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // User Profile States
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', avatar: '', phone: '' });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ show: false, msg: '', type: 'success' });
  const profileFileInputRef = useRef(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileTab, setProfileTab] = useState('saved'); // 'saved' or 'details'
  const [savedSubTab, setSavedSubTab] = useState('events'); // 'events' or 'news'

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', avatar: user.avatar || '', phone: user.phone || '' });
    }
  }, [user, profileOpen]);

  const handleProfileFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ show: true, msg: 'File is too large. Max size is 5MB.', type: 'error' });
      return;
    }

    setProfileUploading(true);
    setProfileMsg({ show: false, msg: '', type: 'success' });
    
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
            setProfileForm(prev => ({ ...prev, avatar: data.url }));
            setProfileMsg({ show: true, msg: 'Photo updated! ✓', type: 'success' });
          } else {
            setProfileMsg({ show: true, msg: data.error || 'Failed to upload photo.', type: 'error' });
          }
        } catch (err) {
          setProfileMsg({ show: true, msg: 'Photo upload failed. Connection error.', type: 'error' });
        } finally {
          setProfileUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setProfileMsg({ show: true, msg: 'Failed to read file.', type: 'error' });
      setProfileUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileMsg({ show: false, msg: '', type: 'success' });
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        setProfileMsg({ show: true, msg: 'Profile updated successfully! 🎉', type: 'success' });
        setTimeout(() => {
          setProfileOpen(false);
          setProfileMsg({ show: false, msg: '', type: 'success' });
        }, 1200);
      } else {
        setProfileMsg({ show: true, msg: data.error || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setProfileMsg({ show: true, msg: 'Network error. Try again.', type: 'error' });
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleToggleSavePost = async (postId, postType, e) => {
    e?.stopPropagation();
    if (!token) {
      alert('You must be logged in to save posts.');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postType })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
      } else {
        const errData = await res.json();
        console.error('Failed to toggle save:', errData.error);
      }
    } catch (err) {
      console.error('Network error toggling save:', err);
    }
  };

  const isPostSaved = (postId, postType) => {
    if (!user) return false;
    const savedList = postType === 'event' ? user.savedEvents : user.savedNews;
    if (!savedList) return false;
    return savedList.some(item => {
      const id = typeof item === 'string' ? item : (item._id || item.id);
      return id === postId;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [authLoading, token, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, newsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/news')
      ]);

      const eventsData = await eventsRes.json();
      const newsData = await newsRes.json();

      if (Array.isArray(eventsData)) {
        setEvents(eventsData);
        setStats(prev => ({ ...prev, events: eventsData.length }));
      }
      if (Array.isArray(newsData)) {
        setNews(newsData);
        setStats(prev => ({ ...prev, news: newsData.length }));
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const eventCategories = ['all', ...new Set(events.map(e => e.category).filter(Boolean))];
  const newsCategories = ['all', ...new Set(news.map(n => n.category).filter(Boolean))];

  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.location || '').toLowerCase().includes(q);
    const matchCat = eventCategory === 'all' || e.category === eventCategory;
    return matchSearch && matchCat;
  });

  const filteredNews = news.filter(n => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    const matchCat = newsCategory === 'all' || n.category === newsCategory;
    return matchSearch && matchCat;
  });

  const openModal = (data, type) => {
    setModal({ open: true, type, data });
  };

  const handleLike = async (item, type, e) => {
    if (e) e.stopPropagation();
    
    // Perform toggling
    const updatedLikes = await toggleLike(item, type);
    
    // Update local state listing
    if (type === 'event') {
      setEvents(events.map(ev => ev._id === item._id ? { ...ev, likes: updatedLikes } : ev));
    } else {
      setNews(news.map(nw => nw._id === item._id ? { ...nw, likes: updatedLikes } : nw));
    }

    // Sync modal if active
    if (modal.open && modal.data._id === item._id) {
      setModal(prev => ({ ...prev, data: { ...prev.data, likes: updatedLikes } }));
    }
  };

  const downloadPost = (item, e) => {
    if (e) e.stopPropagation();
    const itemType = item.date ? 'event' : 'news';
    fetch(`/api/posts/${item._id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'download', postType: itemType })
    }).catch(err => console.error('Track download error:', err));

    if (item.image) {
      const a = document.createElement('a');
      a.href = item.image;
      a.download = item.title.replace(/\s+/g, '_') + '_image';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `${item.title}\n\n${item.description || item.content}\n\nPosted by: ${item.adminName}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.title.replace(/\s+/g, '_') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const sharePost = async (item, e) => {
    if (e) e.stopPropagation();
    const itemType = item.date ? 'event' : 'news';
    fetch(`/api/posts/${item._id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'share', postType: itemType })
    }).catch(err => console.error('Track share error:', err));

    const url = window.location.origin + '/' + (modal.type || itemType) + '/' + item._id;
    const shareData = {
      title: item.title,
      text: (item.summary || item.description || item.content || '').slice(0, 120) + '...',
      url
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShowToast(true);
        setTimeout(() => { setShowToast(false); }, 2500);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const timeAgo = (d) => {
    if (!d) return '';
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  };

  if (authLoading || !token) {
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

  const myUserId = user?.id || user?._id;
  const unreadNotificationsCount = notifications.filter(n => {
    return !n.readBy || !n.readBy.includes(myUserId);
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-600/40">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold gradient-text">EventHub</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {!authLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3 relative">
                    {/* Notification Bell Icon */}
                    <div className="relative">
                      <button 
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className={`p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 transition relative ${notificationsOpen ? 'bg-slate-100 text-purple-600' : ''}`}
                        title="Notifications"
                      >
                        <Bell className="w-4 h-4" />
                        {unreadNotificationsCount > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        )}
                        {unreadNotificationsCount > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </button>

                      {/* Dropdown Card */}
                      {notificationsOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                          <div className="absolute right-0 mt-2 w-80 glass border border-purple-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                            <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-purple-50/50">
                              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Notifications</span>
                              {unreadNotificationsCount > 0 && (
                                <button 
                                  onClick={handleMarkAllAsRead}
                                  className="text-[10px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 transition"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                                </button>
                              )}
                            </div>

                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-200/50">
                              {notifications.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">No notifications yet.</div>
                              ) : (
                                notifications.map(notif => {
                                  const isRead = notif.readBy && notif.readBy.includes(myUserId);
                                  return (
                                    <button
                                      key={notif._id}
                                      onClick={() => handleMarkAsRead(notif)}
                                      className={`w-full text-left p-3.5 transition flex flex-col gap-1 ${
                                        isRead ? 'bg-transparent hover:bg-slate-100/50' : 'bg-purple-900/10 hover:bg-purple-900/20'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-xs text-slate-800">{notif.title}</span>
                                        <span className="text-[9px] text-slate-500">{timeAgo(notif.createdAt)}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-600 leading-normal">{notif.message}</p>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      onClick={() => setProfileOpen(true)}
                      className="flex items-center gap-3 hover:opacity-80 transition text-left focus:outline-none cursor-pointer"
                      title="View Profile"
                    >
                      <div className="flex flex-col text-right hidden md:block">
                        <span className="text-xs text-slate-500">Logged in as</span>
                        <span className="text-sm font-semibold text-purple-800">{user.name}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                        )}
                      </div>
                    </button>
                    
                    {role === 'admin' ? (
                      <Link href="/admin/dashboard" className="px-3.5 py-1.5 rounded-lg border border-purple-200 bg-purple-900/10 hover:bg-purple-900/30 text-xs font-semibold text-purple-800 transition flex items-center gap-1">
                        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                      </Link>
                    ) : null}

                    <button onClick={logout} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition" title="Sign Out">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:border-purple-600 transition text-slate-600 hover:text-purple-600">
                      Sign In
                    </Link>
                    <Link href="/register" className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-semibold hover:opacity-90 transition text-white shadow-md shadow-purple-600/20">
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-bg py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto fade-up">
          <span className="badge badge-event mb-4 uppercase tracking-widest bg-purple-900/30 border-purple-700/40 text-purple-800 px-3 py-1 text-[10px] rounded-full">Live Community Platform</span>
          <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-tight">
            Discover <span className="gradient-text">Events</span><br />& Latest <span class="gradient-text">News</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg mb-8 max-w-xl mx-auto">Your central hub for everything happening. Stay informed with events and updates posted by our team of admins.</p>
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Live Updates
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-400" /> 
              <span>{stats.admins} Active Admins</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" /> 
              <span>{stats.events} Events</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH + TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Search */}
        <div className="relative max-w-lg mx-auto mb-8">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search events and news..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white rounded-xl p-1.5 w-fit mx-auto border border-slate-200">
          <button 
            onClick={() => setActiveTab('events')} 
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === 'events' ? 'tab-active shadow-md' : 'text-slate-500 hover:text-purple-600'
            }`}
          >
            <Calendar className="w-4 h-4" /> Events
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'events' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {filteredEvents.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('news')} 
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === 'news' ? 'tab-active shadow-md' : 'text-slate-500 hover:text-purple-600'
            }`}
          >
            <Newspaper className="w-4 h-4" /> News
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'news' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {filteredNews.length}
            </span>
          </button>
        </div>

        {/* Category Filters */}
        {activeTab === 'events' ? (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {eventCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setEventCategory(cat)} 
                className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition border ${
                  eventCategory === cat 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-purple-600/50 hover:text-purple-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {newsCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setNewsCategory(cat)} 
                className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition border ${
                  newsCategory === cat 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-purple-600/50 hover:text-purple-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden border border-slate-200">
                <div className="skeleton h-48 w-full"></div>
                <div className="p-5 space-y-3 bg-slate-100/50">
                  <div className="skeleton h-4 w-2/3 rounded"></div>
                  <div className="skeleton h-4 w-full rounded"></div>
                  <div className="skeleton h-4 w-4/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVENTS GRID */}
        {!loading && activeTab === 'events' && (
          <div>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 bg-slate-100/50 border border-slate-200/50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <CalendarX className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-500 font-medium">No events found</p>
                <p className="text-slate-600 text-sm mt-1">Check back later for upcoming events</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(ev => (
                  <article 
                    key={ev._id} 
                    className="glass rounded-2xl overflow-hidden card-hover cursor-pointer flex flex-col h-full shadow-lg"
                    onClick={() => openModal(ev, 'event')}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/10 overflow-hidden">
                      {ev.image ? (
                        <img src={ev.image} alt={ev.title} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-purple-600/30" />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex gap-2 mb-2">
                        <span className="badge badge-event uppercase text-[9px] px-2 py-0.5 rounded-full font-bold">Event</span>
                        {ev.category && <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full font-bold">{ev.category}</span>}
                      </div>
                      <h2 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2 hover:text-purple-800 transition-colors">
                        {ev.title}
                      </h2>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">
                        {ev.description}
                      </p>
                      <div className="space-y-1.5 text-xs text-slate-500 mt-auto">
                        {ev.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span>{formatDate(ev.date)}{ev.time ? ` at ${ev.time}` : ''}</span>
                          </div>
                        )}
                        {ev.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>Posted by {ev.adminName}</span>
                        </div>
                      </div>
                      
                      {/* Action Bar */}
                      <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {timeAgo(ev.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {/* Like */}
                          <button 
                            className={`action-btn ${isLiked(ev._id) ? 'liked' : 'text-slate-500 hover:text-rose-400'}`}
                            onClick={(e) => handleLike(ev, 'event', e)}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>{ev.likes || 0}</span>
                          </button>
                          
                          {/* Comment */}
                          <button 
                            className="action-btn text-slate-500 hover:text-purple-600 flex items-center gap-1"
                            onClick={(e) => { e.stopPropagation(); openModal(ev, 'event'); }}
                            title="Comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{ev.commentsCount || 0}</span>
                          </button>
                          
                          {/* Download */}
                          <button className="action-btn text-slate-500 hover:text-purple-400" onClick={(e) => downloadPost(ev, e)} title="Download details">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Share */}
                          <button className="action-btn text-slate-500 hover:text-green-400" onClick={(e) => sharePost(ev, e)} title="Share link">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Save */}
                          {role === 'user' && (
                            <button 
                              className={`action-btn ${isPostSaved(ev._id, 'event') ? 'text-amber-500 hover:text-amber-600' : 'text-slate-500 hover:text-amber-400'}`}
                              onClick={(e) => handleToggleSavePost(ev._id, 'event', e)}
                              title={isPostSaved(ev._id, 'event') ? "Unsave Event" : "Save Event"}
                            >
                              {isPostSaved(ev._id, 'event') ? (
                                <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEWS GRID */}
        {!loading && activeTab === 'news' && (
          <div>
            {filteredNews.length === 0 ? (
              <div className="text-center py-20 bg-slate-100/50 border border-slate-200/50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-500 font-medium">No news articles yet</p>
                <p className="text-slate-600 text-sm mt-1">Check back later for the latest updates</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map(item => (
                  <article 
                    key={item._id} 
                    className="glass rounded-2xl overflow-hidden card-hover cursor-pointer flex flex-col h-full shadow-lg"
                    onClick={() => openModal(item, 'news')}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-pink-600/20 to-purple-900/25 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Newspaper className="w-12 h-12 text-pink-600/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex gap-2 mb-2">
                        <span className="badge badge-news uppercase text-[9px] px-2 py-0.5 rounded-full font-bold">News</span>
                        {item.category && <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full font-bold">{item.category}</span>}
                      </div>
                      <h2 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2 hover:text-pink-800 transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-grow">
                        {item.summary || item.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-auto">
                        <User className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>{item.adminName}</span>
                      </div>
                      
                      {/* Action Bar */}
                      <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {timeAgo(item.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {/* Like */}
                          <button 
                            className={`action-btn ${isLiked(item._id) ? 'liked' : 'text-slate-500 hover:text-rose-400'}`}
                            onClick={(e) => handleLike(item, 'news', e)}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>{item.likes || 0}</span>
                          </button>
                          
                          {/* Comment */}
                          <button 
                            className="action-btn text-slate-500 hover:text-purple-600 flex items-center gap-1"
                            onClick={(e) => { e.stopPropagation(); openModal(item, 'news'); }}
                            title="Comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{item.commentsCount || 0}</span>
                          </button>
                          
                          {/* Download */}
                          <button className="action-btn text-slate-500 hover:text-purple-400" onClick={(e) => downloadPost(item, e)} title="Download details">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Share */}
                          <button className="action-btn text-slate-500 hover:text-green-400" onClick={(e) => sharePost(item, e)} title="Share link">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Save */}
                          {role === 'user' && (
                            <button 
                              className={`action-btn ${isPostSaved(item._id, 'news') ? 'text-amber-500 hover:text-amber-600' : 'text-slate-500 hover:text-amber-400'}`}
                              onClick={(e) => handleToggleSavePost(item._id, 'news', e)}
                              title={isPostSaved(item._id, 'news') ? "Unsave News" : "Save News"}
                            >
                              {isPostSaved(item._id, 'news') ? (
                                <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK PREVIEW DETAIL MODAL */}
      {modal.open && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModal({ open: false, type: '', data: {} })}
        >
          <div 
            className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-purple-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {modal.data.image ? (
                <img src={modal.data.image} alt={modal.data.title} className="w-full h-56 object-cover" />
              ) : (
                <div className="h-24 bg-gradient-to-r from-purple-600 to-pink-600"></div>
              )}
              
              <button 
                onClick={() => setModal({ open: false, type: '', data: {} })} 
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/90 transition shadow-md border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute top-3 left-3">
                <span className={`badge uppercase text-[9px] font-bold ${
                  modal.type === 'event' ? 'badge-event' : 'badge-news'
                }`}>
                  {modal.type}
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {modal.data.category && (
                  <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full font-bold">
                    {modal.data.category}
                  </span>
                )}
                {(modal.data.tags || []).map(tag => (
                  <span 
                    key={tag} 
                    className="badge text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {modal.data.title}
              </h2>
              
              {/* Event details */}
              {modal.type === 'event' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100/50 p-3 rounded-xl border border-slate-200/50 text-sm">
                  {modal.data.date && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>{formatDate(modal.data.date)}{modal.data.time ? ` at ${modal.data.time}` : ''}</span>
                    </div>
                  )}
                  {modal.data.location && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      <span>{modal.data.location}</span>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {modal.data.content || modal.data.description}
              </p>
              
              <div className="pt-4 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-500">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {modal.data.adminName ? modal.data.adminName[0].toUpperCase() : 'A'}
                  </div>
                  <span className="font-semibold text-slate-600">{modal.data.adminName}</span>
                  <span>•</span>
                  <span>{modal.data.createdAt ? new Date(modal.data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                </div>
                
                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    className={`action-btn px-4 py-2 border border-slate-200 rounded-xl hover:border-rose-500/50 ${
                      isLiked(modal.data._id) ? 'liked' : 'text-slate-500'
                    }`}
                    onClick={() => handleLike(modal.data, modal.type)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>{modal.data.likes || 0} Likes</span>
                  </button>
                  
                  <button 
                    className="action-btn text-slate-500 hover:text-purple-400 border border-slate-200 px-3.5 py-2 rounded-xl transition" 
                    onClick={() => downloadPost(modal.data)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button 
                    className="action-btn text-slate-500 hover:text-green-400 border border-slate-200 px-3.5 py-2 rounded-xl transition" 
                    onClick={() => sharePost(modal.data)}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {role === 'user' && (
                    <button 
                      className={`action-btn border border-slate-200 px-3.5 py-2 rounded-xl transition ${
                        isPostSaved(modal.data._id, modal.type) ? 'text-amber-500 hover:text-amber-600' : 'text-slate-500 hover:text-amber-400'
                      }`}
                      onClick={(e) => handleToggleSavePost(modal.data._id, modal.type, e)}
                      title={isPostSaved(modal.data._id, modal.type) ? "Unsave Post" : "Save Post"}
                    >
                      {isPostSaved(modal.data._id, modal.type) ? (
                        <BookmarkCheck className="w-4 h-4 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t border-slate-200/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  Comments
                  <span className="text-[10px] font-normal bg-purple-900/10 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                    {modalComments.length}
                  </span>
                </h3>

                {/* Add Comment Input Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="input-field text-xs flex-grow"
                    disabled={commentSending}
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim() || commentSending}
                    className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center justify-center flex-shrink-0"
                  >
                    {commentSending ? 'Post...' : 'Post'}
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modalComments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to start the conversation!</p>
                  ) : (
                    modalComments.map(c => (
                      <div key={c._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">{c.authorName}</span>
                          <span>{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-normal">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Copy Toast */}
      {showToast && (
        <div className="toast-copy shadow-lg bg-white text-purple-800 border border-purple-200 flex items-center gap-2">
          <span>🔗 Link copied to clipboard!</span>
        </div>
      )}

      <footer className="border-t border-slate-200/50 mt-20 pt-10 pb-20 text-center text-slate-500 text-xs sm:text-sm bg-slate-100/50 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/10">
            <Zap className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="font-semibold text-slate-500">EventHub</span>
        </div>
        <p className="font-medium text-slate-600">EETIRP PVT LTD © {new Date().getFullYear()}</p>
        <p>
          Contact Support: <a href="mailto:eetirpltd@gmail.com" className="text-purple-600 hover:text-purple-800 transition font-medium">eetirpltd@gmail.com</a>
        </p>
      </footer>

      {/* Profile Modal */}
      {profileOpen && user && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setProfileOpen(false)}
        >
          <div 
            className="glass rounded-2xl max-w-md w-full shadow-2xl relative border border-purple-200 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setProfileOpen(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Profile Content */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3 group">
                  <div 
                    onClick={() => profileFileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-lg cursor-pointer overflow-hidden border-2 border-white transition group-hover:opacity-90 relative"
                  >
                    {profileForm.avatar ? (
                      <img src={profileForm.avatar} alt="Profile photo" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                    )}
                    {profileUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-750 transition"
                    title="Change profile photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    ref={profileFileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="hidden"
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
                  {role === 'admin' ? 'System Administrator' : 'Community Member'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-100/50 p-4 rounded-xl border border-slate-200/50 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Posts Liked</p>
                  <p className="text-xl font-bold text-slate-800">{Object.keys(likedPosts || {}).length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Member Since</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1.5">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'July 2026'}
                  </p>
                </div>
              </div>

              {/* Tab Selector */}
              {role === 'user' && (
                <div className="flex border-b border-slate-200 gap-4 mb-4">
                  <button 
                    type="button"
                    onClick={() => setProfileTab('saved')}
                    className={`flex-1 pb-2.5 text-sm font-bold transition border-b-2 text-center ${
                      profileTab === 'saved' 
                        ? 'border-purple-600 text-purple-655' 
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Saved Posts
                  </button>
                  <button 
                    type="button"
                    onClick={() => setProfileTab('details')}
                    className={`flex-1 pb-2.5 text-sm font-bold transition border-b-2 text-center ${
                      profileTab === 'details' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Edit Details
                  </button>
                </div>
              )}

              {/* Edit Form */}
              {(role !== 'user' || profileTab === 'details') && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileMsg.show && (
                  <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                    profileMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {profileMsg.msg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    className="input-field text-sm"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="input-field bg-slate-100 text-slate-500 text-sm border-slate-200 cursor-not-allowed"
                    title="Email cannot be changed"
                  />
                </div>

                {role === 'user' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Phone Number {user.phone ? '(Locked)' : ''}
                    </label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={profileForm.phone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        disabled={!!user.phone}
                        className={`input-field text-sm ${
                          user.phone 
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed !pr-10' 
                            : ''
                        }`}
                        placeholder="Enter your phone number"
                        required
                      />
                      {!!user.phone && (
                        <Lock className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      )}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={profileUpdating || profileUploading}
                  className="btn-primary w-full justify-center flex items-center gap-2 mt-2"
                >
                  {profileUpdating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Updating...
                    </>
                  ) : 'Save Changes'}
                </button>
              </form>
              )}

              {/* Saved Items lists */}
              {role === 'user' && profileTab === 'saved' && (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {/* Saved Sub-Tabs */}
                  <div className="flex border-b border-slate-100 mb-3">
                    <button
                      type="button"
                      onClick={() => setSavedSubTab('events')}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition ${
                        savedSubTab === 'events' ? 'border-b-2 border-purple-550 text-purple-650' : 'text-slate-400 hover:text-slate-655'
                      }`}
                    >
                      Events ({user.savedEvents?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSavedSubTab('news')}
                      className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition ${
                        savedSubTab === 'news' ? 'border-b-2 border-pink-550 text-pink-650' : 'text-slate-400 hover:text-slate-655'
                      }`}
                    >
                      News ({user.savedNews?.length || 0})
                    </button>
                  </div>

                  {savedSubTab === 'events' ? (
                    <div className="space-y-2.5">
                      {(!user.savedEvents || user.savedEvents.length === 0) ? (
                        <p className="text-center text-xs text-slate-400 py-6">No saved events yet.</p>
                      ) : (
                        user.savedEvents.map(ev => {
                          const evId = ev._id || ev.id;
                          return (
                            <div 
                              key={evId} 
                              onClick={() => { setProfileOpen(false); openModal(ev, 'event'); }}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-150 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {ev.image ? (
                                  <img src={ev.image} alt={ev.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-purple-650" />
                                  </div>
                                )}
                                <div className="text-left overflow-hidden">
                                  <p className="text-xs font-bold text-slate-800 truncate">{ev.title}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ev.location || 'Virtual'}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleToggleSavePost(evId, 'event', e)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200/50 rounded-lg transition flex-shrink-0"
                                title="Unsave"
                              >
                                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(!user.savedNews || user.savedNews.length === 0) ? (
                        <p className="text-center text-xs text-slate-400 py-6">No saved articles yet.</p>
                      ) : (
                        user.savedNews.map(ns => {
                          const nsId = ns._id || ns.id;
                          return (
                            <div 
                              key={nsId} 
                              onClick={() => { setProfileOpen(false); openModal(ns, 'news'); }}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-pink-50/50 border border-slate-150 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {ns.image ? (
                                  <img src={ns.image} alt={ns.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                                    <Newspaper className="w-5 h-5 text-pink-650" />
                                  </div>
                                )}
                                <div className="text-left overflow-hidden">
                                  <p className="text-xs font-bold text-slate-800 truncate">{ns.title}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ns.category || 'General'}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleToggleSavePost(nsId, 'news', e)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200/50 rounded-lg transition flex-shrink-0"
                                title="Unsave"
                              >
                                <BookmarkCheck className="w-4 h-4 text-amber-500" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Change Password Link */}
              {(role !== 'user' || profileTab === 'details') && (
                <div className="pt-4 text-center border-t border-slate-200/60">
                  <Link 
                    href="/change-password"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-850 font-semibold transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Change Account Password
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

