import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
// Removed: firebase auth/firestore imports
import { useToast } from './components/Toast';
import { saveUserProfile, updateUserActivity } from './services/userService';

// Components
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Loader from './components/Loader';

// Pages
import Home from './pages/Home';
import Post from './pages/Post';
import Discover from './pages/Discover';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import ChatDetail from './pages/ChatDetail';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import WaitlistAdmin from './pages/WaitlistAdmin';
import Analytics from './pages/Analytics';

export default function App() {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const prevConversationsRef = useRef([]);

  // Shared state for Home/Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tout");

  const location = useLocation();
  const navigate = useNavigate();

  // AUTH INITIALIZATION (Custom Backend)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // Optimistic load
        const localUser = JSON.parse(storedUser);
        setUser(localUser);

        // Verify token with Backend
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            const verifiedUser = await res.json();
            setUser(prev => ({ ...prev, ...verifiedUser }));
            localStorage.setItem('user', JSON.stringify(verifiedUser));
          } else {
            console.warn("Token invalid, logging out");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (err) {
          console.error("Auth verification failed", err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Protect routes: redirect to /welcome if not authed and not waitlisted
  useEffect(() => {
    if (loading) return;
    const publicPaths = ['/welcome', '/auth', '/wl-admin', '/pmf'];
    const isPublic = publicPaths.some(p => location.pathname.startsWith(p));
    if (isPublic) return;

    const isWaitlisted = localStorage.getItem('waitlist_registered');
    const hasToken = !!localStorage.getItem('token');

    // If not authenticated AND not waitlisted → redirect to welcome
    if (!user && !hasToken && !isWaitlisted) {
      navigate('/welcome');
      return;
    }

    // Logged-in-only routes (post, messages, profile, chat) → redirect to /auth
    const authOnlyPrefixes = ['/post', '/messages', '/profile', '/chat'];
    const needsAuth = authOnlyPrefixes.some(prefix => location.pathname.startsWith(prefix));
    if (!user && needsAuth) {
      navigate('/auth');
    }
  }, [user, loading, location, navigate]);

  // Sync User Profile (Polling) & Activity
  useEffect(() => {
    if (!user || !user.uid) return;

    // Update Activity
    updateUserActivity(user.uid);
    const activityInterval = setInterval(() => updateUserActivity(user.uid), 30000);

    // Sync Profile Data
    const syncUserProfile = async () => {
      try {
        const res = await fetch(`/api/users/${user.uid}`);
        if (res.ok) {
          const userData = await res.json();
          setUser(prev => {
            // Cheap deep comparison check
            if (JSON.stringify(prev) !== JSON.stringify({ ...prev, ...userData })) {
              return { ...prev, ...userData };
            }
            return prev;
          });
        }
      } catch (err) { console.error("Sync error", err); }
    };
    syncUserProfile();
    const syncInterval = setInterval(syncUserProfile, 10000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(syncInterval);
    };
  }, [user?.uid]);

  // Synchronisation des données (Produits)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const items = await res.json();
          setProducts(items);
        }
      } catch (err) { console.error("Products API error", err); }
    };
    fetchProducts();
    const interval = setInterval(fetchProducts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Synchronisation des Messages
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      prevConversationsRef.current = [];
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${user.uid}`);
        if (res.ok) {
          const userConversations = await res.json();
          userConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // Notifications Logic
          const prevIds = new Set(prevConversationsRef.current.map(m => m.id));
          const isOnChatPage = location.pathname.startsWith('/chat/detail');
          userConversations.forEach(msg => {
            if (!prevIds.has(msg.id) && msg.senderId !== user.uid && !isOnChatPage && prevConversationsRef.current.length > 0) {
              const senderName = user.uid === msg.sellerId ? msg.buyerName : msg.sellerName;
              addToast(`💬 ${senderName || 'Message'}: ${msg.content?.substring(0, 20)}...`, 'info');
            }
          });

          prevConversationsRef.current = userConversations;
          setConversations(userConversations);
        }
      } catch (err) { console.error("Messages API error", err); }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, location.pathname]);


  // Unread Count
  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return conversations.filter(msg =>
      msg.senderId !== user.uid && (!msg.readBy || !msg.readBy.includes(user.uid))
    ).length;
  }, [conversations, user]);

  if (loading) return <Loader />;

  const isPMF = location.pathname.startsWith('/pmf');
  const isWlAdmin = location.pathname.startsWith('/wl-admin');
  const showNav = !isPMF && !isWlAdmin && !['/auth', '/chat/detail', '/welcome'].some(p => location.pathname.startsWith(p)) && !location.pathname.includes('/product/');
  const showHeader = !isPMF && !isWlAdmin && !['/auth', '/chat/detail', '/welcome'].some(p => location.pathname.startsWith(p)) && !location.pathname.includes('/product/');
  const isChat = location.pathname.startsWith('/chat/detail');
  const isLanding = location.pathname.startsWith('/welcome');

  // Classes du conteneur principal selon la route
  let mainClass = "flex-1 overflow-y-auto pb-24 scroll-smooth";
  if (isChat) mainClass = "flex-1 overflow-hidden h-full relative";
  if (isLanding) mainClass = "flex-1 overflow-y-auto h-full relative bg-brand-50";
  if (isPMF) mainClass = "flex-1 overflow-y-auto";

  // /pmf : full-screen avec inline styles (évite le purge Tailwind en prod)
  if (isPMF) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, Segoe UI, system-ui, sans-serif' }}>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/pmf" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    );
  }

  // /wl-admin : full-screen layout like PMF
  if (isWlAdmin) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', fontFamily: 'Inter, Segoe UI, system-ui, sans-serif' }}>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/wl-admin" element={<WaitlistAdmin />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Conteneur root : mobile-shell pour le reste
  const rootClass = "max-w-lg mx-auto h-[100dvh] bg-white flex flex-col font-sans text-slate-900 shadow-2xl overflow-hidden relative";

  return (
    <div className={rootClass}>
      {showHeader && <Header user={user} />}
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<Home products={products} searchQuery={searchQuery} setSearchQuery={setSearchQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} />} />
          <Route path="/search" element={<Home products={products} searchQuery={searchQuery} setSearchQuery={setSearchQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} isSearchFocus={true} />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/post" element={<Post user={user} />} />
          <Route path="/messages" element={<Messages user={user} conversations={conversations} />} />
          <Route path="/profile" element={<Profile user={user} products={products} />} />
          <Route path="/profile/:id" element={<Profile user={user} products={products} />} />
          <Route path="/product/:id" element={<ProductDetail products={products} user={user} />} />
          <Route path="/chat/detail" element={<ChatDetail user={user} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/wl-admin" element={<WaitlistAdmin />} />
        </Routes>
      </main>
      {showNav && <BottomNav user={user} unreadCount={unreadCount} />}
    </div>
  );
}