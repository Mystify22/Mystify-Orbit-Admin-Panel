import React, { useState, useEffect } from 'react';
import { DropZone } from '../common/DropZone';
import { ProgressBar } from '../common/ProgressBar';
import { ConfirmationModal } from '../common/ConfirmationModal';
import type { CategorySpec, UploadStatus } from '../../types/media';
import { useUploads } from '../../context/UploadContext';
import { uploadMediaFile } from '../../services/mediaUploadService';
import {
  Layout,
  CheckCircle,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  X,
  Tag,
  AlertCircle,
} from 'lucide-react';

const COVER_SPEC: CategorySpec = {
  title: 'Cover Image Uploader',
  description: 'Upload banner covers and wide header images.',
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxSizeLabel: '10 MB',
};

export const CoverUploader: React.FC = () => {
  const { addToast } = useUploads();

  const [category, setCategory] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

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

  const handleUploadClick = () => {
    if (!selectedFile) return;
    const trimmedCategory = category.trim();
    if (!trimmedCategory) {
      addToast('error', 'Category Required', 'Please enter a category before uploading.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    const trimmedCategory = category.trim();
    if (!trimmedCategory) return;

    setShowConfirmModal(false);
    setStatus('uploading');
    setProgress(0);
    setStatusMessage(`Uploading cover to category "${trimmedCategory}"...`);

    try {
      await uploadMediaFile(selectedFile, 'cover', (p) => {
        setProgress(p);
      }, trimmedCategory);

      setStatus('success');
      setStatusMessage('Cover image uploaded successfully!');
      addToast(
        'success',
        'Cover Uploaded',
        `${selectedFile.name} was successfully uploaded to category "${trimmedCategory}".`
      );
    } catch (err: unknown) {
      const error = err as Error;
      setStatus('error');
      setStatusMessage(error.message || 'Upload failed');
      addToast('error', 'Upload Error', error.message || 'Could not upload cover image.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setShowConfirmModal(false);
  };

  const isUploadDisabled =
    !selectedFile ||
    !category.trim() ||
    status === 'uploading' ||
    status === 'success';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
      {/* Upload Box */}
      <div className="red-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
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
            <Layout size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {COVER_SPEC.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {COVER_SPEC.description}
            </p>
          </div>
        </div>

        {/* Category Input Heading & Field */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" htmlFor="cover-category-input" style={{ margin: 0 }}>
              <Tag size={16} color="var(--primary-red)" />
              <span>Category</span>
              <span style={{ color: 'var(--primary-red)', fontWeight: 800 }}>*</span>
            </label>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              <Tag size={16} />
            </div>
            <input
              id="cover-category-input"
              type="text"
              className="form-input"
              placeholder="Enter category name (e.g. Doggo, Nature, Anime...)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={status === 'uploading'}
              style={{
                paddingLeft: '42px',
                paddingRight: category ? '40px' : '14px',
              }}
            />
            {category && (
              <button
                type="button"
                onClick={() => setCategory('')}
                title="Clear category"
                aria-label="Clear category input"
                disabled={status === 'uploading'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-red)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <DropZone
          spec={COVER_SPEC}
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
            {/* Warning if category is missing */}
            {!category.trim() && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--primary-red)',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--primary-red-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-red-border)',
                }}
              >
                <AlertCircle size={16} />
                <span>
                  Please enter a <strong>Category</strong> above to enable the upload button.
                </span>
              </div>
            )}

            {status !== 'idle' && (
              <ProgressBar progress={progress} status={status} statusMessage={statusMessage} />
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: !category.trim() || status !== 'idle' ? '16px' : '0' }}>
              <button
                className="btn btn-primary"
                onClick={handleUploadClick}
                disabled={isUploadDisabled}
                title={!category.trim() ? 'Please enter a category to enable upload' : undefined}
                style={{ flex: 1 }}
              >
                {status === 'uploading' ? (
                  <>Uploading...</>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={18} /> Uploaded
                  </>
                ) : (
                  <>Upload Cover</>
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
              Cover Preview
            </h3>
          </div>
          {previewUrl && (
            <button
              onClick={handleReset}
              title="Discard selected media"
              aria-label="Discard selected cover"
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
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '340px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '3px solid var(--primary-red)',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={previewUrl}
                alt="Cover Preview"
                style={{ width: '100%', height: 'auto', maxHeight: '340px', objectFit: 'cover' }}
              />
            </div>

            {/* Category Preview Tag */}
            <div
              style={{
                marginTop: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: category.trim() ? 'var(--primary-red-subtle)' : '#f3f4f6',
                color: category.trim() ? 'var(--primary-red)' : 'var(--text-secondary)',
                border: category.trim() ? '1px solid var(--primary-red-border)' : '1px solid #e5e7eb',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Tag size={14} />
              <span>Category: <strong>{category.trim() || 'Not specified yet'}</strong></span>
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
              No Cover Image Selected
            </strong>
            <p style={{ fontSize: '0.85rem', maxWidth: '280px' }}>
              Select or drop a cover image to see the preview.
            </p>
          </div>
        )}
      </div>

      {/* Irreversible Upload Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        categoryName={category.trim()}
        message={`This is irreversible process, so are you sure to upload the selected image under '${category.trim()}' category.`}
        onConfirm={handleConfirmUpload}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={status === 'uploading'}
      />
    </div>
  );
};
