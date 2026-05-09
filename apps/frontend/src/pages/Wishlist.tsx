import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CheckoutWizard from '../components/CheckoutWizard';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import { useCartStore } from '../store/useCartStore';
import './Wishlist.css';

const Wishlist: React.FC = () => {
  const profile = useAuthStore(state => state.profile);
  const products = useProductStore(state => state.products);
  const bestsellerIds = useSiteStore(state => state.bestsellerIds);
  const addToCart = useCartStore(state => state.addToCart);
  const [showCheckout, setShowCheckout] = React.useState(false);

  const wishlistedProducts = products.filter(p => profile?.wishlist?.includes(p.id));

  const handleAddAllToCart = () => {
    wishlistedProducts.forEach(product => {
      addToCart({
        id: product.id,
        title: product.title,
        price: parseInt(product.price.toString().replace(/[^0-9]/g, '')),
        image: product.images[0]
      });
    });
  };

  const handleCheckout = () => {
    if (wishlistedProducts.length === 0) return;
    handleAddAllToCart();
    setShowCheckout(true);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <div className="container">
          <h1>YOUR WISHLIST 💖</h1>
          <p>Your personal collection of premium fragrances</p>
        </div>
      </div>
      <div className="container wishlist-container">
        {!profile ? (
          <div className="empty-wishlist">
            <div className="empty-wishlist-icon">💖</div>
            <h2>Save Your Favourites</h2>
            <p>Login to view and manage your personal fragrance wishlist.</p>
            <Link to="/profile" className="btn-primary">LOGIN / SIGN UP</Link>
          </div>
        ) : wishlistedProducts.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-wishlist-icon">🌸</div>
            <h2>Nothing saved yet</h2>
            <p>Tap the ♡ on any perfume to add it to your wishlist.</p>
            <Link to="/shop" className="btn-primary">DISCOVER PERFUMES</Link>
          </div>
        ) : (
          <>
            <div className="wishlist-actions-bar">
              <div className="wishlist-count-label">
                {wishlistedProducts.length} items saved
                <span>Add all to cart or checkout now</span>
              </div>
              <div className="wishlist-btn-group">
                <button className="btn-secondary" onClick={handleAddAllToCart}>
                  ADD ALL
                </button>
                <button className="btn-primary checkout-btn" onClick={handleCheckout}>
                  CHECKOUT
                </button>
              </div>
            </div>
            <div className="product-grid">
              {wishlistedProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  images={product.images}
                  title={product.title}
                  price={`₹${product.price}`}
                  originalPrice={`₹${product.originalPrice}`}
                  isBestseller={bestsellerIds.includes(product.id)}
                  rating={product.rating}
                  reviewsCount={product.reviewsCount}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showCheckout && <CheckoutWizard onClose={() => setShowCheckout(false)} />}
      
    </div>
  );
};

export default Wishlist;
