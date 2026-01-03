import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from './firebase';
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

  // Initialisation Auth & Onboarding
  useEffect(() => {
    // Check first visit
    const hasVisited = localStorage.getItem('has_visited');
    if (!hasVisited && !location.pathname.startsWith('/welcome')) {
      navigate('/welcome');
    }

    // Listen for auth state changes first
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      // If no user is signed in, try anonymous sign-in
      if (!currUser) {
        try {
          if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
          } else {
            // Only sign in anonymously if no user exists
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.error("Erreur d'initialisation Auth:", err);
          // Even if anonymous auth fails, allow app to continue
          setLoading(false);
        }
      } else {
        // User already signed in - keep their session
        setUser(currUser);
        setLoading(false);

        // Save user profile to Firestore (for email notifications)
        if (!currUser.isAnonymous && currUser.email) {
          saveUserProfile(currUser);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Update user activity periodically (for online detection)
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    // Update activity immediately
    updateUserActivity(user.uid);

    // Update every 30 seconds while user is on the site
    const activityInterval = setInterval(() => {
      updateUserActivity(user.uid);
    }, 30000);

    return () => clearInterval(activityInterval);
  }, [user]);

  // Synchronisation des données
  // Products (Public)
  useEffect(() => {
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (err) => console.error("Erreur Firestore (Products):", err));
    return () => unsubProducts();
  }, []);

  // Messages (Private) with notification support
  useEffect(() => {
    if (!user) {
      setConversations([]);
      prevConversationsRef.current = [];
      return;
    }
    const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMessages = onSnapshot(messagesRef, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userConversations = allMsgs.filter(m => m.participants?.includes(user.uid));

      // Check for new messages (not sent by current user and not already seen)
      const prevIds = new Set(prevConversationsRef.current.map(m => m.id));
      const isOnChatPage = location.pathname.startsWith('/chat/detail');

      userConversations.forEach(msg => {
        // New message from someone else, not on chat page
        if (!prevIds.has(msg.id) && msg.senderId !== user.uid && !isOnChatPage && prevConversationsRef.current.length > 0) {
          const senderName = user.uid === msg.sellerId ? msg.buyerName : msg.sellerName;
          addToast(`💬 ${senderName || 'Nouveau message'}: ${msg.content?.substring(0, 30) || 'Image'}${msg.content?.length > 30 ? '...' : ''}`, 'info');
        }
      });

      prevConversationsRef.current = userConversations;
      setConversations(userConversations);
    }, (err) => console.error("Erreur Firestore (Messages):", err));
    return () => unsubMessages();
  }, [user, location.pathname, addToast]);

  // Calculate unread messages count - MUST be before any conditional returns!
  const unreadCount = useMemo(() => {
    if (!user || user.isAnonymous) return 0;
    return conversations.filter(msg =>
      msg.senderId !== user.uid &&
      (!msg.readBy || !msg.readBy.includes(user.uid))
    ).length;
  }, [conversations, user]);

  if (loading) return <Loader />;

  const showNav = !['/auth', '/chat/detail', '/welcome'].some(path => location.pathname.startsWith(path)) && !location.pathname.includes('/product/');
  const showHeader = !['/auth', '/chat/detail', '/welcome'].some(path => location.pathname.startsWith(path)) && !location.pathname.includes('/product/');

  // Pages that need full height without parent padding/scroll
  const isChat = location.pathname.startsWith('/chat/detail');
  const isLanding = location.pathname.startsWith('/welcome');

  let mainClass = "flex-1 overflow-y-auto pb-24 scroll-smooth";
  if (isChat) mainClass = "flex-1 overflow-hidden h-full relative";
  if (isLanding) mainClass = "flex-1 overflow-y-auto h-full relative bg-slate-50";

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col font-sans text-slate-900 shadow-2xl overflow-hidden relative">
      {showHeader && <Header user={user} />}

      <main className={mainClass}>
        <Routes>
          <Route path="/" element={
            <Home
              products={products}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
            />
          } />
          <Route path="/search" element={
            <Home
              products={products}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              isSearchFocus={true}
            />
          } />
          <Route path="/discover" element={<Discover />} />
          <Route path="/post" element={<Post user={user} />} />
          <Route path="/messages" element={<Messages user={user} conversations={conversations} />} />
          <Route path="/profile" element={<Profile user={user} products={products} />} />
          <Route path="/product/:id" element={<ProductDetail products={products} user={user} />} />
          <Route path="/chat/detail" element={<ChatDetail user={user} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/welcome" element={<LandingPage />} />
        </Routes>
      </main>

      {showNav && <BottomNav user={user} unreadCount={unreadCount} />}
    </div>
  );
}