import React from 'react';
import {
  LayoutDashboard,
  User,
  Layout,
  Palette,
  Music,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'avatar' | 'cover' | 'theme' | 'audio';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'avatar' as NavTab, label: 'Avatar', icon: User },
    { id: 'cover' as NavTab, label: 'Cover', icon: Layout },
    { id: 'theme' as NavTab, label: 'Theme', icon: Palette },
    { id: 'audio' as NavTab, label: 'Audio', icon: Music },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1.5px solid var(--border-card)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0,
      }}
    >
      <div>
        {/* Brand Logo & Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px 24px 12px',
            borderBottom: '1.5px solid var(--border-card)',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
              fontWeight: 900,
              fontSize: '1.2rem',
            }}
          >
            M
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Mystify Orbit
              </h1>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-red)' }}>
              ADMIN PANEL
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 12px 6px 12px',
            }}
          >
            Media Modules
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1.5px solid var(--primary-red-border)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--primary-red-subtle)' : 'transparent',
                  color: isActive ? 'var(--primary-red)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-red-subtle)';
                    e.currentTarget.style.color = 'var(--primary-red)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={18} color={isActive ? 'var(--primary-red)' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
