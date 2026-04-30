import React, { useState } from 'react';
import { X, CheckCircle, Smartphone, MapPin, CreditCard, Loader } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCouponStore } from '../store/useCouponStore';
import './CheckoutWizard.css';

interface CheckoutWizardProps {
  onClose: () => void;
}

const CheckoutWizard: React.FC<CheckoutWizardProps> = ({ onClose }) => {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { createOrder, orders, fetchOrders } = useOrderStore();
  const { user, profile } = useAuthStore();
  const validateCoupon = useCouponStore(state => state.validateCoupon);
  const [step, setStep] = useState<number>(1);
  
  // Form State
  const [phone, setPhone] = useState(profile?.phone || '');
  const [otp, setOtp] = useState('');
  const [address, setAddress] = useState({ 
    name: profile?.address?.name || profile?.full_name || '', 
    email: profile?.address?.email || user?.email || '',
    street1: profile?.address?.street1 || '', 
    street2: profile?.address?.street2 || '', 
    landmark: profile?.address?.landmark || '',
    city: profile?.address?.city || '', 
    state: profile?.address?.state || '',
    pincode: profile?.address?.pincode || '' 
  });
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpState, setOtpState] = useState<'idle' | 'success' | 'error'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  
  // Discount State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  React.useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  React.useEffect(() => {
    if (user && orders.length === 0 && discountPercent === 0) {
      setDiscountPercent(10);
      setCouponMessage('🎉 First Order 10% Discount Auto-Applied!');
    }
  }, [user, orders, discountPercent]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const pct = await validateCoupon(couponCode);
    if (pct) {
      setDiscountPercent(pct);
      setCouponMessage(`✅ ${pct}% Discount Applied!`);
    } else {
      setCouponMessage('❌ Invalid or expired coupon code.');
    }
  };

  const originalTotal = getCartTotal();
  const finalTotal = Math.round(originalTotal - (originalTotal * (discountPercent / 100)));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    // OTP validation on step 2
    if (step === 2) {
      if (otp.length < 4) {
        setOtpState('error');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
        return;
      }
      // Simulate OTP success
      setOtpState('success');
      setTimeout(() => setStep(prev => prev + 1), 700);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call to payment gateway
    setTimeout(async () => {
      if (user) {
        await createOrder(finalTotal, items.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })), couponCode.trim() ? couponCode : undefined);
      }
      if (couponCode.trim()) {
        localStorage.setItem('discount_used', 'true');
      }

      setIsProcessing(false);
      setStep(5); // Success step
      clearCart();
    }, 2500);
  };

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        {step < 5 && (
          <button className="close-wizard" onClick={onClose} title="Close checkout">
            <X size={22} strokeWidth={3} />
          </button>
        )}
        
        <div className="wizard-progress">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}><Smartphone size={16} /></div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}><CheckCircle size={16} /></div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}><MapPin size={16} /></div>
          <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 4 ? 'active' : ''}`}><CreditCard size={16} /></div>
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="wizard-form slide-in">
              <h2>Enter Phone Number</h2>
              <p>We'll send you an OTP to verify your identity.</p>
              <input 
                type="tel" 
                placeholder="10-digit mobile number" 
                pattern="[0-9]{10}"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required 
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={phone.length !== 10}>
                SEND OTP
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="wizard-form slide-in" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📲</div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Verify Your Number</h2>
              <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: '5px' }}>
                A 4-digit code was sent to
              </p>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '25px' }}>
                +91 {phone}
              </p>

              {/* 4 individual OTP boxes */}
              <div 
                style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '15px' }}
                className={isShaking ? 'otp-shake' : ''}
              >
                {[0, 1, 2, 3].map(i => {
                  const borderColor = otpState === 'success' 
                    ? '#2e7d32'
                    : otpState === 'error' && !otp[i] 
                      ? '#c62828' 
                      : otp[i] ? 'var(--accent-pink)' : 'var(--text-dark)';
                  return (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i] || ''}
                      autoFocus={i === 0}
                      onChange={e => {
                        setOtpState('idle');
                        const val = e.target.value.replace(/\D/g, '');
                        const arr = otp.split('');
                        arr[i] = val;
                        const next = arr.join('').slice(0, 4);
                        setOtp(next);
                        if (val && i < 3) {
                          document.getElementById(`otp-${i + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      style={{
                        width: '56px',
                        height: '64px',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        border: 'none',
                        borderBottom: `3px solid ${borderColor}`,
                        borderRadius: '0',
                        outline: 'none',
                        background: 'transparent',
                        color: otpState === 'success' ? '#2e7d32' : otpState === 'error' && !otp[i] ? '#c62828' : 'inherit',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                    />
                  );
                })}
              </div>

              {otpState === 'error' && (
                <p style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>⚠️ Please enter all 4 digits</p>
              )}
              {otpState === 'success' && (
                <p style={{ color: '#2e7d32', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>✅ Verified! Proceeding...</p>
              )}
              {otpState === 'idle' && (
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '20px' }}>
                  💡 This is a demo — enter any 4 digits to continue
                </p>
              )}

              <button type="submit" className="btn-primary" disabled={otpState === 'success'}>
                {otpState === 'success' ? '✅ VERIFIED!' : 'VERIFY & CONTINUE →'}
              </button>
              <button type="button" className="text-btn" onClick={() => setStep(1)} style={{ marginTop: '15px', display: 'block', width: '100%' }}>
                ← Wrong number? Go back
              </button>
            </form>
          )}


          {step === 3 && (
            <form onSubmit={handleNextStep} className="wizard-form slide-in" style={{ textAlign: 'left' }}>
              <h2 style={{ textAlign: 'center' }}>Shipping Address</h2>
              <p style={{ textAlign: 'center' }}>Where should we deliver your order?</p>
              
              <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={address.name}
                  onChange={e => setAddress({...address, name: e.target.value})}
                  required 
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={address.email}
                  onChange={e => setAddress({...address, email: e.target.value})}
                  required 
                />
              </div>

              <input 
                type="text" 
                placeholder="Flat, House no., Building, Company, Apartment" 
                value={address.street1}
                onChange={e => setAddress({...address, street1: e.target.value})}
                required 
              />

              <input 
                type="text" 
                placeholder="Area, Street, Sector, Village" 
                value={address.street2}
                onChange={e => setAddress({...address, street2: e.target.value})}
                required 
              />

              <input 
                type="text" 
                placeholder="Landmark (e.g. near Apollo Hospital)" 
                value={address.landmark}
                onChange={e => setAddress({...address, landmark: e.target.value})}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="City" 
                  value={address.city}
                  onChange={e => setAddress({...address, city: e.target.value})}
                  required 
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  placeholder="State" 
                  value={address.state}
                  onChange={e => setAddress({...address, state: e.target.value})}
                  required 
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  placeholder="PIN Code" 
                  pattern="[0-9]{6}"
                  value={address.pincode}
                  onChange={e => setAddress({...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  required 
                  style={{ flex: 1 }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>CONTINUE TO PAYMENT</button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handlePayment} className="wizard-form slide-in" style={{ textAlign: 'left' }}>
              <h2 style={{ textAlign: 'center' }}>Complete Payment</h2>
              <p style={{ textAlign: 'center' }}>You are buying {items.length} items.</p>
              
              <div className="discount-section comic-box" style={{ padding: '15px', marginBottom: '20px', background: '#f9f9f9', border: '2px solid var(--text-dark)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '10px' }}>Apply Coupon</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '10px', border: '2px solid var(--text-dark)', borderRadius: '4px' }}
                  />
                  <button type="button" onClick={handleApplyCoupon} style={{ padding: '10px 20px', background: 'var(--text-dark)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>APPLY</button>
                </div>
                {couponMessage && <p style={{ marginTop: '10px', fontSize: '0.9rem', color: couponMessage.includes('❌') ? 'red' : 'green', fontWeight: 'bold' }}>{couponMessage}</p>}
              </div>

              <div className="order-total-summary" style={{ background: 'var(--primary-yellow)', padding: '15px', borderRadius: '8px', border: '2px solid var(--text-dark)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>Subtotal:</span>
                  <span>₹{originalTotal}</span>
                </div>
                {discountPercent > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--accent-pink)', fontWeight: 'bold' }}>
                    <span>Discount ({discountPercent}%):</span>
                    <span>-₹{Math.round(originalTotal * (discountPercent / 100))}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid var(--text-dark)', fontWeight: '900', fontSize: '1.2rem' }}>
                  <span>FINAL TOTAL:</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              <div className="mock-payment-box" style={{ textAlign: 'center' }}>
                <p>Payment Gateway Simulated</p>
                <CreditCard size={48} color="#ccc" style={{ margin: '20px 0' }} />
                <p style={{ fontSize: '0.8rem', color: '#888' }}>Clicking "Pay Now" will simulate a successful transaction.</p>
              </div>

              <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%', marginTop: '15px' }}>
                {isProcessing ? <><Loader className="spin" size={20} style={{ marginRight: '10px' }} /> PROCESSING...</> : `PAY ₹${finalTotal}`}
              </button>
            </form>
          )}

          {step === 5 && (
            <div className="wizard-success slide-in">
              <CheckCircle size={64} color="var(--accent-green)" />
              <h2>Payment Successful!</h2>
              <p>Thank you, {address.name}. Your order has been placed and is being processed.</p>
              <p style={{ color: '#888', marginTop: '10px' }}>Receipt sent to +91 {phone}</p>
              <button className="btn-primary" onClick={onClose} style={{ marginTop: '30px' }}>
                RETURN TO SHOP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutWizard;
