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