import { createClient } from '@supabase/supabase-js';
import { hasBookingConflict } from './booking-utils.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function fetchStays() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hotels')
    .select('*, rooms(id, name, max_guests, price_per_night)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.filter((hotel) => hotel.rooms.length > 0).map((hotel) => ({
    ...hotel,
    price: Math.min(...hotel.rooms.map((room) => Number(room.price_per_night))),
    image: hotel.cover_image_url,
    neighborhood: hotel.neighborhood || hotel.city,
    rooms: hotel.rooms.map((room) => ({ ...room, price: Number(room.price_per_night), guests: room.max_guests })),
  }));
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Add your Supabase project URL and anon key to .env.local to enable accounts.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, fullName) {
  if (!supabase) throw new Error('Add your Supabase project URL and anon key to .env.local to enable accounts.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function createBooking(booking) {
  if (!supabase) {
    const saved = JSON.parse(localStorage.getItem('stayfinder-bookings') || '[]');
    if (hasBookingConflict(booking, saved)) throw new Error('Those dates are no longer available for this room.');
    const next = { ...booking, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    localStorage.setItem('stayfinder-bookings', JSON.stringify([next, ...saved]));
    return next;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before completing a reservation.');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      room_id: booking.room_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests,
      total_price: booking.total_price,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBookings() {
  if (!supabase) return JSON.parse(localStorage.getItem('stayfinder-bookings') || '[]');
  const { data, error } = await supabase
    .from('bookings')
    .select('*, rooms(name, hotels(name, city, cover_image_url))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function cancelBooking(bookingId) {
  if (!supabase) {
    const saved = JSON.parse(localStorage.getItem('stayfinder-bookings') || '[]');
    const booking = saved.find((item) => item.id === bookingId);
    if (!booking) throw new Error('Reservation not found.');
    booking.status = 'cancelled';
    localStorage.setItem('stayfinder-bookings', JSON.stringify(saved));
    return booking;
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAdminRole(userId) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}