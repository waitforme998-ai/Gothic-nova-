# GOTHIC NOVA — Architectural Decisions & Code Relations Record

> **Purpose for AI Agents & Developers:**  
> This file is the primary single source of truth for the architecture, entity relationships, data flow, and invariants of the Gothic Nova e-commerce platform. Before proposing or executing any code modifications, read this file to prevent regressions.

---

## 1. System Architecture Overview

The application is a high-performance, serverless e-commerce progressive web app consisting of:
1. **Storefront (`index.html`)**: Customer-facing catalog, cart, tarot gamification rewards, search, and checkout.
2. **Admin Panel (`admin.html`)**: Merchant dashboard managing products, categories, announcements, reviews, and customer orders.
3. **Data Adapter Layer (`supabase-engine.js`)**: The centralized bridge managing cloud persistence, 0ms SWR caching, multi-device WebSockets, and cross-tab broadcasts.
4. **Cloud Database (Supabase PostgreSQL)**: Authoritative state store.

```
                    +------------------------------------------+
                    |             Supabase Cloud               |
                    |     (PostgreSQL: Table 'gn_orders')      |
                    +--------------------+---------------------+
                                         ^
                                         | Realtime WebSocket & HTTPS REST
                                         v
                            +--------------------------+
                            |    supabase-engine.js    |
                            |   - SWR Local Storage    |
                            |   - Save Queue Awaiter   |
                            |   - Section Cache        |
                            +------------+-------------+
                                         |
               +-------------------------+-------------------------+
               | BroadcastChannel ('gn_store_sync') / Window Events|
               v                                                   v
+-------------------------------+               +-------------------------------+
|      Storefront (index.html)  |               |       Admin (admin.html)      |
|  - 0ms Fast SWR Hydration     |               |  - Open-by-Default Accordion  |
|  - Realtime Catalog Updates   |               |  - Single & Bulk Product CRUD |
|  - Dynamic Announcement Band  |               |  - Direct Announcements CRUD  |
+-------------------------------+               +-------------------------------+
```

---

## 2. Core Architectural Decisions (ADRs)

### ADR-1: Section Blob Storage inside `gn_orders`
* **Decision**: Global store metadata (`products`, `categories`, `announcements`, `reviews`, `hero_slides`) is serialized as JSON blobs inside dedicated rows in `gn_orders`.
* **Row Identifier**: Row `customer_name` is set to `__GN_SYNC_<SECTION>__` (e.g. `__GN_SYNC_PRODUCTS__`, `__GN_SYNC_ANNOUNCEMENTS__`).
* **Column Used**: JSON is stored in column `items` as `{ [sectionKey]: [...data], updated_at: "..." }`.
* **Rationale**: Maintains backwards compatibility with existing Supabase anonymous write permissions without requiring new database migrations or table schema modifications.
* **Invariant**: There must be strictly **ONE** authoritative row per section. Never allow duplicate rows with the same `customer_name`.

### ADR-2: Stale-While-Revalidate (SWR) Local Caching
* **Decision**: Both `index.html` and `admin.html` cache the last confirmed cloud state in localStorage keys (`gn_swr_products`, `gn_swr_announcements`, `gn_swr_categories`, `gn_swr_reviews`).
* **Behavior**:
  1. **T = 0ms**: UI renders instantly from SWR cache. Products and announcements appear immediately with no blank space, no skeleton loader delay, and no layout shift.
  2. **T = 150-300ms**: Supabase cloud fetch completes in the background. If cloud data differs from cache, UI updates seamlessly in-place and refreshes the SWR key.
* **Invariant**: **NEVER WIPE LOCALSTORAGE ON PAGE LOAD**. Destructive purges (`localStorage.removeItem('gn_products')`) destroy the SWR guarantee and cause disappearing products on refresh.

### ADR-3: Strict Elimination of Hardcoded Fallbacks
* **Decision**: All dynamic text (announcements, ticker items, products) must be fed exclusively from data.
* **Behavior**:
  - The announcement banner (`#saleTickerBand`) starts with `style="display: none;"` in HTML.
  - If no announcements exist or haven't arrived yet, the banner stays hidden.
  - It NEVER renders placeholder text like `"⚡ MIDNIGHT DROP: LIMITED RUN NOW LIVE"`.
* **Invariant**: Never place temporary static text in the HTML body for dynamic content.

### ADR-4: Deterministic Queue & Awaitable Writes
* **Decision**: `SupabaseEngine._saveSection(sectionKey, data)` must return a promise that waits for PostgreSQL write confirmation.
* **Behavior**:
  - Saves are serialized via `_sectionSaveQueue[sectionKey]`.
  - The queue is wrapped with `Promise.resolve(queue).catch(() => {}).then(...)` so a transient failure does not permanently deadlock subsequent saves.
  - `_saveSection` does `await _sectionSaveQueue[sectionKey]` before resolving.
* **Invariant**: Admin mutation handlers (`commitProductsToStore`, `saveSingleProduct`, `saveAnnouncementsFromAdmin`) must await the database write before finishing the loading state.

### ADR-5: Open-by-Default Admin Catalog
* **Decision**: In `admin.html`, `categoriesSectionOpen` is `true` by default, `categoriesBody` has class `open`, and `openCategoryAccordions` contains `'all'`.
* **Rationale**: Merchants open the admin panel to inspect their inventory. Collapsing all accordions by default makes the merchant think their uploaded products vanished.
* **Invariant**: Adding or editing any item must ensure `'all'` and the item's category are in `openCategoryAccordions`.

---

## 3. Data Relationships & Mapping

### Products
```typescript
interface Product {
    id: string;               // Unique string (e.g. "1", "1728312000000")
    name: string;             // Item display name
    category: string;         // Lowercase category slug ("rings", "chains", "pendants", "bracelets")
    price: number;            // Regular price in PKR
    salePrice: number | null; // Optional discounted price in PKR (sale_price also accepted)
    stock: number;            // Inventory units available
    threshold: number;        // Low-stock alert threshold (default 3)
    desc: string;             // Product details / specifications
    img: string;              // Primary image URL or compressed Base64 WebP
    stock_images: string[];   // Secondary gallery images
    active: boolean;          // true = visible on store, false = hidden
    display_order: number;    // Sort sequence
}
```

### Announcements
```typescript
type Announcements = string[]; // Array of strings (1 to 5 items)
// Example: ["High quality packaging", "COD available nationwide"]
```

### Categories
```typescript
interface Category {
    id: string;            // Slug ("rings", "chains", "pendants", "bracelets")
    name: string;          // Display name ("Rings", "Chains", "Pendants", "Bracelets")
    display_order: number; // Sorting order
}
```

---

## 4. Key Functions Reference (Where to Look)

| File | Function | Responsibility |
| :--- | :--- | :--- |
| `supabase-engine.js` | `_getSection(sectionKey, forceFresh)` | Reads section data using SWR cache first, then Supabase `.limit(1)` |
| `supabase-engine.js` | `_saveSection(sectionKey, data)` | Serializes and persists section data to Supabase and updates SWR cache |
| `supabase-engine.js` | `subscribeRealtime()` | Subscribes to Supabase WebSocket channel (`gn_realtime_sync`) |
| `index.html` | `hydrateStorefrontFromCloud()` | Fetches announcements, products, categories, reviews in parallel |
| `index.html` | `renderSaleTicker()` | Updates ticker band DOM or hides it if announcements are empty |
| `index.html` | `renderMainCatalog()` | Renders product grid with active filters and search query |
| `admin.html` | `loadProducts()` | Fetches products from SupabaseEngine and stores in `products` / `window.gn_products` |
| `admin.html` | `commitProductsToStore(items)` | Appends new products, calls `saveProductsBulk`, opens accordions |
| `admin.html` | `saveSingleProduct()` | Edits or adds single item, calls `saveProduct`, opens accordions |
| `admin.html` | `saveAnnouncementsFromAdmin()` | Reads 5 offer inputs, updates state, and persists to Supabase |

---

## 5. Critical AI Pitfalls & Anti-Patterns (NEVER DO THIS)

1. **DO NOT call `.delete().eq().catch()` on Supabase queries**:
   - Supabase `@supabase/supabase-js` query builders are thenables, not native Promises. Chaining `.catch()` directly on the builder throws `TypeError: ...catch is not a function` and crashes query execution.
2. **DO NOT add `localStorage.removeItem(...)` to page load handlers**:
   - Wiping keys destroys fast SWR loading and creates the illusion of data loss whenever the user refreshes.
3. **DO NOT add hardcoded HTML fallback items**:
   - Hardcoded strings in HTML flash before JavaScript loads and confuse users. Always start dynamic containers hidden (`display: none;`) or skeletonized.
4. **DO NOT perform fire-and-forget writes**:
   - Always await the persistence queue so the browser cannot abort the save on page reload.
