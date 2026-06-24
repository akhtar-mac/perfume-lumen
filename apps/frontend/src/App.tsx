import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { env } from './lib/env';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import { useSiteStore } from './store/useSiteStore';
import { useProductStore } from './store/useProductStore';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { themePrimaryYellow, themeAccentPink, themeAccentBlue, fetchSettings, incrementVisitor } = useSiteStore();
  const { fetchProducts } = useProductStore();
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    initializeAuth();
    
    // Visitor tracking
    if (!sessionStorage.getItem('hasVisited')) {
      incrementVisitor();
      sessionStorage.setItem('hasVisited', 'true');
    }

    // Ping Render Backend to verify connection
    const checkBackend = async () => {
      try {
        const apiUrl = env.VITE_API_URL;
        if (apiUrl) {
          const res = await fetch(`${apiUrl}/api/health`);
          const data = await res.json();
          console.log('🔗 Backend Connected:', data);
        }
      } catch (err) {
        console.warn('⚠️ Backend connection pending or VITE_API_URL not set in Vercel.');
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-yellow', themePrimaryYellow);
    document.documentElement.style.setProperty('--accent-pink', themeAccentPink);
    document.documentElement.style.setProperty('--accent-blue', themeAccentBlue);
  }, [themePrimaryYellow, themeAccentPink, themeAccentBlue]);
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
