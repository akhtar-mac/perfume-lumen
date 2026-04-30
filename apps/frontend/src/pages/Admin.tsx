import React, { useState, useEffect } from 'react';
import { Pencil, RotateCcw, Image as ImageIcon, LayoutDashboard, Package, Palette, Type, TrendingUp, Users, DollarSign, Tag, Trash2, Power } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EditProductModal from '../components/EditProductModal';
import AddProductModal from '../components/AddProductModal';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import { useCouponStore } from '../store/useCouponStore';
import { supabase } from '../lib/supabase';
import type { Product } from '../data/products';
import './Admin.css';

const Admin: React.FC = () => {
  const { products, resetProducts } = useProductStore();
  const siteStore = useSiteStore();
  const couponStore = useCouponStore();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'coupons' | 'theme' | 'hero' | 'content'>('overview');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '6m' | 'all'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  // Hero settings form state
  const [heroSettings, setHeroSettings] = useState({
    url: siteStore.heroMediaUrl,
    type: siteStore.heroMediaType,
    headline: siteStore.heroHeadline,
    subheadline: siteStore.heroSubheadline,
    btnText: siteStore.heroButtonText
  });

  // Content settings
  const [contentSettings, setContentSettings] = useState({
    announcement: siteStore.announcementText,
    gridTitle: siteStore.gridTitle
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    yellow: siteStore.themePrimaryYellow,
    pink: siteStore.themeAccentPink,
    blue: siteStore.themeAccentBlue
  });

  // Admin Stats State
  const [adminStats, setAdminStats] = useState({
    revenue: 0,
    unrealised: 0,
    orders: 0,
    aov: 0,
    bestSeller: { name: 'N/A', count: 0 },
    registeredUsers: 0,
    recentOrders: [] as any[],
    isLoading: true
  });

  // Fetch real-time orders for dashboard
  React.useEffect(() => {
    const fetchAdminStats = async () => {
      // Fetch orders based on time filter
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      const now = new Date();
      if (timeFilter === '7d') query = query.gte('created_at', new Date(now.setDate(now.getDate() - 7)).toISOString());
      else if (timeFilter === '30d') query = query.gte('created_at', new Date(now.setMonth(now.getMonth() - 1)).toISOString());
      else if (timeFilter === '6m') query = query.gte('created_at', new Date(now.setMonth(now.getMonth() - 6)).toISOString());

      const { data: orders, error } = await query;
        
      // Fetch profiles to match user details + count registered users
      const { data: profiles, count: profileCount } = await supabase
        .from('profiles')
        .select('id, full_name, address', { count: 'exact' });
        
      if (orders && !error) {
        let totalRev = 0;
        let unrealisedRev = 0;
        orders.forEach(order => {
          if (order.status === 'Delivered') {
            totalRev += (order.total || 0);
          } else if (order.status !== 'Cancelled') {
            unrealisedRev += (order.total || 0);
          }
        });
        
        // Calculate best seller
        const productCounts: Record<string, number> = {};
        orders.forEach(order => {
          order.items?.forEach((item: any) => {
            productCounts[item.title] = (productCounts[item.title] || 0) + item.quantity;
          });
        });
        
        let bestSeller = { name: 'N/A', count: 0 };
        Object.entries(productCounts).forEach(([name, count]) => {
          if (count > bestSeller.count) bestSeller = { name, count };
        });
        
        // Map user details to orders
        const enrichedOrders = orders.map(order => {
          const profile = profiles?.find(p => p.id === order.user_id);
          return {
            ...order,
            customerName: profile?.address?.name || profile?.full_name || 'Anonymous User',
            customerEmail: profile?.address?.email || 'No email provided',
            customerCity: profile?.address?.city || 'Unknown Location'
          };
        });

        setAdminStats({
          revenue: totalRev,
          unrealised: unrealisedRev,
          orders: orders.length,
          aov: orders.length > 0 ? Math.round((totalRev + unrealisedRev) / orders.length) : 0,
          bestSeller,
          registeredUsers: profileCount || 0,
          recentOrders: enrichedOrders,
          isLoading: false
        });
      } else {
        setAdminStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (activeTab === 'overview') {
      fetchAdminStats();
    }
  }, [activeTab, timeFilter]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      couponStore.fetchCoupons();
    }
  }, [activeTab]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all products to default? All local changes will be lost.")) {
      resetProducts();
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setAdminStats(prev => ({
      ...prev,
      recentOrders: prev.recentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    }));
    setUpdatingOrderId(null);
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'City', 'Total (INR)', 'Coupon Code', 'Status', 'Date', 'Items'];
    const rows = adminStats.recentOrders.map(o => [
      o.id.split('-')[0].toUpperCase(),
      o.customerName,
      o.customerEmail,
      o.customerCity,
      o.total,
      o.coupon_code || 'None',
      o.status,
      new Date(o.created_at).toLocaleDateString('en-IN'),
      o.items?.map((i: any) => `${i.title} x${i.quantity}`).join(' | ')
    ]);
    const csv = [headers, ...rows].map(r => r.map(String).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumen-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    siteStore.updateHeroSettings(heroSettings.url, heroSettings.type as 'image' | 'video');
    siteStore.updateContentSettings({
      heroHeadline: heroSettings.headline,
      heroSubheadline: heroSettings.subheadline,
      heroButtonText: heroSettings.btnText
    });
    alert('Hero settings saved!');
  };

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    siteStore.updateContentSettings({
      announcementText: contentSettings.announcement,
      gridTitle: contentSettings.gridTitle
    });
    alert('Content settings saved!');
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    siteStore.updateThemeSettings({
      themePrimaryYellow: themeSettings.yellow,
      themeAccentPink: themeSettings.pink,
      themeAccentBlue: themeSettings.blue
    });
    alert('Theme colors saved!');
  };

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-layout">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <LayoutDashboard size={24} />
            <h2>Dashboard</h2>
          </div>
          <ul className="admin-menu">
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              <LayoutDashboard size={20} /> Overview
            </li>
            <li className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
              <Package size={20} /> Products
            </li>
            <li className={activeTab === 'coupons' ? 'active' : ''} onClick={() => setActiveTab('coupons')}>
              <Tag size={20} /> Coupons
            </li>
            <li className={activeTab === 'theme' ? 'active' : ''} onClick={() => setActiveTab('theme')}>
              <Palette size={20} /> Theme Colors
            </li>
            <li className={activeTab === 'hero' ? 'active' : ''} onClick={() => setActiveTab('hero')}>
              <ImageIcon size={20} /> Hero Section
            </li>
            <li className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>
              <Type size={20} /> Site Content
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          {activeTab === 'overview' && (
            <>
              <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Analytics Dashboard</h1>
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  style={{ padding: '8px 15px', borderRadius: '8px', border: '2px solid var(--text-dark)', fontWeight: 'bold' }}
                >
                  <option value="all">All Time</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-icon blue"><DollarSign size={24} /></div>
                  <div className="analytics-info">
                    <h3>Total Revenue</h3>
                    <p>₹{adminStats.revenue.toLocaleString('en-IN')}</p>
                    <span className="trend positive">Delivered Orders</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon yellow"><DollarSign size={24} /></div>
                  <div className="analytics-info">
                    <h3>Unrealised Funds</h3>
                    <p>₹{adminStats.unrealised.toLocaleString('en-IN')}</p>
                    <span className="trend">Processing / Shipped</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon pink"><Package size={24} /></div>
                  <div className="analytics-info">
                    <h3>Total Orders</h3>
                    <p>{adminStats.orders}</p>
                    <span className="trend positive">Based on filter</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon yellow"><Package size={24} /></div>
                  <div className="analytics-info">
                    <h3>Best Seller</h3>
                    <p style={{ fontSize: '1.2rem' }}>{adminStats.bestSeller.name}</p>
                    <span className="trend positive">{adminStats.bestSeller.count} Units Sold</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon yellow"><Users size={24} /></div>
                  <div className="analytics-info">
                    <h3>Registered Users</h3>
                    <p>{adminStats.registeredUsers.toLocaleString('en-IN')}</p>
                    <span className="trend positive">Accounts Created</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon blue"><TrendingUp size={24} /></div>
                  <div className="analytics-info">
                    <h3>Site Visitors</h3>
                    <p>{siteStore.visitorCount.toLocaleString('en-IN')}</p>
                    <span className="trend positive">Session Tracked</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon green"><TrendingUp size={24} /></div>
                  <div className="analytics-info">
                    <h3>Conversion Rate</h3>
                    <p>{siteStore.visitorCount > 0 ? ((adminStats.orders / siteStore.visitorCount) * 100).toFixed(1) : '0.0'}%</p>
                    <span className="trend positive">Orders / Visitors</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon pink"><DollarSign size={24} /></div>
                  <div className="analytics-info">
                    <h3>Avg. Order Value</h3>
                    <p>₹{adminStats.aov.toLocaleString('en-IN')}</p>
                    <span className="trend positive">Revenue ÷ Orders</span>
                  </div>
                </div>
              </div>
              
              <div className="admin-card" style={{ marginTop: '30px', maxWidth: '100%', background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Order Management</h2>
                    <p className="admin-help-text">View, search, update delivery status, and export all orders.</p>
                  </div>
                  <button className="btn-primary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    ⬇ Export CSV
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search by customer name, email, city or order ID..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', border: '2px solid var(--border-light)', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {adminStats.isLoading ? (
                    <div className="comic-box" style={{ padding: '30px', textAlign: 'center' }}>Loading live order data...</div>
                  ) : adminStats.recentOrders.filter(o => {
                    const q = orderSearch.toLowerCase();
                    return !q || o.customerName?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q) || o.customerCity?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
                  }).length === 0 ? (
                    <div className="comic-box" style={{ padding: '30px', textAlign: 'center' }}>No orders found.</div>
                  ) : (
                    adminStats.recentOrders
                      .filter(o => {
                        const q = orderSearch.toLowerCase();
                        return !q || o.customerName?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q) || o.customerCity?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
                      })
                      .map((order, idx) => {
                        const statusColor: Record<string, string> = {
                          'Processing': '#f59e0b',
                          'Shipped': '#3b82f6',
                          'Delivered': '#10b981',
                          'Cancelled': '#ef4444'
                        };
                        const sc = statusColor[order.status] || '#888';
                        return (
                          <div key={idx} className="comic-box" style={{ padding: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Order Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-light)', paddingBottom: '10px' }}>
                              <div>
                                <strong style={{ fontSize: '1.1rem' }}>Order #{order.id.split('-')[0].toUpperCase()}</strong>
                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', marginBottom: 0 }}>
                                  {new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-pink)' }}>₹{order.total.toLocaleString('en-IN')}</h3>
                                {/* Status Dropdown */}
                                <select
                                  value={order.status}
                                  disabled={updatingOrderId === order.id}
                                  onChange={e => handleStatusChange(order.id, e.target.value)}
                                  style={{
                                    padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold',
                                    fontSize: '0.85rem', border: `2px solid ${sc}`, color: sc,
                                    background: 'white', cursor: 'pointer'
                                  }}
                                >
                                  <option value="Processing">🟡 Processing</option>
                                  <option value="Shipped">🔵 Shipped</option>
                                  <option value="Delivered">🟢 Delivered</option>
                                  <option value="Cancelled">🔴 Cancelled</option>
                                </select>
                                {updatingOrderId === order.id && <span style={{ fontSize: '0.8rem', color: '#888' }}>Saving...</span>}
                              </div>
                            </div>

                            {/* Customer & Items Split */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '2px solid var(--border-light)' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}><Users size={16}/> CUSTOMER</h4>
                                <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{order.customerName}</p>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>{order.customerEmail}</p>
                                <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>📍 {order.customerCity}</p>
                                {order.coupon_code && (
                                  <div style={{ marginTop: '10px', padding: '6px 10px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '4px', fontSize: '0.85rem', color: '#0369a1', fontWeight: 'bold' }}>
                                    🏷️ Coupon: {order.coupon_code}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}><Package size={16}/> ITEMS ({order.items?.length || 0})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {order.items?.map((item: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                                      <img src={item.image} alt={item.title} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                                      <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{item.title}</p>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>Qty: {item.quantity} × ₹{item.price}</p>
                                      </div>
                                      <strong>₹{item.quantity * item.price}</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <div className="admin-header">
                <h1>Product Management</h1>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn-primary" onClick={() => setIsAddingProduct(true)}>
                    + ADD NEW PERFUMES
                  </button>
                  <button className="btn-secondary" onClick={handleReset}>
                    <RotateCcw size={18} style={{ marginRight: '8px' }} />
                    RESET TO DEFAULTS
                  </button>
                </div>
              </div>

              {/* Bestseller Manager */}
              <div className="admin-card" style={{ marginBottom: '30px', maxWidth: '100%' }}>
                <h2 style={{ marginBottom: '5px' }}>⭐ Bestseller Manager</h2>
                <p className="admin-help-text" style={{ marginBottom: '20px' }}>
                  Manually select which products are shown as bestsellers. Click the star to toggle.
                  {siteStore.bestsellerIds.length > 0 && (
                    <span style={{ marginLeft: '10px', background: 'var(--primary-yellow)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid var(--text-dark)' }}>
                      {siteStore.bestsellerIds.length} selected
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {products.map(product => {
                    const isBS = siteStore.bestsellerIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => siteStore.toggleBestseller(product.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 16px',
                          border: `2px solid ${isBS ? 'var(--primary-yellow)' : 'var(--border-light)'}`,
                          borderRadius: '10px',
                          background: isBS ? '#fffde7' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: isBS ? '3px 3px 0px var(--text-dark)' : 'none',
                          fontWeight: isBS ? 'bold' : 'normal',
                        }}
                      >
                        <img src={product.images[0]} alt={product.title} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                        <span style={{ fontSize: '0.9rem' }}>{product.title}</span>
                        <span style={{ fontSize: '1.2rem' }}>{isBS ? '⭐' : '☆'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Original Price</th>
                      <th>Stock Status</th>
                      <th>Bestseller</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const inStock = product.inStock !== false;
                      return (
                        <tr key={product.id} style={{ opacity: inStock ? 1 : 0.65 }}>
                          <td style={{ position: 'relative' }}>
                            <img src={product.images[0]} alt={product.title} className="admin-thumbnail" />
                            {!inStock && (
                              <span style={{ position: 'absolute', top: '4px', left: '4px', background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '4px' }}>OUT</span>
                            )}
                          </td>
                          <td><strong>{product.title}</strong></td>
                          <td>₹{product.price}</td>
                          <td>₹{product.originalPrice}</td>
                          <td>
                            <button
                              onClick={() => useProductStore.getState().updateProduct(product.id, { inStock: !inStock })}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: `2px solid ${inStock ? '#10b981' : '#ef4444'}`,
                                background: inStock ? '#ecfdf5' : '#fef2f2',
                                color: inStock ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {inStock ? '✅ In Stock' : '❌ Out of Stock'}
                            </button>
                          </td>
                          <td>
                            <button
                              onClick={() => siteStore.toggleBestseller(product.id)}
                              style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}
                              title={siteStore.bestsellerIds.includes(product.id) ? 'Remove from Bestsellers' : 'Add to Bestsellers'}
                            >
                              {siteStore.bestsellerIds.includes(product.id) ? '⭐' : '☆'}
                            </button>
                          </td>
                          <td>
                            <button className="edit-btn" onClick={() => setEditingProduct(product)}>
                              <Pencil size={18} /> Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'coupons' && (
            <>
              <div className="admin-header">
                <h1>Discount Coupons</h1>
              </div>
              
              <div className="admin-card" style={{ maxWidth: '800px', marginBottom: '30px' }}>
                <h2>Create New Coupon</h2>
                <form 
                  className="admin-form" 
                  style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const code = (form.elements.namedItem('code') as HTMLInputElement).value;
                    const pct = parseInt((form.elements.namedItem('pct') as HTMLInputElement).value);
                    const maxUsesStr = (form.elements.namedItem('max_uses') as HTMLInputElement).value;
                    const maxUses = maxUsesStr ? parseInt(maxUsesStr) : null;
                    const success = await couponStore.createCoupon(code, pct, maxUses);
                    if (success) {
                      form.reset();
                      alert('Coupon created!');
                    } else alert('Failed to create coupon. Code might already exist.');
                  }}
                >
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Coupon Code</label>
                    <input type="text" name="code" className="admin-input" placeholder="e.g. SUMMER50" required style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Discount %</label>
                    <input type="number" name="pct" className="admin-input" placeholder="e.g. 15" min="1" max="100" required />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Max Uses (Optional)</label>
                    <input type="number" name="max_uses" className="admin-input" placeholder="e.g. 100" min="1" />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '15px 30px' }}>CREATE</button>
                </form>
              </div>

              <div className="admin-table-wrapper" style={{ maxWidth: '800px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Uses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponStore.isLoading ? (
                      <tr><td colSpan={5}>Loading coupons...</td></tr>
                    ) : couponStore.coupons.length === 0 ? (
                      <tr><td colSpan={5}>No coupons found.</td></tr>
                    ) : (
                      couponStore.coupons.map(coupon => (
                        <tr key={coupon.code} style={{ opacity: coupon.is_active ? 1 : 0.5 }}>
                          <td><strong>{coupon.code}</strong></td>
                          <td>{coupon.discount_percentage}% OFF</td>
                          <td>{coupon.current_uses} / {coupon.max_uses === null ? '∞' : coupon.max_uses}</td>
                          <td>
                            <span style={{ 
                              background: coupon.is_active ? '#e8f5e9' : '#ffebee', 
                              color: coupon.is_active ? '#2e7d32' : '#c62828',
                              padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' 
                            }}>
                              {coupon.is_active ? 'ACTIVE' : 'DISABLED'}
                            </span>
                          </td>
                          <td style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              className="edit-btn" 
                              onClick={() => couponStore.toggleCouponStatus(coupon.code, coupon.is_active)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <Power size={18} color={coupon.is_active ? '#f57c00' : '#2e7d32'} /> 
                              {coupon.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button 
                              className="edit-btn" 
                              onClick={() => {
                                if (window.confirm(`Delete coupon ${coupon.code}?`)) couponStore.deleteCoupon(coupon.code);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <Trash2 size={18} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'theme' && (
            <>
              <div className="admin-header">
                <h1>Theme & Branding</h1>
              </div>
              <div className="admin-card">
                <h2>Global Colors</h2>
                <p className="admin-help-text">Change the comic-style vibrant colors across your entire website.</p>
                <form onSubmit={handleSaveTheme} className="admin-form">
                  <div className="form-group">
                    <label>Primary Yellow (Accents)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="color" value={themeSettings.yellow} onChange={e => setThemeSettings({...themeSettings, yellow: e.target.value})} style={{ width: '50px', height: '50px', cursor: 'pointer' }} />
                      <input type="text" className="admin-input" value={themeSettings.yellow} onChange={e => setThemeSettings({...themeSettings, yellow: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Accent Pink (Primary Buttons)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="color" value={themeSettings.pink} onChange={e => setThemeSettings({...themeSettings, pink: e.target.value})} style={{ width: '50px', height: '50px', cursor: 'pointer' }} />
                      <input type="text" className="admin-input" value={themeSettings.pink} onChange={e => setThemeSettings({...themeSettings, pink: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Accent Blue (Secondary)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="color" value={themeSettings.blue} onChange={e => setThemeSettings({...themeSettings, blue: e.target.value})} style={{ width: '50px', height: '50px', cursor: 'pointer' }} />
                      <input type="text" className="admin-input" value={themeSettings.blue} onChange={e => setThemeSettings({...themeSettings, blue: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">SAVE THEME</button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'hero' && (
            <>
              <div className="admin-header">
                <h1>Hero Section Editor</h1>
              </div>
              
              <div className="admin-card" style={{ maxWidth: '800px' }}>
                <h2>Hero Content & Media</h2>
                <p className="admin-help-text">Update the main landing area that customers see first.</p>
                
                <form onSubmit={handleSaveHero} className="admin-form">
                  <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Media Type</label>
                      <select 
                        value={heroSettings.type} 
                        onChange={(e) => setHeroSettings({...heroSettings, type: e.target.value as 'image' | 'video'})}
                        className="admin-input"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video (MP4, WebM, YouTube)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Media URL</label>
                      <input 
                        type="text" 
                        value={heroSettings.url} 
                        onChange={(e) => setHeroSettings({...heroSettings, url: e.target.value})} 
                        className="admin-input"
                        placeholder="e.g., https://example.com/video.mp4"
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Main Headline (Use \n for new lines)</label>
                    <textarea 
                      value={heroSettings.headline} 
                      onChange={(e) => setHeroSettings({...heroSettings, headline: e.target.value})} 
                      className="admin-input"
                      rows={2}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Subheadline Text</label>
                    <input 
                      type="text" 
                      value={heroSettings.subheadline} 
                      onChange={(e) => setHeroSettings({...heroSettings, subheadline: e.target.value})} 
                      className="admin-input"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Call to Action Button Text</label>
                    <input 
                      type="text" 
                      value={heroSettings.btnText} 
                      onChange={(e) => setHeroSettings({...heroSettings, btnText: e.target.value})} 
                      className="admin-input"
                      required 
                    />
                  </div>

                  <button type="submit" className="btn-primary">SAVE HERO SETTINGS</button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'content' && (
            <>
              <div className="admin-header">
                <h1>Site Content Manager</h1>
              </div>
              <div className="admin-card" style={{ maxWidth: '800px' }}>
                <h2>Text Elements</h2>
                <p className="admin-help-text">Manage scrolling announcements and section titles.</p>
                <form onSubmit={handleSaveContent} className="admin-form">
                  <div className="form-group">
                    <label>Announcement Bar Text</label>
                    <textarea 
                      value={contentSettings.announcement} 
                      onChange={(e) => setContentSettings({...contentSettings, announcement: e.target.value})} 
                      className="admin-input"
                      rows={3}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Home Product Grid Title</label>
                    <input 
                      type="text" 
                      value={contentSettings.gridTitle} 
                      onChange={(e) => setContentSettings({...contentSettings, gridTitle: e.target.value})} 
                      className="admin-input"
                      required 
                    />
                  </div>
                  <button type="submit" className="btn-primary">SAVE CONTENT</button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
      
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
        />
      )}

      {isAddingProduct && (
        <AddProductModal onClose={() => setIsAddingProduct(false)} />
      )}
      
      <Footer />
    </div>
  );
};

export default Admin;
