import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../common/DropZone';
import { ProgressBar } from '../common/ProgressBar';
import { ConfirmationModal } from '../common/ConfirmationModal';
import type { CategorySpec, UploadStatus } from '../../types/media';
import { useUploads } from '../../context/UploadContext';
import { uploadAudioFile, getAudioDuration } from '../../services/mediaUploadService';
import {
  Music,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  RefreshCw,
  Radio,
  X,
  Tag,
  Hash,
  AlertCircle,
} from 'lucide-react';

const AUDIO_SPEC: CategorySpec = {
  title: 'Audio File & Track Uploader',
  description: 'Upload audio tracks, sound effects, or background audio.',
  acceptedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
  ],
  acceptedExtensions: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxSizeLabel: '10 MB',
};

export const AudioUploader: React.FC = () => {
  const { addToast } = useUploads();

  // --- Form fields ---
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(''); // kept as string for input, parsed on submit

  // --- File & player state ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // --- Upload state ---
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build and revoke audio object URL whenever the file changes
  useEffect(() => {
    if (!selectedFile) {
      setAudioUrl(null);
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setAudioUrl(objectUrl);

    getAudioDuration(selectedFile).then((dur) => {
      setDuration(dur);
    });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // ---------------------------------------------------------------------------
  // File selection
  // ---------------------------------------------------------------------------
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('Ready to upload');
  };

  // ---------------------------------------------------------------------------
  // Audio player controls
  // ---------------------------------------------------------------------------
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // ---------------------------------------------------------------------------
  // Upload flow  (Avatar/Cover pattern)
  // ---------------------------------------------------------------------------
  const parsedCategoryId = parseInt(categoryId.trim(), 10);
  const isFormValid = title.trim().length > 0 && !isNaN(parsedCategoryId) && parsedCategoryId > 0;

  const isUploadDisabled =
    !selectedFile ||
    !isFormValid ||
    status === 'uploading' ||
    status === 'success';

  const handleUploadClick = () => {
    if (!selectedFile) return;
    if (!isFormValid) {
      addToast('error', 'Fields Required', 'Please enter a valid Title and Category ID before uploading.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !isFormValid) return;

    setShowConfirmModal(false);
    setStatus('uploading');
    setProgress(0);
    setStatusMessage(`Uploading "${title.trim()}" to category ${parsedCategoryId}...`);

    try {
      await uploadAudioFile(selectedFile, title.trim(), parsedCategoryId, (p) => {
        setProgress(p);
      });

      setStatus('success');
      setStatusMessage('Audio track uploaded successfully!');
      addToast(
        'success',
        'Audio Uploaded',
        `"${title.trim()}" was successfully saved to category ${parsedCategoryId}.`
      );
    } catch (err: unknown) {
      const error = err as Error;
      setStatus('error');
      setStatusMessage(error.message || 'Upload failed');
      addToast('error', 'Upload Error', error.message || 'Could not upload audio file.');
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSelectedFile(null);
    setAudioUrl(null);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setIsPlaying(false);
    setShowConfirmModal(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
      {/* ── Upload Box ─────────────────────────────────────────────────────── */}
      <div className="red-card" style={{ padding: '28px' }}>
        {/* Header */}
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
            <Music size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {AUDIO_SPEC.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {AUDIO_SPEC.description}
            </p>
          </div>
        </div>

        {/* ── Title Input ── */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" htmlFor="audio-title-input" style={{ margin: 0 }}>
              <Tag size={16} color="var(--primary-red)" />
              <span>Title</span>
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
              id="audio-title-input"
              type="text"
              className="form-input"
              placeholder="Enter audio title (e.g. Harry Potter Theme)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={status === 'uploading'}
              style={{
                paddingLeft: '42px',
                paddingRight: title ? '40px' : '14px',
              }}
            />
            {title && (
              <button
                type="button"
                onClick={() => setTitle('')}
                title="Clear title"
                aria-label="Clear title input"
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

        {/* ── Category ID Input ── */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" htmlFor="audio-category-id-input" style={{ margin: 0 }}>
              <Hash size={16} color="var(--primary-red)" />
              <span>Category ID</span>
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
              <Hash size={16} />
            </div>
            <input
              id="audio-category-id-input"
              type="number"
              min="1"
              className="form-input"
              placeholder="Enter category ID (e.g. 2)"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={status === 'uploading'}
              style={{
                paddingLeft: '42px',
                paddingRight: categoryId ? '40px' : '14px',
              }}
            />
            {categoryId && (
              <button
                type="button"
                onClick={() => setCategoryId('')}
                title="Clear category ID"
                aria-label="Clear category ID input"
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

        {/* ── Drop Zone ── */}
        <DropZone
          spec={AUDIO_SPEC}
          onFileSelected={handleFileSelect}
          disabled={status === 'uploading'}
        />

        {/* ── Action area (shown after file selection) ── */}
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
            {/* Validation warning */}
            {!isFormValid && (
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
                  Please enter a <strong>Title</strong> and a valid <strong>Category ID</strong> above to enable the upload button.
                </span>
              </div>
            )}

            {status !== 'idle' && (
              <div style={{ marginTop: !isFormValid ? '16px' : '0' }}>
                <ProgressBar progress={progress} status={status} statusMessage={statusMessage} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: (!isFormValid || status !== 'idle') ? '16px' : '0' }}>
              <button
                className="btn btn-primary"
                onClick={handleUploadClick}
                disabled={isUploadDisabled}
                title={!isFormValid ? 'Please enter a title and category ID to enable upload' : undefined}
                style={{ flex: 1 }}
              >
                {status === 'uploading' ? (
                  <>Uploading Audio...</>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={18} /> Uploaded
                  </>
                ) : (
                  <>Upload Audio File</>
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

      {/* ── Audio Wave Player Panel ─────────────────────────────────────────── */}
      <div className="red-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="var(--primary-red)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Audio Player Preview
            </h3>
          </div>
          {audioUrl && (
            <button
              onClick={handleReset}
              title="Discard selected media"
              aria-label="Discard selected audio"
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

        {audioUrl ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '24px',
              padding: '16px',
              backgroundColor: '#fffdfd',
              border: '2px solid var(--primary-red-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              preload="metadata"
            />

            {/* Track info pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {title.trim() && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-red-subtle)',
                    color: 'var(--primary-red)',
                    border: '1px solid var(--primary-red-border)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Tag size={13} />
                  <span>{title.trim()}</span>
                </div>
              )}
              {categoryId.trim() && !isNaN(parsedCategoryId) && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-red-subtle)',
                    color: 'var(--primary-red)',
                    border: '1px solid var(--primary-red-border)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Hash size={13} />
                  <span>Cat. {parsedCategoryId}</span>
                </div>
              )}
            </div>

            {/* Animated Waveform */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '70px',
                padding: '10px',
                backgroundColor: 'var(--primary-red-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {[18, 35, 60, 42, 75, 90, 55, 30, 70, 85, 45, 65, 95, 40, 60, 30, 80, 50, 65, 35].map(
                (height, index) => {
                  const isActive = (index / 20) <= (currentTime / (duration || 1));
                  return (
                    <div
                      key={index}
                      style={{
                        width: '6px',
                        height: isPlaying
                          ? `${Math.max(15, (height * (Math.sin(Date.now() / 200 + index) + 1.5)) / 2.5)}%`
                          : `${height}%`,
                        backgroundColor: isActive ? 'var(--primary-red)' : 'var(--primary-red-border)',
                        borderRadius: '4px',
                        transition: 'height 0.15s ease, background-color 0.2s ease',
                      }}
                    />
                  );
                }
              )}
            </div>

            {/* Scrub Slider */}
            <div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary-red)',
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <button
                onClick={togglePlay}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-red-glow)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Volume2 size={18} color="var(--primary-red)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Audio Stream</span>
              </div>
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
              <Music size={30} />
            </div>
            <strong style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Audio File Selected
            </strong>
            <p style={{ fontSize: '0.85rem', maxWidth: '280px' }}>
              Upload MP3, WAV, FLAC, or AAC files to inspect audio waveform and playback instantly.
            </p>
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        categoryName={`"${title.trim()}" (Category ID: ${parsedCategoryId})`}
        message={`This is irreversible process, so are you sure to upload the selected audio as '${title.trim()}' under category ID ${parsedCategoryId}?`}
        onConfirm={handleConfirmUpload}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={status === 'uploading'}
      />
    </div>
  );
};
