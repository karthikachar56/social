'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  LayoutDashboard
} from 'lucide-react';

export default function Home() {
  const { user, role, token, loading: authLoading, logout, isLiked, toggleLike } = useAuth();

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

  useEffect(() => {
    fetchData();
  }, []);

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
    const url = window.location.origin + '/' + (modal.type || 'events') + '/' + item._id;
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

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#E2E8F0] font-sans selection:bg-purple-600/40">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 glass border-b border-[#2A2A4A]/50">
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
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right hidden md:block">
                      <span className="text-xs text-slate-400">Logged in as</span>
                      <span className="text-sm font-semibold text-purple-200">{user.name}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    
                    {role === 'admin' ? (
                      <Link href="/admin/dashboard" className="px-3.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/30 text-xs font-semibold text-purple-300 transition flex items-center gap-1">
                        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                      </Link>
                    ) : null}

                    <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition" title="Sign Out">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="px-3.5 py-1.5 rounded-lg border border-[#2A2A4A] text-xs font-semibold hover:border-purple-600 transition text-slate-300 hover:text-white">
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
          <span className="badge badge-event mb-4 uppercase tracking-widest bg-purple-900/30 border-purple-700/40 text-purple-300 px-3 py-1 text-[10px] rounded-full">Live Community Platform</span>
          <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-tight">
            Discover <span className="gradient-text">Events</span><br />& Latest <span class="gradient-text">News</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">Your central hub for everything happening. Stay informed with events and updates posted by our team of admins.</p>
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-slate-400">
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
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#16162A] border border-[#2A2A4A] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-[#16162A] rounded-xl p-1.5 w-fit mx-auto border border-[#2A2A4A]">
          <button 
            onClick={() => setActiveTab('events')} 
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === 'events' ? 'tab-active shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> Events
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'events' ? 'bg-white/20 text-white' : 'bg-[#2A2A4A] text-slate-400'
            }`}>
              {filteredEvents.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('news')} 
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
              activeTab === 'news' ? 'tab-active shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4" /> News
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'news' ? 'bg-white/20 text-white' : 'bg-[#2A2A4A] text-slate-400'
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
                    : 'bg-[#16162A] text-slate-400 border-[#2A2A4A] hover:border-purple-600/50 hover:text-white'
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
                    : 'bg-[#16162A] text-slate-400 border-[#2A2A4A] hover:border-purple-600/50 hover:text-white'
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
              <div key={i} className="rounded-2xl overflow-hidden border border-[#2A2A4A]">
                <div className="skeleton h-48 w-full"></div>
                <div className="p-5 space-y-3 bg-[#16162A]/50">
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
              <div className="text-center py-20 bg-[#16162A]/20 border border-[#2A2A4A]/50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#16162A] border border-[#2A2A4A] flex items-center justify-center mx-auto mb-4">
                  <CalendarX className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No events found</p>
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
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-pink-600/10 overflow-hidden">
                      {ev.image ? (
                        <img src={ev.image} alt={ev.title} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-purple-600/30" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="badge badge-event uppercase text-[9px] px-2 py-0.5 rounded-full font-bold">Event</span>
                        {ev.category && <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full font-bold">{ev.category}</span>}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h2 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 hover:text-purple-300 transition-colors">
                        {ev.title}
                      </h2>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">
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
                      <div className="mt-4 pt-4 border-t border-[#2A2A4A]/60 flex items-center justify-between">
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
                          
                          {/* Download */}
                          <button className="action-btn text-slate-500 hover:text-purple-400" onClick={(e) => downloadPost(ev, e)} title="Download details">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Share */}
                          <button className="action-btn text-slate-500 hover:text-green-400" onClick={(e) => sharePost(ev, e)} title="Share link">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
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
              <div className="text-center py-20 bg-[#16162A]/20 border border-[#2A2A4A]/50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#16162A] border border-[#2A2A4A] flex items-center justify-center mx-auto mb-4">
                  <Newspaper className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No news articles yet</p>
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
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="badge badge-news uppercase text-[9px] px-2 py-0.5 rounded-full font-bold">News</span>
                        {item.category && <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full font-bold">{item.category}</span>}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h2 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 hover:text-pink-300 transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">
                        {item.summary || item.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-auto">
                        <User className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>{item.adminName}</span>
                      </div>
                      
                      {/* Action Bar */}
                      <div className="mt-4 pt-4 border-t border-[#2A2A4A]/60 flex items-center justify-between">
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
                          
                          {/* Download */}
                          <button className="action-btn text-slate-500 hover:text-purple-400" onClick={(e) => downloadPost(item, e)} title="Download details">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Share */}
                          <button className="action-btn text-slate-500 hover:text-green-400" onClick={(e) => sharePost(item, e)} title="Share link">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
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
            className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-purple-500/20"
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
                    className="badge text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-900/20 text-indigo-300 border border-indigo-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {modal.data.title}
              </h2>
              
              {/* Event details */}
              {modal.type === 'event' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#16162A]/40 p-3 rounded-xl border border-[#2A2A4A]/40 text-sm">
                  {modal.data.date && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>{formatDate(modal.data.date)}{modal.data.time ? ` at ${modal.data.time}` : ''}</span>
                    </div>
                  )}
                  {modal.data.location && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      <span>{modal.data.location}</span>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {modal.data.content || modal.data.description}
              </p>
              
              <div className="pt-4 border-t border-[#2A2A4A]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-500">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {modal.data.adminName ? modal.data.adminName[0].toUpperCase() : 'A'}
                  </div>
                  <span className="font-semibold text-slate-300">{modal.data.adminName}</span>
                  <span>•</span>
                  <span>{modal.data.createdAt ? new Date(modal.data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                </div>
                
                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    className={`action-btn px-4 py-2 border border-[#2A2A4A] rounded-xl hover:border-rose-500/50 ${
                      isLiked(modal.data._id) ? 'liked' : 'text-slate-400'
                    }`}
                    onClick={() => handleLike(modal.data, modal.type)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>{modal.data.likes || 0} Likes</span>
                  </button>
                  
                  <button 
                    className="action-btn text-slate-400 hover:text-purple-400 border border-[#2A2A4A] px-3.5 py-2 rounded-xl transition" 
                    onClick={() => downloadPost(modal.data)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button 
                    className="action-btn text-slate-400 hover:text-green-400 border border-[#2A2A4A] px-3.5 py-2 rounded-xl transition" 
                    onClick={() => sharePost(modal.data)}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Link to Full Page with Comments */}
              <div className="pt-2 text-center">
                <Link 
                  href={`/${modal.type === 'event' ? 'events' : 'news'}/${modal.data._id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition"
                >
                  Go to details & view comments <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Toast */}
      {showToast && (
        <div className="toast-copy shadow-lg bg-[#16162A] text-purple-300 border border-purple-500/30 flex items-center gap-2">
          <span>🔗 Link copied to clipboard!</span>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#2A2A4A]/50 mt-20 py-10 text-center text-slate-500 text-xs sm:text-sm bg-[#16162A]/10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/10">
            <Zap className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="font-semibold text-slate-400">EventHub</span>
        </div>
        <p>© 2024 EventHub. Powered by our team of admins.</p>
        {role === 'admin' ? (
          <p className="mt-2 text-[10px] text-slate-600">
            Authenticated Admin Mode Active
          </p>
        ) : null}
      </footer>

    </div>
  );
}
