import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Image as ImageIcon, Film } from 'lucide-react';
import { useGalleryStore } from '../store/useGalleryStore';
import './MediaSlideshow.css';

const PLACEHOLDER_SLIDES = [
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80', caption: 'Luxury Fragrances' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=80', caption: 'Premium Collection' },
  { type: 'image' as const, url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80', caption: 'Designer Inspired' },
];

const MediaSlideshow: React.FC = () => {
  const { items } = useGalleryStore();
  const slides = items.length > 0 ? items : PLACEHOLDER_SLIDES;
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((index + slides.length) % slides.length);
      setIsTransitioning(false);
    }, 300);
  };

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) { if (timerRef.current) clearInterval(timerRef.current); return; }
    const slide = slides[current];
    if (slide.type === 'video') return; // video controls its own timing
    timerRef.current = setInterval(next, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, isPlaying, slides.length]);

  // Video ended → advance
  const handleVideoEnded = () => { if (isPlaying) next(); };

  // Play/pause video when switching
  useEffect(() => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.play().catch(() => {}) : videoRef.current.pause();
    }
  }, [current, isPlaying]);

  const slide = slides[current];

  return (
    <div className="slideshow-root">
      {/* Media */}
      <div className={`slideshow-media ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {slide.type === 'video' ? (
          <video
            ref={videoRef}
            src={slide.url}
            className="slideshow-video"
            autoPlay={isPlaying}
            muted
            playsInline
            loop={false}
            onEnded={handleVideoEnded}
          />
        ) : (
          <img src={slide.url} alt={slide.caption || ''} className="slideshow-img" />
        )}
        <div className="slideshow-overlay" />
      </div>

      {/* Caption */}
      {'caption' in slide && slide.caption && (
        <div className="slideshow-caption">{slide.caption}</div>
      )}

      {/* Controls */}
      <div className="slideshow-controls">
        <button className="ss-btn" onClick={prev} aria-label="Previous"><ChevronLeft size={18} /></button>
        <button className="ss-btn play-btn" onClick={() => setIsPlaying(p => !p)} aria-label="Play/Pause">
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="ss-btn" onClick={next} aria-label="Next"><ChevronRight size={18} /></button>
      </div>

      {/* Dots */}
      <div className="slideshow-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`ss-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide type badge */}
      <div className="slideshow-type-badge">
        {slide.type === 'video' ? <Film size={12} /> : <ImageIcon size={12} />}
        <span>{slide.type === 'video' ? 'VIDEO' : 'PHOTO'}</span>
        <span className="ss-counter">{current + 1}/{slides.length}</span>
      </div>
    </div>
  );
};

export default MediaSlideshow;
