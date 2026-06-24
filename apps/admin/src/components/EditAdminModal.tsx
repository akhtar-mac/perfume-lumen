import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import './EditAdminModal.css';

interface EditAdminModalProps {
  admin: any;
  onClose: () => void;
  onSave: (updatedAdmin: any) => void;
  onDelete: (id: string, phone: string) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview & Dashboard' },
  { id: 'products', label: 'Products Management' },
  { id: 'coupons', label: 'Coupons Management' },
  { id: 'customers', label: 'Customer Directory' },
  { id: 'theme', label: 'Theme Colors' },
  { id: 'hero', label: 'Hero Section' },
  { id: 'content', label: 'Content Management' }
];

const EditAdminModal: React.FC<EditAdminModalProps> = ({ admin, onClose, onSave, onDelete }) => {
  const [phone, setPhone] = useState(admin.phone);
  const [password, setPassword] = useState(admin.password);
  const [permissions, setPermissions] = useState<string[]>(
    admin.permissions || ['overview', 'products', 'coupons', 'customers', 'theme', 'hero', 'content']
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePermission = (tabId: string) => {
    setPermissions(prev => 
      prev.includes(tabId) ? prev.filter(t => t !== tabId) : [...prev, tabId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const update: { phone: string; password_hash?: string; permissions: string[] } = {
        phone,
        permissions,
      };
      if (password) {
        update.password_hash = await bcrypt.hash(password, 12);
      }
      const { data, error: updateError } = await supabase
        .from('admin_users')
        .update(update)
        .eq('id', admin.id)
        .select()
        .single();

      if (updateError) throw updateError;
      onSave(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update admin');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal slide-in">
        <button className="close-wizard" onClick={onClose}><X size={20} strokeWidth={3} /></button>
        
        <div className="tm-header">
          <h2>Edit Admin Access</h2>
          <p>Update credentials or manage page permissions</p>
        </div>
        
        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="floating-input-group">
            <input 
              type="tel" 
              id="edit-phone"
              className="floating-input"
              value={phone} 
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
              required 
              placeholder=" "
            />
            <label htmlFor="edit-phone" className="floating-label">Phone Number</label>
          </div>
          
          <div className="floating-input-group">
            <input 
              type="password" 
              id="edit-password"
              className="floating-input"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder=" "
            />
            <label htmlFor="edit-password" className="floating-label">New Password (leave blank to keep)</label>
          </div>

          {admin.role !== 'superadmin' && (
            <div style={{ marginTop: '24px', marginBottom: '16px' }}>
              <label style={{ fontWeight: 'bold', color: 'var(--text-dark)', fontSize: '0.95rem' }}>Page Permissions</label>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Select which tabs this admin is allowed to see.</p>
              
              <div className="permissions-grid">
                {TABS.map(tab => (
                  <label key={tab.id} className={`permission-toggle ${permissions.includes(tab.id) ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="permission-checkbox"
                      checked={permissions.includes(tab.id)} 
                      onChange={() => togglePermission(tab.id)} 
                    />
                    {tab.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button type="submit" className="tm-btn" style={{ flex: 1, margin: 0 }} disabled={isLoading}>
              {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button 
              type="button" 
              onClick={() => onDelete(admin.id, admin.phone)}
              style={{ 
                width: '56px', 
                borderRadius: '8px', 
                border: '1px solid #ef4444', 
                background: '#fef2f2', 
                color: '#ef4444', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminModal;
