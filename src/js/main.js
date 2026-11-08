import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../app.css';
import { demoStays, getDemoStay } from './data.js';
import {
  createBooking,
  fetchAdminRole,
  fetchBookings,
  fetchStays,
  getSession,
  isSupabaseConfigured,
  signIn,
  signOut,
  signUp,
  supabase,
} from './supabase.js';

const root = document.querySelector('#app');
const page = document.body.dataset.page;
const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
let stays = demoStays;

function nav() {
  return `<header class="site-header"><a class="wordmark" href="index.html"><span class="wordmark-icon"><i class="bi bi-compass-fill"></i></span>stayfinder<span class="wordmark-dot">.</span></a><nav class="main-nav" aria-label="Main navigation"><a class="${page === 'stays' ? 'active' : ''}" href="stays.html">Find a stay</a><a class="${page === 'trips' ? 'active' : ''}" href="trips.html">My trips</a><a class="${page === 'admin' ? 'active' : ''}" href="admin.html">Host tools</a></nav><div class="header-actions"><a class="icon-link" href="trips.html" aria-label="Saved trips"><i class="bi bi-heart"></i></a><a class="sign-in-link" href="login.html">Sign in <i class="bi bi-arrow-up-right"></i></a><button class="menu-toggle" type="button" aria-label="Open menu"><i class="bi bi-list"></i></button></div></header>`;
}

function footer() {
  return `<footer class="site-footer"><a class="wordmark" href="index.html"><span class="wordmark-icon"><i class="bi bi-compass-fill"></i></span>stayfinder<span class="wordmark-dot">.</span></a><span>Stay a little closer to the places you love.</span><span>© 2026 Stayfinder</span></footer>`;
}

function stayCard(stay, index = 0) {
  const liked = getFavorites().includes(stay.id);
  const search = new URLSearchParams(location.search);
  const stayUrl = new URLSearchParams({ id: stay.id });
  ['checkin', 'checkout', 'guests'].forEach((key) => { if (search.has(key)) stayUrl.set(key, search.get(key)); });
  const detailUrl = `property.html?${stayUrl}`;
  return `<article class="stay-card" style="--card-order:${index}"><a class="stay-image-link" href="${detailUrl}" aria-label="View ${escapeHtml(stay.name)}"><img class="stay-image" src="${escapeHtml(stay.image)}" alt="Interior at ${escapeHtml(stay.name)}" loading="lazy"><span class="image-tag">${escapeHtml(stay.category || 'Independent stay')}</span></a><button class="favorite-button ${liked ? 'is-favorite' : ''}" type="button" data-favorite="${escapeHtml(stay.id)}" aria-label="${liked ? 'Remove from' : 'Add to'} saved stays"><i class="bi bi-heart${liked ? '-fill' : ''}"></i></button><div class="stay-card-content"><div class="stay-card-heading"><div><p class="eyebrow">${escapeHtml(stay.city)}</p><h3><a href="${detailUrl}">${escapeHtml(stay.name)}</a></h3></div><span class="rating"><i class="bi bi-star-fill"></i> ${Number(stay.rating || 4.9).toFixed(2)}</span></div><p class="stay-neighborhood">${escapeHtml(stay.neighborhood || 'A considered place to stay')}</p><p class="stay-price"><strong>${money(stay.price)}</strong> <span>/ night</span><span class="review-count">(${stay.reviews || 0} reviews)</span></p></div></article>`;
}

function searchForm() {
  const params = new URLSearchParams(location.search);
  return `<form class="search-panel" action="stays.html" id="search-form"><label class="search-field destination-field"><span><i class="bi bi-geo-alt"></i> Destination</span><input name="destination" placeholder="Where to?" value="${escapeHtml(params.get('destination') || '')}" autocomplete="off"></label><label class="search-field"><span><i class="bi bi-calendar3"></i> Check in</span><input name="checkin" type="date" min="${today}" value="${escapeHtml(params.get('checkin') || today)}" required></label><label class="search-field"><span><i class="bi bi-calendar3"></i> Check out</span><input name="checkout" type="date" min="${today}" value="${escapeHtml(params.get('checkout') || nextWeek)}" required></label><label class="search-field guest-field"><span><i class="bi bi-people"></i> Guests</span><select name="guests"><option value="1">1 guest</option><option value="2" selected>2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select></label><button class="search-button" type="submit" aria-label="Search stays"><i class="bi bi-search"></i></button></form>`;
}

function homeView() {
  const featuredStays = stays.slice(0, 3);
  return `<main><section class="home-hero"><div class="hero-image"></div><div class="hero-copy"><span class="eyebrow light-eyebrow"><span></span> FIND YOUR ELSEWHERE</span><h1>Somewhere<br>you’ll <em>remember.</em></h1><p>Thoughtful stays for the stories you haven't told yet.</p><a class="hero-explore" href="#discover">Explore the collection <i class="bi bi-arrow-down-right"></i></a><div class="hero-counter"><strong>01</strong><span> / 06 — Lisbon, Portugal</span></div></div><div class="hero-note"><span>HANDPICKED, NEVER ORDINARY</span><i class="bi bi-arrow-down-left"></i></div></section><section class="search-section">${searchForm()}</section><section class="section-block discover-section" id="discover"><div class="section-heading"><div><span class="eyebrow">THE SHORTLIST</span><h2>Places with a point of view.</h2></div><a class="text-link" href="stays.html">Browse all stays <i class="bi bi-arrow-up-right"></i></a></div>${featuredStays.length ? `<div class="stay-grid">${featuredStays.map(stayCard).join('')}</div>` : '<div class="empty-results"><h2>New stays are on their way.</h2><p>Check back soon for our first places in the collection.</p></div>'}</section><section class="editorial-band"><div><span class="eyebrow">A BETTER WAY TO GET AWAY</span><h2>Less scrolling.<br><em>More settling in.</em></h2></div><p>We look for the small things that make a place feel like yours: a neighborhood bakery, good light in the morning, a host who knows the city.</p><a href="stays.html" class="round-link" aria-label="Explore all stays"><i class="bi bi-arrow-up-right"></i></a></section></main>`;
}

function staysView() {
  const params = new URLSearchParams(location.search);
  return `<main class="page-main"><section class="page-intro"><div><span class="eyebrow">THE COLLECTION</span><h1>Find your kind of place.</h1><p>Independent stays, picked for the way they make you feel.</p></div><span class="collection-count"><strong id="result-count">${stays.length}</strong> considered stays</span></section><div class="results-toolbar"><div class="filter-group"><label class="filter-search"><i class="bi bi-search"></i><input id="filter-destination" value="${escapeHtml(params.get('destination') || '')}" placeholder="City or neighborhood"></label><select id="filter-type" aria-label="Filter by stay type"><option value="all">All stay types</option><option>Design hotel</option><option>Boutique hotel</option><option>Guesthouse</option></select><select id="filter-sort" aria-label="Sort stays"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="rating">Top rated</option></select></div><button id="saved-only" class="saved-filter" type="button"><i class="bi bi-heart"></i> Saved</button></div><div class="stay-grid results-grid" id="results-grid"></div></main>`;
}

function propertyView(stay) {
  const search = new URLSearchParams(location.search);
  const bookingQuery = new URLSearchParams();
  bookingQuery.set('hotel', stay.id);
  ['checkin', 'checkout', 'guests'].forEach((key) => { if (search.has(key)) bookingQuery.set(key, search.get(key)); });
  const extraImages = [
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=950&q=85',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=950&q=85',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=950&q=85',
  ];
  return `<main class="page-main property-main"><a class="back-link" href="stays.html"><i class="bi bi-arrow-left"></i> All stays</a><div class="property-heading"><div><span class="eyebrow">${escapeHtml(stay.category || 'INDEPENDENT STAY')}</span><h1>${escapeHtml(stay.name)}</h1><p><i class="bi bi-geo-alt"></i> ${escapeHtml(stay.neighborhood || stay.city)}, ${escapeHtml(stay.city)} <span class="dot-separator">·</span> <i class="bi bi-star-fill star-icon"></i> ${Number(stay.rating || 4.9).toFixed(2)} <span class="muted">(${stay.reviews || 0} reviews)</span></p></div><button class="share-button" type="button" data-share><i class="bi bi-share"></i> Share</button></div><div class="property-gallery"><img src="${escapeHtml(stay.image)}" alt="${escapeHtml(stay.name)} exterior and interior" class="gallery-main"><img src="${extraImages[0]}" alt="A considered hotel room" loading="lazy"><img src="${extraImages[1]}" alt="Hotel lounge" loading="lazy"><img src="${extraImages[2]}" alt="A bright guest room" loading="lazy"><button type="button" class="gallery-all"><i class="bi bi-grid"></i> View all photos</button></div><div class="property-layout"><section class="property-details"><div class="host-row"><div><h2>A calm base in ${escapeHtml(stay.city.split(',')[0])}</h2><p>Private room · Up to ${Math.max(...stay.rooms.map((room) => room.guests || 2))} guests · Thoughtfully hosted</p></div><span class="host-avatar">S</span></div><p class="property-description">${escapeHtml(stay.description)}</p><div class="amenity-list"><h3>What makes it special</h3>${(stay.amenities || []).map((amenity) => `<span><i class="bi bi-check2"></i> ${escapeHtml(amenity)}</span>`).join('')}</div><div class="room-list"><h3>Choose your room</h3>${stay.rooms.map((room) => { const query = new URLSearchParams(bookingQuery); query.set('room', room.id); return `<article class="room-option"><div><strong>${escapeHtml(room.name)}</strong><span>Up to ${room.guests || 2} guests · Free cancellation</span></div><div><strong>${money(room.price)} <small>/ night</small></strong><a class="button-dark" href="booking.html?${query}">Reserve <i class="bi bi-arrow-right"></i></a></div></article>`; }).join('')}</div></section><aside class="booking-aside"><span class="eyebrow">YOUR NEXT CHAPTER</span><h3>From ${money(stay.price)} <small>/ night</small></h3><p>Choose your room to see dates and final pricing.</p><a class="button-dark full-button" href="booking.html?${new URLSearchParams(bookingQuery).toString()}&room=${encodeURIComponent(stay.rooms[0]?.id || '')}">Check availability <i class="bi bi-arrow-right"></i></a><div class="aside-detail"><i class="bi bi-shield-check"></i> Secure booking, no hidden fees</div></aside></div></main>`;
}

function bookingView(stay) {
  const params = new URLSearchParams(location.search);
  const room = stay.rooms.find((item) => item.id === params.get('room')) || stay.rooms[0];
  return `<main class="page-main narrow-main"><a class="back-link" href="property.html?id=${encodeURIComponent(stay.id)}"><i class="bi bi-arrow-left"></i> Back to stay</a><div class="booking-title"><span class="eyebrow">ONE LAST THING</span><h1>Make it yours.</h1><p>Your next good story starts here.</p></div><div class="checkout-layout"><form id="booking-form" class="checkout-form"><input type="hidden" name="hotel_id" value="${escapeHtml(stay.id)}"><input type="hidden" name="room_id" value="${escapeHtml(room.id)}"><input type="hidden" name="hotel_name" value="${escapeHtml(stay.name)}"><input type="hidden" name="room_name" value="${escapeHtml(room.name)}"><input type="hidden" name="price_per_night" value="${room.price}"><h2>Guest details</h2><div class="form-row"><label>First name<input name="first_name" required autocomplete="given-name" placeholder="Alex"></label><label>Last name<input name="last_name" required autocomplete="family-name" placeholder="Morgan"></label></div><label>Email address<input name="email" type="email" required autocomplete="email" placeholder="alex@example.com"></label><div class="form-row"><label>Check in<input name="check_in" type="date" min="${today}" value="${escapeHtml(params.get('checkin') || today)}" required></label><label>Check out<input name="check_out" type="date" min="${escapeHtml(params.get('checkin') || today)}" value="${escapeHtml(params.get('checkout') || nextWeek)}" required></label></div><label>Guests<select name="guests">${[1, 2, 3, 4].map((guestCount) => `<option value="${guestCount}" ${Number(params.get('guests') || 2) === guestCount ? 'selected' : ''}>${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}</option>`).join('')}</select></label><label class="notes-label">Anything we should know? <span>Optional</span><textarea name="notes" rows="3" placeholder="Arrival time, accessibility needs..."></textarea></label><p class="form-notice" id="booking-message" role="status"></p><button class="button-dark submit-button" type="submit">Confirm reservation <i class="bi bi-arrow-right"></i></button><p class="form-footnote">You won’t be charged yet. Payment collection can be added after Supabase is configured.</p></form><aside class="booking-summary"><img src="${escapeHtml(stay.image)}" alt="${escapeHtml(stay.name)}"><div class="summary-copy"><span class="eyebrow">${escapeHtml(stay.category)}</span><h3>${escapeHtml(stay.name)}</h3><p>${escapeHtml(stay.city)} · ${escapeHtml(room.name)}</p><div class="summary-price"><span>${money(room.price)} × <b id="night-count">7 nights</b></span><strong id="total-price">${money(room.price * 7)}</strong></div><div class="summary-total"><span>Total</span><strong id="grand-total">${money(room.price * 7)}</strong></div></div></aside></div></main>`;
}

async function tripsView() {
  const session = await getSession();
  const bookings = await fetchBookings();
  const list = bookings.length ? bookings.map((booking) => {
    const hotel = booking.rooms?.hotels;
    const title = booking.hotel_name || hotel?.name || 'Stayfinder reservation';
    const city = booking.city || hotel?.city || '';
    const image = booking.image || hotel?.cover_image_url || demoStays[0].image;
    return `<article class="trip-row"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}"><div class="trip-copy"><span class="eyebrow">${escapeHtml(booking.status || 'CONFIRMED')}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(city)} · ${escapeHtml(booking.room_name || booking.rooms?.name || 'Room')}</p></div><div class="trip-date"><span>${escapeHtml(booking.check_in || 'Dates to be confirmed')}</span><strong>${money(booking.total_price || booking.price_per_night)}</strong></div></article>`;
  }).join('') : `<div class="empty-state"><span class="empty-icon"><i class="bi bi-suitcase"></i></span><h2>Your next trip is waiting.</h2><p>Once you reserve a stay, you’ll find all the details right here.</p><a class="button-dark" href="stays.html">Find a stay <i class="bi bi-arrow-right"></i></a></div>`;
  return `<main class="page-main"><section class="page-intro trips-intro"><div><span class="eyebrow">YOUR JOURNEYS</span><h1>Everywhere you’re going.</h1><p>${session ? `Signed in as ${escapeHtml(session.user.email)}` : 'Your saved and upcoming reservations, all in one place.'}</p></div><a class="button-dark" href="stays.html">Plan a trip <i class="bi bi-arrow-right"></i></a></section><section class="trip-list">${list}</section>${session ? '<button class="text-button" id="sign-out" type="button">Sign out</button>' : '<p class="signin-prompt">Have an account? <a href="login.html">Sign in to sync your trips</a></p>'}</main>`;
}

function loginView() {
  return `<main class="auth-layout"><section class="auth-image"><div><span class="eyebrow light-eyebrow">A PLACE TO BEGIN</span><h1>Go somewhere<br><em>good.</em></h1></div><span>Casa Verde Lisboa · Príncipe Real</span></section><section class="auth-panel"><span class="eyebrow">WELCOME TO STAYFINDER</span><h2>Make yourself at home.</h2><p>Sign in or create an account to keep your trips close.</p><div class="auth-tabs" role="tablist"><button class="active" type="button" data-auth-mode="signin">Sign in</button><button type="button" data-auth-mode="signup">Create account</button></div><form id="auth-form"><label class="signup-only hidden">Full name<input name="full_name" autocomplete="name" placeholder="Your name"></label><label>Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Password<input name="password" type="password" required minlength="8" autocomplete="current-password" placeholder="At least 8 characters"></label><p class="form-notice" id="auth-message" role="status"></p><button class="button-dark submit-button" type="submit"><span id="auth-submit-label">Sign in</span><i class="bi bi-arrow-right"></i></button></form><p class="auth-note">${isSupabaseConfigured ? 'Your account is protected by Supabase authentication.' : 'Demo browsing is enabled. Connect Supabase to activate accounts.'}</p></section></main>`;
}

async function adminView() {
  const session = await getSession();
  if (!session) return `<main class="page-main admin-gate"><span class="eyebrow">HOST TOOLS</span><h1>Manage the collection.</h1><p>Sign in with an administrator account to add stays and manage listings.</p><a class="button-dark" href="login.html">Sign in <i class="bi bi-arrow-right"></i></a></main>`;
  const isAdmin = await fetchAdminRole(session.user.id);
  if (!isAdmin) return `<main class="page-main admin-gate"><span class="eyebrow">HOST TOOLS</span><h1>Access is restricted.</h1><p>This account does not have the administrator role.</p><a class="text-link" href="index.html">Return to Stayfinder <i class="bi bi-arrow-up-right"></i></a></main>`;
  return `<main class="page-main admin-page"><section class="page-intro"><div><span class="eyebrow">STAYFINDER OPERATIONS</span><h1>Host tools.</h1><p>Signed in as ${escapeHtml(session.user.email)}</p></div></section><div class="admin-grid"><form class="admin-form" id="hotel-form"><h2>Add a stay</h2><label>Property name<input name="name" required></label><div class="form-row"><label>City<input name="city" required></label><label>Neighborhood<input name="neighborhood"></label></div><label>Description<textarea name="description" rows="4" required></textarea></label><label>First room name<input name="room_name" required></label><div class="form-row"><label>Max guests<input name="max_guests" type="number" min="1" max="12" value="2" required></label><label>Price per night (USD)<input name="price_per_night" type="number" min="1" step="1" required></label></div><label>Cover photo<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" required></label><p class="form-notice" id="admin-message" role="status"></p><button class="button-dark" type="submit">Upload and publish <i class="bi bi-arrow-up-right"></i></button></form><section class="admin-list"><h2>Published stays <span>${stays.length}</span></h2>${stays.map((stay) => `<article><img src="${escapeHtml(stay.image)}" alt=""><div><strong>${escapeHtml(stay.name)}</strong><span>${escapeHtml(stay.city)}</span></div>${stay.cover_image_path ? `<button class="download-image" type="button" data-download-image="${escapeHtml(stay.cover_image_path)}" aria-label="Download ${escapeHtml(stay.name)} photo" title="Download photo"><i class="bi bi-download"></i></button>` : ''}<i class="bi bi-check-circle-fill"></i></article>`).join('')}</section></div></main>`;
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('stayfinder-favorites') || '[]');
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const updated = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
  localStorage.setItem('stayfinder-favorites', JSON.stringify(updated));
  return updated.includes(id);
}

function renderResults() {
  const destination = document.querySelector('#filter-destination')?.value.trim().toLowerCase() || '';
  const category = document.querySelector('#filter-type')?.value || 'all';
  const sort = document.querySelector('#filter-sort')?.value || 'recommended';
  const savedOnly = document.querySelector('#saved-only')?.classList.contains('selected');
  let visible = stays.filter((stay) => `${stay.name} ${stay.city} ${stay.neighborhood || ''}`.toLowerCase().includes(destination));
  if (category !== 'all') visible = visible.filter((stay) => stay.category === category);
  if (savedOnly) visible = visible.filter((stay) => getFavorites().includes(stay.id));
  if (sort === 'price-low') visible.sort((a, b) => a.price - b.price);
  if (sort === 'rating') visible.sort((a, b) => b.rating - a.rating);
  document.querySelector('#result-count').textContent = visible.length;
  document.querySelector('#results-grid').innerHTML = visible.length ? visible.map(stayCard).join('') : '<div class="empty-results"><i class="bi bi-search"></i><h2>No stays found just yet.</h2><p>Try a different city or clear the selected filters.</p></div>';
}

function updateBookingTotal() {
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const checkout = form.elements.check_out;
  checkout.min = form.elements.check_in.value;
  const checkIn = new Date(`${form.elements.check_in.value}T00:00:00`);
  const checkOut = new Date(`${form.elements.check_out.value}T00:00:00`);
  const nightDifference = Math.ceil((checkOut - checkIn) / 86400000);
  const isValidStay = Number.isFinite(nightDifference) && nightDifference > 0;
  const nights = isValidStay ? nightDifference : 0;
  const total = nights * Number(form.elements.price_per_night.value);
  document.querySelector('#night-count').textContent = isValidStay ? `${nights} night${nights === 1 ? '' : 's'}` : 'Select valid dates';
  document.querySelector('#total-price').textContent = money(total);
  document.querySelector('#grand-total').textContent = money(total);
  return { nights, total, isValidStay };
}

async function render() {
  if (isSupabaseConfigured) {
    try {
      const remoteStays = await fetchStays();
      if (remoteStays !== null) stays = remoteStays;
    } catch (error) {
      console.error('Could not load stays from Supabase:', error);
    }
  }

  let content;
  if (page === 'home') content = homeView();
  else if (page === 'stays') content = staysView();
  else if (page === 'property') content = propertyView(stays.find((stay) => stay.id === new URLSearchParams(location.search).get('id')) || getDemoStay(new URLSearchParams(location.search).get('id')));
  else if (page === 'booking') content = bookingView(stays.find((stay) => stay.id === new URLSearchParams(location.search).get('hotel')) || getDemoStay(new URLSearchParams(location.search).get('hotel')));
  else if (page === 'trips') content = await tripsView();
  else if (page === 'login') content = loginView();
  else if (page === 'admin') content = await adminView();
  else content = homeView();

  root.innerHTML = `${nav()}${content}${footer()}`;
  if (page === 'stays') renderResults();
  if (page === 'booking') updateBookingTotal();
  bindEvents();
}

function bindEvents() {
  document.querySelector('.menu-toggle')?.addEventListener('click', () => document.querySelector('.main-nav').classList.toggle('is-open'));
  document.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', () => {
    const liked = toggleFavorite(button.dataset.favorite);
    button.classList.toggle('is-favorite', liked);
    button.innerHTML = `<i class="bi bi-heart${liked ? '-fill' : ''}"></i>`;
  }));
  ['#filter-destination', '#filter-type', '#filter-sort'].forEach((selector) => document.querySelector(selector)?.addEventListener('input', renderResults));
  document.querySelector('#saved-only')?.addEventListener('click', (event) => {
    event.currentTarget.classList.toggle('selected');
    renderResults();
  });
  document.querySelector('[data-share]')?.addEventListener('click', async () => {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else await navigator.clipboard.writeText(location.href);
  });
  document.querySelector('#booking-form')?.addEventListener('input', updateBookingTotal);
  document.querySelector('#booking-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const notice = document.querySelector('#booking-message');
    const { total, isValidStay } = updateBookingTotal();
    if (!isValidStay) {
      notice.textContent = 'Check-out must be after check-in.';
      notice.className = 'form-notice error-message';
      return;
    }
    if (isSupabaseConfigured && !(await getSession())) {
      notice.innerHTML = 'Please <a href="login.html">sign in</a> before confirming your reservation.';
      notice.className = 'form-notice error-message';
      return;
    }
    const booking = Object.fromEntries(new FormData(form));
    booking.guests = Number(booking.guests);
    booking.total_price = total;
    delete booking.first_name;
    delete booking.last_name;
    delete booking.email;
    delete booking.notes;
    try {
      await createBooking(booking);
      notice.textContent = 'Reservation saved. Your stay is waiting in My trips.';
      notice.className = 'form-notice success-message';
      form.querySelector('button[type="submit"]').innerHTML = 'Reservation confirmed <i class="bi bi-check2"></i>';
      form.querySelector('button[type="submit"]').disabled = true;
    } catch (error) {
      notice.textContent = error.message;
      notice.className = 'form-notice error-message';
    }
  });
  document.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-auth-mode]').forEach((tab) => tab.classList.toggle('active', tab === button));
    const signup = button.dataset.authMode === 'signup';
    document.querySelector('.signup-only').classList.toggle('hidden', !signup);
    document.querySelector('#auth-submit-label').textContent = signup ? 'Create account' : 'Sign in';
    document.querySelector('#auth-form [name="password"]').autocomplete = signup ? 'new-password' : 'current-password';
    document.querySelector('#auth-message').textContent = '';
    document.querySelector('#auth-form [name="full_name"]').required = signup;
  }));
  document.querySelector('#auth-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const notice = document.querySelector('#auth-message');
    try {
      if (document.querySelector('[data-auth-mode].active').dataset.authMode === 'signup') await signUp(fields.email, fields.password, fields.full_name);
      else await signIn(fields.email, fields.password);
      notice.textContent = 'You’re all set. Taking you to your trips...';
      notice.className = 'form-notice success-message';
      setTimeout(() => { location.href = 'trips.html'; }, 800);
    } catch (error) {
      notice.textContent = error.message;
      notice.className = 'form-notice error-message';
    }
  });
  document.querySelector('#sign-out')?.addEventListener('click', async () => {
    await signOut();
    location.href = 'index.html';
  });
  document.querySelector('#hotel-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const notice = document.querySelector('#admin-message');
    const fields = Object.fromEntries(new FormData(form));
    const file = fields.cover;
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const { error: uploadError } = await supabase.storage.from('hotel-images').upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('hotel-images').getPublicUrl(path);
      const slug = `${fields.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
      const { data: hotel, error: hotelError } = await supabase.from('hotels').insert({
        name: fields.name,
        slug,
        city: fields.city,
        neighborhood: fields.neighborhood,
        description: fields.description,
        cover_image_url: publicUrl,
        cover_image_path: path,
        is_published: true,
      }).select('id').single();
      if (hotelError) {
        await supabase.storage.from('hotel-images').remove([path]);
        throw hotelError;
      }
      const { error: roomError } = await supabase.from('rooms').insert({
        hotel_id: hotel.id,
        name: fields.room_name,
        max_guests: Number(fields.max_guests),
        price_per_night: Number(fields.price_per_night),
      });
      if (roomError) {
        await supabase.from('hotels').delete().eq('id', hotel.id);
        await supabase.storage.from('hotel-images').remove([path]);
        throw roomError;
      }
      notice.textContent = 'Stay and room published successfully.';
      notice.className = 'form-notice success-message';
      form.reset();
      setTimeout(() => location.reload(), 900);
    } catch (error) {
      notice.textContent = error.message;
      notice.className = 'form-notice error-message';
    }
  });
  document.querySelectorAll('[data-download-image]').forEach((button) => button.addEventListener('click', async () => {
    const { data, error } = await supabase.storage.from('hotel-images').download(button.dataset.downloadImage);
    if (error) {
      button.title = error.message;
      return;
    }
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = button.dataset.downloadImage.split('/').pop();
    link.click();
    URL.revokeObjectURL(url);
  }));
}

render().catch((error) => {
  console.error(error);
  root.innerHTML = `${nav()}<main class="page-main empty-results"><h1>We couldn’t load this page.</h1><p>${escapeHtml(error.message)}</p><a href="index.html" class="button-dark">Back home</a></main>${footer()}`;
});