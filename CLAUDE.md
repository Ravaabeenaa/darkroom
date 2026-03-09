# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
```

No test runner is configured.

## Architecture

**Darkroom** is an Astro 5 e-commerce/services site for a photography lab, deployed to **Cloudflare Pages** using `@astrojs/cloudflare`. All dynamic pages require `export const prerender = false`.

### Cloudflare Bindings

Accessed via `Astro.locals.runtime.env` (or `locals.runtime.env` in API routes):

| Binding | Type | Usage |
|---|---|---|
| `darkroom_db` | D1 (SQLite) | All data: services, orders, images metadata |
| `darkroom_media` | R2 | Service/product images |
| `ADMIN_PASSWORD` | Secret | Admin login |
| `ADMIN_COOKIE_SECRET` | Secret | Cookie auth token value |
| `PUBLIC_R2_BASE_URL` | Var | Base URL for serving R2 images |

### Auth

`src/middleware.ts` guards all `/admin/*` and `/api/admin/*` routes. It checks a cookie `dr_admin` whose value must equal `ADMIN_COOKIE_SECRET`. The login endpoint at `/api/admin/login` is exempted.

### Cart

`window.DarkroomCart` is a global object injected inline in `src/layouts/BaseLayout.astro`. It manages cart state in `localStorage` under key `dr_cart_v1` and dispatches `dr-cart-changed` custom events. Pages listen to this event for reactivity. Customer form data is persisted separately under `dr_customer_v1`.

### Data Model

- **Services**: the primary sellable items (film developing, scanning, etc.). Stored in `services` table with `primary_image_key` pointing to R2. Images are tracked in `service_images` with kinds: `primary`, `gallery`, `sample`.
- **Products**: a static array in `src/lib/products.ts` (legacy/unused shop items with Unsplash images).
- **Orders**: use a dual-table pattern — `orders` stores current state and a snapshot of original values (prefixed `original_`) for audit. Order items are stored in both `order_items_original` and `order_items_current`. Order refs follow the format `DR-YYMM-NNN`.

### Money / Currency

All prices are stored as **cents** (integers). The helper `money()` in `src/lib/db.ts` formats to `MVR X.XX`. Currency is MVR (Maldivian Rufiyaa).

### Styling

- Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Only `src/styles/tailwind.css` is active** — it is the sole import in `BaseLayout.astro`. `theme.css` and `global.css` are orphaned and unused.
- CSS custom properties defined in `src/styles/tailwind.css`. Key tokens:
  - `--red: #ED1C24` — brand red (buttons, badges, accents)
  - `--cream: #EEE4D2` — brand cream (maps to `--text`)
  - `--bg: #000000` — black background
  - `--btn / --btnText` — red bg, black text
  - `--font-display / --font-serif` — League Gothic (headings)
  - `--font-sans` — JetBrains Mono (body)
- **Never use `bg-black` for buttons** — invisible on dark background. Use `bg-[var(--btn)]` instead.
- Fonts are self-hosted in `public/fonts/` (variable TTF files). No Google Fonts.

### Static assets

- `public/fonts/` — League Gothic variable TTF, JetBrains Mono variable TTF (regular + italic)
- `public/images/logos/` — logo variants: `logo-light.png` (cream, for dark bg), `logo-dark.png` (black), `logo-red.png` (red). Use `logo-light.png` in the header.
- Source files from client are in `fromClient/` — do not serve from there directly.

### R2 Image Upload

`/api/admin/r2/upload` validates images by **magic bytes** (not MIME type) and accepts JPG, PNG, WEBP up to 12MB. Images are stored at `services/{service_id}/{kind}/{uuid}.{ext}`. When kind is `primary`, it replaces the existing primary record and updates `services.primary_image_key`.

### API Routes Summary

- `POST /api/orders/create` — public; validates cart against live DB prices (server-side total calculation)
- `POST /api/admin/login` — issues `dr_admin` cookie
- `POST /api/admin/r2/upload` — image upload to R2
- `DELETE /api/admin/r2/delete` — remove image from R2 + DB
- `POST /api/admin/r2/reorder` — update sort_order for gallery images
- `GET/POST /api/admin/services/save` — create/update service
- `DELETE /api/admin/services/delete` — delete service
- `GET /api/admin/services/groups.json` — list distinct service groups
