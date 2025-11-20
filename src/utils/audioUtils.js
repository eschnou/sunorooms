/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - Audio file as ArrayBuffer
 * @returns {string} Base64 encoded string
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // Process in 32KB chunks to avoid call stack size limit

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} Decoded ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Get duration of an audio file from ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - Audio file as ArrayBuffer
 * @returns {Promise<number>} Duration in seconds
 */
export async function getAudioDuration(arrayBuffer) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const duration = audioBuffer.duration;
    audioContext.close();
    return duration;
  } catch (error) {
    console.error('[audioUtils] Error getting audio duration:', error);
    return 0;
  }
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time (e.g. "3:45")
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate if file is a valid MP3
 * @param {File} file - File to validate
 * @returns {boolean} True if valid MP3
 */
export function isValidMP3(file) {
  const validTypes = ['audio/mpeg', 'audio/mp3'];
  return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.mp3');
}

/**
 * Get file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g. "3.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
