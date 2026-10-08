# NOORÉ — luxury fragrance candles & gifting

A complete e-commerce experience for the NOORÉ candle brand: a 3D, animation-rich **Vite + React** storefront, a **Node.js (Express) API**, and a full **admin panel** for managing products, prices, images, orders, coupons, contact/social/address details and every content page (terms, privacy, shipping, refunds, candle care, FAQ…).

```
NOORE/
├─ client/      Vite + React storefront  (+ /admin panel)       → http://localhost:5173
├─ server/      Node.js / Express API + JSON data store         → http://localhost:4000
├─ shared/      Seed catalog & content (products, collections, settings, pages)
├─ docker/      Entrypoint for the hot-reload dev container
├─ scripts/     Image preparation (Python / Pillow)
├─ Dockerfile, docker-compose.yml, docker-compose.dev.yml
├─ start-noore.cmd / stop-noore.cmd / start-noore-dev.cmd   Double-click launchers for Docker Desktop
└─ NOORE_Product_Catalog/   The original concept image pack
```

## Run with Docker Desktop (recommended)

No Node.js or terminal needed — just Docker Desktop.

| What | How |
| --- | --- |
| **Start / update the site** | Double-click **`start-noore.cmd`**. The first build takes 2–3 minutes; it opens **http://localhost:4000** when ready. |
| **Day to day** | Docker Desktop → **Containers → noore** → ▶ / ■. Click the `4000:4000` port link to open the site. |
| **Stop** | ■ in Docker Desktop, or double-click **`stop-noore.cmd`**. |
| **After changing code** | Double-click `start-noore.cmd` again — it rebuilds the image and keeps your data. |
| **Admin panel** | **http://localhost:4000/admin** — `admin@noore.in` / `noore-admin-2026` on first start. |

The container restarts by itself when Docker Desktop starts, unless you stopped it. Everything the admin panel changes (orders, products, prices, settings, pages, customers) lives in the Docker volume `noore_noore-data`, and uploaded images live in `noore_noore-uploads`. Both survive rebuilds, restarts and `stop`; only deleting the volumes in Docker Desktop erases them.

To change the port, admin login or secrets, copy `.env.example` to `.env` next to `docker-compose.yml`, edit it, and run `start-noore.cmd` again. The admin values only apply on the very first start, while the data volume is still empty.

**Hot-reload development container (optional).** Double-click **`start-noore-dev.cmd`** to run the Vite dev server and the API inside Docker with live reload: edit files in this folder and the page updates. It is served at **http://localhost:5173** (admin at `/admin`), runs alongside the main container, and appears in Docker Desktop as **noore-dev**. It reads and writes the local `server/data` folder, not the Docker volume.

Equivalent commands, if you ever want them:

```bash
docker compose up -d --build                        # build + start  (http://localhost:4000)
docker compose stop                                 # stop, keep data
docker compose logs -f                              # follow logs
docker compose -f docker-compose.dev.yml up -d      # dev container  (http://localhost:5173)
```

## Quick start without Docker

Requires Node.js 20.19+ or 22.12+ (Vite 7's minimum).

```bash
npm install          # installs root, client and server workspaces
npm run dev          # starts the API (port 4000) and the storefront (port 5173) together
```

Open **http://localhost:5173** for the storefront and **http://localhost:5173/admin** for the studio admin.

On first boot the API seeds its data from `shared/` and creates an administrator. The credentials are printed in the API console:

```
✦ Admin account created  →  admin@noore.in  /  noore-admin-2026
```

Change them in **Admin → Settings → Administrators**, or set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` before the first run (see `server/.env.example`).

### Production build

```bash
npm run build        # builds client/dist
npm start            # Express serves the API, the storefront and /admin from one origin (port 4000)
```

Before putting the site on the internet:

- **Secrets.** Set `JWT_SECRET` and `ADMIN_KEY` to long random strings. If they're missing or still the public defaults, production generates its own JWT secret (saved as `server/data/.jwt-secret`) and turns the `x-admin-key` header off.
- **Admin password.** Change the seeded `noore-admin-2026` password under Admin → Settings → Administrators.
- **Reverse proxy.** Behind nginx, Caddy or a load balancer, set `TRUST_PROXY=1`. Otherwise every visitor shares the proxy's IP for rate limiting, and sitemap/canonical URLs say `http://`. Leave it unset when the container is exposed directly, or visitors could fake their IP.
- **Payments.** Card and UPI are simulated. Connect a real provider in `server/src/services/payment.js` before taking money.

## The storefront

| Route | What it does |
| --- | --- |
| `/` | Opening sequence, 3D hero (lit Amber & Saffron on polished stone with bloom, embers and gold dust), collections showcase with 3D-tilt cards, draggable bestseller carousel, scroll-driven "signature space" with a morphing 3D candle, craft section, gifting banners, 3D coverflow testimonials, newsletter |
| `/shop` | Filterable catalogue (collection, fragrance family, price, sort, search) with animated layout |
| `/collections/:slug` | Collection hero with a row of lit 3D candles and specs |
| `/products/:slug` | Interactive 3D product stage: drag to rotate, light/snuff, lift the lid, tap hotspots for top/heart/base notes, photo toggle; sizes, add-to-bag with fly-to-cart, notes pyramid, story, related, reviews |
| `/gifting` | Curated gift sets, **build-your-own box** (3 candles, 10 % off via `BOX10`, gift wrap), corporate gifting enquiry |
| `/checkout` → `/order/:number` | Three-step checkout with server-side pricing, coupons, gift wrap, simulated card/UPI/COD payment and an order confirmation page |
| `/account` | Register / sign in, order history |
| `/pages/:slug` | Admin-managed content pages (terms, privacy, shipping & returns, refund policy, candle care) |
| `/story`, `/contact` | Brand story; contact form, address, hours and FAQ (all from admin settings) |

Everything degrades gracefully: if WebGL is unavailable an SVG candle is shown; if the API is down the storefront renders the bundled catalog and content and shows a small banner. Add `?quality=low|medium|high` to force the 3D quality tier, and `?nointro` to skip the opening sequence.

## The admin panel (`/admin`)

| Section | Manage |
| --- | --- |
| Dashboard | Revenue, orders, average order, open enquiries, low stock, bestsellers, 30-day sales |
| Products | Create / edit / duplicate / delete / reorder; name, slug, collection, family, copy, badges, moods, notes, **sizes & prices**, stock, rating, featured, published; **vessel & 3D appearance** (material, colours, lid, label) with a live illustration / 3D preview; main photograph via the media library |
| Collections | Name, headline, description, tone, colours, "from" price, banner image, specifications |
| Coupons | Percentage / flat / free-shipping codes with minimum subtotal, minimum items, collection restriction, max uses, expiry, on/off |
| Media | Drag-and-drop image uploads (served from `/images/uploads/…`), bundled catalog imagery, copy URL, delete |
| Orders | Search & filter, full order detail, status workflow (placed → confirmed → packed → shipped → delivered / cancelled / refunded), tracking number & URL, internal notes |
| Customers | Account holders with spend; newsletter subscribers with CSV export |
| Inbox | Corporate gifting enquiries and contact-form messages with status tracking |
| Reviews | Show / hide, mark verified, delete |
| Pages | Markdown editor with live preview for terms, privacy, shipping & returns, refunds, candle care — and any new page; footer visibility toggle |
| Settings | **Brand & SEO · Contact & address · Social links · Shipping & fees · Homepage copy & announcement bar · FAQ · Legal · Administrators** |

All admin routes require a Bearer token with the `admin` role (`POST /api/admin/auth/login`). Scripts can alternatively send the `x-admin-key` header configured by `ADMIN_KEY` (in production, only when it's set to something other than the public default).

## The API

SEO: `GET /robots.txt`, `GET /sitemap.xml`; every storefront URL is served with its own title, description, Open Graph tags, canonical link and (for products) JSON-LD.

Public: `GET /api/products`, `/api/products/suggest?q=`, `/api/products/:slug`, `/api/collections`, `/api/collections/:slug`, `POST /api/cart/price`, `GET /api/cart/coupons`, `POST /api/orders`, `GET /api/orders/:number?email=`, `GET /api/orders/mine`, `POST /api/auth/register|login`, `GET /api/auth/me`, `POST /api/newsletter`, `POST /api/contact`, `POST /api/gifting/enquiry`, `GET|POST /api/reviews/:slug`, `GET /api/settings`, `GET /api/pages`, `GET /api/pages/:slug`, `GET /api/meta`, `GET /api/health`.

Admin (`/api/admin/…`): `auth/login`, `auth/me`, `overview`, `admins`, `products` (+ `:slug`, `:slug/duplicate`, `reorder`), `collections/:slug`, `coupons`, `media`, `orders`, `customers`, `subscribers` (`?format=csv`), `enquiries`, `contacts`, `reviews`, `pages`, `settings` (+ `reset`).

Prices are **always computed on the server** from the catalog, coupons and shipping settings — the client only sends slugs, sizes and quantities.

### Data & persistence

The API uses a small atomic JSON document store in `server/data/` (products, collections, coupons, pages, settings, orders, users, admins, reviews, newsletter, enquiries, contacts). It is seeded from `shared/` on first run and is easy to swap for MongoDB/Postgres — only `server/src/db/store.js` and the service modules touch storage.

### Payments

`server/src/services/payment.js` is a pluggable adapter. Card and UPI are **simulated** (a card ending in `0000` is declined) so the full flow can be demonstrated; cash on delivery is real. Plug Razorpay or Stripe in there when going live.

## Tech

- **Frontend:** React 19, Vite 7, react-three-fiber + drei + postprocessing (Three.js), Framer Motion, Lenis smooth scroll, Zustand, React Router 7
- **Backend:** Node 20.19+ (or 22.12+), Express 5, zod validation, JWT auth, bcryptjs, multer uploads
- **Design:** Cormorant Garamond + Jost, espresso/cream/gold palette, custom cursor, film grain, page-transition curtains, magnetic buttons, split-text reveals, 3D tilt cards

## Notes

- The product photographs in `NOORE_Product_Catalog` are small AI concept renders (≈160 px). The storefront therefore uses procedurally rendered 3D candles and SVG illustrations as its primary visuals; upload real photography through **Admin → Media** and set it per product.
- Coupons shipped: `WELCOME10`, `NOORE15` (Luxury, min ₹3,000), `FREESHIP`, `GIFT500` (min ₹5,000), `BOX10` (3+ candles).
- Regenerate the prepared imagery with `npm run images` (requires Python 3 + Pillow).
