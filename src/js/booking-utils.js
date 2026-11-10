export function countStayNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  return (end - start) / 86400000;
}

export function calculateStayTotal(pricePerNight, nights) {
  const price = Number(pricePerNight);
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(nights) || nights <= 0) return 0;
  return price * nights;
}

export function hasBookingConflict(candidate, bookings) {
  if (!candidate.room_id || !countStayNights(candidate.check_in, candidate.check_out)) return false;

  const requestedStart = Date.parse(`${candidate.check_in}T00:00:00Z`);
  const requestedEnd = Date.parse(`${candidate.check_out}T00:00:00Z`);
  return bookings.some((booking) => {
    if (booking.room_id !== candidate.room_id || booking.status === 'cancelled') return false;
    const bookedStart = Date.parse(`${booking.check_in}T00:00:00Z`);
    const bookedEnd = Date.parse(`${booking.check_out}T00:00:00Z`);
    return Number.isFinite(bookedStart) && Number.isFinite(bookedEnd)
      && requestedStart < bookedEnd && requestedEnd > bookedStart;
  });
}

export function canAccommodateGuests(guestCount, roomCapacity) {
  const guests = Number(guestCount);
  const capacity = Number(roomCapacity);
  return Number.isInteger(guests) && Number.isInteger(capacity)
    && guests > 0 && capacity > 0 && guests <= capacity;
}