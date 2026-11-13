import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
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
  // Selected category ID & avatar URL state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

  // Refs
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  // Track scroll position for < button enable/disable
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);

  const updateScrollButtons = useCallback(() => {
    if (categoryScrollRef.current) {
      setCanScrollLeft(categoryScrollRef.current.scrollLeft > 4);
    }
  }, []);

  // -------------------------------------------------------------------------
  // 1. TanStack Query: Categories Cache & Infinite Cursor Pagination
  // -------------------------------------------------------------------------
  const {
    data: categoriesData,
    fetchNextPage: fetchNextCategories,
    hasNextPage: hasNextCategories,
    isFetchingNextPage: isFetchingNextCategories,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesErrorObj,
    refetch: refetchCategories,
  } = useInfiniteQuery<CategoriesApiResponse, Error>({
    queryKey: ['avatar-categories'],
    queryFn: async ({ pageParam }) => {
      const cursorParam = pageParam !== null ? `&cursorId=${pageParam}` : '';
      const response = await axios.get<CategoriesApiResponse>(
        `${USER_BASE_URL}/v1/users/avatar/categories?limit=${CATEGORY_LIMIT}${cursorParam}`
      );
      return response.data;
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNext ? lastPage.data.nextCursor : undefined;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache freshness
    gcTime: 30 * 60 * 1000,    // 30 minutes in-memory retention
    refetchOnWindowFocus: false,
  });

  // Flatten and deduplicate categories across all loaded pages
  const categories: CategoryItem[] = useMemo(() => {
    if (!categoriesData?.pages) return [];
    const map = new Map<number, CategoryItem>();
    for (const page of categoriesData.pages) {
      if (page.data?.items) {
        for (const item of page.data.items) {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        }
      }
    }
    return Array.from(map.values());
  }, [categoriesData]);

  // Derived active category: explicit selection or defaults to the first category
  const selectedCategory: CategoryItem | null = useMemo(() => {
    if (selectedCategoryId !== null) {
      const found = categories.find((c) => c.id === selectedCategoryId);
      if (found) return found;
    }
    return categories[0] || null;
  }, [categories, selectedCategoryId]);

  const activeCategoryId = selectedCategory?.id;

  // -------------------------------------------------------------------------
  // 2. TanStack Query: Avatars Cache by Category with Cursor Pagination
  // -------------------------------------------------------------------------
  const {
    data: avatarsData,
    fetchNextPage: fetchNextAvatars,
    hasNextPage: hasNextAvatars,
    isFetchingNextPage: isFetchingNextAvatars,
    isLoading: isLoadingAvatars,
    isError: isAvatarsError,
    error: avatarsErrorObj,
    refetch: refetchAvatars,
  } = useInfiniteQuery<AvatarsApiResponse, Error>({
    queryKey: ['avatars', activeCategoryId],
    queryFn: async ({ pageParam }) => {
      const cursorParam = pageParam !== null ? `&cursorId=${pageParam}` : '';
      const response = await axios.get<AvatarsApiResponse>(
        `${USER_BASE_URL}/v1/users/get-avatar?categoryId=${activeCategoryId}&limit=${AVATAR_LIMIT}${cursorParam}`
      );
      return response.data;
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNext ? lastPage.data.nextCursor : undefined;
    },
    enabled: activeCategoryId !== undefined,
    staleTime: 5 * 60 * 1000,  // 5 minutes cache freshness per category
    gcTime: 30 * 60 * 1000,    // 30 minutes in-memory retention
    refetchOnWindowFocus: false,
  });

  // Flatten avatar image URLs across all loaded pages for the active category
  const avatars: string[] = useMemo(() => {
    if (!avatarsData?.pages) return [];
    const list: string[] = [];
    for (const page of avatarsData.pages) {
      if (page.data?.items) {
        list.push(...page.data.items);
      }
    }
    return list;
  }, [avatarsData]);

  // Derived active avatar: explicit selection or defaults to first in category
  const selectedAvatar: string = useMemo(() => {
    if (selectedAvatarUrl && avatars.includes(selectedAvatarUrl)) {
      return selectedAvatarUrl;
    }
    return avatars[0] || '';
  }, [avatars, selectedAvatarUrl]);

  // -------------------------------------------------------------------------
  // 3. User Actions & Horizontal Category Scroll Controls
  // -------------------------------------------------------------------------
  const handleSelectCategory = (cat: CategoryItem) => {
    if (selectedCategoryId === cat.id) return;
    setSelectedCategoryId(cat.id);
    setSelectedAvatarUrl(null); // Reset selection to first avatar in the new category
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
        hasNextCategories &&
        !isFetchingNextCategories
      ) {
        fetchNextCategories();
      }
    }
  };

  const handleCategoryScroll = () => {
    updateScrollButtons();
    if (!categoryScrollRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = categoryScrollRef.current;
    if (
      scrollLeft + clientWidth >= scrollWidth - 50 &&
      hasNextCategories &&
      !isFetchingNextCategories
    ) {
      fetchNextCategories();
    }
  };

  // -------------------------------------------------------------------------
  // 4. Infinite Scroll Observer for Avatars
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isLoadingCategories || isLoadingAvatars) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasNextAvatars &&
          !isFetchingNextAvatars
        ) {
          fetchNextAvatars();
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
    isLoadingCategories,
    isLoadingAvatars,
    hasNextAvatars,
    isFetchingNextAvatars,
    fetchNextAvatars,
  ]);

  // Format error messages
  const categoriesErrorMessage = categoriesErrorObj
    ? ((categoriesErrorObj as any)?.response?.data?.message || categoriesErrorObj.message || 'Failed to fetch categories')
    : null;

  const avatarsErrorMessage = avatarsErrorObj
    ? ((avatarsErrorObj as any)?.response?.data?.message || avatarsErrorObj.message || 'Failed to fetch avatars')
    : null;

  // -------------------------------------------------------------------------
  // Render: Initial Loading State
  // -------------------------------------------------------------------------
  if (isLoadingCategories) {
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
  if (isCategoriesError && categoriesErrorMessage) {
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
          {categoriesErrorMessage}
        </p>
        <button
          className="btn btn-outline"
          onClick={() => refetchCategories()}
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
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px',
        }}
      >
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
                src={getOptimizedImageUrl(selectedAvatar, 300)}
                alt="Selected Avatar"
                decoding="async"
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
          {isFetchingNextCategories && (
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
      {hasNextAvatars && (
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

      {/* Avatars Initial Loading State */}
      {isLoadingAvatars && (
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
      {!isLoadingAvatars && isAvatarsError && avatarsErrorMessage && (
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
          <p style={{ color: '#991b1b', fontWeight: 600, margin: '0 0 12px 0' }}>{avatarsErrorMessage}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => refetchAvatars()}
            style={{ fontSize: '0.85rem', padding: '6px 16px' }}
          >
            Retry Category
          </button>
        </div>
      )}

      {/* Avatars Empty State */}
      {!isLoadingAvatars && !isAvatarsError && avatars.length === 0 && (
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
      {!isLoadingAvatars && avatars.length > 0 && (
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
                  onClick={() => setSelectedAvatarUrl(url)}
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
                      src={getOptimizedImageUrl(url, 200)}
                      alt={`Avatar ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
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
          {isFetchingNextAvatars && (
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
          {!hasNextAvatars && avatars.length > AVATAR_LIMIT && (
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
