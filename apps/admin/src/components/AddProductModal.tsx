import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProductStore } from '../store/useProductStore';
import './EditProductModal.css'; // Reusing CSS

interface AddProductModalProps {
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onClose }) => {
  const addProduct = useProductStore(state => state.addProduct);
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    originalPrice: 0,
    images: ['/product-1.png', '/product-1.png', '', ''],
    videoUrl: '',
    description: '',
    notes: 'Fresh, Citrus',
    rating: 4.8,
    reviewsCount: 120
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'originalPrice', 'rating', 'reviewsCount'].includes(name) ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      ...formData,
      notes: formData.notes.split(',').map(n => n.trim())
    });
    onClose();
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-content">
        <button className="admin-modal-close" onClick={onClose}><X size={24} /></button>
        <h2>Add New Perfume</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Current Price (₹)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Original Price (₹)</label>
              <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rating (1-5)</label>
              <input type="number" name="rating" value={formData.rating} onChange={handleChange} step="0.1" min="1" max="5" required />
            </div>
            <div className="form-group">
              <label>Review Count</label>
              <input type="number" name="reviewsCount" value={formData.reviewsCount} onChange={handleChange} min="0" required />
            </div>
          </div>
          <div className="form-group">
            <label>Main Image URL</label>
            <input type="text" value={formData.images[0]} onChange={(e) => setFormData(prev => ({...prev, images: [e.target.value, prev.images[1], prev.images[2], prev.images[3]]}))} required />
          </div>
          <div className="form-group">
            <label>Notes Image URL (Hover)</label>
            <input type="text" value={formData.images[1] || ''} onChange={(e) => setFormData(prev => ({...prev, images: [prev.images[0], e.target.value, prev.images[2], prev.images[3]]}))} />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Image 3 URL</label>
              <input type="text" value={formData.images[2] || ''} onChange={(e) => setFormData(prev => ({...prev, images: [prev.images[0], prev.images[1], e.target.value, prev.images[3]]}))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Image 4 URL</label>
              <input type="text" value={formData.images[3] || ''} onChange={(e) => setFormData(prev => ({...prev, images: [prev.images[0], prev.images[1], prev.images[2], e.target.value]}))} />
            </div>
          </div>
          <div className="form-group">
            <label>Video URL (Optional)</label>
            <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Notes (comma separated)</label>
            <input type="text" name="notes" value={formData.notes} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>ADD PRODUCT</button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
