import React from 'react';
import type { MediaType, UploadStatus } from '../../types/media';

interface BadgeProps {
  type?: 'category' | 'status' | 'custom';
  category?: MediaType;
  status?: UploadStatus;
  label?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  type = 'category',
  category,
  status,
  label,
  size = 'md',
}) => {
  const isSmall = size === 'sm';

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: isSmall ? '0.7rem' : '0.75rem',
    padding: isSmall ? '2px 8px' : '4px 10px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  if (type === 'category' && category) {
    const categoryLabels: Record<MediaType, string> = {
      avatar: 'Avatar',
      cover: 'Cover',
      theme: 'Theme',
      audio: 'Audio',
    };

    return (
      <span
        style={{
          ...baseStyle,
          backgroundColor: 'var(--primary-red-subtle)',
          color: 'var(--primary-red)',
          border: '1px solid var(--primary-red-border)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-red)',
          }}
        />
        {categoryLabels[category]}
      </span>
    );
  }

  if (type === 'status' && status) {
    const statusStyles: Record<UploadStatus, { bg: string; color: string; border: string }> = {
      idle: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
      validating: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
      uploading: { bg: 'var(--primary-red-subtle)', color: 'var(--primary-red)', border: 'var(--primary-red-border)' },
      success: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
      error: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    };

    const style = statusStyles[status];

    return (
      <span
        style={{
          ...baseStyle,
          backgroundColor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
        }}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      style={{
        ...baseStyle,
        backgroundColor: '#f3f4f6',
        color: '#1f2937',
        border: '1px solid #e5e7eb',
      }}
    >
      {label}
    </span>
  );
};
