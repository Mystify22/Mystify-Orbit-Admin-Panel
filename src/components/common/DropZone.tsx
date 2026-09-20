import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle, FileCheck } from 'lucide-react';
import type { CategorySpec } from '../../types/media';

interface DropZoneProps {
  spec: CategorySpec;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ spec, onFileSelected, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setValidationError(null);

    // MIME type check
    const isMimeValid =
      spec.acceptedMimeTypes.includes(file.type) ||
      spec.acceptedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isMimeValid) {
      setValidationError(
        `Invalid MediaType (${file.type || 'unknown'}). Allowed: ${spec.acceptedExtensions.join(', ')}`
      );
      return;
    }

    // Size limit check
    if (file.size > spec.maxSizeBytes) {
      setValidationError(
        `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is ${spec.maxSizeLabel}.`
      );
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
    // Reset value so user can re-select the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: isDragOver
            ? '2px dashed var(--primary-red)'
            : '2px dashed var(--primary-red-border)',
          backgroundColor: isDragOver ? 'var(--primary-red-subtle)' : '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: isDragOver ? 'var(--shadow-red-glow)' : 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept={spec.acceptedExtensions.join(',')}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px auto',
            borderRadius: '50%',
            backgroundColor: isDragOver ? 'var(--primary-red)' : 'var(--primary-red-subtle)',
            color: isDragOver ? '#ffffff' : 'var(--primary-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s ease',
          }}
        >
          {isDragOver ? <FileCheck size={32} /> : <UploadCloud size={32} />}
        </div>

        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}
        >
          {isDragOver ? 'Drop file here to upload' : 'Click to browse or drag & drop'}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0',
          }}
        >
          Supports: <strong style={{ color: 'var(--primary-red)' }}>{spec.acceptedExtensions.join(', ')}</strong> (Up to {spec.maxSizeLabel})
        </p>
      </div>

      {validationError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
