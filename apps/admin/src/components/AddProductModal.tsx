import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProductStore } from '../store/useProductStore';
import MediaUpload from './MediaUpload';
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
    images: ['', '', '', ''],
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

  const setImage = (index: number, url: string) => {
    setFormData(prev => {
      const imgs = [...prev.images];
      imgs[index] = url;
      return { ...prev, images: imgs };
    });
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

          <MediaUpload label="Main Image *" value={formData.images[0]} onChange={url => setImage(0, url)} folder="images" />
          <MediaUpload label="Notes Image (Hover)" value={formData.images[1]} onChange={url => setImage(1, url)} folder="images" />
          <div className="form-row">
            <MediaUpload label="Image 3" value={formData.images[2]} onChange={url => setImage(2, url)} folder="images" />
            <MediaUpload label="Image 4" value={formData.images[3]} onChange={url => setImage(3, url)} folder="images" />
          </div>
          <MediaUpload label="Product Video (Optional)" value={formData.videoUrl} onChange={url => setFormData(prev => ({ ...prev, videoUrl: url }))} accept="video" folder="videos" />

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
