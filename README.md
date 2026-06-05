# Precision Reels

Standalone GitHub Pages site for Precision Reels used walk-behind greens mower inventory.

## Pages

- `index.html`: public inventory with expandable listing details and Brandon email inquiries.
- `contact.html`: contact page with mailto form.
- `admin.html`: secure inventory admin once Supabase is configured.

## Supabase setup

1. Create a Supabase project.
2. In Supabase Storage, create a public bucket named `listing-images`.
3. Run `supabase-schema.sql` in the Supabase SQL editor.
4. Disable public signups in Authentication settings.
5. Create Brandon's auth user with `brandon@precisionreels.com`.
6. Insert Brandon's auth user UUID into `admin_profiles`:

```sql
insert into public.admin_profiles (user_id, email)
values ('AUTH_USER_UUID_HERE', 'brandon@precisionreels.com');
```

7. Copy `supabase-config.example.js` to `supabase-config.js` and fill in the project URL and anon key.

Only the Supabase anon key belongs in this repo. Do not commit a service role key.

## SEO and PWA

The site includes canonical tags, Open Graph metadata, structured data, `robots.txt`, `sitemap.xml`, a web manifest, app icons, and a small service worker for cached shell assets.
