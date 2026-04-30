import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import { useSiteStore } from './store/useSiteStore';
import { useProductStore } from './store/useProductStore';
import { useAuthStore } from './store/useAuthStore';
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
