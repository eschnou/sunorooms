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
      className={`dj-upload-zone ${isDragging ? 'dragging' : ''}`}
      style={{
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
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
          <div className="dj-upload-icon">⏳</div>
          <div className="dj-upload-text">Processing MP3...</div>
        </>
      ) : (
        <>
          <div className="dj-upload-icon">🎵</div>
          <div className="dj-upload-text">
            {isDragging ? 'Drop MP3 here' : 'Drop MP3 files here or click to upload'}
          </div>
          <div className="dj-upload-hint">
            Max size: {formatFileSize(MAX_FILE_SIZE)}
          </div>
        </>
      )}
    </div>
  );
}

export default TrackUploader;
