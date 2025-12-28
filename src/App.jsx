import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from './firebase';

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [conversations, setConversations] = useState([]);

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

    const initAuth = async () => {
      try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          // On commence en anonyme pour permettre la navigation
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Erreur d'initialisation Auth:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  // Messages (Private)
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMessages = onSnapshot(messagesRef, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const userConversations = allMsgs.filter(m => m.participants?.includes(user.uid));
      setConversations(userConversations);
    }, (err) => console.error("Erreur Firestore (Messages):", err));
    return () => unsubMessages();
  }, [user]);

  if (loading) return <Loader />;

  const showNav = !['/auth', '/chat/detail', '/welcome'].some(path => location.pathname.startsWith(path)) && !location.pathname.includes('/product/');
  const showHeader = !['/auth', '/chat/detail', '/welcome'].some(path => location.pathname.startsWith(path)) && !location.pathname.includes('/product/');

  // Pages that need full height without parent padding/scroll
  const isFullScreen = ['/chat/detail', '/welcome'].some(path => location.pathname.startsWith(path));

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col font-sans text-slate-900 shadow-2xl overflow-hidden relative">
      {showHeader && <Header user={user} />}

      <main className={isFullScreen ? "flex-1 overflow-hidden h-full relative" : "flex-1 overflow-y-auto pb-24 scroll-smooth"}>
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

      {showNav && <BottomNav user={user} />}
    </div>
  );
}