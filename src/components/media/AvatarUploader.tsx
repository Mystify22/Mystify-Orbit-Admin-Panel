import React, { useState, useEffect } from 'react';
import { DropZone } from '../common/DropZone';
import { ProgressBar } from '../common/ProgressBar';
import type { CategorySpec, UploadStatus } from '../../types/media';
import { useUploads } from '../../context/UploadContext';
import { uploadMediaFile } from '../../services/mediaUploadService';
import { User, CheckCircle, RefreshCw, Eye, Sparkles, Image as ImageIcon, X } from 'lucide-react';

const AVATAR_SPEC: CategorySpec = {
  title: 'Avatar Image Uploader',
  description: 'Upload user or admin profile avatars.',
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxSizeLabel: '10 MB',
};

export const AvatarUploader: React.FC = () => {
  const { addToast } = useUploads();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('Ready to upload');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setProgress(0);
    setStatusMessage('Uploading avatar...');

    try {
      await uploadMediaFile(selectedFile, 'avatar', (p) => {
        setProgress(p);
      });

      setStatus('success');
      setStatusMessage('Avatar uploaded successfully!');
      addToast('success', 'Avatar Uploaded', `${selectedFile.name} was successfully uploaded.`);
    } catch (err: unknown) {
      const error = err as Error;
      setStatus('error');
      setStatusMessage(error.message || 'Upload failed');
      addToast('error', 'Upload Error', error.message || 'Could not upload avatar image.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
      {/* Upload Box */}
      <div className="red-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-red-subtle)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {AVATAR_SPEC.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {AVATAR_SPEC.description}
            </p>
          </div>
        </div>

        <DropZone
          spec={AVATAR_SPEC}
          onFileSelected={handleFileSelect}
          disabled={status === 'uploading'}
        />

        {selectedFile && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fff7f7',
              border: '1px solid var(--border-card)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                  {selectedFile.name}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                </span>
              </div>
              <button
                className="btn btn-ghost"
                onClick={handleReset}
                disabled={status === 'uploading'}
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              >
                Change
              </button>
            </div>

            {status !== 'idle' && (
              <ProgressBar progress={progress} status={status} statusMessage={statusMessage} />
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={status === 'uploading' || status === 'success'}
                style={{ flex: 1 }}
              >
                {status === 'uploading' ? (
                  <>Uploading...</>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={18} /> Uploaded
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Upload Avatar
                  </>
                )}
              </button>

              {status === 'success' && (
                <button className="btn btn-outline" onClick={handleReset}>
                  <RefreshCw size={16} /> Upload Another
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Panel */}
      <div className="red-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={20} color="var(--primary-red)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Avatar Preview
            </h3>
          </div>
          {previewUrl && (
            <button
              onClick={handleReset}
              title="Discard selected media"
              aria-label="Discard selected avatar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#fff1f2',
                color: 'var(--primary-red)',
                border: '1px solid var(--primary-red-border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffe4e6';
                e.currentTarget.style.borderColor = 'var(--primary-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff1f2';
                e.currentTarget.style.borderColor = 'var(--primary-red-border)';
              }}
            >
              <X size={16} /> Discard
            </button>
          )}
        </div>

        {previewUrl ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 0',
            }}
          >
            {/* Circular Preview Only */}
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '4px solid var(--primary-red)',
                boxShadow: 'var(--shadow-red-glow)',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={previewUrl}
                alt="Avatar Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fffdfd',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '24px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-red-subtle)',
                color: 'var(--primary-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <ImageIcon size={30} />
            </div>
            <strong style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Avatar Selected
            </strong>
            <p style={{ fontSize: '0.85rem', maxWidth: '280px' }}>
              Select or drop an avatar image to see the preview.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
