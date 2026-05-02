import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/useProductStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Minus, Heart } from 'lucide-react';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeMedia, setActiveMedia] = useState(0);
  const products = useProductStore(state => state.products);
  const product = products.find(p => p.id === Number(id));
  const { items, addToCart, updateQuantity } = useCartStore();
  const { profile, toggleWishlist } = useAuthStore();
  const cartItem = product ? items.find(item => item.id === product.id) : null;
  const isWishlisted = product && profile?.wishlist?.includes(product.id);

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
          <h2>Product Not Found</h2>
          <button className="btn-primary" onClick={() => navigate('/shop')} style={{ marginTop: '20px' }}>BACK TO SHOP</button>
        </div>
        </div>
    );
  }

  const availableMedia = product ? [
    ...product.images.map((url, i) => ({ type: 'image', url, originalIndex: i })).filter(m => m.url),
    ...(product.videoUrl ? [{ type: 'video', url: product.videoUrl, originalIndex: 4 }] : [])
  ] : [];

  const currentIndex = availableMedia.findIndex(m => m.originalIndex === activeMedia);
  
  const handleNext = () => {
    if (currentIndex === -1 || availableMedia.length === 0) return;
    const nextIndex = (currentIndex + 1) % availableMedia.length;
    setActiveMedia(availableMedia[nextIndex].originalIndex);
  };

  const handlePrev = () => {
    if (currentIndex === -1 || availableMedia.length === 0) return;
    const prevIndex = (currentIndex - 1 + availableMedia.length) % availableMedia.length;
    setActiveMedia(availableMedia[prevIndex].originalIndex);
  };

  return (
    <div className="product-detail-page">
      <div className="container detail-container">
        <div className="detail-image-col">
          <div className="detail-image-wrapper">
            {availableMedia.length > 1 && (
              <button className="slider-btn prev-btn" onClick={handlePrev}>❮</button>
            )}
            {activeMedia === 4 && product.videoUrl ? (
              <video src={product.videoUrl} autoPlay loop muted playsInline controls style={{ width: '100%', display: 'block' }} />
            ) : (
              <img src={product.images[activeMedia] || product.images[0]} alt={product.title} />
            )}
            {availableMedia.length > 1 && (
              <button className="slider-btn next-btn" onClick={handleNext}>❯</button>
            )}
          </div>
          <div className="detail-gallery">
            {product.images.map((img, i) => img && (
              <div key={i} className={`gallery-thumb ${activeMedia === i ? 'active' : ''}`} onClick={() => setActiveMedia(i)}>
                <img src={img} alt={`${product.title} view ${i+1}`} />
              </div>
            ))}
            {product.videoUrl && (
              <div className={`gallery-thumb ${activeMedia === 4 ? 'active' : ''}`} onClick={() => setActiveMedia(4)}>
                <div className="video-thumb-icon">▶️</div>
              </div>
            )}
          </div>
        </div>
        <div className="detail-info-col">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1>{product.title}</h1>
            <button 
              onClick={() => profile ? toggleWishlist(product.id) : alert('Please login to use your wishlist!')}
              style={{ background: 'white', border: '3px solid var(--text-dark)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '3px 3px 0px var(--text-dark)' }}
            >
              <Heart fill={isWishlisted ? "var(--accent-pink)" : "none"} color={isWishlisted ? "var(--accent-pink)" : "var(--text-dark)"} size={24} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '1rem' }}>
            <span style={{ color: '#fbbf24' }}>{'★'.repeat(Math.round(product.rating || 4.8))}{'☆'.repeat(5 - Math.round(product.rating || 4.8))}</span>
            <span style={{ color: '#666', fontWeight: 'bold' }}>{product.rating || 4.8} / 5</span>
            <span style={{ color: '#888', marginLeft: '5px' }}>({product.reviewsCount || 120} reviews)</span>
          </div>
          <div className="detail-price">
            <span className="current">₹{product.price}</span>
            <span className="original">₹{product.originalPrice}</span>
          </div>
          <p className="detail-description">{product.description}</p>
          
          <div className="detail-notes">
            <h3>KEY NOTES</h3>
            <ul>
              {product.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>

          {cartItem ? (
            <div className="btn-primary detail-add-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', cursor: 'default' }}>
              <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Minus size={24} /></button>
              <span>{cartItem.quantity} IN CART</span>
              <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Plus size={24} /></button>
            </div>
          ) : (
            <button className="btn-primary detail-add-btn" onClick={() => addToCart({ id: product.id, title: product.title, price: product.price, image: product.images[0] })}>
              ADD TO CART - ₹{product.price}
            </button>
          )}

          <div className="delivery-info">
            <p>✓ Free Shipping on orders over ₹1000</p>
            <p>✓ 100% Secure Checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
