import React from 'react';
import { useSiteStore } from '../store/useSiteStore';
import './Hero.css';

const Hero: React.FC = () => {
  const { heroMediaUrl, heroMediaType, heroHeadline, heroSubheadline, heroButtonText } = useSiteStore();

  return (
    <section className="hero">
      <div className="hero-background">
        {heroMediaType === 'video' ? (
          heroMediaUrl.includes('youtube.com') || heroMediaUrl.includes('youtu.be') ? (
            <iframe 
              className="hero-media"
              src={heroMediaUrl.includes('watch?v=') 
                ? heroMediaUrl.replace('watch?v=', 'embed/') + '?autoplay=1&mute=1&loop=1&controls=0&playlist=' + heroMediaUrl.split('v=')[1]?.split('&')[0]
                : heroMediaUrl.includes('youtu.be/') 
                  ? heroMediaUrl.replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1&mute=1&loop=1&controls=0&playlist=' + heroMediaUrl.split('youtu.be/')[1]?.split('?')[0]
                  : heroMediaUrl}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ pointerEvents: 'none' }} // Prevents user interaction to act like background
            />
          ) : (
            <video src={heroMediaUrl} autoPlay loop muted playsInline className="hero-media" />
          )
        ) : (
          <img src={heroMediaUrl} alt="Luxury Perfume Collection" className="hero-media" />
        )}
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <h1>{heroHeadline.split('\n').map((line, i, arr) => (
          <React.Fragment key={i}>
            {i === arr.length - 1 ? <span className="highlight">{line}</span> : line}
            {i !== arr.length - 1 && <br/>}
          </React.Fragment>
        ))}</h1>
        <p>{heroSubheadline}</p>
        <button className="btn-primary">{heroButtonText}</button>
      </div>
    </section>
  );
};

export default Hero;
