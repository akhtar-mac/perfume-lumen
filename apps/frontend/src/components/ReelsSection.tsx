import React, { useState, useRef, useCallback } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Eye, Volume2, VolumeX, Maximize } from 'lucide-react';
import './ReelsSection.css';

interface Reel {
  id: number;
  title: string;
  subtitle: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  views: number;
  viewsLabel: string;
}

const SAMPLE_REELS: Reel[] = [
  {
    id: 1,
    title: 'Aventus - The Legend',
    subtitle: 'Creed • Iconic',
    thumbnail: '/lumen_product_3.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:15',
    views: 12500,
    viewsLabel: '12.5K',
  },
  {
    id: 2,
    title: 'Crimson Rouge 540',
    subtitle: 'MFK • Luxe',
    thumbnail: '/product-1.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:12',
    views: 8300,
    viewsLabel: '8.3K',
  },
  {
    id: 3,
    title: 'Bleu de Lumen',
    subtitle: 'Signature • Fresh',
    thumbnail: '/lumen_product_5.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:18',
    views: 15200,
    viewsLabel: '15.2K',
  },
  {
    id: 4,
    title: 'Savage - Wild & Free',
    subtitle: 'Dior • Bold',
    thumbnail: '/lumen_product_4.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:10',
    views: 6700,
    viewsLabel: '6.7K',
  },
  {
    id: 5,
    title: 'Dark Orchid - Luxurious',
    subtitle: 'Tom Ford • Night',
    thumbnail: '/product-2.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:14',
    views: 9100,
    viewsLabel: '9.1K',
  },
  {
    id: 6,
    title: 'Tobacco Vanilla - Warm',
    subtitle: 'Tom Ford • Rich',
    thumbnail: '/lumen_product_3.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:16',
    views: 11400,
    viewsLabel: '11.4K',
  },
];

const maxViews = Math.max(...SAMPLE_REELS.map(r => r.views));

const ReelsSection: React.FC = () => {
  const [activeReel, setActiveReel] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = 260;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  const openReel = (id: number) => {
    setActiveReel(id);
    setIsMuted(false);
  };

  const activeReelData = SAMPLE_REELS.find(r => r.id === activeReel);

  return (
    <section className="reels-section">
      <div className="reels-bg-gradient" />
      <div className="container">
        {/* Premium Section Header */}
        <div className="reels-header">
          <div className="reels-header-top">
            <div className="reels-badge">
              <span className="reels-badge-dot" />
              NOW TRENDING
            </div>
            <a href="#reels" className="reels-view-all">
              View All
              <ChevronRight size={16} />
            </a>
          </div>
          <h2 className="reels-title">
            LUMEN <span className="reels-title-accent">Reels</span>
          </h2>
          <p className="reels-subtitle">Watch our fragrances come to life — cinematic, curated, unforgettable.</p>
        </div>

        {/* Reels Carousel */}
        <div className="reels-carousel">
          <button className="reels-nav-btn reels-nav-left" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={22} />
          </button>

          <div className="reels-scroll" ref={scrollRef}>
            {SAMPLE_REELS.map((reel) => (
              <div
                key={reel.id}
                className="reel-card"
                onClick={() => openReel(reel.id)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${reel.title}`}
                onKeyDown={(e) => e.key === 'Enter' && openReel(reel.id)}
              >
                <div className="reel-card-inner">
                  {/* Thumbnail */}
                  <div className="reel-thumbnail">
                    <img src={reel.thumbnail} alt={reel.title} loading="lazy" />

                    {/* Animated Play Button Overlay */}
                    <div className="reel-play-overlay">
                      <div className="reel-play-btn">
                        <div className="reel-play-pulse" />
                        <Play size={28} fill="#fff" className="reel-play-icon" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="reel-duration-badge">
                      <Play size={10} fill="currentColor" />
                      <span>{reel.duration}</span>
                    </div>

                    {/* Bottom Gradient */}
                    <div className="reel-gradient-overlay" />

                    {/* Bottom Info */}
                    <div className="reel-card-info">
                      <h4 className="reel-card-title">{reel.title}</h4>
                      <p className="reel-card-subtitle">{reel.subtitle}</p>
                    </div>

                    {/* Views Progress Bar */}
                    <div className="reel-progress-bar">
                      <div
                        className="reel-progress-fill"
                        style={{ width: `${(reel.views / maxViews) * 100}%` }}
                      />
                    </div>

                    {/* Views Count */}
                    <div className="reel-views-badge">
                      <Eye size={12} />
                      <span>{reel.viewsLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="reels-nav-btn reels-nav-right" onClick={() => scroll('right')} aria-label="Scroll right">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Mobile swipe hint */}
        <div className="reels-swipe-hint">
          <span className="reels-swipe-line" />
          <span>Swipe to explore</span>
          <span className="reels-swipe-line" />
        </div>
      </div>

      {/* Full-Screen Video Modal */}
      {activeReel && activeReelData && (
        <div className="reel-modal" onClick={() => setActiveReel(null)}>
          <div
            className={`reel-modal-content ${activeReel ? 'reel-modal-enter' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className="reel-modal-close" onClick={() => setActiveReel(null)} aria-label="Close">
              <X size={22} />
            </button>

            {/* Video Container */}
            <div className="reel-modal-video-wrapper">
              <video
                src={activeReelData.videoUrl}
                autoPlay
                controls={false}
                playsInline
                loop
                muted={isMuted}
                className="reel-modal-video"
              />

              {/* Video Overlays */}
              <div className="reel-modal-video-overlay">
                <button
                  className="reel-modal-mute"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button className="reel-modal-fullscreen" aria-label="Fullscreen">
                  <Maximize size={20} />
                </button>
              </div>

              {/* Center play indicator on load */}
              <div className="reel-modal-loading">
                <div className="reel-modal-spinner" />
              </div>
            </div>

            {/* Modal Info */}
            <div className="reel-modal-info">
              <div className="reel-modal-info-header">
                <img src={activeReelData.thumbnail} alt="" className="reel-modal-avatar" />
                <div className="reel-modal-details">
                  <h3>{activeReelData.title}</h3>
                  <p>{activeReelData.subtitle}</p>
                </div>
              </div>
              <div className="reel-modal-stats">
                <span className="reel-modal-stat">
                  <Eye size={14} />
                  {activeReelData.viewsLabel} views
                </span>
                <span className="reel-modal-stat">
                  <Play size={14} fill="currentColor" />
                  {activeReelData.duration}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReelsSection;
