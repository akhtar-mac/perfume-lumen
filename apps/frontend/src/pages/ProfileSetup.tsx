import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import './ProfileSetup.css';

const ProfileSetup: React.FC = () => {
  const { user, profile, updateProfile, addAddress, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    altPhone: '',
    street1: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Redirect if already setup or not logged in
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/');
      } else if (profile?.full_name && profile?.addresses?.length > 0) {
        navigate('/profile');
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    // Mock avatar selection for now
    const mockAvatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver'
    ];
    const randomAvatar = mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
    setAvatarUrl(randomAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Update Profile (Name and Phone)
      await updateProfile({ 
        full_name: formData.fullName,
        phone: user?.phoneNumber || formData.altPhone || ''
      });

      // 2. Add Address
      await addAddress({
        type: 'home',
        name: formData.fullName,
        email: user?.email || '',
        phone: user?.phoneNumber || formData.altPhone || '',
        street1: formData.street1,
        street2: '', // Optional
        landmark: '',
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });

      // Navigate to profile or home
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile setup:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="profile-setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1>Complete Your Profile</h1>
          <p>Just a few details to personalize your premium experience.</p>
        </div>

        <div className="avatar-upload-container">
          <div className="avatar-preview" onClick={handleAvatarClick}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar Preview" />
            ) : (
              <Camera size={32} className="avatar-placeholder" />
            )}
          </div>
          <button type="button" className="avatar-upload-btn" onClick={handleAvatarClick}>
            {avatarUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="fullName" 
                placeholder="Enter your full name" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Alternate Phone (Optional)</label>
              <input 
                type="tel" 
                name="altPhone" 
                placeholder="e.g. +1234567890" 
                value={formData.altPhone} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Delivery Address</label>
            <input 
              type="text" 
              name="street1" 
              placeholder="Flat, House no., Building, Apartment, Area" 
              value={formData.street1} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input 
                type="text" 
                name="city" 
                placeholder="City" 
                value={formData.city} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input 
                type="text" 
                name="state" 
                placeholder="State" 
                value={formData.state} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input 
                type="text" 
                name="pincode" 
                placeholder="ZIP / Pincode" 
                value={formData.pincode} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="setup-submit-btn" disabled={isLoading}>
            {isLoading ? <Loader className="spin" size={24} /> : (
              <>SAVE & CONTINUE <ArrowRight size={20} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
