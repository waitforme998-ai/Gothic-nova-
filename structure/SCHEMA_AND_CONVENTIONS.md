# GOTHIC NOVA — Code-Level Schema & Naming Conventions Dictionary

> **Documentation Suite Navigation:**
> - 📘 **System Architecture (The HOW & WHAT):** [ARCHITECTURE.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/ARCHITECTURE.md) (System topology, component directory, data flow pipelines, and layout specifications)
> - 📜 **Functional Feature Specification (The CAPABILITIES):** [FEATURES.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/FEATURES.md) (Complete catalog of all 10 user-facing & admin subsystems)
> - 📗 **Anti-Hallucination Data Dictionary (The CONTRACT):** [SCHEMA_AND_CONVENTIONS.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/SCHEMA_AND_CONVENTIONS.md) (This file — Product/Order property contracts, dual-property access rules, and SafeStorage keys)
> - 📕 **Historical Decisions & Invariants (The WHY):** [DECISIONS.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/DECISIONS.md) (ADR-001 through ADR-028: Problem statements, failure modes, trade-offs, and invariant rules)
> - 📙 **Agency Replication Playbook (The REUSE):** [REUSABLE_STORE_BLUEPRINT.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/REUSABLE_STORE_BLUEPRINT.md) (Deploying this engine for any new client in 24 hours)

---

## Document Purpose & Anti-Hallucination Guardrail

> **Audience:** Developers & AI Coding Agents.  
> **Critical Purpose:** This document is the **Single Source of Truth** for all data schemas, naming asymmetries, storage keys, and runtime invariants across the application.  
> **Anti-Hallucination Guardrail:** DO NOT rename existing fields or assume standard normalized names. This application uses specific dual-property conventions for backwards compatibility across local caching, Supabase rows, and legacy demo payloads.

---

## 1. Product Entity Data Contract

In the runtime catalog (`window.gn_products`, `SafeStorage`, and Supabase `__GN_SYNC_PRODUCTS__`), products contain legacy dual-field properties. Code **must always** use the safe fallback access pattern: `product.name || product.title` and `product.img || product.image`.

### Field Specifications

| Property Name | Data Type | Safe Access Pattern | Description & Invariant Rules |
| :--- | :--- | :--- | :--- |
| `id` | `string` (or `number`) | `String(p.id)` | Unique product identifier (e.g. `"1"`, `"14"`, `"25"`). Always compare using loose equality `==` or normalize with `String(id)`. |
| `name` / `title` | `string` | `p.name \|\| p.title \|\| ''` | **Dual-Property:** Catalog items use `.name` as primary; older routines use `.title`. Always fallback to both. |
| `img` / `image` | `string` | `p.img \|\| p.image \|\| ''` | **Dual-Property:** Primary image URL (WebP) or Base64 string. Never assume `.image` exists without checking `.img`. |
| `price` | `number` | `Number(p.price) \|\| 0` | Regular retail price in PKR (e.g., `2800`). |
| `salePrice` / `sale_price` | `number` | `p.salePrice ?? p.sale_price ?? p.price` | **Dual-Property:** Discounted offer price in PKR. If not present or `0`, item is sold at regular `price`. |
| `category` | `string` | `p.category \|\| 'necklace'` | Category slug linking to a valid category ID (e.g., `'necklace'`, `'pendants'`, `'rings'`, `'bracelets'`, `'glasses'`, `'pairs-combo'`). |
| `stock` | `number` | `Number(p.stock) \|\| 0` | Current available inventory count. If `<= 0`, displays `SOLD OUT` on storefront. |
| `threshold` | `number` | `Number(p.threshold) \|\| 3` | Low stock alert threshold. Displays "Only X Left!" badge when `stock <= threshold`. |
| `desc` / `description` | `string` | `p.desc \|\| p.description \|\| ''` | Detailed product narrative shown in the PDP modal. |
| `stockImages` / `stock_images`| `string[]` | `p.stockImages \|\| p.stock_images \|\| []`| Array of secondary carousel images for the PDP gallery modal. |
| `active` | `boolean` | `p.active !== false` | Visibility flag. If `false`, hidden from storefront catalog. |
| `display_order` | `number` | `Number(p.display_order) \|\| 999` | Sort priority on grid (lowest number appears first). |
| `delivery_charges` | `number` | `Number(p.delivery_charges) \|\| 0` | Custom delivery override per item (default is `0`, using storewide standard). |

---

## 2. Category Entity Data Contract

Categories are stored in the special Supabase row `customer_name = '__GN_SYNC_CATEGORIES__'` and mirrored in `SafeStorage` under `gn_categories`.

```typescript
interface Category {
  id: string;    // Lowercase slug: 'necklace', 'pendants', 'rings', 'bracelets', 'glasses', 'pairs-combo'
  name: string;  // Uppercase visual label: 'NECKLACES & CHOKERS', 'PENDANTS', 'PAIRS / COMBO'
}
```

### Active Production Categories Reference
1. `necklace` — `NECKLACES & CHOKERS`
2. `pendants` — `PENDANTS`
3. `rings` — `RINGS`
4. `bracelets` — `BRACELETS`
5. `glasses` — `GLASSES`
6. `pairs-combo` — `PAIRS / COMBO`

---

## 3. Storage & Cache Key Index (`SafeStorage` / `localStorage`)

All client storage interactions **must** route through `window.SafeStorage` to guarantee immunity inside sandboxed WebViews (such as Instagram In-App Browser and TikTok Browser).

| Storage Key | Expected Structure | Purpose |
| :--- | :--- | :--- |
| `gn_products` | `Product[]` | Fallback offline product catalog array. |
| `gn_swr_products` | `{ products: Product[], updated_at: string }` | Stale-While-Revalidate cached catalog envelope. |
| `gn_swr_ts_products` | `string` (Epoch ms) | Timestamp of last catalog mutation; prevents resurrection of deleted items. |
| `gn_categories` | `Category[]` | Fallback category list array. |
| `gn_swr_categories` | `{ categories: Category[], updated_at: string }` | SWR category cache envelope. |
| `gn_announcements` | `string[]` | Ticker band announcements array. |
| `gn_swr_announcements` | `{ announcements: string[], updated_at: string }`| SWR announcements cache envelope. |
| `gn_reviews` | `Review[]` | Customer social proof reviews array. |
| `gn_swr_reviews` | `{ reviews: Review[], updated_at: string }` | SWR customer reviews cache envelope. |
| `gn_cart` | `CartItem[]` | Customer shopping cart contents (`[{ id, quantity, price, title, img, ... }]`). |
| `gn_admin_token` | `string` | Authenticated session token for Admin panel operations. |
| `gn_tarot_state` | `{ claimedAt: number, discount: number }` | 48-hour gamified Tarot discount tracker. |

---

## 4. Supabase Database Contracts (`gn_orders`)

A single PostgreSQL table (`gn_orders`) is intentionally partitioned by `customer_name` to handle both customer orders and application configuration rows:

### 4.1 Internal Configuration Rows

| `customer_name` Marker | `items` JSON Column Payload | Purpose |
| :--- | :--- | :--- |
| `__GN_SYNC_PRODUCTS__` | `{ products: Product[], updated_at: string }` | Master catalog persistence. |
| `__GN_SYNC_CATEGORIES__` | `{ categories: Category[], updated_at: string }` | Category navigation persistence. |
| `__GN_SYNC_ANNOUNCEMENTS__`| `{ announcements: string[], updated_at: string }`| Header marquee banner texts. |
| `__GN_SYNC_REVIEWS__` | `{ reviews: Review[], updated_at: string }` | Verified customer reviews. |

### 4.2 Customer Order Rows
For real customer checkouts, `customer_name` contains the customer's actual name:

| Column | Type | Example / Format |
| :--- | :--- | :--- |
| `id` | `uuid` / `serial` | Primary Key. |
| `order_number` | `integer` | Sequence order number (displayed as `#101`, `#102`). |
| `customer_name` | `text` | e.g. `"Muhammad Bilal"`. |
| `customer_phone` | `text` | e.g. `"03001234567"`. |
| `shipping_address` | `text` | Full street and residential address. |
| `city` | `text` | Shipping destination city (e.g. `"Karachi"`, `"Lahore"`). |
| `items` | `jsonb` | Array of ordered items with prices, quantities, and selected options. |
| `total_amount` | `numeric` | Final payable balance including delivery. |
| `delivery_charges` | `numeric` | Standard delivery fee (Rs. 300, waived for Tarot winner). |
| `advance_deposit` | `numeric` | Advance security deposit (Rs. 700 mandatory for COD). |
| `status` | `text` | `'PENDING'`, `'CONFIRMED'`, `'DISPATCHED'`, `'DELIVERED'`, `'CANCELLED'`. |
| `payment_method` | `text` | `'COD'` (Cash on Delivery with Advance Slip). |

---

## 5. Storage Bucket Conventions (`product-media`)

* **Bucket Name:** `product-media`
* **Access Level:** Public Read (`/storage/v1/object/public/product-media/...`)
* **Target Directory:** `products/`
* **Naming Pattern:** `prod_<timestamp>_<random_alphanumeric>.<ext>`
* **Preferred Format:** `webp` (Auto-compressed client-side in `admin.html` via HTML5 Canvas).
* **Dead Project Alert:** NEVER reference URLs containing `ogjyubekshcxcirlboue.supabase.co`. The active production database host is `xtphuycoriazzkoalyyh.supabase.co`.

---

## 6. Coding & AI Hallucination Guardrails

1. **NEVER assume Normalized Product Keys:** Always write `p.name || p.title` and `p.img || p.image`.
2. **NEVER overwrite SWR Caches with empty arrays:** If an API fetch fails or returns empty, `supabase-engine.js` preserves the existing cache to prevent storefront blank-outs.
3. **NEVER modify `SafeStorage` wrapper interface:** Do not replace `window.SafeStorage` with raw `localStorage`.
4. **ALWAYS use `.webp` for media uploads:** Canvas compressor in `admin.html` enforces WebP at quality `0.82` to keep payloads under 150 KB.
5. **DO NOT change font URLs without cache busting:** CSS uses `style.css?v=8.7`. Modifying stylesheets requires updating query params across `index.html`, `admin.html`, and `category.html`.
