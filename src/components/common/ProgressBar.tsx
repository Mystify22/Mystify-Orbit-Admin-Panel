import React from 'react';
import type { UploadStatus } from '../../types/media';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  status: UploadStatus;
  statusMessage?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status, statusMessage }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary-red)' }} />;
      case 'success':
        return <CheckCircle2 size={16} style={{ color: '#16a34a' }} />;
      case 'error':
        return <AlertTriangle size={16} style={{ color: '#dc2626' }} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%', margin: '16px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getStatusIcon()}
          <span
            style={{
              color: status === 'error' ? '#dc2626' : status === 'success' ? '#16a34a' : 'var(--text-primary)',
            }}
          >
            {statusMessage || (status === 'uploading' ? 'Streaming multipart payload...' : status.toUpperCase())}
          </span>
        </div>
        <span style={{ color: 'var(--primary-red)', fontFamily: 'var(--font-mono)' }}>
          {progress}%
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'var(--primary-red-soft)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className={status === 'uploading' ? 'striped-bar' : ''}
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor:
              status === 'error'
                ? '#dc2626'
                : status === 'success'
                ? '#16a34a'
                : 'var(--primary-red)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.2s ease-in-out',
            boxShadow: status === 'uploading' ? '0 0 10px rgba(220, 38, 38, 0.5)' : 'none',
          }}
        />
      </div>
    </div>
  );
};
