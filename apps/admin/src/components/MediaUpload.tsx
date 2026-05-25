import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Loader, ImageIcon, Video, CheckCircle, AlertCircle, Link, FileImage, FileVideo } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: 'image' | 'video' | 'both';
  bucket?: string;
  folder?: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const MediaUpload: React.FC<MediaUploadProps> = ({
  label,
  value,
  onChange,
  accept = 'image',
  bucket = 'products',
  folder = 'images'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const acceptAttr = accept === 'image'
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : accept === 'video'
    ? 'video/mp4,video/webm,video/mov'
    : 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/mov';

  const isVideo = value && (
    value.includes('.mp4') ||
    value.includes('.webm') ||
    value.includes('.mov') ||
    value.includes('video')
  );

  const validateFile = (file: File): string | null => {
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    if (accept === 'image' && !isImageFile) {
      return 'Please select an image file (JPEG, PNG, WebP, GIF).';
    }
    if (accept === 'video' && !isVideoFile) {
      return 'Please select a video file (MP4, WebM, MOV).';
    }
    if (!isImageFile && !isVideoFile) {
      return 'Please select a valid image or video file.';
    }

    if (isImageFile && file.size > MAX_IMAGE_SIZE) {
      return `Image size (${formatFileSize(file.size)}) exceeds the 5MB limit.`;
    }
    if (isVideoFile && file.size > MAX_VIDEO_SIZE) {
      return `Video size (${formatFileSize(file.size)}) exceeds the 50MB limit.`;
    }

    return null;
  };

  const simulateProgress = useCallback(() => {
    setUploadProgress(0);
    let current = 0;
    progressIntervalRef.current = setInterval(() => {
      current += Math.random() * 15 + 5;
      if (current > 90) current = 90;
      setUploadProgress(Math.round(current));
    }, 200);
  }, []);

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess(false);
    setUploadProgress(0);
    simulateProgress();

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadProgress(100);

      setTimeout(() => {
        onChange(data.publicUrl);
        setIsUploading(false);
        setUploadProgress(0);
        setSuccess(true);
        setPreviewLoaded(false);

        successTimeoutRef.current = setTimeout(() => setSuccess(false), 2500);
      }, 300);
    } catch (err: any) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadProgress(0);
      setError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [accept]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleRemove = () => {
    onChange('');
    setError('');
    setSuccess(false);
    setPreviewLoaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlSubmit = () => {
    if (urlInputValue.trim()) {
      onChange(urlInputValue.trim());
      setUrlInputValue('');
      setShowUrlInput(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  const triggerFileSelect = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  return (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#1f2937',
        marginBottom: '8px'
      }}>
        {label}
      </label>

      {/* Preview Area */}
      {value && (
        <div style={{
          position: 'relative',
          marginBottom: '12px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #e5e7eb',
          background: '#f9fafb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          {/* Success overlay */}
          {success && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(16, 185, 129, 0.15)',
              zIndex: 2,
              animation: 'fadeInOut 2.5s ease-in-out'
            }}>
              <div style={{
                background: '#10b981',
                borderRadius: '50%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                animation: 'scaleIn 0.3s ease-out'
              }}>
                <CheckCircle size={32} color="#fff" strokeWidth={2.5} />
              </div>
            </div>
          )}

          {isVideo ? (
            <video
              src={value}
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                display: 'block'
              }}
              muted
              playsInline
              controls={false}
            />
          ) : (
            <div style={{
              position: 'relative',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!previewLoaded && (
                <div style={{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#9ca3af'
                }}>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.8rem' }}>Loading preview...</span>
                </div>
              )}
              <img
                src={value}
                alt="preview"
                onLoad={() => setPreviewLoaded(true)}
                onError={() => setPreviewLoaded(true)}
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  display: 'block',
                  opacity: previewLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(239, 68, 68, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'transform 0.15s, background 0.15s',
              zIndex: 3
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Remove"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {/* File type badge */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 2
          }}>
            {isVideo ? <FileVideo size={12} /> : <FileImage size={12} />}
            {isVideo ? 'VIDEO' : 'IMAGE'}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={triggerFileSelect}
        style={{
          border: `2px dashed ${isDragOver ? '#6366f1' : error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: value ? '12px 16px' : '28px 20px',
          textAlign: 'center' as const,
          cursor: isUploading ? 'not-allowed' : 'pointer',
          background: isDragOver
            ? 'rgba(99, 102, 241, 0.06)'
            : error
            ? 'rgba(239, 68, 68, 0.03)'
            : '#fafbfc',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Progress bar */}
        {isUploading && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: '#e5e7eb'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              transition: 'width 0.2s ease',
              borderRadius: '0 2px 2px 0'
            }} />
          </div>
        )}

        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Loader size={22} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Uploading... {uploadProgress}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                Please wait while your file is being uploaded
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isDragOver
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}>
              {accept === 'video' ? (
                <Video size={24} color="#6366f1" />
              ) : accept === 'both' ? (
                <Upload size={24} color="#6366f1" />
              ) : (
                <ImageIcon size={24} color="#6366f1" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                {isDragOver ? 'Drop your file here' : value ? 'Replace file' : `Drag & drop or click to upload`}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '3px' }}>
                {accept === 'video'
                  ? 'MP4, WebM, MOV up to 50MB'
                  : accept === 'both'
                  ? 'Images up to 5MB, Videos up to 50MB'
                  : 'JPEG, PNG, WebP, GIF up to 5MB'}
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
      </div>

      {/* URL fallback toggle */}
      {!isUploading && (
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setShowUrlInput(!showUrlInput);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'none',
              border: 'none',
              color: '#6366f1',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 0',
              textDecoration: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            <Link size={13} />
            {showUrlInput ? 'Hide URL input' : 'Or paste a URL instead'}
          </button>

          {showUrlInput && (
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '6px',
              animation: 'slideDown 0.2s ease-out'
            }}>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={urlInputValue}
                onChange={e => setUrlInputValue(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#374151',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  background: '#fff'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleUrlSubmit(); }}
                disabled={!urlInputValue.trim()}
                style={{
                  padding: '8px 14px',
                  background: urlInputValue.trim() ? '#6366f1' : '#d1d5db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: urlInputValue.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap' as const
                }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          animation: 'shake 0.4s ease-in-out'
        }}>
          <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
};

export default MediaUpload;
