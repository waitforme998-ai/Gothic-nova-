# GOTHIC NOVA — Architectural Decisions Record (ADR)

> **Documentation Suite Navigation:**
> - 📘 **System Architecture (The HOW & WHAT):** [ARCHITECTURE.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/ARCHITECTURE.md) (System topology, component directory, data flow pipelines, and layout specifications)
> - 📜 **Functional Feature Specification (The CAPABILITIES):** [FEATURES.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/FEATURES.md) (Complete catalog of all 10 user-facing & admin subsystems)
> - 📗 **Anti-Hallucination Data Dictionary (The CONTRACT):** [SCHEMA_AND_CONVENTIONS.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/SCHEMA_AND_CONVENTIONS.md) (Product/Order property contracts, dual-property access rules, and SafeStorage keys)
> - 📕 **Historical Decisions & Invariants (The WHY):** [DECISIONS.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/DECISIONS.md) (This file — ADR-001 through ADR-028: Problem statements, failure modes, trade-offs, and invariant rules)
> - 📙 **Agency Replication Playbook (The REUSE):** [REUSABLE_STORE_BLUEPRINT.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/REUSABLE_STORE_BLUEPRINT.md) (Deploying this engine for any new client in 24 hours)

---

## Purpose & Scope of This Document

This document records the **authoritative architectural decisions, trade-offs, and non-negotiable invariants** established across Gothic Nova's evolution. 

* **The WHY & INVARIANTS:** While `ARCHITECTURE.md` describes *how the system currently works*, `DECISIONS.md` documents *why choices were made*, which bugs or failure modes forced those decisions, and the strict invariants that prevent regressions.
* **Maintenance Rule:** When architectural policies evolve, append a new ADR or update the existing record. Never wipe historical context or delete invariant rules.

---

## Diagnostic Checklist for Future AI Agents

Before modifying code or troubleshooting any reported issue, execute this verification protocol:

- [ ] **Check Deployment:** Confirm latest commit is on `main` and deployed to `https://gothicnova.com` (and `https://gothic-nova.vercel.app`).
- [ ] **Verify Dynamic Sitemap:** Confirm `https://gothicnova.com/sitemap.xml` returns valid XML (`HTTP 200`) containing dynamic product URLs.
- [ ] **Inspect Supabase Row:** Query `gn_orders` where `customer_name = '__GN_SYNC_PRODUCTS__'`. Ensure `count === 1` and `items` is populated with active catalog products.
- [ ] **Check Realtime Logs:** Open DevTools console and verify WebSocket connection (`gn_realtime_sync`) without `cannot add postgres_changes callbacks` errors.
- [ ] **Verify Storage Keys:** Inspect `localStorage.getItem('gn_swr_products')` or `SafeStorage`. Ensure no startup script is clearing it.
- [ ] **Verify Element Display:** Ensure target elements are not hidden by CSS (`display: none;`, zero-height accordions, or parent overflow).
- [ ] **Verify Cart Viewport:** Confirm `#cart-items-list` scrolls cleanly and `#cart-footer` remains docked on mobile screen sizes.
- [ ] **Verify Order Hydration:** Confirm `adminOrders` hydrates from `gn_swr_orders` at T=0ms without being blocked by catalog media.

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
16. [ADR-016: Non-Intrusive PDP Description Presentation via Length-Gated Toggle](#adr-016-non-intrusive-pdp-description-presentation-via-length-gated-toggle)
17. [ADR-017: Cart Drawer Viewport Scrolling & PDP Add-to-Cart State Hardening](#adr-017-cart-drawer-viewport-scrolling--pdp-add-to-cart-state-hardening)
18. [ADR-018: Add-to-Cart Scope Hardening & Undefined Stock Fallback Normalization](#adr-018-add-to-cart-scope-hardening--undefined-stock-fallback-normalization)
19. [ADR-019: SafeStorage Layer Abstraction & Instagram In-App Browser Sandbox Immunity](#adr-019-safestorage-layer-abstraction--instagram-in-app-browser-sandbox-immunity)
20. [ADR-020: Static Wall Hero Backdrop, Crawling Curtain Topology & Marquee Speed Calibration](#adr-020-static-wall-hero-backdrop-crawling-curtain-topology--marquee-speed-calibration)
21. [ADR-021: Add-to-Cart Persistent State, Secondary Stepper, & Cart Drawer Viewport Containment](#adr-021-add-to-cart-persistent-state-secondary-stepper--cart-drawer-viewport-containment)
22. [ADR-022: Zero-Dependency Serverless Dynamic XML Sitemap, Canonical Domain Migration & Core Web Vitals Optimization](#adr-022-zero-dependency-serverless-dynamic-xml-sitemap-canonical-domain-migration--core-web-vitals-optimization)
23. [ADR-023: Mobile Core Web Vitals (<2.5s LCP) & Asset Compression Architecture](#adr-023-mobile-core-web-vitals-25s-lcp--asset-compression-architecture)
24. [ADR-024: PDP Modal Dismissal, Click Fall-Through Immunity & Non-Sticky Close Button](#adr-024-pdp-modal-dismissal-click-fall-through-immunity--non-sticky-close-button)
25. [ADR-025: Catalog Card Interaction Restoration, Hero Typography Reliability & PNG Asset Preservation](#adr-025-catalog-card-interaction-restoration-hero-typography-reliability--png-asset-preservation)
26. [ADR-026: Dynamic XML Sitemap Vercel Rewrite & CleanUrls Resolution](#adr-026-dynamic-xml-sitemap-vercel-rewrite--cleanurls-resolution)
27. [ADR-027: Decoupled Order Hydration, Native Browser Push Notifications & Google Favicon Standards](#adr-027-decoupled-order-hydration-native-browser-push-notifications--google-favicon-standards)
28. [ADR-028: Storefront Real Business WhatsApp Integration & Automated Disaster Recovery Backups](#adr-028-storefront-real-business-whatsapp-integration--automated-disaster-recovery-backups)

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
4. **Password Ambiguity:** Line 809 of `supabase-engine.js` had a legacy check `if (password === '[REDACTED_KEY]' || password === 'admin')` in an unused auth helper, creating confusion over secondary passwords and email requirements.

### Decision
1. **Confine Shimmer Animation to Skeletons:** Normal mobile `.card-img-wrapper` elements have a static dark background with `animation: none !important;`. The infinite shimmer is strictly scoped to `.product-card.skeleton-card .card-img-wrapper` and `.skeleton-img-box`.
2. **Flatten Mobile Cards to Normal Scroll Flow:** On mobile (`@media (max-width: 768px)`), `.product-card` uses `transform: none !important; backface-visibility: visible !important; contain: layout style !important;`, eliminating dozens of promoted GPU layers.
3. **Non-Destructive Catalog Appends:** When `isAppending === true` in `renderMainCatalog()`, existing DOM cards and image decodes are untouched; only newly unveiled cards are inserted via `grid.insertAdjacentHTML('beforeend', newCards)`.
4. **Mobile Button Touch Stabilization:** Disabled `:hover` translates and expanding shadows on mobile buttons (`.catalog-load-more-btn`, `.pdp-modal-btn-buy`, `.product-card:hover`). Replaced with non-transforming subtle `:active` opacity. Lowered overlay backdrop-filters to `blur(4px)` on mobile.
5. **Strict Single Master Password Invariant:** Removed `'admin'` fallback from `supabase-engine.js`. The only authorized administrative key in the system is verified cryptographically via SHA-256 hash. No email required.

### Invariants
* The admin panel authentication is strictly single-password (SHA-256 verified) without email.
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

## ADR-019: SafeStorage Layer Abstraction & Instagram In-App Browser Sandbox Immunity

### Context & Problem
1. **Instagram & WebKit In-App Browser (IAB) DOMExceptions:**
   When visitors open gothicnova.com links through Instagram, Facebook, TikTok, or iOS Safari Private Browsing mode, sandboxed webviews enforce strict privacy barriers. Accessing or modifying `window.localStorage` throws an unhandled:
   `DOMException: SecurityError: Access is denied for this document`.
2. **Catalog Blank Flash & Fatal JS Halts:**
   Because `supabase-engine.js` (lines 54–55) and `index.html` (Tarot check, SWR reads, cart state) invoked `localStorage` directly at 0ms, the thrown SecurityError abruptly halted JavaScript parsing. The catalog collapsed to 0px height, product cards were never hydrated, and customers could not add items to the cart.
3. **Instagram Query Clutter & History API Locks:**
   Instagram ads and bio links append extensive tracking query strings (`?igshid=...`, `?fbclid=...`, `?utm_...`). In restricted webviews, attempting unhandled `history.pushState` on modal interactions caused secondary errors.

### Decision
1. **Synchronous `window.SafeStorage` Polyfill:**
   Placed an inline SafeStorage engine at the very top of `<head>` in `index.html` before any other script. It mimics `Storage.prototype` with synchronous `.getItem()`, `.setItem()`, `.removeItem()`, and `.clear()`.
   If `localStorage` is blocked or throws any SecurityError, it seamlessly transparents to an internal in-memory dictionary (`mem`).
2. **Dual-Mode Engine Migration (`supabase-engine.js`):**
   Integrated `SafeStorage` into `safeLocalStorageSet()`, `initSupabase()`, `_getSection()`, and stock helpers. If running headless or in tests without `window.SafeStorage`, it transparently instantiates its own isolated safe storage.
3. **Storefront Decoupling from Raw `localStorage`:**
   Migrated all storage touchpoints in `index.html` (Tarot ritual gate, 0ms SWR catalog hydration, cart persistence, active reward getters) to `SafeStorage`.
4. **URL Parameter Isolation & History API Guards:**
   Updated `handleUrlQueryParams()` to parse `pid = params.get('product') || params.get('p')` cleanly and open PDP modals without being derailed by trailing social tracking parameters. Wrapped all `history.pushState` calls in `try/catch`.

### Invariants
* All client-side storage access across storefront and dual-mode engine must use `SafeStorage` or be wrapped in `try/catch`.
* `SafeStorage` must remain 100% synchronous; it must never return promises or throw uncaught exceptions.
* In restricted or private browsing sandboxes, cart additions and product browsing must proceed in memory without blocking customer checkout.

---

## ADR-020: Static Wall Hero Backdrop, Crawling Curtain Topology & Marquee Speed Calibration

### Context & Problem
1. **Curtain Parallax Invariant:**
   The signature Gothic Nova aesthetic requires the hero section to stand static like an immovable gothic wall (`position: fixed`). As the user scrolls, the active drop section (`.active-drop-section`) must crawl/override smoothly over the hero rather than the hero scrolling away in normal document flow.
2. **Viewport Spacing & Hero Visibility Defect:**
   When visitors are at scroll position 0 (`scrollY = 0`) to view the hero section fully, no portion of `.active-drop-section` (e.g. its curved crimson border, shadow, or "NEW ARRIVALS" header) should peek onto the screen. Under in-flow or truncated height topologies (`calc(100dvh - 60px)` with `margin-top: 0`), 60px of the product catalog persistently remained on screen.
3. **Marquee Speed Calibration:**
   The New Arrivals marquee scrolled too aggressively for luxury editorial browsing, requiring a 20% speed reduction for both JS `requestAnimationFrame` auto-scrolling and CSS keyframe animations.

### Decision
1. **Static Wall Hero Topology:**
   Enforced `position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100vh !important; height: 100dvh !important; z-index: 1 !important; overflow: hidden !important;` across desktop and mobile. The hero section remains completely static during scrolling.
2. **Crawling Curtain Product Section with 100vh/100dvh Offset:**
   Set `.active-drop-section` to `margin-top: 100vh !important; margin-top: 100dvh !important; position: relative !important; z-index: 10 !important; background-color: #0a0508 !important;`.
   - At `scrollY = 0`, the product section begins strictly below the visible viewport, allowing the hero section to be viewed 100% cleanly without spacing peeking defects.
   - Upon scroll, the opaque `#0a0508` product section crawls smoothly over the hero with an elevated `z-index: 10`.
3. **New Arrivals Marquee 20% Speed Reduction:**
   - In `index.html`: Reduced `baseSpeed` from `0.6` to `0.48` (~29px/sec).
   - In `style.css`: Increased mobile animation duration from `28s` to `35s`.
4. **Stable Catalog Footprint:**
   Preserved `min-height: 480px;` on `.drop-grid` across desktop and mobile to ensure layout stability during initial catalog hydration.

### Invariants
* `.hero-section` must always remain static (`position: fixed`) with `z-index: 1`.
* `.active-drop-section` must maintain `margin-top: 100vh !important; margin-top: 100dvh !important;`, `z-index: 10 !important;`, and `background-color: #0a0508 !important;`.
* At scroll position 0, zero pixels of the product section may peek onto the screen over the hero section.
* The marquee auto-scroll speed must remain calibrated at `baseSpeed = 0.48`.

---

## ADR-021: Add-to-Cart Persistent State, Secondary Stepper, & Cart Drawer Viewport Containment

### Context & Problem
1. **Ephemeral Button Reset & User Confusion:**
   In `index.html`, clicking "Add to Cart" previously transitioned the CTA into `VIEW CART` for an arbitrary 800ms timer before automatically resetting back to `ADD TO CART`. Customers who paused to read or wanted to proceed to the cart were caught in a race condition where the button snapped back, creating confusion over whether their item had actually been added.
2. **Missing In-Modal Multi-Unit Addition Flow:**
   When an item was already present in the cart, opening the PDP modal or adding the first unit left customers without an obvious mechanism to increment quantity further from the modal itself without opening the full cart drawer.
3. **Cart Key Inconsistency (String vs Numeric ID):**
   Product IDs could be parsed or handled inconsistently as numbers or strings across different triggers (`addToCartBtn`, `renderCart`, stepper controls). Non-coerced IDs caused lookup mismatches where `cartMap[id]` could create duplicate item entries or fail to increment smoothly.
4. **Mobile Cart Drawer Viewport Overflow:**
   On mobile devices with short vertical viewports (or browsers with dynamic URL bars), `#cart-items-list` lacked a hard boundary relative to dynamic viewport units (`dvh`). When 3+ items were added, the list expanded down and pushed the checkout CTA and subtotal footer past the fold, preventing customers from finishing their purchase without closing and reopening.

### Decision
1. **Pure Binary Cart Button State (`ADD TO CART` / `VIEW CART`):**
   - The button has only two clean binary states: `ADD TO CART` and `VIEW CART`.
   - Never displays numeric counts (`(1)`, `(+1)`, `(X)`) on the button.
   - When clicked in `ADD TO CART` mode, adds strictly 1 unit to the cart and immediately flips permanently to `VIEW CART`.
   - When clicked in `VIEW CART` mode, opens the cart drawer immediately.
2. **Decoupled Quantity Controls (Exclusively for Buy Now):**
   - The quantity stepper (`-`, `1`, `+`) in the product details modal controls quantity strictly for the direct **"BUY NOW"** checkout flow.
   - It does not modify the cart, nor does it alter the `ADD TO CART` button.
   - Increasing and decreasing quantity of cart items is managed exclusively inside the Cart Drawer (`#cart-drawer`), ensuring zero conflicting or fighting DOM states.
3. **Card "Added to Cart" Clutter Removal:**
   - All secondary badges (`.card-incart-badge`), "X IN CART" overlays, and special in-cart card borders are completely removed.
   - The only indicator that an artifact is currently in the cart is that its action button changes from `ADD TO CART` to `VIEW CART`.
4. **Checkout Modal Layering Immunity:**
   - `#checkoutOverlay` (`z-index: 999998 !important`) and `#checkoutModal` (`z-index: 999999 !important`) are permanently elevated above all modal systems.
   - `.pdp-modal-box:not(.active)` is strictly set to `display: none !important`, and `openCheckout()` explicitly closes the PDP modal, eliminating any stacking or bleed-through conflicts.
5. **Strict ID String Coercion:**
   All cart operations strictly enforce `String(pid).trim()`.

### Invariants
* The Add-to-Cart button must never show quantity numbers in parentheses or fight with modal steppers.
* Stepper adjustments on the product card/modal must only affect direct "BUY NOW" checkout; clicking `ADD TO CART` always adds strictly 1 unit.
* Checkout modal must always close any active PDP modal and render above all other layers.

---

## ADR-022: Zero-Dependency Serverless Dynamic XML Sitemap, Canonical Domain Migration & Core Web Vitals Optimization

### Context & Problem
1. **Static Sitemap Staleness:**
   The storefront relied on a hardcoded root `sitemap.xml` containing only `/` and `/category.html`. As the merchant added products via `admin.html`, new items were completely invisible to search engine crawlers (Googlebot, Bingbot) unless those bots executed client-side JavaScript.
2. **Staging URL Canonical Leakage:**
   Canonical tags, OpenGraph URLs, JSON-LD schemas, and `robots.txt` referenced the temporary Vercel staging deployment (`https://gothic-nova.vercel.app/`) rather than the official production domain (`https://gothicnova.com/`), fragmenting domain authority and search ranking.
3. **Mobile Largest Contentful Paint (LCP) Delay:**
   Mobile browsers downloaded desktop-sized hero images (`hero_gothic_bg.png`) due to non-responsive `<link rel="preload">` tags in `<head>`. Additionally, synchronous script parsing blocked initial rendering on mid-tier cellular devices.
4. **Missing Edge Cache-Control Directives:**
   Vercel served assets with default non-immutable cache headers, forcing redundant re-validations of static JS, CSS, and optimized WebP images on repeated user visits.

### Decision
1. **Zero-Dependency Serverless XML Sitemap (`api/sitemap.js`):**
   - Created a standalone Vercel Serverless Function running on Node.js using native `https` (zero npm dependencies).
   - Queries Supabase REST API directly for `customer_name = '__GN_SYNC_PRODUCTS__'`, dynamically enumerating all active catalog items.
   - Generates compliant XML (`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`) with `<loc>`, `<lastmod>`, `<changefreq>`, and `<priority>` for root, category, and every individual product (`https://gothicnova.com/?product=<id>`).
   - Serves edge caching header: `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` (cached at edge for 1 hour, background revalidated up to 24 hours).
   - Configured rewrite in `vercel.json`: `/sitemap.xml` -> `/api/sitemap.js`.
   - Retired static root `sitemap.xml`.
2. **Production Domain Canonicalization (`https://gothicnova.com`):**
   - Updated `robots.txt` to `Sitemap: https://gothicnova.com/sitemap.xml`.
   - Standardized all canonical `<link rel="canonical" href="https://gothicnova.com/">`, OpenGraph (`og:url`, `og:image`), and Schema.org JSON-LD references to `https://gothicnova.com/`.
3. **Core Web Vitals (CWV) & Performance Tuning:**
   - **Responsive Hero Preloading:** Replaced monolithic image preload with media-query-conditioned preloads:
     `<link rel="preload" as="image" href="assets/website_bg_mobile.jpg" media="(max-width: 768px)" fetchpriority="high">`
     `<link rel="preload" as="image" href="assets/hero_gothic_bg.png" media="(min-width: 769px)" fetchpriority="high">`
   - **Deferred Script Execution:** Added `defer` to Supabase SDK and `supabase-engine.js` to eliminate DOM parser blocking.
   - **Connection Warming:** Injected `dns-prefetch` and `preconnect` directives for `cdn.jsdelivr.net` and Supabase API origins.
   - **Edge Caching Rules (`vercel.json`):**
     - Static JS/CSS: `public, max-age=86400, stale-while-revalidate=604800`.
     - Static Images & Fonts: `public, max-age=31536000, immutable`.
   - **Rendering & Layout Shift Optimization:**
     - Added `aspect-ratio: 1 / 1` to `.card-img-wrapper` to prevent Cumulative Layout Shift (CLS).
     - Added `content-visibility: auto; contain-intrinsic-size: 1px 500px;` to `.reviews-section` and `.store-footer` to defer off-screen rendering until user scrolls.

### Invariants
* `api/sitemap.js` must remain zero-dependency (native Node.js `https`) to ensure rapid cold starts and zero maintenance overhead.
* All canonical references, OpenGraph URLs, JSON-LD schemas, and sitemap entries must strictly target `https://gothicnova.com/`.
* Never wipe or modify live database rows in Supabase table `gn_orders`.

---

## ADR-023: Mobile Core Web Vitals (<2.5s LCP) & Asset Compression Architecture

### Context & Problem
1. **Mobile Performance Bottleneck (66 Score, 7.2s LCP):**
   Google Lighthouse throttled mobile audits reported a 7.2-second Largest Contentful Paint (LCP) and 3.8-second First Contentful Paint (FCP). While CLS (0.015) was stable, heavy assets and render-blocking resources severely impaired mobile load times.
2. **Blocking Fonts & Stylesheet Latency:**
   Loading 4 Google Font families (16 weight combinations) synchronously in `<head>` stalled the DOM parser.
3. **Monolithic Uncompressed Hero Images:**
   Raw PNG/JPG backgrounds (`website_bg_mobile.jpg`, `hero_gothic_bg.png`, `gothic_card_back.jpg`) totaled over 800KB. Competing `<link rel="preload">` tags saturated cellular 4G bandwidth.
4. **Main-Thread JavaScript Contention:**
   Synchronous execution of Supabase Realtime CDC handshakes, review tickers, and search tokenizer generated 820ms of Total Blocking Time (TBT).

### Decision
1. **Asynchronous Non-Blocking Fonts & Critical CSS:**
   - Asynchronously preload Google Fonts using `onload="this.rel='stylesheet'"` with `display=swap`.
   - Restrict weights to `Antonio:700` and `Inter:400;600;700`.
   - Inline core above-the-fold layout CSS (~4KB) in `<head>` for instantaneous FCP (<1.1s).
2. **WebP Modernization & Strict Single-LCP Preload:**
   - Convert all core hero and backdrop assets to WebP at quality 82 (70–80% byte reduction).
   - Enforce a strict single-LCP preload rule: only `assets/website_bg_mobile.webp` carries `fetchpriority="high"` on mobile.
3. **Offscreen Catalog Decoupling:**
   - Decouple catalog cards below the first 4 with `loading="lazy" decoding="async" fetchpriority="low"`.
   - Lock `aspect-ratio: 1 / 1` and `#12090d` background to guarantee zero Cumulative Layout Shift.
4. **Merchant Ingestion Gateway:**
   - Client-side Canvas 800x800 WebP compressor in `admin.html` ensures all future inventory uploads remain under 80KB.
5. **Main-Thread Scheduling Ladder:**
   - Defer search indexing and realtime subscriptions to `requestIdleCallback`, dropping TBT below 150ms.

### Invariants
* Never bypass or alter `window.SafeStorage`.
* In-place quantity steppers (`[ − ] [ X In Cart ] [ + ]`) and cart-to-modal quantity sync must remain 100% intact.
* Delivery fees (flat Rs. 300, Tarot Rs. 0 waiver) and mandatory Rs. 700 advance deposit verification must remain unchanged.
* Zero-Click admin live order feed (Triple-Shield) must remain active.
* Image compression must remain visually lossless (q=82 WebP) preserving the dark gothic luxury aesthetic.

---

## ADR-024: PDP Modal Dismissal, Click Fall-Through Immunity & Non-Sticky Close Button

### Context & Problem
1. **Modal Reopening Glitch upon Dismissal:**
   When clicking the top-right cross button (`✕`) to close the product details modal (`pdpModalBox`), the modal frequently flashed closed and immediately reopened with the cross button illuminated ("lighted").
2. **Click Fall-Through / Touch Ghost Clicks:**
   Setting `modalBox.style.display = 'none'` synchronously removed the modal from the browser's hit-test layer before the click/tap cycle completed. The underlying `.product-card` directly beneath the cross button coordinates captured the fall-through `click` event, invoking `onclick="openPdpModal(id)"` and reopening the modal.
3. **Repeated Deep-Link Ingestion on Product Sync:**
   `handleUrlQueryParams` listened to the `productsLoaded` event without an idempotency latch. When Supabase or local storage dispatched catalog updates, the handler re-parsed `?product=` from the initial URL and triggered a deferred `setTimeout` reopening the modal even after the customer dismissed it.
4. **Sticky `:hover` State on Mobile Touchscreens:**
   CSS rules for `.pdp-modal-close:hover` applied deep crimson background and glowing red borders without checking for `@media (hover: hover)`. Mobile touch interactions left the `:hover` styling stuck to the button upon reopening.

### Decision
1. **Event Propagation & Focus Isolation:**
   - `closeBtn` and `overlay` click listeners explicitly call `e.stopPropagation()` and `e.preventDefault()`.
   - `closePdpModal()` explicitly calls `closeBtn.blur()`, clearing focused or active states.
2. **Ghost-Click Cooldown Guard:**
   - Implemented an atomic closing timestamp: `_pdpJustClosedTime = Date.now()`.
   - `openPdpModal()` enforces an immediate rejection guard: `if (Date.now() - _pdpJustClosedTime < 400) return;`.
3. **Idempotent URL Query Latch:**
   - Gated `handleUrlQueryParams()` behind `_hasHandledInitialDeepLink = true`.
   - Inside the scheduled timeout, validated that `new URLSearchParams(window.location.search).get('product')` has not been deleted by modal closure before opening.
4. **Touch-Safe CSS Media Queries:**
   - Scoped `.pdp-modal-close:hover` under `@media (hover: hover)` so mobile touch interactions never retain a persistent glow.
   - Added `.pdp-modal-close:active` and `.pdp-modal-close:focus { outline: none !important; }`.

### Invariants
* The product details modal must dismiss completely on the first click of the `✕` button or overlay.
* Catalog cards beneath the modal must never register click events originating from the dismissal action.
* Initial deep links (`?product=...`) must only open once on store boot and never resurrect after customer dismissal.

---

## ADR-025: Catalog Card Interaction Restoration, Hero Typography Reliability & PNG Asset Preservation

### Context & Problem
1. **Statue Silhouette Transparency Artifacts:**
   The floating gothic statue (`assets/subject_silhouette`) features fine semi-transparent cutouts. Conversion to lossy WebP produced an unsightly black background border/halo, destroying the seamless blend with the hero background.
2. **Hero Typography Failure & Delays:**
   Restricting the Google Fonts stylesheet to Inter/Fira Code and relying on a lazy-loaded print stylesheet caused the hero title (`GOTHIC NOVA`) to fail to apply `Antonio` (or fallback to browser defaults) because the font was removed from the active Google Fonts link, and the local `@font-face` only defined `font-weight: 700` whereas the hero title required `font-weight: 900`.
3. **Card Grid CTA Clarity:**
   Displaying `ADD TO CART` buttons directly on the product grid cluttered the dark aesthetic and bypassed the PDP modal where customers review specifications, sizing, and quantity before purchase.

### Decision
1. **Preserve PNG for Silhouette Cutouts:**
   - Retained `assets/subject_silhouette.png` exclusively for transparent cutouts.
   - All solid photographic and canvas backdrops (`website_bg`, `gothic_cathedral_bg`, `gothic_card_back`, `website_bg_mobile`) remain WebP.
2. **Immediate Brand Font Availability:**
   - Restored `Antonio:wght@700` and `League+Spartan:wght@600;700` to the primary Google Fonts stylesheet link.
   - Broadened the local critical `@font-face` definition to `font-weight: 400 900;` to ensure full coverage across all font weight declarations.
3. **Restoration of "VIEW OPTIONS" on Catalog Cards:**
   - Product cards in the storefront grid render the clean `VIEW OPTIONS` button (or `SOLD OUT` if out of stock), complete with the view eye icon.
   - Clicking `VIEW OPTIONS` opens the PDP modal smoothly.
   - Cart additions, quantity adjustments, and `BUY NOW` direct checkouts are managed within the PDP modal and cart drawer with zero layout thrashing or grid button desynchronization.

### Invariants
* The floating statue cutout must strictly remain a transparent PNG (`assets/subject_silhouette.png`).
* The brand hero title must render in `Antonio` immediately upon page paint.
* Product cards on the grid must display `VIEW OPTIONS` (never `ADD TO CART`), leaving purchase and cart actions to the PDP modal.

---

## ADR-026: Dynamic XML Sitemap Vercel Rewrite & CleanUrls Resolution

### Context & Problem
1. **Sitemap 404 & SEO Score Regression:**
   After migrating from static `sitemap.xml` to dynamic serverless generation via `api/sitemap.js`, PageSpeed/Lighthouse mobile SEO score dropped significantly.
2. **CleanUrls Collision:**
   `vercel.json` specified `"cleanUrls": true`, which strips `.js` extensions and issues HTTP 308 redirects for requests targeting `/api/sitemap.js`. The rewrite `{ "source": "/sitemap.xml", "destination": "/api/sitemap.js" }` caused an internal routing loop / 404 Not Found error for search crawlers visiting `/sitemap.xml` declared in `robots.txt`.

### Decision
1. **Direct Route Rewriting:**
   Updated `vercel.json` rewrites to point `/sitemap.xml` directly to `/api/sitemap` (omitting `.js`), matching Vercel's cleanUrls routing model.
2. **Response Verification:**
   Verified `https://gothicnova.com/sitemap.xml` returns `HTTP 200 OK` with `Content-Type: application/xml; charset=utf-8` and complete live product XML payload.

### Invariants
* `robots.txt` must declare `Sitemap: https://gothicnova.com/sitemap.xml`.
* `/sitemap.xml` must serve dynamic product URLs with `HTTP 200` without static file conflicts.

---

## ADR-027: Decoupled Order Hydration, Native Browser Push Notifications & Google Favicon Standards

### Context & Problem
1. **Startup Latency Bottleneck (20–25s Delay):**
   In `admin.html`, `loadOrdersAdmin()` was coupled inside a monolithic `await Promise.all([...])` alongside `loadProducts()`, `loadReviewsAdmin()`, and category payloads. Even though the Supabase orders query resolves in under 150ms, orders rendering was blocked until the entire catalog and base64 media downloaded. In addition, `adminOrders` lacked initial local storage SWR cache hydration on startup.
2. **Order Alert Latency & Third-Party Bloat:**
   The admin required instant order notifications without 3rd-party gamer app downloads (like Discord) or blocked networks (Telegram in Pakistan). The system needed to function like modern progressive web apps (Claude.ai / ChatGPT) via the native Web Notification and Audio APIs.
3. **Google Search SERP Favicon Default Globe Issue:**
   Googlebot-Favicon requires explicit square icons matching 48px multiples (48×48, 96×96, 192×192) and root `/favicon.ico`. The previous configuration only declared an SVG icon first, delaying Googlebot-Favicon from caching the monochrome emblem.

### Decision
1. **0ms Startup Hydration & Decoupled Fast Path:**
   - Hydrate `adminOrders` immediately from `gn_swr_orders` in 0ms on page paint before network requests fire.
   - Decoupled `loadOrdersAdmin()` from the catalog `Promise.all` queue so the fresh orders table revalidates independently in <200ms.
2. **Native Web Push & Realtime Chime Engine:**
   - Implemented `playOrderAlertChime()` using the native Web Audio API (dual-tone 880Hz $\rightarrow$ 1320Hz sine wave, 0 KB external asset weight).
   - Added `handleIncomingOrderAlert()` which triggers OS-level `new Notification()` with store emblem icon upon receiving `INSERT` events from Supabase Realtime.
   - Added `focusAndHighlightOrder(target)` supporting deep-links (`?order=ID` or `#order-ID`): fetches the single record in ~80ms if not in memory, expands the order card, scrolls smoothly, and flashes a subtle 3-second highlight border.
   - Added an understated `[ALERTS: ON/OFF]` toggle button in the header actions bar.
3. **Standard Google Search Favicon Suite:**
   - Generated high-quality bicubic 48×48, 96×96, 192×192, and 180×180 PNG emblems.
   - Updated `index.html` with explicit `<link rel="icon" sizes="...">` tags prioritized for search engine crawlers.

### Invariants
* Orders revalidation must never be blocked by catalog products or media loading.
* Audio alerts must be synthesized in-memory via Web Audio API (no external MP3/WAV assets).
* Notification routing must deep-link directly to the specific order without full page reload.

---

## ADR-028: Storefront Real Business WhatsApp Integration & Automated Disaster Recovery Backups

### Context & Problem
1. **Dummy Contact Number Vulnerability:**
   Trust badges, customer support buttons, and post-order WhatsApp confirmation routing in `index.html` were hardcoded to a placeholder number (`923001234567`). Customer inquiries and order verification chats were routed to a non-existent number instead of the store owner's real business line (`923710498483` / Muhammad Sammam Faisal).
2. **Obsolete 20.6MB Legacy Backup:**
   `docs/backups` contained an outdated 20.6 MB file from October 2024 containing raw base64 data URLs. If restored, it would inject dead media paths and outdated catalog rows.

### Decision
1. **Live Business Line Routing:**
   - Updated all customer touchpoints (`index.html` lines 3445, 3546, 6264) to route directly to `https://wa.me/923710498483`.
   - Preserved automated pre-filled receipt generation on the checkout success modal, allowing customers to send their order summary, delivery details, and balance with 1 tap.
2. **Automated Clean Backup Engine:**
   - Created `scripts/backup-store.js` which connects to Supabase, queries active rows for products, categories, reviews, and announcements, and outputs clean JSON snapshots to `docs/backups/latest_clean_store_backup.json`.
   - Created `docs/backups/README.md` documenting restoration procedures and CLI usage (`node scripts/backup-store.js`).

### Invariants
* Customer-facing WhatsApp links must always resolve to the store's verified business number.
* Backup scripts must store live CDN WebP paths, avoiding raw base64 data bloat.
