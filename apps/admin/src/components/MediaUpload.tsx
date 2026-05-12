import React, { useState } from 'react';
import { Upload, X, Loader, ImageIcon, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'video' | 'both';
  bucket?: string;
  folder?: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  label,
  value,
  onChange,
  accept = 'image',
  bucket = 'products',
  folder = 'images'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const acceptAttr = accept === 'image'
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : accept === 'video'
    ? 'video/mp4,video/webm,video/mov'
    : 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/mov';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const isVideo = value && (value.includes('.mp4') || value.includes('.webm') || value.includes('.mov'));

  return (
    <div className="form-group">
      <label>{label}</label>

      {/* Preview */}
      {value && (
        <div style={{ position: 'relative', marginBottom: '8px', display: 'inline-block' }}>
          {isVideo ? (
            <video
              src={value}
              style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
              muted
              playsInline
            />
          ) : (
            <img
              src={value}
              alt="preview"
              style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
            />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: '4px', right: '4px',
              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
              width: '24px', height: '24px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px', border: '2px dashed #d1d5db', borderRadius: '8px',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        background: isUploading ? '#f9fafb' : '#fff',
        transition: 'border-color 0.2s, background 0.2s',
        fontSize: '0.875rem', color: '#374151', fontWeight: '500'
      }}
        onMouseEnter={e => { if (!isUploading) (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'; }}
      >
        {isUploading ? (
          <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
        ) : (
          <>
            {accept === 'video' ? <Video size={18} color="#6366f1" /> : <ImageIcon size={18} color="#6366f1" />}
            {value ? 'Replace File' : `Upload ${accept === 'video' ? 'Video' : 'Image'}`}
            <Upload size={14} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
          </>
        )}
        <input
          type="file"
          accept={acceptAttr}
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
      </label>

      {/* URL fallback input */}
      <input
        type="text"
        placeholder="Or paste URL directly..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ marginTop: '6px', fontSize: '0.78rem', padding: '6px 10px', color: '#6b7280' }}
      />

      {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}
    </div>
  );
};

export default MediaUpload;
