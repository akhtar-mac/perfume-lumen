import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { User, Package, MapPin, Heart, LogOut, Settings, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import type { Address } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import AuthModal from '../components/AuthModal';

import './Profile.css';

const Profile: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { products } = useProductStore();
  const { bestsellerIds } = useSiteStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [ratedItems, setRatedItems] = useState<Record<string, number>>({});

  // Address Management State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id' | 'isDefault'>>({
    type: 'home',
    name: '',
    email: '',
    phone: '',
    receiverName: '',
    receiverPhone: '',
    street1: '',
    street2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const { addAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  
  // Account Form State
  // Password State Removed
  
  const [accountForm, setAccountForm] = useState({ full_name: '', phone: '' });

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
      setAccountForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
  }, [profile]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      const updatedAddresses = profile?.addresses.map(a => 
        a.id === editingAddressId ? { ...a, ...addressForm } : a
      ) || [];
      await updateProfile({ addresses: updatedAddresses });
      setEditingAddressId(null);
    } else {
      await addAddress(addressForm);
      setIsAddingAddress(false);
    }
    setAddressForm({
      type: 'home', name: '', email: '', phone: '', receiverName: '', receiverPhone: '',
      street1: '', street2: '', landmark: '', city: '', state: '', pincode: ''
    });
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({ ...address });
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
  };

  const handleCancelAddress = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setAddressForm({
      type: 'home', name: '', email: '', phone: '', receiverName: '', receiverPhone: '',
      street1: '', street2: '', landmark: '', city: '', state: '', pincode: ''
    });
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ full_name: accountForm.full_name, phone: accountForm.phone });
    alert("Account details updated!");
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
        <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
          <User size={64} color="var(--accent-blue)" style={{ marginBottom: '20px' }} />
          <h1>Account Login Required</h1>
          <p style={{ margin: '20px 0', color: '#666' }}>Please log in or create an account to view your profile and order history.</p>
          <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
            LOGIN / SIGN UP
          </button>
        </div>
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
      <div className="container profile-container">
        <div className="profile-sidebar">
          <div className="profile-user-info">
            <div className="profile-avatar">
              <User size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.2rem', wordBreak: 'break-all' }}>{profile?.full_name || user.phoneNumber || (user.email?.split('@')[0])}</h2>
            <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{user.phoneNumber || user.email}</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>SAVED ADDRESSES</h1>
                {!isAddingAddress && (
                  <button className="btn-primary" onClick={() => setIsAddingAddress(true)}>
                    + ADD NEW ADDRESS
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleSaveAddress} className="profile-form comic-box slide-in">
                  <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                  
                  <div className="address-type-selector" style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
                    {['home', 'office', 'other'].map(type => (
                      <label key={type} className={`type-chip ${addressForm.type === type ? 'active' : ''}`}>
                        <input 
                          type="radio" 
                          name="addressType" 
                          value={type} 
                          checked={addressForm.type === type} 
                          onChange={() => setAddressForm({...addressForm, type: type as any})}
                          style={{ display: 'none' }}
                        />
                        {type === 'home' ? '🏠 Home' : type === 'office' ? '🏢 Office' : '🎁 Someone Else'}
                      </label>
                    ))}
                  </div>

                  {addressForm.type === 'other' && (
                    <div className="receiver-details comic-box" style={{ padding: '15px', marginBottom: '20px', background: '#f0f9ff', border: '2px solid var(--text-dark)' }}>
                      <h4 style={{ marginBottom: '10px' }}>Receiver's Information</h4>
                      <div className="form-row">
                        <input type="text" placeholder="Receiver's Name" required value={addressForm.receiverName} onChange={e => setAddressForm({...addressForm, receiverName: e.target.value})} />
                        <input type="tel" placeholder="Receiver's Phone" required value={addressForm.receiverPhone} onChange={e => setAddressForm({...addressForm, receiverPhone: e.target.value})} />
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <input type="text" placeholder="Your Name" required value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} />
                    <input type="email" placeholder="Email Address" required value={addressForm.email} onChange={e => setAddressForm({...addressForm, email: e.target.value})} />
                  </div>
                  <input type="tel" placeholder="Phone Number" required value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} />
                  <input type="text" placeholder="Flat, House no., Building, Apartment" required value={addressForm.street1} onChange={e => setAddressForm({...addressForm, street1: e.target.value})} />
                  <input type="text" placeholder="Area, Street, Sector, Village" required value={addressForm.street2} onChange={e => setAddressForm({...addressForm, street2: e.target.value})} />
                  <input type="text" placeholder="Landmark (Optional)" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} />
                  <div className="form-row triplet">
                    <input type="text" placeholder="City" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
                    <input type="text" placeholder="State" required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
                    <input type="text" placeholder="PIN Code" pattern="[0-9]{6}" required value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                      <Save size={20} style={{ marginRight: '10px' }}/> {editingAddressId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                    </button>
                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleCancelAddress}>
                      CANCEL
                    </button>
                  </div>
                </form>
              ) : (
                <div className="address-grid">
                  {profile?.addresses?.length === 0 ? (
                    <div className="empty-state">
                      <MapPin size={48} color="#ccc" style={{ marginBottom: '15px' }}/>
                      <p>No addresses saved yet. Add one to speed up your checkout!</p>
                    </div>
                  ) : (
                    profile?.addresses?.map((addr) => (
                      <div key={addr.id} className={`address-card comic-box ${addr.isDefault ? 'default' : ''}`}>
                        <div className="address-card-header">
                          <span className="address-type-tag">
                            {addr.type === 'home' ? '🏠 HOME' : addr.type === 'office' ? '🏢 OFFICE' : '🎁 OTHER'}
                          </span>
                          {addr.isDefault && <span className="default-badge">DEFAULT</span>}
                        </div>
                        <div className="address-card-body">
                          {addr.type === 'other' ? (
                            <p><strong>Receiver:</strong> {addr.receiverName} ({addr.receiverPhone})</p>
                          ) : (
                            <p><strong>{addr.name}</strong></p>
                          )}
                          <p>{addr.street1}, {addr.street2}</p>
                          {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                          <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p>Contact: {addr.phone || profile.phone}</p>
                        </div>
                        <div className="address-card-actions">
                          <button onClick={() => handleEditAddress(addr)}>Edit</button>
                          <button onClick={() => deleteAddress(addr.id)}>Delete</button>
                          {!addr.isDefault && (
                            <button onClick={() => setDefaultAddress(addr.id)}>Set Default</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
