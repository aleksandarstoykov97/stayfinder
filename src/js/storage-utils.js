const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const hotelImageMaxBytes = 5 * 1024 * 1024;

export function validateHotelImage(file) {
  if (!file) return 'Choose a property photo.';
  if (!allowedImageTypes.has(file.type)) return 'Use a JPEG, PNG, or WebP image.';
  if (file.size > hotelImageMaxBytes) return 'Choose an image smaller than 5 MB.';
  return '';
}