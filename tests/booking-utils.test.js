import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStayTotal, countStayNights } from '../src/js/booking-utils.js';

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