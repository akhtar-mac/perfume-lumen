import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Heart, MessageCircle } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useProductStore } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import './Header.css';

interface HeaderProps {
  isHomePage?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isHomePage = true }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = useCartStore(state => state.getCartCount());
  const openDrawer = useCartStore(state => state.openDrawer);
  const profile = useAuthStore(state => state.profile);
  const wishlistCount = profile?.wishlist?.length || 0;
  const products = useProductStore(state => state.products);
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = searchQuery
    ? products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    closeSearch();
    setIsScrolled(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''} ${!isHomePage ? 'not-home' : ''}`}>
      <div className="container header-container">

        {/* Hamburger — mobile only */}
        <div className="mobile-toggle" onClick={() => {
          setMobileMenuOpen(!mobileMenuOpen);
          if (!mobileMenuOpen) closeSearch();
        }}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>

        {/* Logo — always visible */}
        <Link to="/" className="logo">LUMEN.</Link>

        {/* Desktop nav */}
        <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <ul className="nav-links">
              <li><Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
              <li><Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop Collection</Link></li>
              <li><Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link></li>
              <li><Link to="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</Link></li>
            </ul>
            <div className="mobile-menu-footer">
              <div className="social-links">
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" className="social-icon" aria-label="WhatsApp">
                  <MessageCircle size={20} />
                </a>
              </div>
              <p className="menu-tagline">India's Finest Designer Recreations ✨</p>
            </div>
          </div>
        </nav>

        {/* Right actions — search expands here, nothing else moves */}
        <div className="header-actions">

          {/* Expandable search — icon stays, input grows left */}
          <div className={`search-expand-wrap ${searchOpen ? 'search-is-open' : ''}`}>
            <input
              ref={searchInputRef}
              type="text"
              className="search-expand-input"
              placeholder="Search perfumes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && closeSearch()}
            />
            <button
              className="icon-btn search-expand-btn"
              onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}
            >
              {searchOpen ? <X size={22} /> : <Search size={22} />}
            </button>

            {/* Results — scoped to search bar width via position:absolute on wrap */}
            {searchOpen && filteredProducts.length > 0 && (
              <div className="header-search-results">
                {filteredProducts.map(p => (
                  <div key={p.id} className="header-search-item" onClick={() => { navigate(`/product/${p.id}`); closeSearch(); }}>
                    <img src={p.images[0]} alt={p.title} className="header-search-item-img" />
                    <div className="header-search-item-info">
                      <strong>{p.title}</strong>
                      <span>₹{p.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchOpen && searchQuery && filteredProducts.length === 0 && (
              <div className="header-search-results">
                <div className="header-search-empty">No results for "{searchQuery}"</div>
              </div>
            )}
          </div>

          <Link to="/wishlist" className="icon-btn cart-btn">
            <Heart size={22} />
            {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
          </Link>

          <a href="/cart" className="icon-btn cart-btn" onClick={e => { e.preventDefault(); openDrawer(); }}>
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </a>
        </div>

      </div>


      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}
    </header>
  );
};

export default Header;
