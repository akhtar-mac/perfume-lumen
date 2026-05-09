import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import CheckoutWizard from './CheckoutWizard';
import './CartDrawer.css';

const CartDrawer: React.FC = () => {
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className="cart-drawer-overlay" onClick={closeDrawer} />
      <div className={`cart-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2>YOUR CART 🛒 <span className="cart-count-badge">{getCartCount()}</span></h2>
          <button className="close-btn" onClick={closeDrawer}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-drawer-content">
          {items.length === 0 ? (
            <div className="empty-cart-drawer">
              <ShoppingBag size={48} color="var(--text-light)" />
              <p>Your cart is empty.</p>
              <button 
                className="btn-primary" 
                onClick={() => {
                  closeDrawer();
                  navigate('/shop');
                }}
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            <div className="cart-drawer-items">
              {items.map(item => (
                <div key={item.id} className="cart-drawer-item">
                  <img src={item.image} alt={item.title} className="drawer-item-img" />
                  <div className="drawer-item-details">
                    <div className="drawer-item-title-row">
                      <Link to={`/product/${item.id}`} onClick={closeDrawer}>
                        <h3>{item.title}</h3>
                      </Link>
                      <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="drawer-item-price">₹{item.price}</p>
                    <div className="drawer-item-actions">
                      <div className="quantity-controls small">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="drawer-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{getCartTotal()}</span>
              </div>
              <p className="shipping-notice">Shipping & Coupons calculated at checkout.</p>
            </div>
            <button className="btn-primary checkout-btn" onClick={() => setShowCheckout(true)}>
              PROCEED TO CHECKOUT
            </button>
            <Link to="/cart" className="view-cart-link" onClick={closeDrawer}>
              View Full Cart
            </Link>
          </div>
        )}
      </div>

      {showCheckout && <CheckoutWizard onClose={() => {
        setShowCheckout(false);
      }} />}
    </>
  );
};

export default CartDrawer;
