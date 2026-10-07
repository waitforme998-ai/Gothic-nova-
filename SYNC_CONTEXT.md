# GOTHIC NOVA — Multi-Device Realtime Sync Context & Post-Mortem

> **Target Audience:** Future AI Agents, Engineers, and Maintainers.  
> **Core Objective:** Document the evolution of the multi-device sync architecture, every failed hypothesis/approach attempted, why each failed, and the definitive solution that achieved stability.

---

## 1. Executive Summary

For approximately 3 weeks, Gothic Nova experienced persistent issues where:
1. Products added in the Admin Panel would disappear when the page was refreshed.
2. The storefront would show skeleton loaders and then fall back to "NO ARTIFACTS FOUND" even when products existed in the database.
3. The announcement bar would flash obsolete hardcoded text (e.g., "MIDNIGHT DROP") for several seconds before loading live admin announcements, or fail to update across devices.
4. Changes made on mobile or desktop incognito sessions failed to reflect across tabs and devices.

The root problem was **not** a single bug, but a chain of 7 interconnected design traps across storage, database queries, UI defaults, and asynchronous execution.

---

## 2. Chronological Log of Failed Hypotheses & Attempts

### Attempt 1: Dual-Storage Contention (LocalStorage Primary, Supabase Secondary)
* **What was tried:** Writing mutations to `localStorage` first, and then trying to push to Supabase as a background sync task.
* **Why it failed:** Different browsers, private/incognito windows, and mobile devices have completely isolated `localStorage`. If device A updated `localStorage`, device B knew nothing about it until a full manual sync occurred. Furthermore, if device B had older local data, it would overwrite device A's cloud data on save ("last-write-wins with stale data").

### Attempt 2: Monolithic State Sync Blob (`__GN_SYNC_STATE__`)
* **What was tried:** Packing all store state (products, categories, announcements, reviews, orders) into a single giant JSON object stored in one row.
* **Why it failed:** Cross-section clobbering. If the merchant was in the Admin Announcement section and saved offers, the script read its local state (which might have had empty products if the products tab wasn't loaded) and overwrote the cloud row, wiping out the entire product catalog!
* **Evolution:** Replaced in Commit `c10faa2` with **Per-Section Independent Synchronization** (`__GN_SYNC_PRODUCTS__`, `__GN_SYNC_ANNOUNCEMENTS__`, etc.).

### Attempt 3: The Destructive Startup Wipe (`localStorage.removeItem`)
* **What was tried:** To ensure no "legacy mock products" lingered on client devices, a startup script was added:
  ```javascript
  ['gn_products', 'gn_categories_meta', 'gn_announcements', ...].forEach(k => localStorage.removeItem(k));
  ```
* **Why it failed:** This executed on **every single page refresh**! On mobile networks or cellular data with 300ms–800ms latency, the user refreshed the page, the local cache was wiped, and the UI sat with 0 products. To the merchant, it looked like: *"Whenever I refresh, my uploaded products disappear!"*

### Attempt 4: In-Band SQL Deletion with `.catch()` on Supabase Thenables
* **What was tried:** Inside `_getSection`, when duplicate sync rows were detected, code attempted:
  ```javascript
  client.from('gn_orders').delete().eq('id', dupId).catch(() => {});
  ```
* **Why it failed:** Supabase's query builder is a *thenable* (implements `.then()`), not a standard Promise instance with `.catch()` directly on the builder before execution. Calling `.catch()` threw a fatal `TypeError: client.from(...).delete(...).eq(...).catch is not a function`. The query crashed into `catch(e)` on every product read and returned `[]`.

### Attempt 5: Hardcoded HTML Fallback Strings
* **What was tried:** Embedding fallback text directly in HTML so the ticker wouldn't be blank while loading:
  ```html
  <div class="sale-ticker-band" id="saleTickerBand">
      <div class="sale-ticker-group">
          <span>⚡ MIDNIGHT DROP: LIMITED RUN NOW LIVE</span>
      </div>
  </div>
  ```
* **Why it failed:** The browser paints HTML at 0ms. The user saw "MIDNIGHT DROP" every time they refreshed or visited the site, even though they had saved custom announcements in the admin panel.

### Attempt 6: Admin Accordion Concealment (UI False Negative)
* **What was tried:** Refactoring the admin panel to organize products under collapsible category accordions.
* **Why it failed:** `categoriesSectionOpen` was set to `false` and `openCategoryAccordions` was empty (`new Set()`). When products were successfully fetched from Supabase, the product cards were rendered into collapsed DOM containers with `display: none` / `height: 0`. The merchant saw "0 items" or an empty table on refresh because the accordion was closed!

### Attempt 7: Fire-and-Forget Unawaited Persistence Queue
* **What was tried:** Serializing saves via a Promise queue:
  ```javascript
  _sectionSaveQueue[sectionKey] = _sectionSaveQueue[sectionKey].then(async () => { ... });
  ```
* **Why it failed:** `_saveSection` did not `await` the queue. When the merchant clicked "Save Product" and refreshed 500ms later, the browser aborted the HTTP PATCH request before it reached Supabase.

---

## 3. The Definitive Permanent Architecture

The current architecture stabilizes multi-device synchronization through 4 pillars:

1. **Pure Cloud Authority with Stale-While-Revalidate (SWR):**
   - Cloud (Supabase PostgreSQL `gn_orders`) is the sole source of truth.
   - SWR keys (`gn_swr_products`, `gn_swr_announcements`) provide instant 0ms hydration on page reload.
   - Background revalidation updates the UI when network responds, eliminating blank screens and data loss.
2. **Deduplicated Single-Row PostgreSQL Records:**
   - Exactly one row per section (`customer_name = '__GN_SYNC_<SECTION>__'`).
   - Clean, deterministic `.limit(1)` queries with no SQL delete crashes.
3. **Guaranteed Write Awaiting:**
   - `SupabaseEngine._saveSection` awaits `_sectionSaveQueue` with a `.catch(() => {})` wrapper to prevent deadlock.
   - The UI loading indicator does not dismiss until the database confirms the write.
4. **Zero-Fallback Dynamic UI:**
   - Dynamic elements start hidden (`style="display: none;"`) until data arrives.
   - Admin catalog sections and "All Products" accordions are open by default.

---

## 4. Diagnostic Checklist for Future AI Agents

If an issue is reported with syncing, follow this exact checklist:

- [ ] **Check Vercel Deployment**: Are changes pushed to GitHub (`main`) and live on `https://gothicnovastore.vercel.app`? (Never test against local while assuming live is updated).
- [ ] **Inspect Cloud Rows**: Run a fetch query to `gn_orders` with `apikey` and check `customer_name = '__GN_SYNC_PRODUCTS__'`. Does it contain the expected items? Are there duplicate rows?
- [ ] **Check for JavaScript Errors**: Use Chrome DevTools Protocol to inspect `Runtime.consoleAPICalled` and `Network.responseReceived` for 4xx/5xx status codes or TypeErrors.
- [ ] **Check DOM Element Display**: Is the element present in the DOM but hidden by CSS (`display: none`, collapsed accordion)?
- [ ] **Verify Storage Keys**: Check `localStorage.getItem('gn_swr_products')`. Ensure no script is purging it on mount.
