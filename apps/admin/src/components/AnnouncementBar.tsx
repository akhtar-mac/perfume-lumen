import React from 'react';
import { useSiteStore } from '../store/useSiteStore';
import './AnnouncementBar.css';

const AnnouncementBar: React.FC = () => {
  const { announcementText } = useSiteStore();

  return (
    <div className="announcement-bar">
      <div className="marquee">
        <div className="marquee-content">
          <span>⭐ {announcementText} ⭐</span>
          <span>⭐ {announcementText} ⭐</span>
          <span>⭐ {announcementText} ⭐</span>
          <span>⭐ {announcementText} ⭐</span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
