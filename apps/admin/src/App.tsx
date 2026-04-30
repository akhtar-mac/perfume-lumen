import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Admin from './pages/Admin';
import { useSiteStore } from './store/useSiteStore';
import { useProductStore } from './store/useProductStore';
import { useAuthStore } from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { themePrimaryYellow, themeAccentPink, themeAccentBlue, fetchSettings } = useSiteStore();
  const { fetchProducts } = useProductStore();
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    initializeAuth();
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
          <Route path="/" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
