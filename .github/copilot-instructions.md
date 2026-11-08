# Stayfinder project instructions

## Product context
Stayfinder is a multi-page hotel discovery and reservation app built with plain JavaScript, HTML, CSS, Bootstrap, Vite, and Supabase. Guests can search stays, save favorites, make reservations, and review their trips. Administrators manage listings and property photos.

## Architecture
- Keep each user-facing screen in its own root HTML entry and register new entries in `vite.config.js`.
- Put shared browser logic in small ES modules under `src/js/`; keep Supabase access in `src/js/supabase.js` and shared styling in `src/app.css`.
- Use Bootstrap utilities and Bootstrap Icons where useful. Do not introduce React, Vue, TypeScript, or a client-side router.
- Keep demo data clearly separate from data returned by Supabase.
- Put every database schema change in a new ordered file under `supabase/migrations/`.

## Security
- Never put a Supabase service-role key, password, or other secret in browser code or committed environment files. Only the project URL and anon/publishable key may use `VITE_` variables.
- Enforce access in PostgreSQL RLS policies; hiding controls in the browser is not authorization.
- Validate ownership and administrator privileges in the database. Do not trust role values supplied by the browser.
- Use Supabase Storage policies for uploads, and restrict writes to administrators.

## Quality
- Preserve responsive behavior, semantic HTML, labels, keyboard access, and reduced-motion support.
- Run `npm run build` after changes to app code or Vite entries.
- Keep sample credentials out of the repository. Demo access must use an explicitly provisioned test account.