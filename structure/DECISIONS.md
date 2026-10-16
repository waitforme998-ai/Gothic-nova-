# GOTHIC NOVA — Architectural Decisions Record (ADR)

> **Audience:** Core Engineers & AI Coding Agents.  
> **Scope:** Historical decisions, problem statements, failed hypotheses, chosen architectural solutions, and non-negotiable invariants across storage, synchronization, inventory integrity, image delivery, and UI state.  
> **Maintenance Rule:** Keep this document modular, authoritative, and concise. When architectural policies evolve, update the relevant ADR and remove obsolete hypotheses.

---

## ADR Index

1. [ADR-001: Section-Isolated Persistence over Monolithic Store State](#adr-001-section-isolated-persistence-over-monolithic-store-state)
2. [ADR-002: Stale-While-Revalidate (SWR) Local Hydration & Anti-Purge Invariant](#adr-002-stale-while-revalidate-swr-local-hydration--anti-purge-invariant)
3. [ADR-003: Authoritative Database Await & Zero Fake Success States](#adr-003-authoritative-database-await--zero-fake-success-states)
4. [ADR-004: Dynamic Inventory Bounding, Store Default Stock & Cart Auto-Clamp](#adr-004-dynamic-inventory-bounding-store-default-stock--cart-auto-clamp)
5. [ADR-005: Hosted Cloud Image URLs over Inline Base64 Blobs](#adr-005-hosted-cloud-image-urls-over-inline-base64-blobs)
6. [ADR-006: Singleton Realtime Channels & Non-Destructive Query Builders](#adr-006-singleton-realtime-channels--non-destructive-query-builders)
7. [ADR-007: Zero-Fallback Dynamic UI & Open-by-Default Admin Accordion](#adr-007-zero-fallback-dynamic-ui--open-by-default-admin-accordion)
8. [ADR-008: Tarot Gamification Ritual Containment & Cooldown Persistence](#adr-008-tarot-gamification-ritual-containment--cooldown-persistence)
9. [ADR-009: Background Floating Save Pill & Repeated Action Duplicate Confirmation](#adr-009-background-floating-save-pill--repeated-action-duplicate-confirmation)
10. [ADR-010: Offline Network vs Supabase Cloud Failure Differentiation](#adr-010-offline-network-vs-supabase-cloud-failure-differentiation)
11. [ADR-011: Sequential Order Numbering Starting at #1 & System Sync Row Negative Integer Isolation](#adr-011-sequential-order-numbering-starting-at-1--system-sync-row-negative-integer-isolation)
12. [ADR-012: Zero Over-Engineering Rule, Unhindered Catalog Deletion, & Anti-Redundancy Guarantee](#adr-012-zero-over-engineering-rule-unhindered-catalog-deletion--anti-redundancy-guarantee)
13. [ADR-013: Mobile Viewport Fluid Topology, Single-Line Category Locking & Render-Thrash Coalescing](#adr-013-mobile-viewport-fluid-topology-single-line-category-locking--render-thrash-coalescing)
14. [ADR-014: Universal Non-Destructive Hydration, Pre-Decoded PDP Images & Top-Anchored Mobile Topology](#adr-014-universal-non-destructive-hydration-pre-decoded-pdp-images--top-anchored-mobile-topology)
15. [ADR-015: Low-Tier Mobile Tile Rasterization, Button Anti-Flicker & Single Master Password Invariant](#adr-015-low-tier-mobile-tile-rasterization-button-anti-flicker--single-master-password-invariant)

---

## ADR-001: Section-Isolated Persistence over Monolithic Store State

### Context & Problem
Originally, all store entities (products, categories, announcements, reviews, settings) were packed into a single monolithic JSON blob (`__GN_SYNC_STATE__`) written to a single PostgreSQL row.
* **Failure Mode (Cross-Section Clobbering):** When an admin edited an announcement, the client serialized in-memory state. If the catalog tab had not been loaded into RAM yet, the admin script pushed `{ products: [], announcements: [...] }`, instantly overwriting and wiping the live cloud catalog.

### Decision
Store sections independently as discrete rows inside table `gn_orders`:
* Row identifier: `customer_name = '__GN_SYNC_<SECTION>__'` (e.g., `__GN_SYNC_PRODUCTS__`, `__GN_SYNC_ANNOUNCEMENTS__`, `__GN_SYNC_CATEGORIES__`, `__GN_SYNC_REVIEWS__`).
* Payload container: Column `items` stores `{ [sectionKey]: [...], updated_at: "<ISO>" }`.
* Rationale: Isolates failure domains. An announcement save can never mutate or clobber product rows. Reuses existing anonymous table permissions without requiring manual PostgreSQL schema migrations.

### Invariants
* **Strict Single-Row Cardinality:** Exactly ONE row per section must exist. Never allow duplicate rows with the identical `customer_name`.
* **Zero Wipe Guard:** In `universalAdminRefresh`, if in-memory items are empty while the cloud indicates data exists, blocking guards prevent pushing empty arrays to Supabase.

---

## ADR-002: Stale-While-Revalidate (SWR) Local Hydration & Anti-Purge Invariant

### Context & Problem
Dual-storage setups where `localStorage` was treated as primary and Supabase as background caused multi-device divergence ("last-write-wins with stale data"). To combat stale mock items, an early script executed `localStorage.removeItem(...)` on page load.
* **Failure Mode (Refresh Wipe Illusion):** On cellular connections (300ms–800ms latency), clearing storage on mount forced the UI to sit blank with zero items. Users reported: *"Whenever I refresh, my uploaded products disappear!"*

### Decision
Implement Stale-While-Revalidate (SWR) across both Storefront and Admin:
1. **T = 0ms (Stale Render):** Hydrate immediately from `gn_swr_<section>` localStorage keys (`gn_swr_products`, `gn_swr_announcements`, etc.). Zero skeleton layout shifts, zero blank screens.
2. **T = 150–300ms (Revalidation):** Background `fetch()` reads Supabase. If cloud state differs from SWR, seamlessly patch the DOM and update local SWR cache.

### Invariants
* **NEVER purge SWR keys on startup:** Boot routines must never execute `localStorage.removeItem('gn_products')` or similar purges.
* **Pure Cloud Authority:** Supabase is the sole source of truth; SWR cache is strictly an ephemeral read accelerator.

---

## ADR-003: Authoritative Database Await & Zero Fake Success States

### Context & Problem
Earlier UI handlers updated in-memory arrays and rendered success toasts optimistically while dispatching unawaited background promises.
* **Failure Mode (Fake Success & Aborted Saves):** If network failed, the UI displayed false confirmation while the database remained unchanged. Furthermore, if a merchant saved a product and refreshed 500ms later, the browser aborted the in-flight HTTP request.

### Decision
Enforce strictly awaited database writes with zero optimistic fake success states:
1. When any mutation triggers (`saveSingleProduct`, `commitProductsToStore`, `updateProductStock`, `saveAnnouncementsFromAdmin`, delete actions), the UI sets a loading spinner and disables buttons.
2. The handler awaits `SupabaseEngine._saveSection()`, which awaits the internal serialization queue `_sectionSaveQueue[sectionKey]`.
3. UI state and confirmation toasts update **only after** PostgreSQL returns HTTP 200/201.
4. On network or Supabase failure: show explicit error message, do NOT mutate local UI state, and keep inputs intact for retry.

### Invariants
* All administrative CRUD operations must be `async/await` and handle errors before showing success.
* Save queues must chain `.catch(() => {})` internally so a transient rejection never deadlocks subsequent saves.

---

## ADR-004: Dynamic Inventory Bounding, Store Default Stock & Cart Auto-Clamp

### Context & Problem
The system previously contained hardcoded `10` stock values across multiple files. Furthermore, storefront quantity controls allowed incrementing past inventory limits, and carts did not react when another user purchased the last remaining item.

### Decision
1. **Dynamic Store Default Stock:** Replace hardcoded `10` defaults with a configurable setting (`gn_default_stock`, default 1).
2. **Ceiling Clamping in Storefront:**
   - Product detail modal `+` button is disabled when `qty >= product.stock`.
   - Cart modal `+` button is disabled when `cartItem.qty >= product.stock`.
   - Items with `stock <= 0` display a `SOLD OUT` badge with disabled "Add to Cart".
3. **Realtime Cart Auto-Clamping:**
   - On `gn:productsUpdated`, the storefront compares all `window.gn_cart` items against live product inventory.
   - If `cart[id].qty > liveStock`, the cart immediately clamps down to `liveStock` and issues a gentle notification to the user.
4. **Atomic Order Inventory Reservation & Replenishment:**
   - In `createOrder()`, vault stock is strictly verified for all physical items before committing the order. If requested quantity exceeds available stock, placement is blocked with `INSUFFICIENT_STOCK: ...`.
   - Upon confirmed order placement, `product.stock` is atomically decremented and persisted to `__GN_SYNC_PRODUCTS__` and mirrored to `gn_products`.
   - If an order is Cancelled or Deleted in the admin panel, reserved items are automatically replenished back to active inventory.

### Invariants
* A customer cannot add or increment a quantity exceeding `product.stock`.
* Checkout must never accept an order for items with insufficient vault stock.
* Stock changes in the admin use `updateProductStock(pid, newStock)` and await PostgreSQL before updating the admin UI.

---

## ADR-005: Hosted Cloud Image URLs over Inline Base64 Blobs

### Context & Problem
Product images were originally encoded as raw WebP DataURLs (`data:image/webp;base64,...`) and stored inside the JSON column in `gn_orders`.
* **Failure Mode (WebSocket & Memory Overload):** A single Base64 image took ~150 KB. 10 products totaled 1.5 MB, breaching Supabase Realtime's 1 MB WebSocket message limit, causing subscription termination and mobile browser freezes.

### Decision
Migrate all product media to hosted HTTPS URLs:
1. **Client-Side Pre-Compression:** Photos selected in `admin.html` are resized and compressed client-side to 800x800 WebP binary Blobs (~20 KB).
2. **Supabase Storage Destination:** Blobs are uploaded to public bucket `product-media` via `window.SupabaseEngine.uploadProductImage()`, returning direct HTTPS URLs (`https://<project>.supabase.co/storage/v1/object/public/product-media/products/...`).
3. **Payload Reduction:** Each product record drops from 150,000 bytes to ~350 bytes, enabling seamless 1,000+ item realtime broadcasting.
4. **Fallback:** If bucket write fails, the optimized lightweight WebP Blob is used as an emergency fallback.

### Invariants
* Product JSON records stored in the cloud must prioritize HTTPS CDN URLs over Base64 strings.
* Admin panel performs automatic one-time background migration of legacy Base64 strings to cloud storage.

---

## ADR-006: Singleton Realtime Channels & Non-Destructive Query Builders

### Context & Problem
Two critical SDK runtime bugs previously caused silent data loss:
1. **PostgREST Builder Thenable Bug:** Code attempted `client.from('gn_orders').delete().eq('id', dupId).catch(() => {})`. In `@supabase/supabase-js`, query builders are *thenables*, not native Promises; calling `.catch()` directly threw `TypeError: ...delete(...).catch is not a function`, crashing product fetch into an empty array `[]`.
2. **Multiple Realtime Subscriptions:** Repeated calls to `subscribeRealtime()` threw `cannot add postgres_changes callbacks after subscribe()`.

### Decision
1. **Pure Read-Only Queries:** `_getSection()` is strictly read-only. In-band SQL deletions during read operations are completely banned.
2. **Deterministic Query Ordering:** All section reads query `.order('updated_at', { ascending: false }).order('id', { ascending: false }).limit(1)`.
3. **Singleton Realtime Guard:** `subscribeRealtime()` maintains a module-level `_realtimeChannel` singleton guard, preventing duplicate subscription crashes.

### Invariants
* Never chain `.catch()` onto an un-awaited Supabase query builder. Use standard `try/catch` with `await`.
* Reads must never trigger background write or delete side-effects.

---

## ADR-007: Zero-Fallback Dynamic UI & Open-by-Default Admin Accordion

### Context & Problem
1. **Flashed Outdated Strings:** Hardcoded HTML strings (`"⚡ MIDNIGHT DROP: LIMITED RUN NOW LIVE"`) inside `index.html` flashed on every reload before JavaScript fetched live admin announcements.
2. **Admin Concealment Bug:** Products were grouped into category accordions with `categoriesSectionOpen = false` by default, making merchants think products vanished because the DOM container had `height: 0`.

### Decision
1. **Zero Static Fallback in HTML:** Dynamic text containers (`#saleTickerBand`) start hidden (`style="display: none;"`). The banner only becomes visible when verified data arrives from Supabase or SWR.
2. **Open-by-Default Accordion:** In `admin.html`, `categoriesSectionOpen` is `true` by default, and `openCategoryAccordions` includes `'all'`.

### Invariants
* No hardcoded promotional text allowed in markup. Dynamic elements must remain collapsed or skeletonized until data is hydrated.
* The admin catalog list must always default to an expanded, visible state.

---

## ADR-008: Tarot Gamification Ritual Containment & Cooldown Persistence

### Context & Problem
The Tarot Card ritual previously occupied an unbound full-screen overlay that occluded the store and caused card shuffle animations to translate outside viewport boundaries.
* **Requirements:** Luxury modal presentation, strictly bounded 5.0-second shuffle, 48-hour shuffle cooldown, 24-hour reward discount validity, and generic parcel gifts without promising specific SKUs.

### Decision
1. **Modal Containment:** All tarot UI is enclosed in `.tarot-stage-container` (`max-width: 840px`, gold/crimson border, dark obsidian background) with a subtle `blur(3.5px)` backdrop preserving storefront visibility.
2. **Bounded Keyframes:** Translations during shuffle are clamped within `±32px X` and `±12px Y` with `overflow: hidden` on the stage container.
3. **Cooldown Storage:** Ritual state is locked via `localStorage.getItem('gn_tarot_ritual_v14')`. Cooldown is 48 hours; active claimed discounts expire after 24 hours and automatically apply to cart and checkout calculations.
4. **Generic Copy:** Free gifts are labeled `✦ Free Gift Included (In Parcel)` without disclosing specific item names in toasts or receipts.

### Invariants
* Card transforms must never overflow the modal container.
* Never reset or alter the 48-hour cooldown key during routine site navigation.

---

## ADR-009: Background Floating Save Pill & Repeated Action Duplicate Confirmation

### Context & Problem
1. When merchants clicked save or restock and closed the sheet/modal before completion, they could not verify if the write was still progressing or succeeded.
2. Rapid double-clicks or repeated submissions created duplicate products or unintended double restocks.
3. Simultaneously displaying an inline button spinner and a floating status pill created dual competing loaders, cluttering the UI and confusing the merchant.

### Decision
1. **Unclickable Success Feedback:** Buttons transition into a loading spinner upon initiation, and upon authoritative cloud confirmation display `SAVED ✓` or `UPDATED ✓` in green for 1.2 seconds while remaining strictly unclickable (`disabled`, `pointer-events: none`).
2. **Strict Single-Loader Rule:** The floating status pill remains completely hidden while the modal or initiating view is open. Dual spinners are strictly prevented.
3. **Premature Dismissal Activation:** If and only if the merchant closes the modal or dismisses the bottom sheet before cloud resolution finishes, the floating status pill surfaces at the bottom center to display ongoing background sync progress and confirms cloud resolution with a luxury status badge.
4. **Duplicate Submission Confirmation:** When an admin re-submits a form with the exact same information and images, the system prompts via `showLuxuryConfirm`: *"This item was just saved with the exact same details. Are you sure you want to save it again?"* before initiating another mutation.

### Invariants
* Multiple loader indicators must never render concurrently on screen for the same operation.
* Operations must never fail silently if their parent modal is closed mid-transit.
* A form submitted with identical fields immediately after a confirmed save must require explicit user confirmation.

---

## ADR-010: Offline Network vs Supabase Cloud Failure Differentiation

### Context & Problem
Previously, any failure (offline network drop, client-side abort, PostgREST 500 error, or API timeout) either failed silently or produced confusing raw JavaScript exceptions (`TypeError: Failed to fetch`). Replaying stale mutations from an offline backlog caused race conditions and ghost overwrites.

### Decision
1. **Strict Offline Differentiation:** Check `navigator.onLine` and distinguish offline internet failure from Supabase cloud database timeouts or 5xx rejections.
   - Offline failure: *"No internet connection. Please check your network."*
   - Supabase failure: *"Cloud database is temporarily unreachable."*
2. **Order Integrity:** Storefront checkout halts with clear offline guidance if the customer has no internet connection, preventing fake order success screens. Orders are never queued in local backlog; customers must re-submit when online.
3. **No Offline Queuing & No Auto-Refetching:** Offline operations (products, reviews, announcements, orders) must NOT get queued into local outboxes or replay buffers. When coming online, automatic background refetching and queue replays must NOT occur. The user or merchant must explicitly re-upload products, reviews, or announcements after coming online. No nagging reminders or popups to re-upload are displayed.

### Invariants
* Never present raw internal code error strings to customers or merchants.
* Never queue offline mutations into silent background outboxes.
* Never auto-replay stale queued mutations or clobber current screen work on reconnect.

---

## ADR-011: Sequential Order Numbering Starting at #1 & System Sync Row Negative Integer Isolation

### Context & Problem
Internal system state records (`__GN_SYNC_PRODUCTS__`, `__GN_SYNC_ANNOUNCEMENTS__`, etc.) and deleted test rows originally consumed PostgreSQL auto-incrementing serial integers on `gn_orders.order_number`. This caused new customer order numbers to appear artificially inflated (e.g. #100, #115) instead of starting sequentially from `#1`.

### Decision
1. **Negative Sequence Space for System Rows:** All internal sync records (`__GN_...`) and legacy test markers are permanently assigned negative `order_number` integers (`< 0`). System row insertions never consume positive sequence numbers.
2. **Sequential Customer Numbering (#1, #2, #3...):** When creating customer orders, the system dynamically queries the highest existing positive `order_number` (`gt.0`) and assigns `order_number = max + 1`. If no positive customer orders exist, the first order is `#1`.
3. **Database Consistency:** Legacy records were shifted to negative numbers via migration script, clearing the positive integer space. Both storefront checkout and admin dashboard query and display positive customer orders sequentially.

### Invariants
* Customer order numbers must always be positive integers (`> 0`) starting from `#1`.
* System sync records (`customer_name` starting with `__GN_`) must never be assigned a positive order number.
* Order numbering must never skip counts due to internal sync updates or deletions.

---

## ADR-012: Zero Over-Engineering Rule, Unhindered Catalog Deletion, & Anti-Redundancy Guarantee

### Context & Problem
1. Overcomplicated "wipe guards" in `supabase-engine.js` blocked intentional merchant deletions whenever deleting down to 0 items, producing confusing runtime errors (*"Wipe guard: refusing to overwrite 1 products with 0 items"*).
2. Multiple notification mechanisms (`showToast` and `showFloatingStatus`) were simultaneously triggered for individual user actions (like deleting a product or updating stock), resulting in dual overlapping banners colliding at the bottom center.
3. Temporary test/debug scripts accumulated in `scripts/`, adding clutter.

### Decision
1. **Unhindered Catalog Deletion:** The merchant is the authoritative master of their store. Explicit deletions (`deleteProduct`) pass `{ allowEmpty: true, adminExplicitDeleteAll: true }`. Wipe guards are restricted strictly to preventing accidental empty initialization arrays; they must NEVER block intentional user actions or deletions.
2. **Mutual Exclusion & Single-Feedback Invariant:**
   - One user action = exactly one visual feedback channel.
   - `showToast` automatically yields if `admin-floating-status-pill` is active.
   - `showFloatingStatus` dismisses `ios-toast` immediately upon appearing.
   - No method may concurrently invoke both `showToast` and `showFloatingStatus`.
3. **Repository Cleanliness (Zero Cruft):**
   - Temporary scripts and diagnostic files are not kept in `scripts/`. Production directories must remain minimal, clean, and free of obsolete one-off helpers.

### Invariants
* The merchant can always delete any or all products without being blocked by safety guards.
* Never display two concurrent feedback loaders, pills, or toast alerts on the screen simultaneously.
* Keep `scripts/` clean of obsolete one-off scripts.

---

## ADR-013: Mobile Viewport Fluid Topology, Single-Line Category Locking & Render-Thrash Coalescing

### Context & Problem
1. **Layout Thrashing & Flashing on Mobile:** On initial page load, `refreshStorefrontCatalog()` triggered 5–6 times within ~600ms across competing asynchronous events (`DOMContentLoaded`, `productsLoaded`, `reviewsUpdated`, `categoriesUpdated`, and `BroadcastChannel`). Every invocation completely wiped and rebuilt `innerHTML` on `#customer-reviews-track` and `#main-drop-grid`. On mid-range mobile chips (e.g. Realme C75), this caused continuous DOM reflow thrashing, visual flashing, and erratic horizontal scroll snapping.
2. **Double Asynchronous Fetch Race:** `window.renderCustomerReviews()` initiated an independent `SupabaseEngine.getReviews()` network request even after `hydrateStorefrontFromCloud()` had already fetched reviews, causing two overlapping asynchronous paints that collided and glitched on screen.
3. **Mobile Layout Spills & Shifts:**
   - Hero title `"GOTHIC NOVA"` was hardcoded to `font-size: 4.3rem` with `white-space: nowrap !important`. On phones with 360px–375px viewports or with enlarged Android OS Display/Font scaling, this expanded to >450px, clipping outside both screen edges.
   - Hero statue vertical translation was a static `-180px` pixel offset, shooting too high into the navbar on taller modern 20:9 screens.
   - Flanking description had a static `82px` center gap and static font size, spilling off narrow mobile screens.
   - Category filter bar specified `flex-wrap: wrap !important` with fixed button paddings (`0 10px`). When 5 buttons (`ALL`, `RINGS`, `CHAINS`, `BRACELETS`, and `MORE ▾`) rendered on 360px screens, `MORE ▾` dropped to a second line.

### Decision
1. **Idempotent Content Fingerprinting:** Added fingerprint checking (`_lastReviewsKey` and `_lastCatalogKey`) matching `renderNewArrivals` (`_lastArrivalsKey`). If the serialized content signature matches the existing DOM state, `innerHTML` is never wiped, eliminating visual flashing and horizontal scroll reset.
2. **Animation Frame Debounce & Coalescing:** Catalog refresh triggers are debounced and coalesced into a single `requestAnimationFrame` callback. Rapid successive events coalesce into exactly one clean paint on the next frame.
3. **Single Fetch Source for Reviews:** Removed the redundant secondary network call from `renderCustomerReviews()`. Reviews hydrate synchronously from in-memory state populated by `hydrateStorefrontFromCloud()` and reactive `reviewsUpdated` events.
4. **Fluid Viewport Clamping (Hero Title, Statue, Flanking Subtext):**
   - Hero title: `clamp(4.0rem, 18.2vw, 4.3rem)` with `max-width: 98vw !important` and `box-sizing: border-box`. Preserves the exact majestic 4.3rem scale on standard phones (390px, 412px+) while gracefully adapting down to 65.5px (88% width) on narrow 360px phones without shrinking, clipping, or causing horizontal overflow.
   - Statue vertical position: `clamp(-180px, -21.3vh, -155px)` with fallback `var(--statue-y, -180px)`. Preserves the exact original -180px designer elevation on standard phones (390px, 412px+) framing the wings and shoulders behind the title, while adapting down to -155px on shorter viewports so the top stays strictly below the upper screen edge.
   - Flanking description: Center gap clamped to `clamp(48px, 14vw, 82px)` and font size clamped to `clamp(6.6px, 2.1vw, 7.5px)` with `max-width: 94vw !important`, strictly guaranteeing a single line without wrapping.
5. **Single-Line Category Bar Invariant:** `.category-filter-container` set to `flex-wrap: nowrap !important` with `justify-content: space-between !important` and `overflow-x: hidden !important`. Tab buttons use `flex: 1 1 0 !important; min-width: 0 !important; padding: 0 clamp(4px, 1.5vw, 10px) !important; font-size: clamp(0.64rem, 2.1vw, 0.74rem) !important; white-space: nowrap !important; text-overflow: ellipsis !important;`, guaranteeing all 5 buttons (`ALL`, `RINGS`, `CHAINS`, `BRACELETS`, `MORE ▾`) are locked to a single line across all mobile devices (320px–430px+).

### Invariants
* All 5 category filter tabs must remain strictly on a single row without wrapping on all screen sizes.
* Storefront catalog and reviews rendering must be idempotent; never wipe `innerHTML` if data has not mutated.
* Core backend and upload logic in `supabase-engine.js` and `admin.html` remain strictly untouched.

---

## ADR-014: Universal Non-Destructive Hydration, Pre-Decoded PDP Images & Top-Anchored Mobile Topology

### Context & Problem
1. **Device-Specific GPU Texture Invalidation (Mid-range Androids / Realme C75):** On budget and mid-range devices with Mali GPUs and aggressive Skia memory management, setting `innerHTML = ''` or directly changing `img.src` triggers instantaneous GPU texture backing store eviction. For 16ms–50ms during CPU layout recalculations and WebP decode stalls, the screen paints a raw blank/white flash. Flagships (Apple Silicon / high-RAM Snapdragon) mask this by holding stale raster layers in memory.
2. **Product Detail Page (PDP Modal) Flashing:** Changing thumbnails or opening PDP modals caused image decode flickers, and thumbs and price rows were rebuilt from scratch on every catalog SWR refresh.
3. **Announcement & Category Bar Layout Thrashing:** `renderSaleTicker()` wiped `track.innerHTML` on every catalog sync, resetting active CSS marquee translation to 0px. `renderCategoryTabs()` destroyed and rebuilt tab buttons on every sync pass.
4. **Android OS Font Scaling Overflow:** `--hero-title-size: clamp(4.0rem, 18.2vw, 4.3rem)` used a rigid `4.0rem` floor. When Android OS "Display Size" or "Font Size" was set to Large, `1rem` scaled up to 18px–20px+, forcing `"GOTHIC NOVA"` to 76px+ (>375px wide), clipping outside 360px viewports.
5. **Statue Aspect-Ratio Drift on Modern 20:9 Screens:** The statue was anchored from the bottom (`transform-origin: center bottom` inside `100dvh`). On modern tall screens (Realme C75, 880px–915px height) vs shorter screens (667px), the bottom anchor point shifted by up to 200px, moving the statue's head and wings out of alignment with the top-anchored hero title.

### Decision
1. **Pre-Decoded PDP Image Swapping (`safeSwapPdpImage`):** When opening PDP modals or changing thumbnails, images are preloaded and decoded off-screen via `img.decode()` before updating the visible element. If an active modal is refreshed for the same product, thumbnails and price rows are preserved in-place.
2. **Universal Content Signatures (`_lastTickerKey`, `_lastFooterKey`, `_lastCategoryKey`, `data-last-render`):** All storefront renderers fingerprint their data signatures. Unchanged data returns immediately, eliminating marquee skips, layout reflows, and search dropdown flashing.
3. **Viewport-Bounded Fluid Title (`min(4.3rem, 16.5vw)`):** Replaced the rigid `rem` floor with a viewport-bounded ceiling. Preserves the majestic 4.3rem scale on standard displays while strictly capping the text to 16.5vw (under 90% screen width) on narrow screens or under extreme Android font scaling.
4. **Top-Anchored Statue Framing (`transform-origin: center top`):** Re-anchored the statue to `center top` with `--statue-y: clamp(4px, 1.5vh, 14px)`. Distance between the statue's wings/head and the "GOTHIC NOVA" title is mathematically locked and identical across every mobile screen height (600px to 1000px).

### Invariants
* All storefront renders must be idempotent; never wipe `innerHTML` if data signature matches existing DOM.
* PDP modal image transitions must never swap `.src` on a visible element without pre-decoding.
* Statue and hero title must remain anchored from the top reference frame on mobile.
* Backend logic in `supabase-engine.js` and `admin.html` remains strictly untouched.

---

## ADR-015: Low-Tier Mobile Tile Rasterization, Button Anti-Flicker & Single Master Password Invariant

### Context & Problem
1. **Low-Tier Mobile Screen Chunk Glitching / Tile Eviction:** On lower-RAM Android phones (e.g. Mali-G52/G57, Adreno 6xx with 2GB–4GB RAM), Chromium breaks the viewport into 256x256 / 512x512 tile buffers. Two critical issues caused tile eviction and flashing:
   - Every product `.card-img-wrapper` on mobile ran `animation: skeletonShimmer 1.8s infinite !important;` 24/7 even after images loaded. Continuously animating 14–24 background gradients saturated GPU raster memory.
   - Every `.product-card` had `transform: translate3d(0, 0, 0)` and `contain: paint layout`, promoting dozens of individual elements into independent hardware-accelerated GPU layers (`cc::PictureLayer`). Under Skia memory pressure, Chrome dropped tiles ("chunks"), which flashed/glitched when interacting with buttons.
2. **Catalog Load More Grid Wiping:** Tapping "DISCOVER MORE ARTIFACTS" previously called `grid.innerHTML = ...` wiping all existing 12 cards, causing image texture eviction and re-decoding lag.
3. **Touch-Triggered `:hover` Transforms:** Mobile touch events synthesized `:hover`, triggering `transform: translateY(...)` and expanding box shadows on buttons like BUY NOW and LOAD MORE, forcing layer bounds re-evaluation during touch.
4. **Password Ambiguity:** Line 809 of `supabase-engine.js` had a legacy check `if (password === 'gothicnova51214' || password === 'admin')` in an unused auth helper, creating confusion over secondary passwords and email requirements.

### Decision
1. **Confine Shimmer Animation to Skeletons:** Normal mobile `.card-img-wrapper` elements have a static dark background with `animation: none !important;`. The infinite shimmer is strictly scoped to `.product-card.skeleton-card .card-img-wrapper` and `.skeleton-img-box`.
2. **Flatten Mobile Cards to Normal Scroll Flow:** On mobile (`@media (max-width: 768px)`), `.product-card` uses `transform: none !important; backface-visibility: visible !important; contain: layout style !important;`, eliminating dozens of promoted GPU layers.
3. **Non-Destructive Catalog Appends:** When `isAppending === true` in `renderMainCatalog()`, existing DOM cards and image decodes are untouched; only newly unveiled cards are inserted via `grid.insertAdjacentHTML('beforeend', newCards)`.
4. **Mobile Button Touch Stabilization:** Disabled `:hover` translates and expanding shadows on mobile buttons (`.catalog-load-more-btn`, `.pdp-modal-btn-buy`, `.product-card:hover`). Replaced with non-transforming subtle `:active` opacity. Lowered overlay backdrop-filters to `blur(4px)` on mobile.
5. **Strict Single Master Password Invariant:** Removed `'admin'` fallback from `supabase-engine.js`. The only authorized administrative key in the system is `gothicnova51214`. No email required.

### Invariants
* The admin panel authentication is strictly single-password (`gothicnova51214`) without email.
* Normal loaded product cards must never run infinite CSS keyframe animations.
* Catalog batch expansion must append via `insertAdjacentHTML` without wiping existing grid elements.

---

## ADR-016: Non-Intrusive PDP Description Presentation via Length-Gated Toggle

### Context & Problem
1. **Catalog Density & Aesthetic Cleanliness:** Product cards in the main catalog must remain compact, minimal, and aligned to Gothic Nova aesthetics without cramming long descriptive text onto card surfaces.
2. **Admin-Customer Data Pipeline Gap:** The admin panel accepts multi-line product descriptions, but previously the PDP quick-view modal had unstyled description handling, risking layout stretching or empty text blocks.
3. **Short vs. Long Description Ergonomics:** Short descriptions (e.g. `"ADJUSTABLE RING"` or brief materials, $\le 20$ words) look clean rendered directly under the price row. Long multi-paragraph descriptions create visual clutter if displayed fully open by default.

### Decision
1. **Length-Gated Collapsible Toggle (> 20 words):** In `openPdpModal()`, word count of the description is evaluated:
   - If empty: both wrapper and toggle button are set to `display: none;`.
   - If $\le 20$ words: toggle button is hidden (`display: none;`) and the description text renders directly (`display: block;`).
   - If $> 20$ words: a muted, dull toggle button (`DETAILS ▾`) is shown (`display: inline-flex;`), keeping the body text collapsed (`display: none;`) until explicitly tapped.
2. **Zero-Glow Minimalist Styling:** The `.pdp-details-toggle-btn` uses understated typography (`var(--font-mono)`, 0.65rem), low contrast border (`rgba(255, 255, 255, 0.12)`), dull muted grey text (`#8e828a`), and zero glowing box-shadows or heavy keyframe animations.
3. **No Regression on Main Cards:** Product cards in the main catalog grid remain completely untouched, ensuring zero visual or performance regression.

### Invariants
* The details button must only appear when description length strictly exceeds 20 words.
* Short descriptions ($\le 20$ words) must render directly without requiring button clicks.
* The details button must remain understated and dull (no neon glows, no pulsating animations).

---

## ADR-017: Cart Drawer Viewport Scrolling & PDP Add-to-Cart State Hardening

### Context & Problem
1. **Flexbox Item List Viewport Overflow:** In `#cart-drawer`, the item list `#cart-items-list` had `flex: 1; overflow-y: auto;` without explicit `min-height: 0;`. By default flex items have `min-height: auto`, which caused the container to expand downwards past the screen fold on mobile when 4+ items were added, pushing the checkout footer off-screen and breaking touch-scrolling. Users perceived items as "not adding" until top items were deleted, which caused the list to contract and reveal the hidden items.
2. **Button State Deadlock on PDP Modal:** If a product was already present in the cart, opening the PDP modal defaulted the CTA to `VIEW CART` even when available inventory remained. This prevented customers from increasing quantity from the modal and caused confusion when clicking other products.
3. **Cart Storage Synchronization:** Cart state relied on split references (`cartMap` vs `window.gn_cart`), and `window.saveCart` was not exposed, preventing real-time inventory clamping in `refreshStorefrontCatalog`.

### Decision
1. **Hardened Flex Scrolling on Cart Drawer:** Enforced `flex: 1 1 0% !important; min-height: 0 !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; overscroll-behavior-y: contain !important;` on `#cart-items-list`, with `flex-shrink: 0 !important;` on `#cart-drawer-header` and `#cart-footer`. The footer and header remain anchored, and any number of items can be smoothly scrolled through.
2. **Dynamic Stock-Aware PDP Button:** The modal CTA only switches to `VIEW CART` when `existingInCart >= maxStock`. If remaining stock exists, the button remains `ADD TO CART`, allowing continuous item additions with clear `ADDED TO CART ✓` feedback.
3. **Unified Global Cart Authority:** Exported `window.saveCart` and ensured `cartMap` and `window.gn_cart` stay synchronized, including explicit `id` assignments across all cart items.

### Invariants
* `#cart-items-list` must retain `min-height: 0` and `flex: 1 1 0%` to ensure scrollability on all mobile screens.
* Cart footer and drawer header must never be pushed out of viewport by list contents (`flex-shrink: 0`).
* `window.saveCart` must remain globally accessible for realtime stock reconciliation.

---

## ADR-018: Add-to-Cart Scope Hardening & Undefined Stock Fallback Normalization

### Context & Problem
1. **Uncaught ReferenceError on Add to Cart:** During an earlier refactor of button feedback state, `const priceText = ...` was inadvertently removed from the `addToCartBtn` event handler while remaining in the item payload object assignment. When clicked, JavaScript threw an uncaught `ReferenceError: priceText is not defined`, blocking all cart additions completely across all products.
2. **Undefined Stock Clamp to Zero:** In several places (`openPdpModal`, `refreshStorefrontCatalog`, `renderCart`, and `buildProductCardHTML`), stock checks used `Number(p.stock || 0) <= 0` or defaulted undefined stock to `0`. For products loaded without explicit stock attributes (or in catalogs where inventory tracking was optional), this falsely marked items as `SOLD OUT`, locked `maxStock` to `0`, and caused `refreshStorefrontCatalog` to purge newly added items from `gn_cart`.

### Decision
1. **Restored Formatted Price Definition:** Reintroduced `const priceText = \`Rs. ${activePrice.toLocaleString('en-PK')}\`;` within `addToCartBtn` before item persistence.
2. **Normalized Stock Fallback Invariant (999 Default):** All catalog, PDP, and cart routines now check:
   `const pStock = (p.stock !== undefined && p.stock !== null && p.stock !== '') ? Number(p.stock) : 999;`
   Only products explicitly configured with stock $\le 0$ are treated as out-of-stock. Products without explicit stock remain freely purchasable.
3. **Safe Addable & MaxStock Clamping:** `maxStock` is normalized via `Math.max(1, pStock)` preventing `0 >= 0` false locks.

### Invariants
* Any product without an explicit numeric stock attribute defaults to in-stock (`999`).
* `addToCartBtn` handler must define `priceText` locally before writing to cart state.
* `refreshStorefrontCatalog` must never delete cart items unless authoritative stock is explicitly $\le 0$.

---

## Diagnostic Checklist for Future AI Agents

Before troubleshooting any reported issue, execute this verification protocol:

- [ ] **Check Deployment:** Confirm latest commit is on `main` and deployed to `https://gothic-nova.vercel.app`.
- [ ] **Inspect Supabase Row:** Query `gn_orders` where `customer_name = '__GN_SYNC_PRODUCTS__'`. Ensure `count === 1` and `items` is populated.
- [ ] **Check Realtime Logs:** Open DevTools console and verify WebSocket connection (`gn_realtime_sync`) without `cannot add postgres_changes callbacks` errors.
- [ ] **Verify Storage Keys:** Inspect `localStorage.getItem('gn_swr_products')`. Ensure no startup script is clearing it.
- [ ] **Verify Element Display:** Ensure target elements are not hidden by CSS (`display: none;`, zero-height accordions, or parent overflow).



