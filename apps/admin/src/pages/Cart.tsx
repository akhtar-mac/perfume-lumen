import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCartStore } from '../store/useCartStore';
import CheckoutWizard from '../components/CheckoutWizard';
import './Cart.css';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getCartTotal } = useCartStore();
  const [showCheckout, setShowCheckout] = React.useState(false);

  return (
    <div className="cart-page">
      <Header />
      <div className="container cart-container">
        <h1>YOUR CART 🛒</h1>
        
        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is currently empty.</p>
            <Link to="/shop" className="btn-primary">CONTINUE SHOPPING</Link>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.title} className="cart-item-img" />
                  <div className="cart-item-details">
                    <Link to={`/product/${item.id}`}><h3>{item.title}</h3></Link>
                    <p className="cart-item-price">₹{item.price}</p>
                    
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary">
              <h2>ORDER SUMMARY</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{getCartTotal()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="summary-row total">
                <span>TOTAL</span>
                <span>₹{getCartTotal()}</span>
              </div>
              <button className="btn-primary checkout-btn" onClick={() => setShowCheckout(true)}>PROCEED TO CHECKOUT</button>
            </div>
          </div>
        )}
      </div>
      
      {showCheckout && <CheckoutWizard onClose={() => setShowCheckout(false)} />}
      
      <Footer />
    </div>
  );
};

export default Cart;
