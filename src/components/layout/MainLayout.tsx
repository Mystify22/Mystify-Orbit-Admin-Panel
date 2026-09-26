import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { NavTab } from './Sidebar';
import { Header } from './Header';
import { AvatarUploader } from '../media/AvatarUploader';
import { CoverUploader } from '../media/CoverUploader';
import { ThemeUploader } from '../media/ThemeUploader';
import { AudioUploader } from '../media/AudioUploader';
import { ToastContainer } from '../common/Toast';
import { User, Layout, Palette, Music, ArrowRight } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const categories = [
    {
      id: 'avatar' as NavTab,
      title: 'Avatar',
      description: 'Upload user and admin profile photos and avatars.',
      icon: User,
    },
    {
      id: 'cover' as NavTab,
      title: 'Cover',
      description: 'Upload widescreen header covers, channel banners, and wide visuals.',
      icon: Layout,
    },
    {
      id: 'theme' as NavTab,
      title: 'Theme',
      description: 'Configure and save AI theme prompts, categories, and styling tags.',
      icon: Palette,
    },
    {
      id: 'audio' as NavTab,
      title: 'Audio',
      description: 'Upload high-bitrate music tracks, audio clips, and sound effects.',
      icon: Music,
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header activeTab={activeTab} />

        <main style={{ padding: '36px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 4 Primary Category Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                }}
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      className="red-card"
                      onClick={() => setActiveTab(cat.id)}
                      style={{
                        padding: '32px 28px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '230px',
                        transition: 'all 0.25s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-red)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-card)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                    >
                      <div>
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--primary-red-subtle)',
                            color: 'var(--primary-red)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            border: '1.5px solid var(--primary-red-soft)',
                          }}
                        >
                          <Icon size={28} />
                        </div>

                        <h3
                          style={{
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {cat.title}
                        </h3>

                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          {cat.description}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '24px',
                          color: 'var(--primary-red)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        <span>Open {cat.title} {cat.id === 'theme' ? 'Studio' : 'Uploader'}</span>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'avatar' && <AvatarUploader />}
          {activeTab === 'cover' && <CoverUploader />}
          {activeTab === 'theme' && <ThemeUploader />}
          {activeTab === 'audio' && <AudioUploader />}
        </main>
      </div>

      {/* Global Toast System Notifications */}
      <ToastContainer />
    </div>
  );
};
