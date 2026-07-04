'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Zap, 
  Calendar, 
  MapPin, 
  User, 
  ArrowLeft, 
  Download, 
  Share2, 
  Trash2, 
  Send,
  MessageSquare
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading, isLiked, toggleLike } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      fetchComments();
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [authLoading, token, router]);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        setLikesCount(data.likes || 0);
      } else {
        router.push('/');
      }
    } catch (e) {
      console.error(e);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!event) return;
    const updatedLikes = await toggleLike(event, 'event');
    setLikesCount(updatedLikes);
  };

  const downloadEvent = () => {
    if (!event) return;
    if (event.image) {
      const a = document.createElement('a');
      a.href = event.image;
      a.download = event.title.replace(/\s+/g, '_') + '_image';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `${event.title}\n\n${event.description}\n\nDate: ${event.date} ${event.time || ''}\nLocation: ${event.location || ''}\n\nPosted by: ${event.adminName}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = event.title.replace(/\s+/g, '_') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const shareEvent = async () => {
    if (!event) return;
    const url = window.location.href;
    const shareData = {
      title: event.title,
      text: event.description.slice(0, 120) + '...',
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

  const postComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentContent,
          postType: 'event'
        })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setCommentContent('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (authLoading || !token) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20 animate-pulse">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase animate-pulse">Loading EventHub...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A]">
        <svg className="w-8 h-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-[#E2E8F0]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 glass border-b border-[#2A2A4A]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold gradient-text">EventHub</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition group mb-2">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to all posts
        </Link>

        {/* HERO EVENT CARD */}
        <article className="glass rounded-2xl overflow-hidden shadow-2xl border border-purple-500/10">
          <div className="relative h-64 sm:h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/10">
            {event.image ? (
              <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-purple-600/30" />
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="badge badge-event uppercase text-[10px] px-2.5 py-1 rounded-full font-bold">Event</span>
              {event.category && <span className="badge badge-cat text-[10px] px-2.5 py-1 rounded-full font-bold">{event.category}</span>}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap gap-2">
              {(event.tags || []).map(tag => (
                <span key={tag} className="badge text-[10px] px-2.5 py-1 rounded-full font-bold bg-indigo-900/20 text-indigo-300 border border-indigo-500/20">
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>

            {/* Event Specific Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#16162A]/40 p-4 rounded-xl border border-[#2A2A4A]/50 text-sm">
              {event.date && (
                <div className="flex items-center gap-3 text-slate-300">
                  <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Date & Time</p>
                    <p className="font-medium">{formatDate(event.date)}{event.time ? ` at ${event.time}` : ''}</p>
                  </div>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed whitespace-pre-line text-base sm:text-lg">
              {event.description}
            </p>

            <div className="pt-6 border-t border-[#2A2A4A]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {event.adminName ? event.adminName[0].toUpperCase() : 'A'}
                </div>
                <div>
                  <p className="font-bold text-slate-300">{event.adminName}</p>
                  <p className="text-[10px] text-slate-500">{timeAgo(event.createdAt)}</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2">
                <button 
                  className={`action-btn px-4 py-2 border border-[#2A2A4A] rounded-xl hover:border-rose-500/50 ${
                    isLiked(event._id) ? 'liked' : 'text-slate-400'
                  }`}
                  onClick={handleLike}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span className="font-semibold">{likesCount} Likes</span>
                </button>

                <button className="action-btn text-slate-400 hover:text-purple-400 border border-[#2A2A4A] px-3.5 py-2 rounded-xl" onClick={downloadEvent} title="Download text info">
                  <Download className="w-4 h-4" />
                </button>

                <button className="action-btn text-slate-400 hover:text-green-400 border border-[#2A2A4A] px-3.5 py-2 rounded-xl" onClick={shareEvent} title="Share Link">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* COMMENTS SECTION */}
        <section className="glass rounded-2xl p-6 sm:p-8 space-y-6 border border-purple-500/10 shadow-xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Comments ({comments.length})
          </h3>

          {/* New Comment Input */}
          {user ? (
            <form onSubmit={postComment} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="input-field pr-12 text-sm"
                  required
                />
                <button 
                  type="submit" 
                  disabled={submittingComment || !commentContent.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/40 transition disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-[#16162A]/40 border border-[#2A2A4A]/50 text-center text-sm text-slate-400">
              <Link href="/login" className="text-purple-400 hover:underline font-semibold">Sign in</Link> or <Link href="/register" className="text-purple-400 hover:underline font-semibold">register</Link> to post comments.
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 divide-y divide-[#2A2A4A]/60">
            {commentsLoading ? (
              <div className="py-8 text-center">
                <svg className="w-6 h-6 animate-spin text-purple-400 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : comments.length === 0 ? (
              <p className="py-8 text-center text-slate-500 text-sm">No comments yet. Be the first to start the conversation!</p>
            ) : (
              comments.map((comment, index) => (
                <div key={comment._id} className={`flex gap-3 pt-4 ${index === 0 ? 'pt-0 border-0' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-[#2A2A4A] flex-shrink-0 flex items-center justify-center text-slate-300 text-xs font-semibold uppercase">
                    {comment.authorName ? comment.authorName[0] : 'U'}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-200">{comment.authorName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-medium">{timeAgo(comment.createdAt)}</span>
                        {user && (user.role === 'admin' || user.id === comment.authorId) && (
                          <button 
                            onClick={() => deleteComment(comment._id)} 
                            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mt-1 whitespace-pre-line leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Copy Toast */}
      {showToast && (
        <div className="toast-copy shadow-lg bg-[#16162A] text-purple-300 border border-purple-500/30 flex items-center gap-2">
          <span>🔗 Link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}
