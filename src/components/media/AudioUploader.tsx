import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../common/DropZone';
import { ProgressBar } from '../common/ProgressBar';
import type { CategorySpec, UploadStatus } from '../../types/media';
import { useUploads } from '../../context/UploadContext';
import { uploadMediaFile, getAudioDuration } from '../../services/mediaUploadService';
import {
  Music,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  RefreshCw,
  Radio,
  X,
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatus('idle');
    setProgress(0);
    setStatusMessage('Ready to upload');
  };

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

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setProgress(0);
    setStatusMessage('Streaming audio binary multipart/form-data...');

    try {
      await uploadMediaFile(selectedFile, 'audio', (p) => {
        setProgress(p);
      });

      setStatus('success');
      setStatusMessage('Audio track uploaded successfully!');
      addToast('success', 'Audio Uploaded', `${selectedFile.name} was successfully uploaded.`);
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

        <DropZone
          spec={AUDIO_SPEC}
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
            {status !== 'idle' && (
              <div style={{ marginBottom: '16px' }}>
                <ProgressBar progress={progress} status={status} statusMessage={statusMessage} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={status === 'uploading' || status === 'success'}
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

      {/* Audio Wave Player Panel */}
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

            {/* Simulated Animated Red Waveform */}
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
                        height: isPlaying ? `${Math.max(15, (height * (Math.sin(Date.now() / 200 + index) + 1.5)) / 2.5)}%` : `${height}%`,
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
    </div>
  );
};
