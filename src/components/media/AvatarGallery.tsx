import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface CategoryItem {
  id: number;
  category: string;
}

interface CategoriesApiResponse {
  timestamp: string;
  code: number;
  status: string;
  success: boolean;
  message: string;
  data: {
    items: CategoryItem[];
    nextCursor: number | null;
    hasNext: boolean;
  };
}

interface AvatarsApiResponse {
  timestamp: string;
  code: number;
  status: string;
  success: boolean;
  message: string;
  data: {
    items: string[];
    nextCursor: number | null;
    hasNext: boolean;
  };
}

const CATEGORY_LIMIT = 10;
const AVATAR_LIMIT = 12;

const USER_BASE_URL = import.meta.env.DEV
  ? ''
  : ((import.meta.env.VITE_USER_MS_URL as string | undefined)?.trim() ?? '');

export const AvatarGallery: React.FC = () => {
  // Gallery open/collapsed state
  const [hasOpened, setHasOpened] = useState<boolean>(false);

  // Categories state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [categoriesNextCursor, setCategoriesNextCursor] = useState<number | null>(null);
  const [categoriesHasNext, setCategoriesHasNext] = useState<boolean>(false);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingMoreCategories, setLoadingMoreCategories] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Avatars state
  const [avatars, setAvatars] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [avatarsNextCursor, setAvatarsNextCursor] = useState<number | null>(null);
  const [avatarsHasNext, setAvatarsHasNext] = useState<boolean>(false);
  const [loadingAvatars, setLoadingAvatars] = useState<boolean>(false);
  const [loadingMoreAvatars, setLoadingMoreAvatars] = useState<boolean>(false);
  const [avatarsError, setAvatarsError] = useState<string | null>(null);

  // Refs
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const activeCategoryReqRef = useRef<number | null>(null);

  // Track scroll position for < button enable/disable
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);

  const updateScrollButtons = useCallback(() => {
    if (categoryScrollRef.current) {
      setCanScrollLeft(categoryScrollRef.current.scrollLeft > 4);
    }
  }, []);

  // -------------------------------------------------------------------------
  // 1. Fetch Categories (Initial & Pagination)
  // -------------------------------------------------------------------------
  const fetchCategories = async (isInitial: boolean = true) => {
    try {
      if (isInitial) {
        setLoadingCategories(true);
        setCategoriesError(null);
      } else {
        setLoadingMoreCategories(true);
      }

      const cursorParam = !isInitial && categoriesNextCursor !== null
        ? `&cursorId=${categoriesNextCursor}`
        : '';
      const url = `${USER_BASE_URL}/v1/users/avatar/categories?limit=${CATEGORY_LIMIT}${cursorParam}`;

      const response = await axios.get<CategoriesApiResponse>(url);
      const resData = response.data.data;
      const fetchedItems = resData.items || [];

      if (isInitial) {
        setCategories(fetchedItems);
        setCategoriesNextCursor(resData.nextCursor);
        setCategoriesHasNext(resData.hasNext);

        // Automatically select the first category if available
        if (fetchedItems.length > 0) {
          const first = fetchedItems[0];
          setSelectedCategory(first);
          fetchAvatarsForCategory(first.id, true);
        }
      } else {
        setCategories((prev) => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map((c) => c.id));
          const newUnique = fetchedItems.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newUnique];
        });
        setCategoriesNextCursor(resData.nextCursor);
        setCategoriesHasNext(resData.hasNext);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch categories';
      if (isInitial) {
        setCategoriesError(msg);
      }
    } finally {
      if (isInitial) {
        setLoadingCategories(false);
      } else {
        setLoadingMoreCategories(false);
      }
      setTimeout(updateScrollButtons, 100);
    }
  };

  // -------------------------------------------------------------------------
  // 2. Fetch Avatars for a specific category (Initial & Pagination)
  // -------------------------------------------------------------------------
  const fetchAvatarsForCategory = async (
    categoryId: number,
    isInitial: boolean = true,
    cursor: number | null = null
  ) => {
    try {
      activeCategoryReqRef.current = categoryId;

      if (isInitial) {
        setLoadingAvatars(true);
        setAvatarsError(null);
        setAvatars([]);
      } else {
        setLoadingMoreAvatars(true);
      }

      const cursorParam = !isInitial && cursor !== null ? `&cursorId=${cursor}` : '';
      const url = `${USER_BASE_URL}/v1/users/get-avatar?categoryId=${categoryId}&limit=${AVATAR_LIMIT}${cursorParam}`;

      const response = await axios.get<AvatarsApiResponse>(url);

      // Guard against race conditions if user switched categories
      if (activeCategoryReqRef.current !== categoryId) return;

      const resData = response.data.data;
      const fetchedUrls = resData.items || [];

      if (isInitial) {
        setAvatars(fetchedUrls);
        setAvatarsNextCursor(resData.nextCursor);
        setAvatarsHasNext(resData.hasNext);

        if (fetchedUrls.length > 0) {
          setSelectedAvatar(fetchedUrls[0]);
        } else {
          setSelectedAvatar('');
        }
      } else {
        setAvatars((prev) => [...prev, ...fetchedUrls]);
        setAvatarsNextCursor(resData.nextCursor);
        setAvatarsHasNext(resData.hasNext);
      }
    } catch (err: any) {
      if (activeCategoryReqRef.current !== categoryId) return;
      const msg = err.response?.data?.message || err.message || 'Failed to fetch avatars';
      setAvatarsError(msg);
    } finally {
      if (activeCategoryReqRef.current === categoryId) {
        if (isInitial) {
          setLoadingAvatars(false);
        } else {
          setLoadingMoreAvatars(false);
        }
      }
    }
  };

  // -------------------------------------------------------------------------
  // 3. User actions
  // -------------------------------------------------------------------------
  const handleOpenLibrary = () => {
    setHasOpened(true);
    if (categories.length === 0) {
      fetchCategories(true);
    }
  };

  const handleSelectCategory = (cat: CategoryItem) => {
    if (selectedCategory?.id === cat.id) return;
    setSelectedCategory(cat);
    fetchAvatarsForCategory(cat.id, true);
  };

  const handleScrollCategoryLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollCategoryRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
      // If approaching the end and more categories exist, fetch next
      const { scrollLeft, clientWidth, scrollWidth } = categoryScrollRef.current;
      if (
        scrollLeft + clientWidth >= scrollWidth - 80 &&
        categoriesHasNext &&
        !loadingMoreCategories &&
        categoriesNextCursor !== null
      ) {
        fetchCategories(false);
      }
    }
  };

  const handleCategoryScroll = () => {
    updateScrollButtons();
    if (!categoryScrollRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = categoryScrollRef.current;
    if (
      scrollLeft + clientWidth >= scrollWidth - 50 &&
      categoriesHasNext &&
      !loadingMoreCategories &&
      categoriesNextCursor !== null
    ) {
      fetchCategories(false);
    }
  };

  // -------------------------------------------------------------------------
  // 4. Infinite scroll observer for Avatars
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!hasOpened || loadingCategories || loadingAvatars) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          avatarsHasNext &&
          !loadingMoreAvatars &&
          avatarsNextCursor !== null &&
          selectedCategory
        ) {
          fetchAvatarsForCategory(selectedCategory.id, false, avatarsNextCursor);
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [
    hasOpened,
    loadingCategories,
    loadingAvatars,
    avatarsHasNext,
    loadingMoreAvatars,
    avatarsNextCursor,
    selectedCategory,
  ]);

  // -------------------------------------------------------------------------
  // Render: Collapsed "Avatar Library" Trigger Card
  // -------------------------------------------------------------------------
  if (!hasOpened && !loadingCategories) {
    return (
      <div
        className="red-card"
        onClick={handleOpenLibrary}
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
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-red-subtle)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={18} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Avatar Library
          </h2>
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

  // -------------------------------------------------------------------------
  // Render: Initial Loading State
  // -------------------------------------------------------------------------
  if (loadingCategories) {
    return (
      <div
        className="red-card"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={36} className="spin-animation" style={{ color: 'var(--primary-red)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Loading Avatar Library...
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Fetching categories from server...
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Categories Error State
  // -------------------------------------------------------------------------
  if (categoriesError) {
    return (
      <div
        className="red-card"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <AlertCircle size={36} style={{ color: 'var(--primary-red)', margin: '0 auto 12px auto' }} />
        <p style={{ color: 'var(--primary-red)', fontWeight: 600, fontSize: '1rem', marginBottom: '16px' }}>
          {categoriesError}
        </p>
        <button
          className="btn btn-outline"
          onClick={() => fetchCategories(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Full Gallery UI
  // -------------------------------------------------------------------------
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
      {/* Header */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-red-subtle)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={18} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Avatar Library
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Browse and select avatars by category
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (selectedCategory) {
              fetchAvatarsForCategory(selectedCategory.id, true);
            } else {
              fetchCategories(true);
            }
          }}
          disabled={loadingAvatars}
          title="Refresh current avatars"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-card)',
            backgroundColor: '#ffffff',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: loadingAvatars ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loadingAvatars) {
              e.currentTarget.style.borderColor = 'var(--primary-red-soft)';
              e.currentTarget.style.color = 'var(--primary-red)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-card)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <RefreshCw size={14} className={loadingAvatars ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Large Avatar Preview */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '3px solid var(--primary-red-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px auto',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-subtle)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
            }}
          >
            {selectedAvatar ? (
              <img
                src={selectedAvatar}
                alt="Selected Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Avatar</div>
            )}
          </div>
          {selectedCategory && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-red)',
                backgroundColor: 'var(--primary-red-subtle)',
                padding: '3px 10px',
                borderRadius: '12px',
                textTransform: 'capitalize',
              }}
            >
              {selectedCategory.category}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Categories Bar with Right-side < and > Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1.5px solid var(--border-card)',
          marginBottom: '28px',
          position: 'relative',
        }}
      >
        {/* Categories Horizontal Scroll Container */}
        <div
          ref={categoryScrollRef}
          onScroll={handleCategoryScroll}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            flex: 1,
            padding: '2px 0',
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: isSelected ? '1.5px solid var(--primary-red)' : '1.5px solid var(--border-card)',
                  backgroundColor: isSelected ? 'var(--primary-red)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(220, 38, 38, 0.28)' : 'var(--shadow-sm)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--primary-red-soft)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-card)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{cat.category}</span>
              </button>
            );
          })}

          {/* Loading more categories indicator */}
          {loadingMoreCategories && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px',
                color: 'var(--primary-red)',
                fontSize: '0.8rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Loader2 size={16} className="spin-animation" />
              <span>More...</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: 'var(--border-card)',
            margin: '0 4px',
            flexShrink: 0,
          }}
        />

        {/* Navigation Buttons on Right Side of the Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Previous (<) Button */}
          <button
            type="button"
            onClick={handleScrollCategoryLeft}
            disabled={!canScrollLeft}
            title="Previous categories"
            aria-label="Previous categories"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1.5px solid var(--border-card)',
              backgroundColor: '#ffffff',
              color: canScrollLeft ? 'var(--primary-red)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canScrollLeft ? 'pointer' : 'not-allowed',
              opacity: canScrollLeft ? 1 : 0.45,
              transition: 'all 0.2s ease',
              boxShadow: canScrollLeft ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Forward / Next (>) Button */}
          <button
            type="button"
            onClick={handleScrollCategoryRight}
            title="Next categories"
            aria-label="Next categories"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1.5px solid var(--border-card)',
              backgroundColor: '#ffffff',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Avatars Scroll Hint (when more are available) */}
      {avatarsHasNext && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Scroll down to load more
          </span>
        </div>
      )}

      {/* Avatars Loading State */}
      {loadingAvatars && (
        <div
          style={{
            textAlign: 'center',
            padding: '54px 16px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader2 size={32} className="spin-animation" style={{ color: 'var(--primary-red)', marginBottom: '12px' }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
            Loading avatars for "{selectedCategory?.category}"...
          </p>
        </div>
      )}

      {/* Avatars Error State */}
      {!loadingAvatars && avatarsError && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fee2e2',
            border: '1.5px solid #fca5a5',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: '#991b1b', fontWeight: 600, margin: '0 0 12px 0' }}>{avatarsError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => selectedCategory && fetchAvatarsForCategory(selectedCategory.id, true)}
            style={{ fontSize: '0.85rem', padding: '6px 16px' }}
          >
            Retry Category
          </button>
        </div>
      )}

      {/* Avatars Empty State */}
      {!loadingAvatars && !avatarsError && avatars.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: 'var(--text-muted)',
          }}
        >
          <ImageIcon size={42} style={{ color: 'var(--border-card)', margin: '0 auto 12px auto' }} />
          <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1rem' }}>
            No Avatars Available
          </strong>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            No avatars currently exist under the "{selectedCategory?.category}" category.
          </p>
        </div>
      )}

      {/* Avatars Grid */}
      {!loadingAvatars && avatars.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '20px',
              width: '100%',
            }}
          >
            {avatars.map((url, idx) => {
              const isSelected = url === selectedAvatar;
              return (
                <div
                  key={`${url}-${idx}`}
                  onClick={() => setSelectedAvatar(url)}
                  title="Click to select this avatar"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border: isSelected ? '3px solid var(--primary-red)' : '2px solid var(--border-card)',
                    padding: isSelected ? '3px' : '0px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isSelected ? 'scale(1.05)' : 'none',
                    boxShadow: isSelected ? '0 4px 14px rgba(220, 38, 38, 0.35)' : 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--primary-red-soft)';
                      e.currentTarget.style.transform = 'scale(1.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-card)';
                      e.currentTarget.style.transform = 'none';
                    }
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
                    <img
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Sentinel for Infinite Scroll */}
          <div ref={bottomSentinelRef} style={{ height: '20px', width: '100%' }} />

          {/* Loading More Avatars Spinner */}
          {loadingMoreAvatars && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '24px 0',
                color: 'var(--primary-red)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <Loader2 size={18} className="spin-animation" />
              <span>Loading more avatars...</span>
            </div>
          )}

          {/* End of list notification */}
          {!avatarsHasNext && avatars.length > AVATAR_LIMIT && (
            <div
              style={{
                textAlign: 'center',
                padding: '16px 0 0 0',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              All avatars for this category loaded.
            </div>
          )}
        </>
      )}

      {/* Hide Scrollbars CSS */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
