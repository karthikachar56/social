'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin', 'user', or null
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    // Check localStorage on mount
    const savedToken = localStorage.getItem('eh_token');
    const savedLiked = localStorage.getItem('eh_liked');
    
    if (savedLiked) {
      try {
        setLikedPosts(JSON.parse(savedLiked));
      } catch (e) {
        console.error(e);
      }
    }

    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRole(data.role);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (e) {
      console.error('Verify session error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = (authToken, userRole, userData) => {
    localStorage.setItem('eh_token', authToken);
    setToken(authToken);
    setRole(userRole);
    setUser(userData);
  };

  const signup = (authToken, userRole, userData) => {
    localStorage.setItem('eh_token', authToken);
    setToken(authToken);
    setRole(userRole);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('eh_token');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  const isLiked = (id) => {
    return !!likedPosts[id];
  };

  const toggleLike = async (item, itemType) => {
    const id = item._id;
    const alreadyLiked = likedPosts[id];
    const action = alreadyLiked ? 'unlike' : 'like';

    // Optimistic update local state
    const newLiked = { ...likedPosts };
    if (alreadyLiked) {
      delete newLiked[id];
    } else {
      newLiked[id] = true;
    }
    setLikedPosts(newLiked);
    localStorage.setItem('eh_liked', JSON.stringify(newLiked));

    // Call server API
    try {
      const typePath = itemType === 'event' ? 'events' : 'news';
      const res = await fetch(`/api/${typePath}/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const data = await res.json();
        return data.likes;
      }
    } catch (error) {
      console.error('Error syncing like:', error);
    }
    
    // Return estimated likes if server sync fails
    return (item.likes || 0) + (alreadyLiked ? -1 : 1);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      token,
      loading,
      login,
      signup,
      logout,
      isLiked,
      toggleLike
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

