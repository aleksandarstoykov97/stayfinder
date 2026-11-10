insert into public.hotels (id, name, slug, city, neighborhood, description, category, cover_image_url, is_published)
values
  ('11111111-1111-4111-8111-111111111111', 'Casa Verde Lisboa', 'casa-verde-lisboa', 'Lisbon, Portugal', 'Príncipe Real', 'A slow-living hideaway in the heart of Lisbon, tucked between leafy gardens and the city’s best little restaurants.', 'Design hotel', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85', true),
  ('22222222-2222-4222-8222-222222222222', 'L’Atelier Saint-Germain', 'atelier-saint-germain', 'Paris, France', 'Saint-Germain-des-Prés', 'A thoughtful Paris address with a quiet courtyard, original details and a neighborhood made for wandering.', 'Boutique hotel', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85', true),
  ('33333333-3333-4333-8333-333333333333', 'The North House', 'the-north-house', 'Copenhagen, Denmark', 'Indre By', 'Warm Nordic materials, an excellent bakery downstairs and a calm place to land after a day around the canals.', 'Design hotel', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85', true)
on conflict (id) do nothing;

insert into public.rooms (id, hotel_id, name, max_guests, price_per_night)
values
  ('11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'Garden suite', 2, 184),
  ('11111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111111', 'Terrace loft', 3, 236),
  ('22222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', 'Classic room', 2, 229),
  ('22222222-2222-4222-8222-222222222224', '22222222-2222-4222-8222-222222222222', 'Deluxe room', 3, 295),
  ('33333333-3333-4333-8333-333333333334', '33333333-3333-4333-8333-333333333333', 'Nordic room', 2, 198),
  ('33333333-3333-4333-8333-333333333335', '33333333-3333-4333-8333-333333333333', 'Family room', 4, 278)
on conflict (id) do nothing;