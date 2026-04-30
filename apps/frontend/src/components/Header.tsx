import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useProductStore } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import './Header.css';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartCount = useCartStore(state => state.getCartCount());
  const profile = useAuthStore(state => state.profile);
  const wishlistCount = profile?.wishlist?.length || 0;
  const products = useProductStore(state => state.products);
  const navigate = useNavigate();

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // show max 5 in dropdown

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        
        <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>

        <Link to="/" className="logo">LUMEN.</Link>

        <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>

        <div className="header-actions">
          <div className="search-container">
            <button className="icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <X size={22} /> : <Search size={22} />}
            </button>
            {searchOpen && (
              <div className="search-dropdown comic-box">
                <input 
                  type="text" 
                  placeholder="Search perfumes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <div className="search-dropdown-results">
                  {searchQuery && filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      className="search-dropdown-item" 
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <img src={p.images[0]} alt={p.title} />
                      <div>
                        <strong>{p.title}</strong>
                        <p>₹{p.price}</p>
                      </div>
                    </div>
                  ))}
                  {searchQuery && filteredProducts.length === 0 && (
                    <p className="no-results-small">No results found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Link to="/wishlist" className="icon-btn cart-btn">
            <Heart size={22} />
            {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
          </Link>
          <Link to="/profile" className="icon-btn"><User size={22} /></Link>
          <Link to="/cart" className="icon-btn cart-btn">
            <ShoppingBag size={22} />
            <span className="cart-count">{cartCount}</span>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Header;
