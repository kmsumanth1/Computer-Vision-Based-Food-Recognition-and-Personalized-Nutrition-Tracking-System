export function isCameraSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/** Turns a getUserMedia failure into a message the user can act on. */
export function describeCameraError(error: unknown): string {
  if (!isCameraSupported()) {
    return 'Camera access needs a secure (HTTPS) connection and a supported browser. Try opening the app over HTTPS, or upload an image instead.';
  }
  const name = error instanceof DOMException || error instanceof Error ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Camera access is blocked. Allow camera access in your browser’s site settings, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device. Upload an image instead.';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'The camera is being used by another app. Close it and try again.';
    default:
      return 'We couldn’t start the camera. Check your browser permissions and try again.';
  }
}
