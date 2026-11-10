import test from 'node:test';
import assert from 'node:assert/strict';
import { hotelImageMaxBytes, validateHotelImage } from '../src/js/storage-utils.js';

test('accepts supported hotel image formats below the storage limit', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(validateHotelImage({ type, size: hotelImageMaxBytes }), '');
  }
});

test('rejects missing files, unsupported formats, and images over 5 MB', () => {
  assert.match(validateHotelImage(null), /Choose a property photo/);
  assert.match(validateHotelImage({ type: 'image/gif', size: 100 }), /JPEG, PNG, or WebP/);
  assert.match(validateHotelImage({ type: 'image/png', size: hotelImageMaxBytes + 1 }), /smaller than 5 MB/);
});