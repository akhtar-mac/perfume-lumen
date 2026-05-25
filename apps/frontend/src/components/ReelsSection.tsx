import React, { useState } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './ReelsSection.css';

const SAMPLE_REELS = [
  {
    id: 1,
    title: 'Aventus - The Legend',
    thumbnail: '/lumen_product_3.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:15',
    views: '12.5K',
  },
  {
    id: 2,
    title: 'Crimson Rouge 540',
    thumbnail: '/product-1.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:12',
    views: '8.3K',
  },
  {
    id: 3,
    title: 'Bleu de Lumen',
    thumbnail: '/lumen_product_5.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:18',
    views: '15.2K',
  },
  {
    id: 4,
    title: 'Savage - Wild & Free',
    thumbnail: '/lumen_product_4.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:10',
    views: '6.7K',
  },
  {
    id: 5,
    title: 'Dark Orchid - Luxurious',
    thumbnail: '/product-2.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:14',
    views: '9.1K',
  },
  {
    id: 6,
    title: 'Tobacco Vanilla - Warm',
    thumbnail: '/lumen_product_3.png',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '0:16',
    views: '11.4K',
  },
];

const ReelsSection: React.FC = () => {
  const [activeReel, setActiveReel] = useState<number | null>(null);
  const [scrollPos, setScrollPos] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('reels-scroll');
    if (container) {
      const scrollAmount = 280;
      const newPos = direction === 'left' ? scrollPos - scrollAmount : scrollPos + scrollAmount;
      container.scrollTo({ left: newPos, behavior: 'smooth' });
      setScrollPos(newPos);
    }
  };

  return (
    <section className="reels-section">
      <div className="container">
        <div className="reels-header">
          <h2>🎬 LUMEN <span className="highlight">REELS</span></h2>
          <p>Watch our fragrances in action</p>
        </div>

        <div className="reels-container">
          <button className="reels-nav-btn left" onClick={() => scroll('left')}>
            <ChevronLeft size={24} />
          </button>

          <div className="reels-scroll" id="reels-scroll">
            {SAMPLE_REELS.map((reel) => (
              <div key={reel.id} className="reel-card" onClick={() => setActiveReel(reel.id)}>
                <div className="reel-thumbnail">
                  <img src={reel.thumbnail} alt={reel.title} />
                  <div className="reel-overlay">
                    <Play size={32} fill="#fff" />
                  </div>
                  <span className="reel-duration">{reel.duration}</span>
                </div>
                <div className="reel-info">
                  <h4>{reel.title}</h4>
                  <span className="reel-views">👁 {reel.views} views</span>
                </div>
              </div>
            ))}
          </div>

          <button className="reels-nav-btn right" onClick={() => scroll('right')}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Video Modal */}
      {activeReel && (
        <div className="reel-modal" onClick={() => setActiveReel(null)}>
          <div className="reel-modal-content" onClick={e => e.stopPropagation()}>
            <button className="reel-modal-close" onClick={() => setActiveReel(null)}>
              <X size={24} />
            </button>
            <video
              src={SAMPLE_REELS.find(r => r.id === activeReel)?.videoUrl}
              autoPlay
              controls
              playsInline
            />
            <div className="reel-modal-info">
              <h3>{SAMPLE_REELS.find(r => r.id === activeReel)?.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReelsSection;
