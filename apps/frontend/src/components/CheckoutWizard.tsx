import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Smartphone, MapPin, CreditCard, Loader, Plus, ChevronRight, User } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Address } from '../store/useAuthStore';
import { loadRazorpayScript } from '../lib/razorpay';
import './CheckoutWizard.css';

interface CheckoutWizardProps {
  onClose: () => void;
}

const CheckoutWizard: React.FC<CheckoutWizardProps> = ({ onClose }) => {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { createOrder, orders, fetchOrders } = useOrderStore();
  const { user, profile } = useAuthStore();
  const [step, setStep] = useState<number>(useAuthStore.getState().user ? 3 : 1);
  
  // Form State
  const [phone, setPhone] = useState(profile?.phone || '');
  const [otp, setOtp] = useState('');
  
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
  const [otpState, setOtpState] = useState<'idle' | 'success' | 'error'>('idle');
  const [isShaking, setIsShaking] = useState(false);
  const [timer, setTimer] = useState(30);
  
  // Discount State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponCode] = useState('');

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


  const originalTotal = getCartTotal();
  const finalTotal = Math.round(originalTotal - (originalTotal * (discountPercent / 100)));

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setTimer(30);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (otp.length < 4) {
        setOtpState('error');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
        return;
      }
      setOtpState('success');
      
      // Actually log the user in using the demo hack!
      const formattedPhone = `+91${phone}`;
      const { useAuthStore } = await import('../store/useAuthStore');
      await useAuthStore.getState().loginWithPhoneHack(formattedPhone);

      setTimeout(() => setStep(prev => prev + 1), 700);
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
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'cod') {
        // Immediate processing for COD
        if (user) {
          await createOrder(finalTotal, items.map(item => ({
            id: item.id, title: item.title, price: item.price, quantity: item.quantity, image: item.image
          })), couponCode.trim() ? couponCode : undefined);
        }
        setIsProcessing(false);
        setStep(5);
        clearCart();
        return;
      }

      // 1. Load Razorpay script dynamically
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Failed to load Razorpay SDK. Are you online?');
        setIsProcessing(false);
        return;
      }

      // 2. Ask our backend to create a Razorpay Order ID
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const orderResponse = await fetch(`${apiUrl}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalTotal, currency: 'INR' })
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData || !orderData.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // 3. Open the Razorpay Popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use the test key safely exposed
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
        handler: async function (response: any) {
          // 4. On success, verify payment signature on backend
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const verifyResponse = await fetch(`${apiUrl}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            // Payment is verified and secure! Save the order to DB
            if (user) {
              await createOrder(finalTotal, items.map(item => ({
                id: item.id, title: item.title, price: item.price, quantity: item.quantity, image: item.image
              })), couponCode.trim() ? couponCode : undefined);
            }
            setIsProcessing(false);
            setStep(5);
            clearCart();
          } else {
            alert('Payment verification failed! Please contact support.');
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      
      rzp.open();

    } catch (error) {
      console.error(error);
      alert('Something went wrong initiating the payment.');
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
              
              <button type="submit" className="btn-primary tm-btn" disabled={phone.length !== 10}>
                CONTINUE
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="wizard-form slide-in text-center">
              <div className="tm-header">
                <h2>Verify OTP</h2>
                <p>Sent to <strong>+91 {phone}</strong> <span className="edit-link" onClick={() => setStep(1)}>Edit</span></p>
              </div>

              <div className={`otp-container ${isShaking ? 'otp-shake' : ''}`}>
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    className={`otp-box ${otpState}`} value={otp[i] || ''} autoFocus={i === 0}
                    onChange={e => {
                      setOtpState('idle');
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = otp.split('');
                      arr[i] = val;
                      setOtp(arr.join('').slice(0, 4));
                      if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
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

              <button type="submit" className="btn-primary tm-btn" disabled={otp.length !== 4 || otpState === 'success'}>
                {otpState === 'success' ? 'VERIFIED' : 'VERIFY'}
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
                <p>100% Safe & Secure Payments</p>
              </div>

              {selectedAddress && (
                <div className="delivery-summary-mini">
                  <p>Delivering to: <strong>{selectedAddress.type === 'other' ? selectedAddress.receiverName : selectedAddress.name}</strong></p>
                  <p className="tiny-addr">{selectedAddress.city}, {selectedAddress.pincode} <span className="edit-link" onClick={() => setStep(3)}>Change</span></p>
                </div>
              )}
              
              <div className="tm-receipt">
                <div className="receipt-row"><span>Item Total</span><span>₹{originalTotal}</span></div>
                {discountPercent > 0 && <div className="receipt-row discount"><span>Discount ({discountPercent}%)</span><span>-₹{Math.round(originalTotal * (discountPercent / 100))}</span></div>}
                <div className="receipt-row total"><span>To Pay</span><span>₹{finalTotal}</span></div>
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

              <button type="submit" className="btn-primary tm-btn" disabled={isProcessing}>
                {isProcessing ? <><Loader className="spin" size={20} /> SECURING PAYMENT...</> : `PAY ₹${finalTotal}`}
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
