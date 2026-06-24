import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Minus, Heart, ShoppingBag } from 'lucide-react';
import './ProductCard.css';

interface ProductCardProps {
  id: number;
  images: string[];
  title: string;
  price: string;
  originalPrice: string;
  isBestseller?: boolean;
  rating?: number | null;
  reviewsCount?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, images, title, price, originalPrice, isBestseller, rating = null, reviewsCount = 0 }) => {
  const { items, addToCart, updateQuantity } = useCartStore();
  const { profile, toggleWishlist } = useAuthStore();
  const cartItem = items.find(item => item.id === id);
  const isWishlisted = profile?.wishlist?.includes(id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (profile) toggleWishlist(id);
    else alert('Please login to use your wishlist!');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id,
      title,
      price: parseInt(price.replace(/[^0-9]/g, '')), // Parse int from string "₹999"
      image: images[0]
    });
  };
  return (
    <div className="product-card">
      <Link to={`/product/${id}`} className="product-image-wrapper">
        <img src={images[0]} alt={title} className="product-image main-image" loading="lazy" decoding="async" width={400} height={533} />
        <img src={images[1] || images[0]} alt={`${title} Notes`} className="product-image hover-image" loading="lazy" decoding="async" width={400} height={533} />
        {isBestseller && <div className="product-badge">BESTSELLER</div>}
        <button className="wishlist-toggle-btn" onClick={handleWishlist}>
          <Heart fill={isWishlisted ? "var(--accent-pink)" : "none"} color={isWishlisted ? "var(--accent-pink)" : "var(--text-dark)"} size={20} />
        </button>
        {cartItem ? (
          <div className="quick-add-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', bottom: 0 }} onClick={e => e.preventDefault()}>
            <button onClick={() => updateQuantity(id, cartItem.quantity - 1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Minus size={20} /></button>
            <span>{cartItem.quantity}</span>
            <button onClick={() => updateQuantity(id, cartItem.quantity + 1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><Plus size={20} /></button>
          </div>
        ) : (
          <button className="quick-add-btn" onClick={handleQuickAdd}>
            <span className="quick-add-text">ADD TO CART</span>
            <ShoppingBag className="quick-add-icon" size={20} />
          </button>
        )}
      </Link>
      <div className="product-info">
        <Link to={`/product/${id}`}>
          <h3 className="product-title">{title}</h3>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '8px', fontSize: '0.85rem', minHeight: rating ? 'auto' : '1.2rem' }}>
          {rating !== null && rating !== undefined && (
            <>
              <span style={{ color: '#fbbf24' }}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
              <span style={{ color: '#666' }}>({reviewsCount})</span>
            </>
          )}
        </div>
        <div className="product-price">
          <span className="current-price">{price}</span>
          <span className="original-price">{originalPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
