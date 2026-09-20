import React from 'react';
import type { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Select a media category to upload and manage assets',
    },
    avatar: {
      title: 'Avatar',
      subtitle: 'Upload user and profile images',
    },
    cover: {
      title: 'Cover',
      subtitle: 'Upload banner and header images',
    },
    theme: {
      title: 'Theme',
      subtitle: 'Upload theme and background assets',
    },
    audio: {
      title: 'Audio',
      subtitle: 'Upload audio tracks and sound files',
    },
  };

  const current = tabTitles[activeTab];

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1.5px solid var(--border-card)',
        padding: '20px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {current.subtitle}
        </p>
      </div>
    </header>
  );
};
