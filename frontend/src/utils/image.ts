import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '../constants/config';

/** Returns an error message, or null when the file is acceptable. */
export function validateImageFile(file: File): string | null {
  const typeOk = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
  const extensionOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!typeOk && !(file.type === '' && extensionOk)) {
    return `That file type isn’t supported. Use a ${ACCEPTED_IMAGE_EXTENSIONS} image.`;
  }
  if (file.size === 0) return 'That file is empty. Choose another image.';
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `That image is larger than ${MAX_IMAGE_SIZE_MB} MB. Choose a smaller one.`;
  }
  return null;
}
