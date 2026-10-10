import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Tag,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface CoverCategory {
  category: string;
  coverUrls: string[];
}

interface ApiResponse {
  data: {
    content: CoverCategory[];
  };
}

const COVER_API_URL =
  'https://user-ms-k4i3.onrender.com/v1/users/get-cover?pageNumber=0&pageSize=12';

const fetchCovers = async (): Promise<CoverCategory[]> => {
  const response = await axios.get<ApiResponse>(COVER_API_URL);

  return response.data.data.content || [];
};

const CoverGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCover, setSelectedCover] = useState('');

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<CoverCategory[], Error>({
    queryKey: ['covers'],
    queryFn: fetchCovers,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Automatically select first category and first cover
  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategory('');
      setSelectedCover('');
      return;
    }

    const currentCategoryExists = categories.some(
      (item) => item.category === selectedCategory
    );

    if (!selectedCategory || !currentCategoryExists) {
      const firstCategory = categories[0];

      setSelectedCategory(firstCategory.category);
      setSelectedCover(firstCategory.coverUrls?.[0] || '');
    }
  }, [categories, selectedCategory]);

  const selectedCategoryData = categories.find(
    (item) => item.category === selectedCategory
  );

  const coverUrls = selectedCategoryData?.coverUrls || [];

  const handleCategoryChange = (item: CoverCategory) => {
    setSelectedCategory(item.category);
    setSelectedCover(item.coverUrls?.[0] || '');
  };

  const handleCoverSelect = (url: string) => {
    setSelectedCover(url);
  };

  const handleClearSelection = () => {
    setSelectedCover('');
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <>
        <style>{coverGalleryStyles}</style>

        <div className="cover-gallery">
          <div className="cover-status-card">
            <div className="cover-loading"></div>

            <div className="cover-status-icon">
              <ImageIcon size={22} />
            </div>

            <strong>Loading Covers...</strong>
            <p>Please wait while the covers are being loaded.</p>
          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (isError) {
    return (
      <>
        <style>{coverGalleryStyles}</style>

        <div className="cover-gallery">
          <div className="cover-status-card">

            <div className="cover-status-icon">
              <AlertCircle size={27} />
            </div>

            <strong>
              Failed to load covers
            </strong>

            <p>
              {error instanceof Error
                ? error.message
                : 'Something went wrong while loading the cover gallery.'}
            </p>

            <button
              type="button"
              className="cover-refresh-btn"
              onClick={() => refetch()}
            >
              <RefreshCw size={15} />
              Try Again
            </button>

          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // EMPTY
  // =========================================================

  if (categories.length === 0) {
    return (
      <>
        <style>{coverGalleryStyles}</style>

        <div className="cover-gallery">
          <div className="cover-status-card">

            <div className="cover-status-icon">
              <ImageIcon size={27} />
            </div>

            <strong>
              No Covers Available
            </strong>

            <p>
              Upload a cover image to create your first cover.
            </p>

          </div>
        </div>
      </>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <>
      <style>{coverGalleryStyles}</style>

      <div className="cover-gallery">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="cover-gallery-header">

          <div className="cover-gallery-title-section">

            <div className="cover-gallery-icon">
              <ImageIcon size={22} />
            </div>

            <div>
              <h2 className="cover-gallery-title">
                Cover Gallery
              </h2>

              <p className="cover-gallery-subtitle">
                Browse uploaded covers by category.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="cover-refresh-btn"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              size={15}
              className={
                isFetching
                  ? 'cover-spin'
                  : ''
              }
            />

            {isFetching
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>

        {/* =====================================================
            CATEGORY SECTION
        ====================================================== */}

        <div className="cover-category-section">

          <div className="cover-category-label">

            <Tag size={15} />

            <span>
              Categories
            </span>

            <span className="cover-category-count">
              ({categories.length})
            </span>

          </div>

          <div className="cover-category-list">

            {categories.map((item) => {

              const isActive =
                selectedCategory === item.category;

              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(item)
                  }
                  className={`cover-category-btn ${isActive ? 'active' : ''
                    }`}
                >

                  <Tag size={13} />

                  <span>
                    {item.category}
                  </span>

                  <span className="cover-category-number">
                    {item.coverUrls?.length || 0}
                  </span>

                </button>
              );
            })}

            <ChevronRight
              size={17}
              className="cover-category-arrow"
            />

          </div>

        </div>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="cover-gallery-content">

          {/* ===================================================
              COVER GALLERY
          ==================================================== */}

          <div className="cover-gallery-panel">

            <div className="cover-panel-header">

              <h3 className="cover-panel-title">
                {selectedCategory || 'Covers'}
              </h3>

              <span className="cover-panel-count">
                {coverUrls.length}{' '}
                {coverUrls.length === 1
                  ? 'cover'
                  : 'covers'}
              </span>

            </div>

            {coverUrls.length > 0 ? (

              <div className="cover-grid">

                {coverUrls.map((url, index) => {

                  const isSelected =
                    selectedCover === url;

                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() =>
                        handleCoverSelect(url)
                      }
                      className={`cover-item ${isSelected
                        ? 'selected'
                        : ''
                        }`}
                    >

                      <img
                        src={url}
                        alt={`${selectedCategory} cover ${index + 1
                          }`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.opacity =
                            '0.3';
                        }}
                      />

                      {isSelected && (
                        <div className="cover-selected-icon">
                          <Eye size={14} />
                        </div>
                      )}

                      <div className="cover-number">
                        #{index + 1}
                      </div>

                    </button>
                  );
                })}

              </div>

            ) : (

              <div className="cover-empty-state">

                <ImageIcon size={30} />

                <strong>
                  No covers in this category
                </strong>

                <p>
                  There are no cover images available
                  for this category.
                </p>

              </div>

            )}

          </div>

          {/* ===================================================
              PREVIEW
          ==================================================== */}

          <div className="cover-gallery-panel">

            <div className="cover-preview-header">

              <h3 className="cover-preview-title">

                <Eye size={17} />

                <span>
                  Cover Preview
                </span>

              </h3>

              {selectedCover && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  title="Clear selected cover"
                  aria-label="Clear selected cover"
                  className="cover-clear-btn"
                >
                  <X size={14} />
                </button>
              )}

            </div>

            <div className="cover-preview-box">

              {selectedCover ? (

                <img
                  src={selectedCover}
                  alt={`${selectedCategory} selected cover`}
                />

              ) : (

                <div className="cover-preview-empty">

                  <div className="cover-preview-empty-icon">
                    <ImageIcon size={25} />
                  </div>

                  <strong>
                    No Cover Selected
                  </strong>

                  <p>
                    Select a cover from the gallery
                    to preview it here.
                  </p>

                </div>

              )}

            </div>

            {selectedCover && (
              <div className="cover-category-badge">

                <Tag size={12} />

                <span>
                  Category:
                </span>

                <strong>
                  {selectedCategory}
                </strong>

              </div>
            )}

          </div>

        </div>

      </div>
    </>
  );
};


/* =========================================================
   ALL CSS IS INSIDE THIS FILE
========================================================= */

const coverGalleryStyles = `
  /* =======================================================
     COVER GALLERY
  ======================================================== */
  .cover-gallery {
  width: 100%;
  max-width: none;
  margin: 24px 0 0;
  padding: 28px;
  box-sizing: border-box;

  background: #ffffff;
  border: 1px solid #f7dada;
  border-radius: 18px;

  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.05);
}
  /* 
     HEADER
  */

  .cover-gallery-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 16px;
    margin-bottom: 24px;
  }


  .cover-gallery-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }


  .cover-gallery-icon {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 12px;

    background: #fff1f2;
    color: #e52525;
  }


  .cover-gallery-title {
    margin: 0;

    font-size: 1.15rem;
    font-weight: 800;

    color: #111827;
  }


  .cover-gallery-subtitle {
    margin: 3px 0 0;

    font-size: 0.82rem;

    color: #6b7280;
  }


  /*
     REFRESH BUTTON
*/

  .cover-refresh-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    padding: 9px 15px;

    border: 1px solid #f5bcbc;
    border-radius: 999px;

    background: #ffffff;

    color: #e52525;

    font-size: 0.82rem;
    font-weight: 600;

    cursor: pointer;

      transition:
      background 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
  }


  .cover-refresh-btn:hover {
    background: #fff1f2;
    border-color: #e52525;
    transform: translateY(-1px);
  }


  .cover-refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }


  /* =======================================================
     CATEGORY SECTION
  ======================================================== */

  .cover-category-section {
    margin-bottom: 24px;
  }


  .cover-category-label {
    display: flex;
    align-items: center;

    gap: 7px;

    margin-bottom: 10px;

    color: #111827;

    font-size: 0.88rem;
    font-weight: 700;
  }


  .cover-category-label svg {
    color: #e52525;
  }


  .cover-category-count {
    color: #9ca3af;

    font-size: 0.74rem;
    font-weight: 500;
  }


  /* 
     CATEGORY LIST
 */

  .cover-category-list {
    display: flex;
    align-items: center;
    gap: 9px;
    overflow-x: auto;
    padding: 2px 2px 8px;
    scrollbar-width: thin;
  }

  .cover-category-list::-webkit-scrollbar {
    height: 4px;
  }

  .cover-category-list::-webkit-scrollbar-thumb {
    background: #f3b6b6;
    border-radius: 10px;
  }


  /*
     CATEGORY BUTTON
 */

  .cover-category-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid #f3d1d1;
    background: #ffffff;
    color: #4b5563;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
     transition:
      background 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }


  .cover-category-btn:hover {
    border-color: #e52525;
    color: #e52525;

    background: #fff7f7;

    transform: translateY(-1px);
  }


  .cover-category-btn.active {
    background: #e52525;

    border-color: #e52525;

    color: #ffffff;

    box-shadow:
      0 4px 10px rgba(229, 37, 37, 0.18);
  }


  .cover-category-number {
    opacity: 0.7;

    font-size: 0.72rem;
  }


  .cover-category-arrow {
    flex-shrink: 0;
    color: #9ca3af;
  }


  /* =======================================================
     MAIN CONTENT
  ======================================================== */

.cover-gallery-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 36px; 
  row-gap: 20px;
  width: 100%;
  max-width: none;
  min-width: 0;
  box-sizing: border-box;
  align-items: stretch;
}
.cover-gallery-panel {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}


  /* 
     PANEL HEADER
  */

  .cover-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }


  .cover-panel-title {
    margin: 0;
    color: #111827;
    font-size: 0.95rem;
    font-weight: 750;
  }


  .cover-panel-count {
    color: #9ca3af;
    font-size: 0.76rem;
  }



.cover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 80%;
  max-width: 400px;
}



.cover-item {
  position: relative;
  width: 80%;
  aspect-ratio: 1 / 1;
  height: auto;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 2px solid #f1eeee;
  border-radius: 14px;
  background: #fafafa;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 0.2s, border-color 0.2s,
              box-shadow 0.2s;
}

  .cover-item:hover {
    transform: translateY(-2px);
    border-color: #f0a0a0;
    box-shadow:
    0 6px 15px rgba(0, 0, 0, 0.08);
  }


  .cover-item.selected {
    border: 2px solid #e52525;
    box-shadow:
    0 0 0 3px #fff0f0;
  }


  
.cover-item img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}



  /* =======================================================
     SELECTED ICON
  ======================================================== */

   .cover-selected-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #e52525;
    color: #ffffff;
    box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.15);
  }


  /*
     IMAGE NUMBER
   */
  .cover-number {
    position: absolute;
    left: 8px;
    bottom: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.62);
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 600;
  }

  /* 
     PREVIEW HEADER
  */
  .cover-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .cover-preview-title {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: 0;
    color: #111827;
    font-size: 0.95rem;
    font-weight: 750;
  }

  .cover-preview-title svg {
    color: #e52525;
  }

  /*
   CLEAR BUTTON */

  .cover-clear-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #f5caca;
    border-radius: 50%;
    background: #fff1f2;
    color: #e52525;
    cursor: pointer;
    transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  }
  .cover-clear-btn:hover {
    background: #e52525;

    border-color: #e52525;

    color: #ffffff;
  }


  /* 
     PREVIEW BOX */

    .cover-preview-box {
    position: relative;
    min-height: 220px;
    overflow: hidden;
    border: 1px solid #f0dcdc;
    border-radius: 15px;
    background: #fffafa;
    display: flex;
    align-items: center;
    justify-content: center;
  }


  .cover-preview-box img {
    width: 100%;
    height: 100%;
    min-height: 220px;
    display: block;
    object-fit: cover;
  }


  /* 
     PREVIEW EMPTY STATE
 */

  .cover-preview-empty {
    width: 100%;
    min-height: 220px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;
  }

  .cover-preview-empty-icon {
    width: 52px;
    height: 52px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #fff1f2;
    color: #e52525;
  }


  .cover-preview-empty strong {
    margin-bottom: 4px;
    color: #111827;
    font-size: 0.88rem;
  }


  .cover-preview-empty p {
    max-width: 220px;
    margin: 0;
    color: #9ca3af;
    font-size: 0.76rem;
    line-height: 1.5;
  }


  /* =======================================================
     CATEGORY BADGE
  ======================================================== */

  .cover-category-badge {
    display: inline-flex;
    align-items: center;

    gap: 6px;

    margin-top: 10px;

    padding: 6px 11px;

    border: 1px solid #f5cccc;

    border-radius: 999px;

    background: #fff1f2;

    color: #e52525;

    font-size: 0.75rem;
    font-weight: 600;
  }


  .cover-category-badge strong {
    font-weight: 700;
  }


  /* =======================================================
     EMPTY STATE
  ======================================================== */

  .cover-empty-state {
    min-height: 180px;

    border: 2px dashed #eadede;

    border-radius: 14px;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    text-align: center;

    color: #9ca3af;

    padding: 20px;
  }


  .cover-empty-state svg {
    margin-bottom: 8px;

    color: #e52525;
  }


  .cover-empty-state strong {
    color: #111827;

    font-size: 0.88rem;
  }


  .cover-empty-state p {
    margin: 5px 0 0;

    font-size: 0.76rem;

    color: #9ca3af;
  }


  /* =======================================================
     LOADING / ERROR
  ======================================================== */

  .cover-status-card {
    min-height: 220px;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    gap: 10px;

    text-align: center;
  }


  .cover-status-icon {
    width: 54px;
    height: 54px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #fff1f2;

    color: #e52525;
  }


  .cover-status-card strong {
    color: #111827;

    font-size: 0.9rem;
  }


  .cover-status-card p {
    max-width: 420px;

    margin: 0;

    color: #6b7280;

    font-size: 0.78rem;

    line-height: 1.5;
  }


  /* =======================================================
     SPINNER
  ======================================================== */

  /* Horizontal loading bar */
.cover-loading {
  width: 100%;
  height: 4px;
  margin: 0 0 20px;
  overflow: hidden;
  border-radius: 4px;
  background: #f3d6d6;
  position: relative;
}

.cover-loading::before {
  content: "";
  position: absolute;
  top: 0;
  left: -35%;
  width: 35%;
  height: 100%;
  border-radius: 4px;
  background: #e52525;
  animation: cover-loading-line 1.2s ease-in-out infinite;
}

@keyframes cover-loading-line {
  0% {
    left: -35%;
    width: 35%;
  }

  50% {
    left: 35%;
    width: 45%;
  }

  100% {
    left: 100%;
    width: 35%;
  }
}


  


  /* =======================================================
     TABLET
  ======================================================== */

  @media (max-width: 900px) {

    .cover-gallery-content {
      grid-template-columns: 1fr;
    }

    .cover-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

  }


  /* =======================================================
     MOBILE
  ======================================================== */

  @media (max-width: 600px) {

    .cover-gallery {
      padding: 18px;
      border-radius: 14px;
    }

    .cover-gallery-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .cover-refresh-btn {
      width: 100%;
    }

    .cover-grid {
      grid-template-columns: 1fr;
    }

    .cover-gallery-title {
      font-size: 1.05rem;
    }

    .cover-gallery-subtitle {
      font-size: 0.78rem;
    }

    .cover-category-btn {
      padding: 7px 13px;
      font-size: 0.78rem;
    }

  }
`;

export default CoverGallery;