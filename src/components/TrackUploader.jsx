import { useState, useRef } from 'react';
import { isValidMP3, getAudioDuration, formatFileSize } from '../utils/audioUtils';
import { generateUUID } from '../utils/userUtils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function TrackUploader({ onTrackUpload, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!isValidMP3(file)) {
      alert('Please upload a valid MP3 file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setIsProcessing(true);
    console.log('[TrackUploader] Processing file:', file.name);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Get duration
      const duration = await getAudioDuration(arrayBuffer);

      // Generate track ID
      const trackId = generateUUID();

      // Create track metadata
      const track = {
        id: trackId,
        name: file.name,
        size: file.size,
        duration,
      };

      console.log('[TrackUploader] Track ready:', track);

      // Call parent callback with track data
      if (onTrackUpload) {
        await onTrackUpload(track, arrayBuffer);
      }
    } catch (error) {
      console.error('[TrackUploader] Error processing file:', error);
      alert('Error processing MP3 file. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input to allow re-uploading same file
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const isDisabled = disabled || isProcessing;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        padding: '2rem',
        border: `2px dashed ${isDragging ? '#646cff' : '#444'}`,
        borderRadius: '8px',
        textAlign: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        backgroundColor: isDragging ? '#2a2a3e' : 'transparent',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg,audio/mp3"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={isDisabled}
      />

      {isProcessing ? (
        <>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ margin: 0, color: '#888' }}>Processing MP3...</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎵</div>
          <p style={{ margin: 0, marginBottom: '0.5rem' }}>
            {isDragging ? 'Drop MP3 here' : 'Drop MP3 files here or click to upload'}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
            Max size: {formatFileSize(MAX_FILE_SIZE)}
          </p>
        </>
      )}
    </div>
  );
}

export default TrackUploader;
