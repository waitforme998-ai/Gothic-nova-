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

## Diagnostic Checklist for Future AI Agents

Before troubleshooting any reported issue, execute this verification protocol:

- [ ] **Check Deployment:** Confirm latest commit is on `main` and deployed to `https://gothic-nova.vercel.app`.
- [ ] **Inspect Supabase Row:** Query `gn_orders` where `customer_name = '__GN_SYNC_PRODUCTS__'`. Ensure `count === 1` and `items` is populated.
- [ ] **Check Realtime Logs:** Open DevTools console and verify WebSocket connection (`gn_realtime_sync`) without `cannot add postgres_changes callbacks` errors.
- [ ] **Verify Storage Keys:** Inspect `localStorage.getItem('gn_swr_products')`. Ensure no startup script is clearing it.
- [ ] **Verify Element Display:** Ensure target elements are not hidden by CSS (`display: none;`, zero-height accordions, or parent overflow).


