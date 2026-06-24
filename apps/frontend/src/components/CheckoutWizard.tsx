import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Smartphone, MapPin, CreditCard, Loader, Plus, ChevronRight, User, Tag, ChevronDown } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Address } from '../store/useAuthStore';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loadRazorpayScript } from '../lib/razorpay';
import { env } from '../lib/env';
import './CheckoutWizard.css';
import { useCouponStore } from '../store/useCouponStore';

interface CheckoutWizardProps {
  onClose: () => void;
}

const CheckoutWizard: React.FC<CheckoutWizardProps> = ({ onClose }) => {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { orders, fetchOrders } = useOrderStore();
  const { user, profile } = useAuthStore();
  const [step, setStep] = useState<number>(useAuthStore.getState().user ? 3 : 1);
  
  // Form State
  const [phone, setPhone] = useState(profile?.phone || '');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [address, setAddress] = useState<Omit<Address, 'id' | 'isDefault'>>({
    type: 'home',
    name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    receiverName: '',
    receiverPhone: '',
    street1: '',
    street2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'initiating' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [otpState, setOtpState] = useState<'idle' | 'success' | 'error'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [timer, setTimer] = useState(30);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'applied' | 'error'>('idle');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);

  // Discount State — must be declared before useEffects that reference it
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  useEffect(() => {
    if (user && orders.length === 0 && discountPercent === 0) {
      setDiscountPercent(10);
    }
  }, [user, orders, discountPercent]);

  useEffect(() => {
    if (profile?.addresses) {
      const defaultAddr = profile.addresses.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (profile.addresses.length > 0) {
        setSelectedAddressId(profile.addresses[0].id);
      } else {
        setShowNewAddressForm(true);
      }
    }
  }, [profile]);

  // OTP Timer Logic
  useEffect(() => {
    let interval: any;
    if (step === 2 && timer > 0 && otpState !== 'success') {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer, otpState]);

  // Mock Auto-fetch City/State based on Pincode
  useEffect(() => {
    if (address.pincode.length === 6) {
      const timeout = setTimeout(() => {
        setAddress(prev => ({
          ...prev,
          city: prev.city || 'Mumbai',
          state: prev.state || 'Maharashtra'
        }));
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [address.pincode]);


  // VALID_COUPONS removed - now using useCouponStore

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    const discount = await useCouponStore.getState().validateCoupon(code);
    
    if (discount !== null) {
      setCouponDiscount(discount);
      setCouponCode(code);
      setCouponStatus('applied');
    } else {
      setCouponStatus('error');
      setCouponDiscount(0);
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponStatus('idle');
    setCouponDiscount(0);
  };

  const originalTotal = getCartTotal();
  const activeDiscountPercent = couponDiscount > 0 ? 0 : discountPercent;
  const firstOrderDiscount = Math.round(originalTotal * (activeDiscountPercent / 100));
  const couponDiscountAmount = Math.round(originalTotal * (couponDiscount / 100));
  
  const subtotalAfterDiscounts = originalTotal - firstOrderDiscount - couponDiscountAmount;
  const shippingFee = paymentMethod === 'cod' ? (subtotalAfterDiscounts >= 1500 ? 0 : 50) : 0;
  
  const finalTotal = Math.round(subtotalAfterDiscounts + shippingFee);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setIsProcessing(true);
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-checkout', { size: 'invisible' });
        }
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
        setConfirmationResult(result);
        
        setIsProcessing(false);
        setTimer(30);
        setStep(2);
      } catch (error: any) {
        console.error(error);
        setIsProcessing(false);
        alert(error.message || 'Failed to send OTP.');
      }
      return;
    }
    if (step === 2) {
      if (otp.length < 6) {
        setOtpState('error');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
        return;
      }
      
      if (!confirmationResult) {
        alert('Session expired.');
        return;
      }

      setIsProcessing(true);
      try {
        await confirmationResult.confirm(otp);
        setOtpState('success');
        setIsProcessing(false);
        setTimeout(() => setStep(prev => prev + 1), 700);
      } catch (error: any) {
        setIsProcessing(false);
        setOtpState('error');
        alert(error.message || 'Invalid OTP');
      }
      return;
    }
    if (step === 3 && showNewAddressForm) {
      // Save new address if form is visible
      const { useAuthStore } = await import('../store/useAuthStore');
      await useAuthStore.getState().addAddress({
        ...address,
        phone: address.phone || phone // Use the typed phone if not set
      });
      setShowNewAddressForm(false);
      // Wait a bit for profile to update then select it
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Idempotency guard — prevent double-clicks
    if (paymentState !== 'idle' && paymentState !== 'failed') return;
    setPaymentState('initiating');
    setPaymentError('');
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'cod') {
        // COD: create order via backend (server-side persistence)
        const apiUrl = env.VITE_API_URL;
        const codResponse = await fetch(`${apiUrl}/api/create-cod-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid,
            items: items.map(item => ({
              id: item.id, title: item.title, price: item.price, quantity: item.quantity, image: item.image
            })),
            total: finalTotal,
            shippingFee,
            couponCode: couponCode.trim() ? couponCode : undefined,
            shippingAddress: selectedAddress ? {
              name: selectedAddress.name || profile?.full_name || '',
              phone: selectedAddress.phone || profile?.phone || '',
              address: selectedAddress.street1 || '',
              city: selectedAddress.city || '',
              pincode: selectedAddress.pincode || '',
            } : undefined,
          })
        });
        const codData = await codResponse.json();
        if (codData.success) {
          await fetchOrders();
          setPaymentState('success');
          setIsProcessing(false);
          setStep(5);
          clearCart();
        } else {
          setPaymentError('Failed to place order. Please try again.');
          setPaymentState('failed');
          setIsProcessing(false);
        }
        return;
      }

      // 1. Load Razorpay script dynamically
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setPaymentError('Failed to load Razorpay SDK. Are you online?');
        setPaymentState('failed');
        setIsProcessing(false);
        return;
      }

      // 2. Ask our backend to create a Razorpay Order ID
      const apiUrl = env.VITE_API_URL;
      const orderResponse = await fetch(`${apiUrl}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalTotal, currency: 'INR' })
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData || !orderData.id) {
        throw new Error('Failed to create Razorpay order');
      }

      setPaymentState('processing');

      // 3. Open the Razorpay Popup
      const options = {
        key: env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Lumen Perfumes',
        description: 'Luxury Fragrance Purchase',
        order_id: orderData.id,
        prefill: {
          name: selectedAddress?.name || profile?.full_name || '',
          email: user?.email || '',
          contact: selectedAddress?.phone || profile?.phone || '',
        },
        theme: {
          color: '#1A1A1A'
        },
        modal: {
          ondismiss: () => {
            setPaymentError('Payment was cancelled. You can try again.');
            setPaymentState('failed');
            setIsProcessing(false);
          }
        },
        handler: async function (response: any) {
          // 4. On success, verify payment signature on backend — backend persists the order
          const vApiUrl = env.VITE_API_URL;
          const orderPayload = {
            userId: user?.uid,
            items: items.map(item => ({
              id: item.id, title: item.title, price: item.price, quantity: item.quantity, image: item.image
            })),
            total: finalTotal,
            paymentMethod,
            shippingFee,
            couponCode: couponCode.trim() ? couponCode : undefined,
            shippingAddress: selectedAddress ? {
              name: selectedAddress.name || profile?.full_name || '',
              phone: selectedAddress.phone || profile?.phone || '',
              address: selectedAddress.street1 || '',
              city: selectedAddress.city || '',
              pincode: selectedAddress.pincode || '',
            } : undefined,
          };
          const verifyResponse = await fetch(`${vApiUrl}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderPayload,
            })
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            // Order persisted server-side — refresh orders from DB and show success
            await fetchOrders();
            setPaymentState('success');
            setIsProcessing(false);
            setStep(5);
            clearCart();
          } else {
            setPaymentError('Payment verification failed! Please contact support with your payment ID.');
            setPaymentState('failed');
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setPaymentError(
          response?.error?.description ||
          'Payment failed. Please try a different payment method.'
        );
        setPaymentState('failed');
        setIsProcessing(false);
      });
      
      rzp.open();

    } catch (error) {
      console.error(error);
      setPaymentError('Something went wrong initiating the payment. Please try again.');
      setPaymentState('failed');
      setIsProcessing(false);
    }
  };

  const selectedAddress = profile?.addresses?.find(a => a.id === selectedAddressId);

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal tm-style">
        {step < 5 && (
          <button className="close-wizard" onClick={onClose} title="Close checkout">
            <X size={20} strokeWidth={3} />
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
              <div className="tm-header">
                <h2>Login or Sign Up</h2>
                <p>Please enter your mobile number to proceed</p>
              </div>
              
              <div className="floating-input-group">
                <span className="country-code">+91</span>
                <input 
                  type="tel" id="phone" className="floating-input with-prefix"
                  pattern="[0-9]{10}" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required autoFocus placeholder=" "
                />
                <label htmlFor="phone" className="floating-label">Mobile Number</label>
              </div>
              
              <button type="submit" className="btn-primary tm-btn" disabled={phone.length !== 10 || isProcessing}>
                {isProcessing ? <Loader className="spin" size={20} /> : 'CONTINUE'}
              </button>
              <p className="terms-text" style={{ fontSize: '0.7rem', color: '#888', marginTop: '10px', textAlign: 'center' }}>
                This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{color: '#0369a1', textDecoration: 'none'}}>Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{color: '#0369a1', textDecoration: 'none'}}>Terms of Service</a> apply.
              </p>
              <div id="recaptcha-checkout"></div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="wizard-form slide-in text-center">
              <div className="tm-header">
                <h2>Verify OTP</h2>
                <p>Sent to <strong>+91 {phone}</strong> <span className="edit-link" onClick={() => setStep(1)}>Edit</span></p>
              </div>

              <div className={`otp-container ${isShaking ? 'otp-shake' : ''}`}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <input
                    key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    className={`otp-box ${otpState}`} value={otp[i] || ''} autoFocus={i === 0}
                    onChange={e => {
                      setOtpState('idle');
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = otp.split('');
                      arr[i] = val;
                      setOtp(arr.join('').slice(0, 6));
                      if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                    }}
                  />
                ))}
              </div>

              <div className="timer-text">
                {timer > 0 ? (
                  <span>Resend OTP in <strong>00:{timer.toString().padStart(2, '0')}</strong></span>
                ) : (
                  <button type="button" className="resend-btn" onClick={() => setTimer(30)}>Resend OTP</button>
                )}
              </div>

              <button type="submit" className="btn-primary tm-btn" disabled={otp.length !== 6 || otpState === 'success' || isProcessing}>
                {isProcessing ? <Loader className="spin" size={20} /> : (otpState === 'success' ? 'VERIFIED' : 'VERIFY')}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="wizard-form slide-in">
              <div className="tm-header">
                <h2>Delivery Address</h2>
                <p>Select where you want your items delivered</p>
              </div>

              {!showNewAddressForm ? (
                <>
                  <div className="saved-addresses-list">
                    {profile?.addresses?.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`address-selection-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <div className="selection-indicator">
                          <div className="radio-circle"></div>
                        </div>
                        <div className="address-info">
                          <div className="address-meta">
                            <span className="type-label">{addr.type.toUpperCase()}</span>
                            {addr.isDefault && <span className="default-tag">DEFAULT</span>}
                          </div>
                          <p className="receiver-name">
                            {addr.type === 'other' ? addr.receiverName : addr.name}
                          </p>
                          <p className="address-text">{addr.street1}, {addr.street2}, {addr.city}, {addr.pincode}</p>
                          <p className="phone-text">Phone: {addr.type === 'other' ? addr.receiverPhone : (addr.phone || profile.phone)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="add-new-address-btn" onClick={() => setShowNewAddressForm(true)}>
                    <Plus size={18} /> ADD NEW ADDRESS
                  </button>

                  <button className="btn-primary tm-btn" onClick={() => setStep(4)} disabled={!selectedAddressId}>
                    DELIVER TO THIS ADDRESS <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                <form onSubmit={handleNextStep}>
                  <div className="address-type-selector small">
                    {['home', 'office', 'other'].map(type => (
                      <button 
                        key={type} type="button"
                        className={`type-chip ${address.type === type ? 'active' : ''}`}
                        onClick={() => setAddress({...address, type: type as any})}
                      >
                        {type === 'home' ? '🏠 Home' : type === 'office' ? '🏢 Office' : '🎁 Other'}
                      </button>
                    ))}
                  </div>

                  {address.type === 'other' && (
                    <div className="receiver-fields-animation">
                      <div className="floating-input-group">
                        <input type="text" id="rname" className="floating-input" required placeholder=" " value={address.receiverName} onChange={e => setAddress({...address, receiverName: e.target.value})} />
                        <label htmlFor="rname" className="floating-label">Receiver's Name</label>
                        <User className="input-icon" size={18} />
                      </div>
                      <div className="floating-input-group">
                        <input type="tel" id="rphone" className="floating-input" required placeholder=" " value={address.receiverPhone} onChange={e => setAddress({...address, receiverPhone: e.target.value})} />
                        <label htmlFor="rphone" className="floating-label">Receiver's Phone</label>
                        <Smartphone className="input-icon" size={18} />
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="floating-input-group">
                      <input type="text" id="pincode" className="floating-input" pattern="[0-9]{6}" required placeholder=" " value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} />
                      <label htmlFor="pincode" className="floating-label">PIN Code</label>
                      <MapPin className="input-icon" size={18} />
                    </div>
                    <div className="floating-input-group"><input type="text" className="floating-input" required placeholder=" " value={address.city} onChange={e => setAddress({...address, city: e.target.value})} /><label className="floating-label">City</label></div>
                    <div className="floating-input-group"><input type="text" className="floating-input" required placeholder=" " value={address.state} onChange={e => setAddress({...address, state: e.target.value})} /><label className="floating-label">State</label></div>
                  </div>

                  <div className="form-row">
                    <div className="floating-input-group">
                      <input type="text" className="floating-input" required placeholder=" " value={address.street1} onChange={e => setAddress({...address, street1: e.target.value})} />
                      <label className="floating-label">Flat / House / Building</label>
                    </div>

                    <div className="floating-input-group">
                      <input type="text" className="floating-input" required placeholder=" " value={address.street2} onChange={e => setAddress({...address, street2: e.target.value})} />
                      <label className="floating-label">Area / Street / Sector</label>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="floating-input-group">
                      <input type="text" className="floating-input" placeholder=" " value={address.landmark} onChange={e => setAddress({...address, landmark: e.target.value})} />
                      <label className="floating-label">Landmark (Optional)</label>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: '10px' }}>
                    <button type="submit" className="btn-primary tm-btn" style={{ flex: 2 }}>SAVE & DELIVER</button>
                    {(profile?.addresses?.length ?? 0) > 0 && (
                      <button type="button" className="btn-secondary tm-btn" style={{ flex: 1 }} onClick={() => setShowNewAddressForm(false)}>CANCEL</button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handlePayment} className="wizard-form slide-in">
              <div className="tm-header">
                <h2>Payment</h2>
                <p>100% Safe &amp; Secure Payments</p>
              </div>

              {selectedAddress && (
                <div className="delivery-summary-mini">
                  <p>Delivering to: <strong>{selectedAddress.type === 'other' ? selectedAddress.receiverName : selectedAddress.name}</strong></p>
                  <p className="tiny-addr">{selectedAddress.city}, {selectedAddress.pincode} <span className="edit-link" onClick={() => setStep(3)}>Change</span></p>
                </div>
              )}

              {/* ── Premium Order Summary ── */}
              <div className="tm-receipt">
                <div className="receipt-header">
                  <span className="receipt-title">Order Summary</span>
                  <span className="receipt-items-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="receipt-rows">
                  <div className="receipt-row"><span>Item Total</span><span>₹{originalTotal}</span></div>
                  {activeDiscountPercent > 0 && (
                    <div className="receipt-row discount">
                      <span>🎉 First Order ({activeDiscountPercent}% off)</span>
                      <span>−₹{firstOrderDiscount}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="receipt-row discount">
                      <span>🏷️ {couponCode} ({couponDiscount}% off)</span>
                      <span>−₹{couponDiscountAmount}</span>
                    </div>
                  )}
                  <div className="receipt-row shipping">
                    <span>Delivery</span>
                    {shippingFee > 0 ? (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>+₹{shippingFee} 🛵</span>
                    ) : (
                      <span className="free-tag">FREE 🚚</span>
                    )}
                  </div>
                </div>
                <div className="receipt-total-row">
                  <span>Total Payable</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              {/* ── Coupon Code ── */}
              <div className="coupon-section">
                <button type="button" className={`coupon-toggle ${couponOpen ? 'open' : ''}`} onClick={() => setCouponOpen(o => !o)}>
                  <span className="coupon-toggle-left"><Tag size={15} />{couponStatus === 'applied' ? <span><strong>{couponCode}</strong> applied ✓</span> : <span>Have a coupon code?</span>}</span>
                  <ChevronDown size={15} className={`coupon-chevron ${couponOpen ? 'rotated' : ''}`} />
                </button>
                {couponOpen && (
                  <div className="coupon-body">
                    {couponStatus === 'applied' ? (
                      <div className="coupon-applied-row">
                        <div className="coupon-applied-badge"><CheckCircle size={15} /><span>₹{couponDiscountAmount} saved!</span></div>
                        <button type="button" className="coupon-remove-btn" onClick={handleRemoveCoupon}>Remove</button>
                      </div>
                    ) : (
                      <>
                        <div className="coupon-input-row">
                          <input type="text" className="coupon-input" placeholder="Enter coupon code" value={couponInput}
                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponStatus('idle'); }}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())} />
                          <button type="button" className="coupon-apply-btn" onClick={handleApplyCoupon}>APPLY</button>
                        </div>
                        {couponStatus === 'error' && <p className="coupon-error">Invalid token</p>}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="payment-accordion">
                <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                  <div className="option-header">
                    <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                    <span className="option-title">UPI (Google Pay, PhonePe, Paytm)</span>
                    <span className="badge-offer">Offers</span>
                  </div>
                </label>
                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <div className="option-header">
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    <span className="option-title">Credit / Debit Card</span>
                  </div>
                </label>
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <div className="option-header">
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <span className="option-title">Cash on Delivery</span>
                  </div>
                </label>
              </div>

              {paymentError && (
                <div className="payment-error" style={{ color: '#9B2335', background: '#FDF0F2', padding: '10px 14px', borderRadius: '8px', margin: '10px 0', fontSize: '0.9rem', fontWeight: 600 }}>
                  {paymentError}
                </div>
              )}

              <button type="submit" className="btn-primary tm-btn" disabled={paymentState === 'initiating' || paymentState === 'processing'} aria-busy={paymentState === 'initiating' || paymentState === 'processing'}>
                {paymentState === 'initiating' && <><Loader className="spin" size={20} /> PREPARING PAYMENT...</>}
                {paymentState === 'processing' && <><Loader className="spin" size={20} /> PROCESSING...</>}
                {paymentState === 'failed' && `TRY AGAIN — PAY ₹${finalTotal}`}
                {(paymentState === 'idle' || paymentState === 'success') && `PAY ₹${finalTotal}`}
              </button>
            </form>
          )}


          {step === 5 && (
            <div className="wizard-success slide-in">
              <CheckCircle size={64} color="#2e7d32" />
              <h2>Order Confirmed!</h2>
              <p className="success-desc">Thank you for shopping with us!</p>
              <button className="btn-primary tm-btn" onClick={onClose}>CONTINUE SHOPPING</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutWizard;
