import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Save, Trash2, Image as ImageIcon, FileText, Tag } from 'lucide-react';
import type { Product } from '../data/products';
import { useProductStore } from '../store/useProductStore';
import MediaUpload from './MediaUpload';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
}

const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: <FileText size={16} /> },
  { id: 'media', label: 'Images & Video', icon: <ImageIcon size={16} /> },
  { id: 'details', label: 'Details', icon: <Tag size={16} /> },
];

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose }) => {
  const updateProduct = useProductStore(state => state.updateProduct);
  const deleteProduct = useProductStore(state => state.deleteProduct);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: product.title,
    price: product.price,
    originalPrice: product.originalPrice,
    images: [...(product.images || ['', '', '', ''])].map(i => i || ''),
    videoUrl: product.videoUrl || '',
    description: product.description,
    notes: (product.notes || []).join(', '),
    rating: product.rating || 4.8,
    reviewsCount: product.reviewsCount || 120,
    category: product.category || 'men',
    inStock: product.inStock !== false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    updateProduct(product.id, {
      ...formData,
      notes: formData.notes.split(',').map(n => n.trim())
    });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product? This will permanently remove it from the database.')) {
      await deleteProduct(product.id);
      onClose();
    }
  };

  const nextStep = () => setActiveStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setActiveStep(s => Math.max(s - 1, 0));

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-product-wizard" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wizard-header">
          <h2>✏️ Edit Product</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn-delete" onClick={handleDelete} title="Delete product">
              <Trash2 size={16} /> Delete
            </button>
            <button className="wizard-close" onClick={onClose}><X size={22} /></button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="wizard-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`wizard-step-btn ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
              onClick={() => setActiveStep(i)}
            >
              <span className="step-num">{i < activeStep ? '✓' : i + 1}</span>
              <span className="step-icon">{s.icon}</span>
              <span className="step-label">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="wizard-body">
            {/* Step 1: Basic Info */}
            {activeStep === 0 && (
              <div className="wizard-step-content fade-in">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Selling Price (₹) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required min="1" />
                  </div>
                  <div className="form-group">
                    <label>Original Price (₹) *</label>
                    <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} required min="1" />
                  </div>
                  <div className="form-group">
                    <label>Rating (1-5)</label>
                    <input type="number" name="rating" value={formData.rating} onChange={handleChange} step="0.1" min="1" max="5" />
                  </div>
                  <div className="form-group">
                    <label>Review Count</label>
                    <input type="number" name="reviewsCount" value={formData.reviewsCount} onChange={handleChange} min="0" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Media */}
            {activeStep === 1 && (
              <div className="wizard-step-content fade-in">
                <div className="media-grid">
                  <MediaUpload label="Main Image *" value={formData.images[0]} onChange={url => setImage(0, url)} folder="images" />
                  <MediaUpload label="Hover Image" value={formData.images[1]} onChange={url => setImage(1, url)} folder="images" />
                  <MediaUpload label="Image 3" value={formData.images[2]} onChange={url => setImage(2, url)} folder="images" />
                  <MediaUpload label="Image 4" value={formData.images[3]} onChange={url => setImage(3, url)} folder="images" />
                  <MediaUpload label="Product Video" value={formData.videoUrl} onChange={url => setFormData(prev => ({ ...prev, videoUrl: url }))} accept="video" folder="videos" />
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {activeStep === 2 && (
              <div className="wizard-step-content fade-in">
                <div className="form-grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Fragrance Notes (comma separated)</label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Fresh, Citrus, Woody" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="wizard-footer">
            <button type="button" className="btn-secondary" onClick={activeStep === 0 ? onClose : prevStep}>
              {activeStep === 0 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
            </button>
            <div className="wizard-actions">
              {activeStep < STEPS.length - 1 ? (
                <button type="button" className="btn-primary" onClick={nextStep}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" className="btn-primary btn-save">
                  <Save size={16} /> Save Changes
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
