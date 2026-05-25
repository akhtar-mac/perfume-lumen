import React, { useState, useEffect } from 'react';
import { Pencil, RotateCcw, Image as ImageIcon, LayoutDashboard, Package, Palette, Type, TrendingUp, Users, DollarSign, Tag, LogOut, BarChart3, ShoppingBag, Eye } from 'lucide-react';
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

const ADMIN_SESSION_KEY = 'lumen_admin_session';

const AdminDashboard: React.FC = () => {
  const { products, resetProducts } = useProductStore();
  const siteStore = useSiteStore();
  const couponStore = useCouponStore();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'coupons' | 'theme' | 'hero' | 'content' | 'logs'>('overview');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '6m' | 'all'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  // Fetch real-time orders for dashboard
  React.useEffect(() => {
    const fetchAdminStats = async () => {
      addLog('Fetching admin stats...');
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      const now = new Date();
      if (timeFilter === '7d') query = query.gte('created_at', new Date(now.setDate(now.getDate() - 7)).toISOString());
      else if (timeFilter === '30d') query = query.gte('created_at', new Date(now.setMonth(now.getMonth() - 1)).toISOString());
      else if (timeFilter === '6m') query = query.gte('created_at', new Date(now.setMonth(now.getMonth() - 6)).toISOString());

      const { data: orders, error } = await query;
        
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
        addLog(`Stats loaded: ${orders.length} orders, ₹${totalRev} revenue`);
      } else {
        setAdminStats(prev => ({ ...prev, isLoading: false }));
        addLog('Error fetching stats');
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

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.reload();
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all products to default?")) {
      resetProducts();
      addLog('Products reset to defaults');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    addLog(`Updating order ${orderId} to ${newStatus}`);
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setAdminStats(prev => ({
      ...prev,
      recentOrders: prev.recentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    }));
    setUpdatingOrderId(null);
    addLog(`Order ${orderId} updated to ${newStatus}`);
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
    addLog('Orders exported to CSV');
  };

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    siteStore.updateHeroSettings(heroSettings.url, heroSettings.type as 'image' | 'video');
    siteStore.updateContentSettings({
      heroHeadline: heroSettings.headline,
      heroSubheadline: heroSettings.subheadline,
      heroButtonText: heroSettings.btnText
    });
    addLog('Hero settings saved');
    alert('Hero settings saved!');
  };

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    siteStore.updateContentSettings({
      announcementText: contentSettings.announcement,
      gridTitle: contentSettings.gridTitle
    });
    addLog('Content settings saved');
    alert('Content settings saved!');
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    siteStore.updateThemeSettings({
      themePrimaryYellow: themeSettings.yellow,
      themeAccentPink: themeSettings.pink,
      themeAccentBlue: themeSettings.blue
    });
    addLog('Theme colors saved');
    alert('Theme colors saved!');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Products', icon: <Package size={20} /> },
    { id: 'coupons', label: 'Coupons', icon: <Tag size={20} /> },
    { id: 'theme', label: 'Theme Colors', icon: <Palette size={20} /> },
    { id: 'hero', label: 'Hero Section', icon: <ImageIcon size={20} /> },
    { id: 'content', label: 'Site Content', icon: <Type size={20} /> },
    { id: 'logs', label: 'Activity Logs', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-layout">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <LayoutDashboard size={24} />
            <h2>Admin Panel</h2>
          </div>
          <ul className="admin-menu">
            {menuItems.map(item => (
              <li key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id as any)}>
                {item.icon} {item.label}
              </li>
            ))}
          </ul>
          <div className="admin-sidebar-footer">
            <button className="admin-logout-btn" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          {activeTab === 'overview' && (
            <>
              <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>📊 Analytics Dashboard</h1>
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
                  <div className="analytics-icon yellow"><ShoppingBag size={24} /></div>
                  <div className="analytics-info">
                    <h3>Best Seller</h3>
                    <p style={{ fontSize: '1.2rem' }}>{adminStats.bestSeller.name}</p>
                    <span className="trend positive">{adminStats.bestSeller.count} Units Sold</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon blue"><Users size={24} /></div>
                  <div className="analytics-info">
                    <h3>Registered Users</h3>
                    <p>{adminStats.registeredUsers.toLocaleString('en-IN')}</p>
                    <span className="trend positive">Accounts Created</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-icon pink"><Eye size={24} /></div>
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
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>📦 Order Management</h2>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-light)', paddingBottom: '10px' }}>
                              <div>
                                <strong style={{ fontSize: '1.1rem' }}>Order #{order.id.split('-')[0].toUpperCase()}</strong>
                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', marginBottom: 0 }}>
                                  {new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-pink)' }}>₹{order.total.toLocaleString('en-IN')}</h3>
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
                <h1>📦 Product Management</h1>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn-primary" onClick={() => { setIsAddingProduct(true); addLog('Add product modal opened'); }}>
                    + ADD NEW PRODUCT
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
                  Select which products are shown as bestsellers. Click the star to toggle.
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
                        onClick={() => { siteStore.toggleBestseller(product.id); addLog(`Bestseller toggled: ${product.title}`); }}
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
                      <th>Original</th>
                      <th>Stock</th>
                      <th>Rating</th>
                      <th>Badge</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td><img src={product.images[0]} alt={product.title} className="product-thumb" /></td>
                        <td><strong>{product.title}</strong></td>
                        <td>₹{product.price}</td>
                        <td>₹{product.originalPrice}</td>
                        <td>
                          <span className={`stock-badge ${product.inStock === false ? 'out' : 'in'}`}>
                            {product.inStock === false ? 'Out of Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td>⭐ {product.rating || 'N/A'} ({product.reviewsCount || 0})</td>
                        <td>
                          {product.badge && (
                            <span className={`badge-tag ${product.badge}`}>
                              {product.badge === 'new' ? '🆕 NEW' : product.badge === 'trending' ? '🔥 TRENDING' : product.badge === 'bestseller' ? '⭐ BEST' : '❌ SOLD OUT'}
                            </span>
                          )}
                        </td>
                        <td>
                          <button className="action-btn edit" onClick={() => { setEditingProduct(product); addLog(`Editing product: ${product.title}`); }}>
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'coupons' && (
            <>
              <div className="admin-header">
                <h1>🏷️ Coupon Management</h1>
              </div>
              <div className="admin-card">
                <p className="admin-help-text">Manage discount coupons and promotional codes.</p>
                <div style={{ marginTop: '20px' }}>
                  <p style={{ color: '#888' }}>Coupon management coming soon. For now, manage coupons directly in Supabase.</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'theme' && (
            <>
              <div className="admin-header">
                <h1>🎨 Theme Color Manager</h1>
              </div>
              <div className="admin-card" style={{ maxWidth: '600px' }}>
                <h2>Color Scheme</h2>
                <p className="admin-help-text">Change the website colors. Changes apply instantly.</p>
                <form onSubmit={handleSaveTheme} className="admin-form">
                  <div className="form-group">
                    <label>Primary Yellow</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={themeSettings.yellow} onChange={e => setThemeSettings({...themeSettings, yellow: e.target.value})} style={{ width: '50px', height: '40px', border: 'none', cursor: 'pointer' }} />
                      <input type="text" value={themeSettings.yellow} onChange={e => setThemeSettings({...themeSettings, yellow: e.target.value})} className="admin-input" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Accent Pink</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={themeSettings.pink} onChange={e => setThemeSettings({...themeSettings, pink: e.target.value})} style={{ width: '50px', height: '40px', border: 'none', cursor: 'pointer' }} />
                      <input type="text" value={themeSettings.pink} onChange={e => setThemeSettings({...themeSettings, pink: e.target.value})} className="admin-input" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Accent Blue</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={themeSettings.blue} onChange={e => setThemeSettings({...themeSettings, blue: e.target.value})} style={{ width: '50px', height: '40px', border: 'none', cursor: 'pointer' }} />
                      <input type="text" value={themeSettings.blue} onChange={e => setThemeSettings({...themeSettings, blue: e.target.value})} className="admin-input" />
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="theme-preview">
                    <h4>Preview</h4>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <div style={{ width: '60px', height: '60px', backgroundColor: themeSettings.yellow, borderRadius: '8px', border: '2px solid #333' }}></div>
                      <div style={{ width: '60px', height: '60px', backgroundColor: themeSettings.pink, borderRadius: '8px', border: '2px solid #333' }}></div>
                      <div style={{ width: '60px', height: '60px', backgroundColor: themeSettings.blue, borderRadius: '8px', border: '2px solid #333' }}></div>
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
                <h1>🖼️ Hero Section Manager</h1>
              </div>
              <div className="admin-card" style={{ maxWidth: '800px' }}>
                <h2>Hero Media & Content</h2>
                <p className="admin-help-text">Manage the main banner/hero section on the homepage.</p>
                <form onSubmit={handleSaveHero} className="admin-form">
                  <div className="form-group">
                    <label>Media Type</label>
                    <select value={heroSettings.type} onChange={e => setHeroSettings({...heroSettings, type: e.target.value as any})} className="admin-input">
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Media URL</label>
                    <input type="text" value={heroSettings.url} onChange={e => setHeroSettings({...heroSettings, url: e.target.value})} className="admin-input" placeholder="e.g., https://example.com/video.mp4" required />
                  </div>
                  <div className="form-group">
                    <label>Main Headline (Use \n for new lines)</label>
                    <textarea value={heroSettings.headline} onChange={e => setHeroSettings({...heroSettings, headline: e.target.value})} className="admin-input" rows={2} required />
                  </div>
                  <div className="form-group">
                    <label>Subheadline Text</label>
                    <input type="text" value={heroSettings.subheadline} onChange={e => setHeroSettings({...heroSettings, subheadline: e.target.value})} className="admin-input" required />
                  </div>
                  <div className="form-group">
                    <label>Call to Action Button Text</label>
                    <input type="text" value={heroSettings.btnText} onChange={e => setHeroSettings({...heroSettings, btnText: e.target.value})} className="admin-input" required />
                  </div>
                  <button type="submit" className="btn-primary">SAVE HERO SETTINGS</button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'content' && (
            <>
              <div className="admin-header">
                <h1>📝 Site Content Manager</h1>
              </div>
              <div className="admin-card" style={{ maxWidth: '800px' }}>
                <h2>Text Elements</h2>
                <p className="admin-help-text">Manage scrolling announcements and section titles.</p>
                <form onSubmit={handleSaveContent} className="admin-form">
                  <div className="form-group">
                    <label>Announcement Bar Text</label>
                    <textarea value={contentSettings.announcement} onChange={e => setContentSettings({...contentSettings, announcement: e.target.value})} className="admin-input" rows={3} required />
                  </div>
                  <div className="form-group">
                    <label>Home Product Grid Title</label>
                    <input type="text" value={contentSettings.gridTitle} onChange={e => setContentSettings({...contentSettings, gridTitle: e.target.value})} className="admin-input" required />
                  </div>
                  <button type="submit" className="btn-primary">SAVE CONTENT</button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'logs' && (
            <>
              <div className="admin-header">
                <h1>📋 Activity Logs</h1>
                <button className="btn-secondary" onClick={() => setLogs([])}>Clear Logs</button>
              </div>
              <div className="admin-card">
                <h2>Recent Activity</h2>
                <p className="admin-help-text">Track all admin actions for debugging.</p>
                <div className="logs-container">
                  {logs.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No activity yet. Actions will be logged here.</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="log-entry">{log}</div>
                    ))
                  )}
                </div>
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

export default AdminDashboard;
