import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Image as ImageIcon, ChevronRight } from 'lucide-react';

interface AvatarCategory {
  category: string;
  avatarUrls: string[];
}

interface ApiResponse {
  data: {
    content: AvatarCategory[];
  };
}

export const AvatarGallery: React.FC = () => {
  const [categories, setCategories] = useState<AvatarCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const fetchAvatars = async () => {
    try {
      setLoading(true);
      const userBaseUrl = import.meta.env.DEV
        ? ''
        : ((import.meta.env.VITE_USER_MS_URL as string | undefined)?.trim() ?? '');
      const response = await axios.get<ApiResponse>(
        `${userBaseUrl}/v1/users/get-avatar?pageNumber=0&pageSize=12`
      );
      const fetchedCategories = response.data.data.content;
      setCategories(fetchedCategories);
      setHasFetched(true);
      
      if (fetchedCategories.length > 0) {
        setSelectedCategory(fetchedCategories[0].category);
        if (fetchedCategories[0].avatarUrls.length > 0) {
          setSelectedAvatar(fetchedCategories[0].avatarUrls[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch avatars');
    } finally {
      setLoading(false);
    }
  };

  const activeCategoryData = categories.find((c) => c.category === selectedCategory);
  const activeAvatars = activeCategoryData ? activeCategoryData.avatarUrls : [];

  if (!hasFetched && !loading) {
    return (
      <div 
        className="red-card" 
        onClick={fetchAvatars}
        style={{ 
          padding: '16px 20px', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary-red-soft)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          const arrow = e.currentTarget.querySelector('.expand-arrow') as HTMLElement;
          if (arrow) {
            arrow.style.backgroundColor = 'var(--primary-red-subtle)';
            arrow.style.transform = 'translateX(4px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-card)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          const arrow = e.currentTarget.querySelector('.expand-arrow') as HTMLElement;
          if (arrow) {
            arrow.style.backgroundColor = 'var(--bg-subtle)';
            arrow.style.transform = 'translateX(0)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-red-subtle)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageIcon size={18} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Avatar Library</h2>
        </div>
        
        <div 
          className="expand-arrow"
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-subtle)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary-red)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease',
          }}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="red-card" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          .custom-loader {
            --color-1: var(--primary-red);
            --color-2: rgba(220, 38, 38, 0.5);
            --size: 0.8px;

            width: 0;
            height: calc(4.8 * var(--size));
            display: inline-block;
            position: relative;
            background: var(--color-1);
            box-shadow: 0 0 calc(10 * var(--size)) var(--color-2);
            box-sizing: border-box;
            animation: animFw 4s linear infinite;
          }
          .custom-loader::after,
          .custom-loader::before {
            content: '';
            width: calc(10 * var(--size));
            height: calc(1 * var(--size));
            background: var(--color-1);
            position: absolute;
            top: calc(9 * var(--size));
            right: calc(-2 * var(--size));
            opacity: 0;
            transform: rotate(-45deg) translateX(0);
            box-sizing: border-box;
            animation: coli1 0.3s linear infinite;
          }
          .custom-loader::before {
            top: calc(-4 * var(--size));
            transform: rotate(45deg);
            animation: coli2 0.3s linear infinite;
          }

          @keyframes animFw {
            0% {
              width: 0;
            }
            100% {
              width: 100%;
            }
          }

          @keyframes coli1 {
            0% {
              transform: rotate(-45deg) translateX(0);
              opacity: 0.7;
            }
            100% {
              transform: rotate(-45deg) translateX(calc(-45 * var(--size)));
              opacity: 0;
            }
          }

          @keyframes coli2 {
            0% {
              transform: rotate(45deg) translateX(0);
              opacity: 1;
            }
            100% {
              transform: rotate(45deg) translateX(calc(-45 * var(--size)));
              opacity: 0.7;
            }
          }
        `}</style>
        
        <div style={{ width: '160px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-start', marginBottom: '24px', height: '4px', marginTop: '12px' }}>
          <span className="custom-loader"></span>
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Loading Library...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="red-card" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--primary-red)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '16px' }}>{error}</p>
        <button className="btn btn-outline" onClick={fetchAvatars}>Try Again</button>
      </div>
    );
  }

  return (
    <div
      className="red-card"
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Choose Avatar</h2>
      </div>

      {/* Large Preview */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '2px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          {selectedAvatar ? (
            <img src={selectedAvatar} alt="Selected Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No Image</div>
          )}
        </div>
      </div>

      {/* Categories Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          width: '100%',
          paddingBottom: '16px',
          marginBottom: '24px',
          scrollbarWidth: 'none', // Firefox
          WebkitOverflowScrolling: 'touch',
        }}
        className="hide-scrollbar"
      >
        {categories.map((cat) => {
          const isActive = cat.category === selectedCategory;
          return (
            <button
              key={cat.category}
              onClick={() => {
                setSelectedCategory(cat.category);
                if (cat.avatarUrls.length > 0 && !cat.avatarUrls.includes(selectedAvatar)) {
                  setSelectedAvatar(cat.avatarUrls[0]);
                }
              }}
              style={{
                padding: '8px 24px',
                borderRadius: '24px',
                border: isActive ? '1px solid var(--primary-red)' : '1px solid var(--border-card)',
                backgroundColor: isActive ? 'var(--primary-red)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--primary-red-soft)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border-card)';
              }}
            >
              {cat.category}
            </button>
          );
        })}
      </div>

      {/* Avatars Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '24px',
          width: '100%',
        }}
      >
        {activeAvatars.map((url, idx) => {
          const isSelected = url === selectedAvatar;
          return (
            <div
              key={idx}
              onClick={() => setSelectedAvatar(url)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                border: isSelected ? '3px solid var(--primary-red)' : '3px solid transparent',
                padding: isSelected ? '4px' : '0px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src={url} alt={`Avatar ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Inject css to hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
