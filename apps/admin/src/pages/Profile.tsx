import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { User, Package, MapPin, Heart, LogOut, Settings, Save, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import type { Address } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products } = useProductStore();
  const { bestsellerIds } = useSiteStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [ratedItems, setRatedItems] = useState<Record<string, number>>({});

  // Address Form State
  const [addressForm, setAddressForm] = useState<Address>({
    name: '', email: '', street1: '', street2: '', landmark: '', city: '', state: '', pincode: ''
  });
  
  // Account Form State
  const [accountForm, setAccountForm] = useState({ full_name: '', phone: '' });
  
  // Password State
  const [passwords, setPasswords] = useState({ current: '', newPass: '' });
  const [passMessage, setPassMessage] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (user) {
      fetchOrders();
      unsubscribe = useOrderStore.getState().subscribeToOrders();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, fetchOrders]);

  useEffect(() => {
    if (profile) {
      if (profile.address) setAddressForm(profile.address);
      setAccountForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
  }, [profile]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ address: addressForm });
    alert("Address saved! This will be used at checkout.");
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ full_name: accountForm.full_name, phone: accountForm.phone });
    alert("Account details updated!");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage('Verifying current password...');
    if (!user?.email) return;

    // Verify current password by trying to log in
    const { error: verifyError } = await supabase.auth.signInWithPassword({ 
      email: user.email, 
      password: passwords.current 
    });

    if (verifyError) {
      setPassMessage('❌ Incorrect current password. No changes made.');
      return;
    }

    setPassMessage('Updating password...');
    const { error: updateError } = await supabase.auth.updateUser({ password: passwords.newPass });
    
    if (updateError) {
      setPassMessage(`❌ Error: ${updateError.message}`);
    } else {
      setPassMessage('✅ Password updated successfully!');
      setPasswords({ current: '', newPass: '' });
    }
  };

  const handleRateProduct = async (orderId: string, productId: number, rating: number) => {
    const key = `${orderId}-${productId}`;
    if (ratedItems[key]) return; // Already rated
    
    setRatedItems(prev => ({ ...prev, [key]: rating }));
    await useProductStore.getState().submitCustomerRating(productId, rating);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <Header />
        <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
          <User size={64} color="var(--accent-blue)" style={{ marginBottom: '20px' }} />
          <h1>Account Login Required</h1>
          <p style={{ margin: '20px 0', color: '#666' }}>Please log in or create an account to view your profile and order history.</p>
          <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
            LOGIN / SIGN UP
          </button>
        </div>
        <Footer />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing': return { color: '#f59e0b', emoji: '⏳' };
      case 'shipped': return { color: '#3b82f6', emoji: '🚚' };
      case 'delivered': return { color: '#10b981', emoji: '✅' };
      case 'cancelled': return { color: '#ef4444', emoji: '❌' };
      default: return { color: '#666', emoji: '📦' };
    }
  };

  const wishlistedProducts = products.filter(p => profile?.wishlist?.includes(p.id));

  return (
    <div className="profile-page">
      <Header />
      <div className="container profile-container">
        <div className="profile-sidebar">
          <div className="profile-user-info">
            <div className="profile-avatar">
              <User size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.2rem', wordBreak: 'break-all' }}>{profile?.full_name || user.email?.split('@')[0]}</h2>
            <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{user.email}</p>
          </div>
          
          <ul className="profile-menu">
            <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}><Package size={20} /> My Orders</li>
            <li className={activeTab === 'addresses' ? 'active' : ''} onClick={() => setActiveTab('addresses')}><MapPin size={20} /> Saved Addresses</li>
            <li className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => setActiveTab('wishlist')}><Heart size={20} /> Wishlist</li>
            <li className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}><Settings size={20} /> Account Details</li>
            <li onClick={() => signOut()} style={{ color: '#c62828', cursor: 'pointer', marginTop: '20px' }}><LogOut size={20} /> Sign Out</li>
          </ul>
        </div>
        
        <div className="profile-content">
          {activeTab === 'orders' && (
            <>
              <h1>MY ORDERS</h1>
              {isLoading ? (
                <p>Loading your orders...</p>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const statusStyle = getStatusStyle(order.status);
                  return (
                  <div key={order.id} className="mock-order">
                    <div className="order-header">
                      <div>
                        <p className="order-label">ORDER PLACED</p>
                        <p className="order-value">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="order-label">TOTAL</p>
                        <p className="order-value">₹{order.total}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <p className="order-label">ORDER #</p>
                        <p className="order-value">{String(order.id).split('-')[0].toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="order-body">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Status: <span style={{ color: statusStyle.color, fontWeight: 'bold' }}>{statusStyle.emoji} {order.status}</span>
                      </h3>
                      <div className="order-items">
                        {order.items.map((item, i) => (
                          <div key={i} className="order-item">
                            <img src={item.image} alt={item.title} />
                            <div style={{ flex: 1 }}>
                              <h4>{item.title}</h4>
                              <p>Qty: {item.quantity} | ₹{item.price}</p>
                              {order.status === 'Delivered' && (
                                <div style={{ marginTop: '10px' }}>
                                  {ratedItems[`${order.id}-${item.id}`] ? (
                                    <p style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                      ✅ You rated this {ratedItems[`${order.id}-${item.id}`]} stars!
                                    </p>
                                  ) : (
                                    <div>
                                      <p style={{ fontSize: '0.85rem', marginBottom: '5px', color: '#666' }}>Rate this product:</p>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <button
                                            key={star}
                                            onClick={() => handleRateProduct(order.id, item.id, star)}
                                            style={{
                                              background: 'none', border: 'none', padding: 0,
                                              fontSize: '1.2rem', color: '#fbbf24', cursor: 'pointer',
                                              transition: 'transform 0.1s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                          >
                                            ☆
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'addresses' && (
            <>
              <h1>SAVED ADDRESS</h1>
              <p style={{ marginBottom: '20px', color: '#666' }}>We will automatically use this address when you checkout.</p>
              <form onSubmit={handleSaveAddress} className="profile-form comic-box">
                <div className="form-row">
                  <input type="text" placeholder="Full Name" required value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} />
                  <input type="email" placeholder="Email Address" required value={addressForm.email} onChange={e => setAddressForm({...addressForm, email: e.target.value})} />
                </div>
                <input type="text" placeholder="Flat, House no., Building, Apartment" required value={addressForm.street1} onChange={e => setAddressForm({...addressForm, street1: e.target.value})} />
                <input type="text" placeholder="Area, Street, Sector, Village" required value={addressForm.street2} onChange={e => setAddressForm({...addressForm, street2: e.target.value})} />
                <input type="text" placeholder="Landmark (Optional)" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} />
                <div className="form-row triplet">
                  <input type="text" placeholder="City" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
                  <input type="text" placeholder="State" required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
                  <input type="text" placeholder="PIN Code" pattern="[0-9]{6}" required value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}><Save size={20} style={{ marginRight: '10px' }}/> SAVE ADDRESS</button>
              </form>
            </>
          )}

          {activeTab === 'wishlist' && (
            <>
              <h1>MY WISHLIST ({wishlistedProducts.length})</h1>
              {wishlistedProducts.length === 0 ? (
                <div className="empty-state">
                  <Heart size={48} color="#ccc" style={{ marginBottom: '15px' }}/>
                  <p>Your wishlist is empty. Tap the heart on products you love!</p>
                </div>
              ) : (
                <div className="product-grid" style={{ marginTop: '20px' }}>
                  {wishlistedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={`₹${product.price}`}
                      originalPrice={`₹${product.originalPrice}`}
                      images={product.images}
                      isBestseller={bestsellerIds.includes(product.id)}
                      rating={product.rating}
                      reviewsCount={product.reviewsCount}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'account' && (
            <>
              <h1>ACCOUNT DETAILS</h1>
              <div className="profile-form comic-box" style={{ marginBottom: '30px' }}>
                <h3>Personal Info</h3>
                <form onSubmit={handleSaveAccount} style={{ marginTop: '15px' }}>
                  <div className="form-row">
                    <input type="text" placeholder="Full Name" value={accountForm.full_name} onChange={e => setAccountForm({...accountForm, full_name: e.target.value})} />
                    <input type="tel" placeholder="Phone Number" value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>UPDATE DETAILS</button>
                </form>
              </div>

              <div className="profile-form comic-box">
                <h3><Lock size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }}/> Change Password</h3>
                <form onSubmit={handleChangePassword} style={{ marginTop: '15px' }}>
                  <input type="password" placeholder="Current Password" required minLength={6} value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                  <input type="password" placeholder="New Password" required minLength={6} value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} style={{ marginTop: '15px' }} />
                  <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>CHANGE PASSWORD</button>
                  {passMessage && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{passMessage}</p>}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
