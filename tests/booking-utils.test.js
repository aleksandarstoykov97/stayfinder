import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStayTotal, canAccommodateGuests, countStayNights, hasBookingConflict } from '../src/js/booking-utils.js';

test('counts nights between checkout dates, excluding checkout day', () => {
  assert.equal(countStayNights('2026-11-09', '2026-11-16'), 7);
});

test('counts one night for consecutive dates', () => {
  assert.equal(countStayNights('2026-11-09', '2026-11-10'), 1);
});

test('handles leap day in UTC date arithmetic', () => {
  assert.equal(countStayNights('2028-02-28', '2028-03-01'), 2);
});

test('rejects missing, invalid, same-day, and reversed dates', () => {
  assert.equal(countStayNights('', '2026-11-16'), 0);
  assert.equal(countStayNights('not-a-date', '2026-11-16'), 0);
  assert.equal(countStayNights('2026-11-09', '2026-11-09'), 0);
  assert.equal(countStayNights('2026-11-10', '2026-11-09'), 0);
});

test('calculates the stay total from a positive nightly rate and integer nights', () => {
  assert.equal(calculateStayTotal('184', 3), 552);
});

test('rejects invalid rates and night counts', () => {
  assert.equal(calculateStayTotal(0, 3), 0);
  assert.equal(calculateStayTotal(-1, 3), 0);
  assert.equal(calculateStayTotal('invalid', 3), 0);
  assert.equal(calculateStayTotal(184, 0), 0);
  assert.equal(calculateStayTotal(184, 1.5), 0);
});

test('detects an overlapping booking for the same room', () => {
  const existing = [{ room_id: 'room-1', check_in: '2026-11-10', check_out: '2026-11-14', status: 'confirmed' }];
  assert.equal(hasBookingConflict({ room_id: 'room-1', check_in: '2026-11-13', check_out: '2026-11-16' }, existing), true);
});

test('allows back-to-back bookings and bookings for different rooms', () => {
  const existing = [{ room_id: 'room-1', check_in: '2026-11-10', check_out: '2026-11-14', status: 'confirmed' }];
  assert.equal(hasBookingConflict({ room_id: 'room-1', check_in: '2026-11-14', check_out: '2026-11-16' }, existing), false);
  assert.equal(hasBookingConflict({ room_id: 'room-2', check_in: '2026-11-11', check_out: '2026-11-12' }, existing), false);
});

test('ignores cancelled reservations when checking availability', () => {
  const existing = [{ room_id: 'room-1', check_in: '2026-11-10', check_out: '2026-11-14', status: 'cancelled' }];
  assert.equal(hasBookingConflict({ room_id: 'room-1', check_in: '2026-11-12', check_out: '2026-11-13' }, existing), false);
});

test('checks room capacity without accepting invalid guest counts', () => {
  assert.equal(canAccommodateGuests('2', 2), true);
  assert.equal(canAccommodateGuests(3, 2), false);
  assert.equal(canAccommodateGuests(0, 2), false);
  assert.equal(canAccommodateGuests(1.5, 2), false);
});