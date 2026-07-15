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
  MapPin,
  Search,
  MessageSquare,
  Send,
  Camera,
  Lock,
  Download,
  Share2
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, role, token, loading: authLoading, logout, updateUser, isLiked, toggleLike } = useAuth();

  // Navigation and data states
  const [page, setPage] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [postsFilter, setPostsFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Feed preview states
  const [feedTab, setFeedTab] = useState('events'); // 'events' or 'news'
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [feedEventCategory, setFeedEventCategory] = useState('all');
  const [feedNewsCategory, setFeedNewsCategory] = useState('all');
  const [feedModal, setFeedModal] = useState({ open: false, type: '', data: {} });
  const [feedModalComments, setFeedModalComments] = useState([]);
  const [feedCommentInput, setFeedCommentInput] = useState('');
  const [feedCommentSending, setFeedCommentSending] = useState(false);

  // Profile edit states
  const [profileForm, setProfileForm] = useState({ name: '', avatar: '', phone: '', otherDetails: '' });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ show: false, msg: '', type: 'success' });
  const profileFileInputRef = useRef(null);

  // Initialize profile form
  useEffect(() => {
    if (user && role === 'admin') {
      setProfileForm({
        name: user.name || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        otherDetails: user.otherDetails || ''
      });
    }
  }, [user, role]);

  const handleProfileFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB.', 'error');
      return;
    }

    setProfileUploading(true);
    setProfileMsg({ show: false, msg: '', type: 'success' });

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: reader.result })
          });
          const data = await res.json();
          if (res.ok) {
            setProfileForm(prev => ({ ...prev, avatar: data.url }));
            setProfileMsg({ show: true, msg: 'Photo uploaded successfully! Save changes to apply.', type: 'success' });
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

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [activeRecipient, setActiveRecipient] = useState(null); // null means group chat
  const [unreadChats, setUnreadChats] = useState([]);
  const chatBottomRef = useRef(null);

  // Chat Polling Effect
  useEffect(() => {
    let interval;
    if (page === 'chat' && token) {
      fetchChatMessages();
      interval = setInterval(fetchChatMessages, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [page, token, activeRecipient]);

  // Global Unread Chats Polling Effect
  useEffect(() => {
    let interval;
    if (token && role === 'admin') {
      fetchUnreadChats();
      interval = setInterval(fetchUnreadChats, 6000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token, role, page, activeRecipient]);

  // Clear messages on switching chat targets
  useEffect(() => {
    setChatMessages([]);
  }, [activeRecipient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (page === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, page]);

  // Load feed comments when feed modal opens
  useEffect(() => {
    if (feedModal.open && feedModal.data?._id) {
      fetchFeedComments(feedModal.data._id);
    }
  }, [feedModal.open, feedModal.data?._id]);

  const fetchFeedComments = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setFeedModalComments(data);
      }
    } catch (e) {
      console.error('Fetch feed comments error:', e);
    }
  };

  const handleAddFeedComment = async (e) => {
    e.preventDefault();
    if (!feedCommentInput.trim() || feedCommentSending) return;

    const content = feedCommentInput.trim();
    setFeedCommentInput('');
    setFeedCommentSending(true);

    try {
      const res = await fetch(`/api/posts/${feedModal.data._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          postType: feedModal.type
        })
      });

      if (res.ok) {
        const newComm = await res.json();
        setFeedModalComments(prev => [newComm, ...prev]);
        
        // Also update local comment count
        if (feedModal.type === 'event') {
          setEvents(events.map(ev => ev._id === feedModal.data._id ? { ...ev, commentsCount: (ev.commentsCount || 0) + 1 } : ev));
        } else {
          setNews(news.map(nw => nw._id === feedModal.data._id ? { ...nw, commentsCount: (nw.commentsCount || 0) + 1 } : nw));
        }
      }
    } catch (e) {
      console.error('Error posting comment:', e);
    } finally {
      setFeedCommentSending(false);
    }
  };

  const handleFeedDownload = (item, e) => {
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

  const handleFeedShare = async (item, e) => {
    if (e) e.stopPropagation();
    const itemType = item.date ? 'event' : 'news';
    fetch(`/api/posts/${item._id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'share', postType: itemType })
    }).catch(err => console.error('Track share error:', err));

    const url = window.location.origin + '/' + (feedModal.type || itemType) + '/' + item._id;
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
        showToast('🔗 Link copied to clipboard!', 'success');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchUnreadChats = async () => {
    try {
      const res = await fetch('/api/admin/chat/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadChats(data);
      }
    } catch (e) {
      console.error('Fetch unread chats error:', e);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const targetId = activeRecipient ? activeRecipient._id : 'group';
      const res = await fetch(`/api/admin/chat?recipientId=${targetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
        // Instantly refresh unread counts since fetching marked messages as read
        fetchUnreadChats();
      }
    } catch (e) {
      console.error('Fetch chat error:', e);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const msgText = chatInput.trim();
    setChatInput('');
    setChatSending(true);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: msgText,
          recipientId: activeRecipient ? activeRecipient._id : null,
          recipientName: activeRecipient ? activeRecipient.name : null
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages(prev => [...prev, newMsg]);
      } else {
        showToast('Failed to send message.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error.', 'error');
    } finally {
      setChatSending(false);
    }
  };

  // Submit states
  const [submitLoading, setSubmitLoading] = useState({ event: false, news: false });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '', loading: false });
  const [editModal, setEditModal] = useState({ open: false, type: '', id: null, loading: false });
  const [editForm, setEditForm] = useState({});

  // Expanded comments for post manager
  const [expandedComments, setExpandedComments] = useState({}); 
  const [loadingComments, setLoadingComments] = useState({});

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
      const [evRes, nwRes, usrRes, admRes, unrRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/news'),
        fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/admin/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/admin/chat/unread', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (evRes.ok && nwRes.ok) {
        const evData = await evRes.json();
        const nwData = await nwRes.json();
        
        setEvents(evData);
        setNews(nwData);
      }

      if (usrRes && usrRes.ok) {
        const usrData = await usrRes.json();
        setUsers(usrData);
      }

      if (admRes && admRes.ok) {
        const admData = await admRes.json();
        setAdmins(admData);
      }

      if (unrRes && unrRes.ok) {
        const unrData = await unrRes.json();
        setUnreadChats(unrData);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleBan = async (userToUpdate) => {
    const newBannedStatus = !userToUpdate.banned;
    try {
      const res = await fetch(`/api/admin/users/${userToUpdate._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ banned: newBannedStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userToUpdate._id ? data : u));
        showToast(
          `User "${userToUpdate.name}" has been ${newBannedStatus ? 'suspended' : 'reactivated'} successfully!`, 
          newBannedStatus ? 'error' : 'success'
        );
      } else {
        showToast(data.error || 'Failed to update user status.', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!confirm(`Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
        showToast(`User "${userToDelete.name}" has been deleted successfully!`, 'success');
      } else {
        showToast(data.error || 'Failed to delete user.', 'error');
      }
    } catch {
      showToast('Network error. Try again.', 'error');
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
    analytics: 'Analytics',
    'add-event': 'Create Event',
    'add-news': 'Publish News',
    'my-posts': 'All Posts',
    'users': 'Manage Users',
    'chat': 'Admin Chat',
    'profile': 'Edit Profile'
  }[page] || '';

  const pageSubtitle = {
    dashboard: `Browse published posts as users see them`,
    analytics: `Detailed platform activity statistics`,
    'add-event': 'Fill in the details below',
    'add-news': 'Write and publish your article',
    'my-posts': 'Manage all events and news',
    'users': 'Suspend or reactivate user accounts',
    'chat': 'Internal secure administrator discussion',
    'profile': 'Update your administrator information'
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

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });
      return;
    }

    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setExpandedComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (e) {
      console.error('Fetch comments error:', e);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c._id !== commentId)
        }));
        
        // Decrement local commentsCount
        setEvents(prev => prev.map(ev => ev._id === postId ? { ...ev, commentsCount: Math.max(0, (ev.commentsCount || 1) - 1) } : ev));
        setNews(prev => prev.map(nw => nw._id === postId ? { ...nw, commentsCount: Math.max(0, (nw.commentsCount || 1) - 1) } : nw));
        
        showToast('Comment deleted successfully!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete comment.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  };

  const handleEditClick = (type, item) => {
    setEditModal({ open: true, type, id: item._id, loading: false });
    if (type === 'event') {
      setEditForm({
        title: item.title || '',
        description: item.description || '',
        date: item.date || '',
        time: item.time || '',
        location: item.location || '',
        category: item.category || 'General',
        image: item.image || '',
        tags: item.tags || []
      });
    } else {
      setEditForm({
        title: item.title || '',
        content: item.content || '',
        summary: item.summary || '',
        category: item.category || 'General',
        image: item.image || '',
        tags: item.tags || []
      });
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditModal(prev => ({ ...prev, loading: true }));
    const { type, id } = editModal;
    
    try {
      const url = type === 'event' ? `/api/events/${id}` : `/api/news/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (type === 'event') {
          setEvents(prev => prev.map(ev => ev._id === id ? { ...ev, ...data } : ev));
        } else {
          setNews(prev => prev.map(nw => nw._id === id ? { ...nw, ...data } : nw));
        }
        showToast('Updated successfully!', 'success');
        setEditModal({ open: false, type: '', id: null, loading: false });
      } else {
        showToast(data.error || 'Failed to update post.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    } finally {
      setEditModal(prev => ({ ...prev, loading: false }));
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
    <div className="h-screen flex bg-slate-50 text-slate-900 overflow-hidden relative">
      
      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div onClick={() => setMobileMenu(false)} className="fixed inset-0 bg-black/60 z-40 md:hidden"></div>
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar w-64 flex-shrink-0 h-screen overflow-y-auto flex flex-col p-4 fixed md:sticky top-0 left-0 z-50 transform ${
        mobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } transition-transform duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/10">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-slate-900">EventHub</span>
          <span className="text-xs text-slate-500 ml-auto bg-white px-2 py-0.5 border border-slate-200 rounded-full">Admin</span>
        </div>

        {/* Admin Info */}
        <div className="mb-6 px-3 py-3 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/5 border border-purple-100">
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
          <Link href="/" className="nav-item w-full mb-3 border border-slate-200 hover:border-purple-600/50 text-slate-500 hover:text-purple-600 transition flex items-center">
            <ArrowLeft className="w-4 h-4 flex-shrink-0" /> Back to Site
          </Link>
          <div className="border-t border-slate-200 mb-3"></div>
          
          <button onClick={() => { setPage('dashboard'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> Dashboard
          </button>

          <button onClick={() => { setPage('analytics'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'analytics' ? 'active' : ''}`}>
            <Activity className="w-4 h-4 flex-shrink-0" /> Analytics
          </button>
          
          <button onClick={() => { setPage('add-event'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'add-event' ? 'active' : ''}`}>
            <CalendarPlus className="w-4 h-4 flex-shrink-0" /> Add Event
          </button>
          
          <button onClick={() => { setPage('add-news'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'add-news' ? 'active' : ''}`}>
            <FilePlus className="w-4 h-4 flex-shrink-0" /> Add News
          </button>
          
          <button onClick={() => { setPage('my-posts'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'my-posts' ? 'active' : ''}`}>
            <List className="w-4 h-4 flex-shrink-0" /> All Posts
            <span className="ml-auto text-[10px] bg-purple-900/30 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
              {events.length + news.length}
            </span>
          </button>

          <button onClick={() => { setPage('users'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'users' ? 'active' : ''}`}>
            <User className="w-4 h-4 flex-shrink-0" /> Manage Users
            <span className="ml-auto text-[10px] bg-indigo-900/10 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </button>

          <button onClick={() => { setPage('chat'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'chat' ? 'active' : ''}`}>
            <MessageSquare className="w-4 h-4 flex-shrink-0" /> Admin Chat
            {new Set(unreadChats.map(m => m.senderId)).size > 0 && (
              <span className="ml-auto text-[10px] bg-red-600 text-white font-bold border border-red-500 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {new Set(unreadChats.map(m => m.senderId)).size}
              </span>
            )}
          </button>

          <button onClick={() => { setPage('profile'); setMobileMenu(false); }} className={`nav-item w-full ${page === 'profile' ? 'active' : ''}`}>
            <User className="w-4 h-4 flex-shrink-0" /> Edit Profile
          </button>
        </nav>

        {/* APK Download Link */}
        <div className="border-t border-slate-200/50 pt-3 mt-auto">
          <a 
            href="/eventhub-admin-release.apk" 
            download="eventhub-admin-release.apk"
            className="nav-item w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold transition flex items-center justify-center gap-2 py-2.5 rounded-xl shadow-md shadow-purple-500/10 hover:shadow-purple-500/20"
          >
            <Download className="w-4 h-4 flex-shrink-0 text-white" /> Download Admin App (.apk)
          </a>
        </div>

        {/* Logout */}
        <button onClick={logout} className="nav-item w-full mt-3 border border-red-900/30 text-red-400 hover:bg-red-950/10 hover:text-red-300">
          <LogOut className="w-4 h-4 flex-shrink-0" /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-grow h-screen overflow-y-auto flex flex-col min-w-0 w-full pl-0 md:pl-0">
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-800 transition">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 text-lg">{pageTitle}</h1>
            <p className="text-xs text-slate-500">{pageSubtitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-500">Today</div>
              <div className="text-xs font-semibold text-slate-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div 
              onClick={() => setPage('profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow shadow-purple-500/20 flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-90 transition"
              title="Edit Profile"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name ? user.name[0].toUpperCase() : 'A'}</span>
              )}
            </div>
            
            <button 
              onClick={logout} 
              className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition md:hidden flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* ======================== DASHBOARD (USER FEED VIEW) ======================== */}
          {page === 'dashboard' && (
            <div className="space-y-6">
              {/* Search + Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search posts..." 
                    value={feedSearchQuery}
                    onChange={(e) => setFeedSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-105 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setFeedTab('events')} 
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                      feedTab === 'events' ? 'bg-white text-purple-650 shadow-sm' : 'text-slate-500 hover:text-purple-650'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Events
                  </button>
                  <button 
                    onClick={() => setFeedTab('news')} 
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                      feedTab === 'news' ? 'bg-white text-pink-650 shadow-sm' : 'text-slate-500 hover:text-pink-650'
                    }`}
                  >
                    <Newspaper className="w-3.5 h-3.5" /> News
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              {feedTab === 'events' ? (
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {['all', ...new Set(events.map(e => e.category).filter(Boolean))].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setFeedEventCategory(cat)} 
                      className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition border ${
                        feedEventCategory === cat 
                          ? 'bg-purple-600 border-purple-600 text-white' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-purple-600/50 hover:text-purple-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {['all', ...new Set(news.map(n => n.category).filter(Boolean))].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setFeedNewsCategory(cat)} 
                      className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition border ${
                        feedNewsCategory === cat 
                          ? 'bg-purple-600 border-purple-600 text-white' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-purple-600/50 hover:text-purple-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Feed Grid */}
              {feedTab === 'events' ? (
                <div>
                  {events.filter(e => {
                    const q = feedSearchQuery.toLowerCase();
                    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
                    const matchCat = feedEventCategory === 'all' || e.category === feedEventCategory;
                    return matchSearch && matchCat;
                  }).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-xs font-semibold">No events found matching criteria</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events
                        .filter(e => {
                          const q = feedSearchQuery.toLowerCase();
                          const matchSearch = !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
                          const matchCat = feedEventCategory === 'all' || e.category === feedEventCategory;
                          return matchSearch && matchCat;
                        })
                        .map(ev => (
                          <article 
                            key={ev._id} 
                            className="glass rounded-2xl overflow-hidden card-hover cursor-pointer flex flex-col h-full shadow-md bg-white border border-slate-200"
                            onClick={() => setFeedModal({ open: true, type: 'event', data: ev })}
                          >
                            <div className="relative h-40 bg-slate-100 overflow-hidden">
                              {ev.image ? (
                                <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Calendar className="w-10 h-10 text-purple-600/20" />
                                </div>
                              )}
                              <span className="absolute top-3 left-3 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                Event
                              </span>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                              <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">{ev.category}</span>
                              <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1">{ev.title}</h3>
                              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">{ev.description}</p>
                              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                <span>🕒 {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span>👤 {ev.adminName}</span>
                              </div>
                            </div>
                          </article>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {news.filter(n => {
                    const q = feedSearchQuery.toLowerCase();
                    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
                    const matchCat = feedNewsCategory === 'all' || n.category === feedNewsCategory;
                    return matchSearch && matchCat;
                  }).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-xs font-semibold">No news articles found matching criteria</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {news
                        .filter(n => {
                          const q = feedSearchQuery.toLowerCase();
                          const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
                          const matchCat = feedNewsCategory === 'all' || n.category === feedNewsCategory;
                          return matchSearch && matchCat;
                        })
                        .map(item => (
                          <article 
                            key={item._id} 
                            className="glass rounded-2xl overflow-hidden card-hover cursor-pointer flex flex-col h-full shadow-md bg-white border border-slate-200"
                            onClick={() => setFeedModal({ open: true, type: 'news', data: item })}
                          >
                            <div className="relative h-40 bg-slate-100 overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Newspaper className="w-10 h-10 text-pink-600/20" />
                                </div>
                              )}
                              <span className="absolute top-3 left-3 bg-pink-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                News
                              </span>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                              <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-1">{item.category}</span>
                              <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1">{item.title}</h3>
                              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">{item.summary || item.content}</p>
                              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                <span>🕒 {timeAgo(item.createdAt)}</span>
                                <span>👤 {item.adminName}</span>
                              </div>
                            </div>
                          </article>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================== ANALYTICS (STATS VIEW) ======================== */}
          {page === 'analytics' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Total Events</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{events.length}</div>
                  <div className="text-[10px] text-slate-500 mt-1">all admins</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-pink-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Total News</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{news.length}</div>
                  <div className="text-[10px] text-slate-500 mt-1">all admins</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Your Events</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{yourEventsCount}</div>
                  <div className="text-[10px] text-slate-500 mt-1">posted by you</div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-500">Your News</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{yourNewsCount}</div>
                  <div className="text-[10px] text-slate-500 mt-1">posted by you</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setPage('add-event')} className="glass rounded-xl p-6 text-left hover:border-purple-500/40 transition group relative overflow-hidden bg-white border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition border border-purple-100">
                    <CalendarPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Create Event</h3>
                  <p className="text-sm text-slate-500">Add a new event visible to all users on the platform.</p>
                </button>

                <button onClick={() => setPage('add-news')} className="glass rounded-xl p-6 text-left hover:border-pink-500/40 transition group relative overflow-hidden bg-white border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mb-4 group-hover:bg-pink-100 transition border border-pink-100">
                    <FilePlus className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Publish News</h3>
                  <p className="text-sm text-slate-500">Share the latest news and updates with your community.</p>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="glass rounded-xl p-6 border border-purple-100 bg-white">
                <h2 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
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
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          item._type === 'event' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                        }`}>
                          {item._type === 'event' ? <Calendar className="w-4.5 h-4.5" /> : <Newspaper className="w-4.5 h-4.5" />}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>
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
              <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 mb-4 transition group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </button>
              
              <div className="glass rounded-2xl p-6 sm:p-8 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-200 flex items-center justify-center">
                    <CalendarPlus className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">Create New Event</h2>
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
                            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto mb-3">
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
                    
                    <button type="button" onClick={resetEventForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-slate-600 text-sm transition">
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
              <button onClick={() => setPage('dashboard')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 mb-4 transition group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
              </button>
              
              <div className="glass rounded-2xl p-6 sm:p-8 border border-pink-100">
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
                    
                    <button type="button" onClick={resetNewsForm} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-slate-600 text-sm transition">
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
                <div className="glass rounded-2xl overflow-hidden border border-purple-100">
                  <div className="p-5 border-b border-slate-200/50 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h2 className="font-bold text-slate-900">Events</h2>
                    <span className="text-xs bg-purple-900/30 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full ml-auto">
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
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {ev.image ? (
                                <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                              ) : (
                                <Calendar className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 text-sm truncate">{ev.title}</h3>
                                <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full">{ev.category}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">{ev.description}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(ev.date)}</span>
                                {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ev.adminName}</span>
                                <span>{timeAgo(ev.createdAt)}</span>
                              </div>

                              <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-500 border-t border-slate-200/40 pt-1.5 w-max">
                                <span className="text-rose-500">❤️ {ev.likes || 0} Likes</span>
                                <button 
                                  onClick={() => toggleComments(ev._id)}
                                  className="text-purple-500 hover:underline flex items-center gap-0.5 transition cursor-pointer"
                                >
                                  💬 {ev.commentsCount || 0} Comments
                                </button>
                                <span className="text-emerald-500">🔗 {ev.shares || 0} Shares</span>
                                <span className="text-blue-500">📥 {ev.downloads || 0} Downloads</span>
                              </div>

                              {loadingComments[ev._id] && (
                                <div className="mt-3 text-xs text-slate-500 animate-pulse">Loading comments...</div>
                              )}

                              {expandedComments[ev._id] && (
                                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3 max-h-64 overflow-y-auto">
                                  <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Comments List</h4>
                                  {expandedComments[ev._id].length === 0 ? (
                                    <p className="text-xs text-slate-500 py-2">No comments on this post yet.</p>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {expandedComments[ev._id].map(c => (
                                        <div key={c._id} className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start justify-between gap-3">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                              <span className="font-bold text-slate-700">{c.authorName}</span>
                                              <span>•</span>
                                              <span>{timeAgo(c.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-normal">{c.content}</p>
                                          </div>
                                          
                                          <button
                                            onClick={() => handleDeleteComment(ev._id, c._id)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition flex-shrink-0"
                                            title="Delete Comment"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 self-center">
                              <button 
                                onClick={() => handleEditClick('event', ev)} 
                                className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-900/10 hover:bg-purple-900/20 text-xs font-semibold text-purple-800 transition flex items-center gap-1 cursor-pointer"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('event', ev._id)} 
                                className="btn-danger"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* News Manager Grid */}
              {(postsFilter === 'all' || postsFilter === 'news') && (
                <div className="glass rounded-2xl overflow-hidden border border-pink-100">
                  <div className="p-5 border-b border-slate-200/50 flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-pink-400" />
                    <h2 className="font-bold text-slate-900">News Articles</h2>
                    <span className="text-xs bg-pink-900/30 text-pink-800 border border-pink-500/20 px-2.5 py-0.5 rounded-full ml-auto">
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
                                <h3 className="font-semibold text-slate-900 text-sm truncate">{item.title}</h3>
                                <span className="badge badge-cat text-[9px] px-2 py-0.5 rounded-full">{item.category}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1 mb-2">{item.summary || item.content}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.adminName}</span>
                                <span>{timeAgo(item.createdAt)}</span>
                              </div>

                              <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-500 border-t border-slate-200/40 pt-1.5 w-max">
                                <span className="text-rose-500">❤️ {item.likes || 0} Likes</span>
                                <button 
                                  onClick={() => toggleComments(item._id)}
                                  className="text-purple-500 hover:underline flex items-center gap-0.5 transition cursor-pointer"
                                >
                                  💬 {item.commentsCount || 0} Comments
                                </button>
                                <span className="text-emerald-500">🔗 {item.shares || 0} Shares</span>
                                <span className="text-blue-500">📥 {item.downloads || 0} Downloads</span>
                              </div>

                              {loadingComments[item._id] && (
                                <div className="mt-3 text-xs text-slate-500 animate-pulse">Loading comments...</div>
                              )}

                              {expandedComments[item._id] && (
                                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl space-y-3 max-h-64 overflow-y-auto">
                                  <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Comments List</h4>
                                  {expandedComments[item._id].length === 0 ? (
                                    <p className="text-xs text-slate-500 py-2">No comments on this post yet.</p>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {expandedComments[item._id].map(c => (
                                        <div key={c._id} className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start justify-between gap-3">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                              <span className="font-bold text-slate-700">{c.authorName}</span>
                                              <span>•</span>
                                              <span>{timeAgo(c.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-normal">{c.content}</p>
                                          </div>
                                          
                                          <button
                                            onClick={() => handleDeleteComment(item._id, c._id)}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition flex-shrink-0"
                                            title="Delete Comment"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 self-center">
                              <button 
                                onClick={() => handleEditClick('news', item)} 
                                className="px-3 py-1.5 rounded-lg border border-pink-200 bg-pink-900/10 hover:bg-pink-900/20 text-xs font-semibold text-pink-800 transition flex items-center gap-1 cursor-pointer"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('news', item._id)} 
                                className="btn-danger"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================== USER MANAGEMENT ======================== */}
          {page === 'users' && (
            <div className="space-y-6">
              <div className="glass rounded-2xl overflow-hidden border border-indigo-100">
                <div className="p-5 border-b border-slate-200/50 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  <h2 className="font-bold text-slate-900">Registered Users</h2>
                  <span className="text-xs bg-indigo-900/10 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full ml-auto">
                    {users.length} users total
                  </span>
                </div>

                {/* User Search Input */}
                <div className="p-4 border-b border-slate-200/50 bg-slate-50/50">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users by Gmail or Name..."
                      className="input-field !pl-10 text-sm"
                    />
                  </div>
                </div>

                {users.filter(u => {
                  const q = userSearchQuery.toLowerCase().trim();
                  return !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
                }).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No matching users found.</div>
                ) : (
                  <div className="divide-y divide-slate-200/50 bg-slate-100/50">
                    {users.filter(u => {
                      const q = userSearchQuery.toLowerCase().trim();
                      return !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
                    }).map(u => (
                      <div key={u._id} className="p-4 sm:p-5 hover:bg-white/[0.01] transition">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0 overflow-hidden">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{u.name ? u.name[0].toUpperCase() : 'U'}</span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-800 text-sm truncate">{u.name}</h3>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                                  u.banned 
                                    ? 'bg-red-50 text-red-800 border-red-200' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {u.banned ? 'Suspended' : 'Active'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                              <p className="text-[10px] text-slate-500 mt-1">Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleBan(u)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                u.banned
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                            >
                              {u.banned ? 'Reactivate' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================== ADMIN CHAT ======================== */}
          {page === 'chat' && (
            <div className="space-y-6">
              <div className="glass rounded-2xl overflow-hidden border border-purple-200 flex flex-col md:flex-row h-[75vh]">
                
                {/* Admins Sidebar Panel */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col min-w-0">
                  <div className="p-4 border-b border-slate-200 bg-white">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Conversations</h3>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {/* Public Group Chat Option */}
                    <button
                      type="button"
                      onClick={() => setActiveRecipient(null)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 border ${
                        activeRecipient === null
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/10'
                          : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        activeRecipient === null ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-600'
                      }`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className={`font-semibold text-xs truncate ${activeRecipient === null ? 'text-white' : 'text-slate-800'}`}>
                          Global Admin Chat
                        </p>
                        <p className={`text-[10px] truncate ${activeRecipient === null ? 'text-purple-200' : 'text-slate-500'}`}>
                          All administrators channel
                        </p>
                      </div>
                    </button>

                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Messages</p>
                    </div>

                    {admins
                      .filter(adm => adm._id !== (user?.id || user?._id))
                      .map(adm => {
                        const isActive = activeRecipient?._id === adm._id;
                        return (
                          <button
                            type="button"
                            key={adm._id}
                            onClick={() => setActiveRecipient(adm)}
                            className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 border ${
                              isActive
                                ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/10'
                                : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-200/50'
                            }`}
                          >
                             <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden ${
                               isActive ? 'bg-purple-700 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                             }`}>
                               {adm.avatar ? (
                                 <img src={adm.avatar} alt={adm.name} className="w-full h-full object-cover" />
                               ) : (
                                 <span>{adm.name ? adm.name[0].toUpperCase() : 'A'}</span>
                               )}
                             </div>
                            <div className="min-w-0 flex-grow">
                              <p className={`font-semibold text-xs truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {adm.name}
                              </p>
                              <p className={`text-[10px] truncate ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
                                {adm.email}
                              </p>
                            </div>
                            {unreadChats.filter(m => m.senderId === adm._id).length > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                isActive ? 'bg-white text-purple-600' : 'bg-red-600 text-white'
                              }`}>
                                {unreadChats.filter(m => m.senderId === adm._id).length}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-grow flex flex-col bg-white min-w-0 h-full">
                  {/* Active Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-purple-50/50 flex items-center gap-3 flex-shrink-0">
                     <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 font-bold overflow-hidden">
                       {activeRecipient ? (
                         activeRecipient.avatar ? (
                           <img src={activeRecipient.avatar} alt={activeRecipient.name} className="w-full h-full object-cover" />
                         ) : (
                           activeRecipient.name ? activeRecipient.name[0].toUpperCase() : 'A'
                         )
                       ) : (
                         <MessageSquare className="w-5 h-5" />
                       )}
                     </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-900 text-sm truncate">
                        {activeRecipient ? activeRecipient.name : 'Secure Internal Discussion'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {activeRecipient ? `Private Chat (${activeRecipient.email})` : 'This channel is restricted to systems administrators only.'}
                      </p>
                    </div>
                  </div>

                  {/* Messages Scroll Panel */}
                  <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-slate-500 text-xs py-20">
                        No messages in this chat. Start the conversation!
                      </div>
                    ) : (
                      chatMessages.map(msg => {
                        const isMe = msg.senderId === (user?.id || user?._id);
                        return (
                          <div key={msg._id} className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                            <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1 px-0.5">
                              {isMe ? 'You' : msg.senderName}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs shadow-sm border ${
                              isMe 
                                ? 'bg-purple-600 text-white border-purple-500 rounded-tr-none' 
                                : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
                            }`}>
                              <p className="leading-relaxed break-words">{msg.text}</p>
                            </div>
                            <span className="text-[8px] text-slate-500 mt-1 ml-1 px-0.5">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Message Input Bar */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={activeRecipient ? `Message ${activeRecipient.name}...` : 'Type your secure message...'}
                      className="input-field text-xs flex-grow"
                      disabled={chatSending}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatSending}
                      className="btn-primary px-4 py-2 rounded-xl text-xs justify-center flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* ======================== EDIT PROFILE ======================== */}
          {page === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="glass rounded-2xl border border-purple-100 bg-white p-6 sm:p-8 shadow-xl">
                <div className="border-b border-slate-200/50 pb-5 mb-6 flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Admin Profile Settings</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage your administrative details and account presentation.</p>
                  </div>
                </div>

                {/* Profile Photo */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative w-24 h-24 group">
                    <div 
                      onClick={() => profileFileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-black shadow-lg cursor-pointer overflow-hidden border-4 border-white transition group-hover:opacity-90 relative"
                    >
                      {profileForm.avatar ? (
                        <img src={profileForm.avatar} alt="Profile photo" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name ? user.name[0].toUpperCase() : 'A'}</span>
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
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-750 transition"
                      title="Upload profile photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      ref={profileFileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleProfileFileChange}
                      className="hidden"
                    />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-3">{user?.name || 'Administrator'}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">System Administrator</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {profileMsg.show && (
                    <div className={`px-4 py-3 rounded-xl text-xs font-semibold border ${
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
                      placeholder="Enter display name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={user?.email || ''}
                        disabled
                        className="input-field bg-slate-100 text-slate-500 text-sm border-slate-200 cursor-not-allowed !pr-10"
                        title="Email cannot be changed"
                      />
                      <Lock className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      value={profileForm.phone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Other Details</label>
                    <textarea 
                      value={profileForm.otherDetails || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, otherDetails: e.target.value })}
                      rows={3}
                      className="input-field text-sm"
                      placeholder="Enter any additional details, roles, or description..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={profileUpdating || profileUploading}
                    className="btn-primary w-full justify-center flex items-center gap-2 mt-4"
                  >
                    {profileUpdating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Saving Changes...
                      </>
                    ) : 'Save Profile Details'}
                  </button>
                </form>
              </div>
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
            
            <h3 className="font-bold text-slate-900 text-lg text-center mb-2">
              Delete <span className="capitalize">{deleteModal.type}</span>?
            </h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              This action cannot be undone. The item and all its comments will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ open: false, type: '', id: '', loading: false })}
                className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-purple-600 text-sm transition"
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
      {/* EDIT POST MODAL */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-purple-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <span>✏️ Edit {editModal.type === 'event' ? 'Event' : 'News'}</span>
              </h2>
              <button 
                onClick={() => setEditModal({ open: false, type: '', id: null, loading: false })}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Title</label>
                <input 
                  type="text" 
                  value={editForm.title || ''} 
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  required 
                  className="input-field" 
                />
              </div>

              {editModal.type === 'event' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Date</label>
                      <input 
                        type="date" 
                        value={editForm.date || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        required 
                        className="input-field" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Time</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 18:00"
                        value={editForm.time || ''} 
                        onChange={e => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                        className="input-field" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Location</label>
                    <input 
                      type="text" 
                      value={editForm.location || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="input-field" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Description</label>
                    <textarea 
                      rows={4} 
                      value={editForm.description || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      required 
                      className="input-field"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Summary</label>
                    <input 
                      type="text" 
                      value={editForm.summary || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                      className="input-field" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Content</label>
                    <textarea 
                      rows={5} 
                      value={editForm.content || ''} 
                      onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      required 
                      className="input-field"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select 
                    value={editForm.category || 'General'} 
                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="input-field"
                  >
                    <option value="General">General</option>
                    <option value="Technology">Technology</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Image URL</label>
                  <input 
                    type="text" 
                    value={editForm.image || ''} 
                    onChange={e => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200/50">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, type: '', id: null, loading: false })}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editModal.loading}
                  className="btn-primary px-5 py-2 rounded-xl text-white font-semibold transition"
                >
                  {editModal.loading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEED DETAIL PREVIEW MODAL */}
      {feedModal.open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setFeedModal({ open: false, type: '', data: {} })}
        >
          <div 
            className="glass rounded-2xl max-w-2xl w-full shadow-2xl relative border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Cover Image */}
            <div className="relative h-48 sm:h-64 bg-slate-100 flex-shrink-0">
              <button 
                onClick={() => setFeedModal({ open: false, type: '', data: {} })}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              {feedModal.data.image ? (
                <img src={feedModal.data.image} alt={feedModal.data.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-pink-900/20">
                  {feedModal.type === 'event' ? (
                    <Calendar className="w-16 h-16 text-purple-650/30" />
                  ) : (
                    <Newspaper className="w-16 h-16 text-pink-650/30" />
                  )}
                </div>
              )}
            </div>

            {/* Scrollable details */}
            <div className="p-6 overflow-y-auto space-y-5 flex-grow">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge uppercase text-[10px] font-bold ${
                  feedModal.type === 'event' ? 'badge-event' : 'badge-news'
                }`}>
                  {feedModal.type}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {feedModal.data.category}
                </span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{feedModal.data.title}</h2>
              
              {/* Event specific details */}
              {feedModal.type === 'event' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/50 text-xs text-slate-655">
                  {feedModal.data.date && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>{new Date(feedModal.data.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{feedModal.data.time ? ` at ${feedModal.data.time}` : ''}</span>
                    </div>
                  )}
                  {feedModal.data.location && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <span>{feedModal.data.location}</span>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                {feedModal.data.content || feedModal.data.description}
              </p>
              
              <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {feedModal.data.adminName ? feedModal.data.adminName[0].toUpperCase() : 'A'}
                  </div>
                  <span className="font-semibold text-slate-700">{feedModal.data.adminName}</span>
                  <span>•</span>
                  <span>{feedModal.data.createdAt ? new Date(feedModal.data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                </div>
                
                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    className={`action-btn px-4 py-2 border border-slate-200 rounded-xl hover:border-rose-500/50 flex items-center gap-1 text-xs transition ${
                      isLiked(feedModal.data._id) ? 'text-pink-600 border-pink-200 bg-pink-50' : 'text-slate-500'
                    }`}
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      toggleLike(feedModal.data, feedModal.type).then(updatedLikes => {
                        if (feedModal.type === 'event') {
                          setEvents(events.map(ev => ev._id === feedModal.data._id ? { ...ev, likes: updatedLikes } : ev));
                        } else {
                          setNews(news.map(nw => nw._id === feedModal.data._id ? { ...nw, likes: updatedLikes } : nw));
                        }
                        setFeedModal(prev => ({ ...prev, data: { ...prev.data, likes: updatedLikes } }));
                      });
                    }}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>{feedModal.data.likes || 0} Likes</span>
                  </button>
                  
                  <button 
                    className="action-btn text-slate-500 hover:text-purple-500 border border-slate-200 p-2 rounded-xl transition" 
                    onClick={() => handleFeedDownload(feedModal.data)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button 
                    className="action-btn text-slate-500 hover:text-green-500 border border-slate-200 p-2 rounded-xl transition" 
                    onClick={() => handleFeedShare(feedModal.data)}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t border-slate-200/50 space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  Comments
                  <span className="text-[10px] font-normal bg-purple-900/10 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                    {feedModalComments.length}
                  </span>
                </h3>

                {/* Add Comment Input Form */}
                <form onSubmit={handleAddFeedComment} className="flex gap-2">
                  <input
                    type="text"
                    value={feedCommentInput}
                    onChange={(e) => setFeedCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="input-field text-xs flex-grow"
                    disabled={feedCommentSending}
                  />
                  <button
                    type="submit"
                    disabled={!feedCommentInput.trim() || feedCommentSending}
                    className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center justify-center flex-shrink-0"
                  >
                    {feedCommentSending ? 'Post...' : 'Post'}
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {feedModalComments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No comments yet.</p>
                  ) : (
                    feedModalComments.map(c => (
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

    </div>
  );
}

