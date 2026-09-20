import React from 'react';
import type { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Smartphone } from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const { user, logout } = useAuth();

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
        padding: '16px 36px',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user?.mobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary-red-subtle)',
              border: '1.5px solid var(--primary-red-soft)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary-red)',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Smartphone size={14} />
            <span>+91 {user.mobile.slice(-10)}</span>
          </div>
        )}

        {/* Quick Sign Out Button */}
        <button
          onClick={() => logout()}
          className="btn btn-ghost"
          style={{
            padding: '8px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            backgroundColor: '#ffffff',
          }}
          title="Sign out of Admin Panel"
        >
          <LogOut size={15} color="var(--primary-red)" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
