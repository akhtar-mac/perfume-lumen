import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
      <Header />
      <div className="wishlist-header">
        <div className="container">
          <h1>YOUR WISHLIST 💖</h1>
          <p>Your personal collection of premium fragrances</p>
        </div>
      </div>
      <div className="container wishlist-container">
        {!profile ? (
          <div className="empty-wishlist">
            <p>Please login to view and manage your wishlist.</p>
            <Link to="/profile" className="btn-primary">GO TO LOGIN</Link>
          </div>
        ) : wishlistedProducts.length === 0 ? (
          <div className="empty-wishlist">
            <p>Your wishlist is currently empty.</p>
            <Link to="/shop" className="btn-primary">DISCOVER PERFUMES</Link>
          </div>
        ) : (
          <>
            <div className="wishlist-actions-bar">
              <p className="results-count">You have {wishlistedProducts.length} items saved.</p>
              <div className="wishlist-btn-group">
                <button className="btn-secondary" onClick={handleAddAllToCart}>
                  ADD ALL TO CART
                </button>
                <button className="btn-primary checkout-btn" onClick={handleCheckout}>
                  CHECKOUT WISHLIST
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
      
      <Footer />
    </div>
  );
};

export default Wishlist;
