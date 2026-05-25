import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { User, Package, MapPin, Heart, LogOut, Settings, Save, Edit3, Trash2, Plus, Star, ShoppingBag, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
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
    type: 'home', name: '', email: '', phone: '', receiverName: '', receiverPhone: '',
    street1: '', street2: '', landmark: '', city: '', state: '', pincode: ''
  });
  
  const { addAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  const [accountForm, setAccountForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (user) {
      fetchOrders();
      unsubscribe = useOrderStore.getState().subscribeToOrders();
    }
    return () => { if (unsubscribe) unsubscribe(); };
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
    resetAddressForm();
  };

  const resetAddressForm = () => {
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
    resetAddressForm();
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ full_name: accountForm.full_name, phone: accountForm.phone });
    alert("Account details updated!");
  };

  const handleRateProduct = async (orderId: string, productId: number, rating: number) => {
    const key = `${orderId}-${productId}`;
    if (ratedItems[key]) return;
    setRatedItems(prev => ({ ...prev, [key]: rating }));
    await useProductStore.getState().submitCustomerRating(productId, rating);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container profile-login-prompt">
          <div className="login-prompt-box">
            <User size={64} color="var(--accent-pink)" />
            <h1>Welcome to LUMEN</h1>
            <p>Login to view your orders, wishlist, and account details.</p>
            <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
              LOGIN / SIGN UP
            </button>
          </div>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing': return { color: '#f59e0b', emoji: '⏳', icon: <Clock size={16} />, label: 'Processing' };
      case 'shipped': return { color: '#3b82f6', emoji: '🚚', icon: <Truck size={16} />, label: 'Shipped' };
      case 'delivered': return { color: '#10b981', emoji: '✅', icon: <CheckCircle size={16} />, label: 'Delivered' };
      case 'cancelled': return { color: '#ef4444', emoji: '❌', icon: <XCircle size={16} />, label: 'Cancelled' };
      default: return { color: '#666', emoji: '📦', icon: <Package size={16} />, label: status };
    }
  };

  const wishlistedProducts = products.filter(p => profile?.wishlist?.includes(p.id));

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: <Package size={18} />, count: orders.length },
    { id: 'addresses', label: 'Addresses', icon: <MapPin size={18} />, count: profile?.addresses?.length || 0 },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart size={18} />, count: wishlistedProducts.length },
    { id: 'account', label: 'Account', icon: <Settings size={18} /> },
  ];

  return (
    <div className="profile-page">
      <div className="container profile-container">
        {/* Sidebar - Desktop */}
        <div className="profile-sidebar">
          <div className="profile-user-info">
            <div className="profile-avatar">
              <User size={36} color="#fff" />
            </div>
            <h2>{profile?.full_name || user.phoneNumber || user.email?.split('@')[0] || 'User'}</h2>
            <p>{user.phoneNumber || user.email}</p>
          </div>
          
          <ul className="profile-menu">
            {tabs.map(tab => (
              <li key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="tab-badge">{tab.count}</span>
                )}
              </li>
            ))}
            <li className="sign-out-btn" onClick={() => signOut()}>
              <LogOut size={18} /> Sign Out
            </li>
          </ul>
        </div>

        {/* Mobile Tab Bar */}
        <div className="profile-mobile-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`mobile-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="mobile-tab-badge">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="profile-section">
              <div className="section-header">
                <h1>My Orders</h1>
                <p className="section-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
              </div>
              
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={56} color="#ddd" />
                  <h3>No orders yet</h3>
                  <p>Start shopping to see your orders here!</p>
                  <a href="/shop" className="btn-primary">SHOP NOW</a>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <div key={order.id} className="order-card">
                        <div className="order-card-header">
                          <div className="order-id-date">
                            <span className="order-id">#{String(order.id).split('-')[0].toUpperCase()}</span>
                            <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="order-total">₹{order.total.toLocaleString('en-IN')}</div>
                        </div>
                        
                        <div className="order-status-bar" style={{ borderColor: statusConfig.color }}>
                          <span className="status-icon" style={{ color: statusConfig.color }}>{statusConfig.icon}</span>
                          <span className="status-label" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                        </div>

                        <div className="order-items">
                          {order.items.map((item, i) => (
                            <div key={i} className="order-item">
                              <img src={item.image} alt={item.title} />
                              <div className="order-item-info">
                                <h4>{item.title}</h4>
                                <p>Qty: {item.quantity} × ₹{item.price}</p>
                              </div>
                              <div className="order-item-total">₹{item.quantity * item.price}</div>
                            </div>
                          ))}
                        </div>

                        {order.status === 'Delivered' && (
                          <div className="order-rating-section">
                            <p>Rate your products:</p>
                            <div className="rating-items">
                              {order.items.map((item, i) => {
                                const key = `${order.id}-${item.id}`;
                                const rated = ratedItems[key];
                                return (
                                  <div key={i} className="rating-item">
                                    <span className="rating-item-name">{item.title}</span>
                                    {rated ? (
                                      <span className="rated-badge">{'★'.repeat(rated)}{'☆'.repeat(5 - rated)} Rated!</span>
                                    ) : (
                                      <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <button key={star} onClick={() => handleRateProduct(order.id, item.id, star)}>
                                            <Star size={16} />
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="profile-section">
              <div className="section-header">
                <h1>Saved Addresses</h1>
                {!isAddingAddress && (
                  <button className="btn-primary btn-sm" onClick={() => setIsAddingAddress(true)}>
                    <Plus size={16} /> Add New
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleSaveAddress} className="address-form">
                  <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                  
                  <div className="address-type-selector">
                    {['home', 'office', 'other'].map(type => (
                      <label key={type} className={`type-chip ${addressForm.type === type ? 'active' : ''}`}>
                        <input type="radio" name="addressType" value={type} checked={addressForm.type === type} onChange={() => setAddressForm({...addressForm, type: type as any})} style={{ display: 'none' }} />
                        {type === 'home' ? '🏠 Home' : type === 'office' ? '🏢 Office' : '🎁 Someone Else'}
                      </label>
                    ))}
                  </div>

                  {addressForm.type === 'other' && (
                    <div className="receiver-details">
                      <h4>Receiver's Information</h4>
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
                  
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      <Save size={18} /> {editingAddressId ? 'UPDATE' : 'SAVE'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={handleCancelAddress}>CANCEL</button>
                  </div>
                </form>
              ) : (
                <div className="address-grid">
                  {profile?.addresses?.length === 0 ? (
                    <div className="empty-state">
                      <MapPin size={56} color="#ddd" />
                      <h3>No addresses saved</h3>
                      <p>Add an address to speed up checkout!</p>
                    </div>
                  ) : (
                    profile?.addresses?.map((addr) => (
                      <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
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
                          <button onClick={() => handleEditAddress(addr)}><Edit3 size={14} /> Edit</button>
                          <button className="delete" onClick={() => deleteAddress(addr.id)}><Trash2 size={14} /> Delete</button>
                          {!addr.isDefault && (
                            <button className="set-default" onClick={() => setDefaultAddress(addr.id)}>Set Default</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="profile-section">
              <div className="section-header">
                <h1>My Wishlist</h1>
                <p className="section-subtitle">{wishlistedProducts.length} item{wishlistedProducts.length !== 1 ? 's' : ''} saved</p>
              </div>
              {wishlistedProducts.length === 0 ? (
                <div className="empty-state">
                  <Heart size={56} color="#ddd" />
                  <h3>Your wishlist is empty</h3>
                  <p>Tap the heart on products you love!</p>
                  <a href="/shop" className="btn-primary">BROWSE PRODUCTS</a>
                </div>
              ) : (
                <div className="product-grid">
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
                      badge={product.badge}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="profile-section">
              <div className="section-header">
                <h1>Account Details</h1>
              </div>
              <div className="account-form-wrapper">
                <div className="account-avatar-section">
                  <div className="account-avatar-large">
                    <User size={48} color="#fff" />
                  </div>
                  <div className="account-info">
                    <h3>{profile?.full_name || 'Your Name'}</h3>
                    <p>{user.phoneNumber || user.email}</p>
                  </div>
                </div>
                
                <form onSubmit={handleSaveAccount} className="account-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="Enter your full name" value={accountForm.full_name} onChange={e => setAccountForm({...accountForm, full_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="Enter your phone number" value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={user.email || user.phoneNumber || ''} disabled style={{ background: '#f5f5f5' }} />
                  </div>
                  <button type="submit" className="btn-primary">
                    <Save size={18} /> SAVE CHANGES
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
