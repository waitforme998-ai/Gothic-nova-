# MASTER ENGINEERING PLAN: Gothic Nova (Storefront & Admin)
## Domain: gothicnova.com | Unified Architectural Execution Blueprint

> **Status:** ALL PHASES COMPLETED & DEPLOYED LIVE TO PRODUCTION (October 20, 2026)  
> **Repository:** https://github.com/waitforme998-ai/Gothic-nova- (`main` branch)  
> **Target Files:**
> - [`index.html`](file:///c:/Users/tasaw/Desktop/gothic-nova-store/index.html)
> - [`style.css`](file:///c:/Users/tasaw/Desktop/gothic-nova-store/style.css)
> - [`supabase-engine.js`](file:///c:/Users/tasaw/Desktop/gothic-nova-store/supabase-engine.js)
> - [`admin.html`](file:///c:/Users/tasaw/Desktop/gothic-nova-store/admin.html)

---

## 1. What Has Already Been Completed & Verified

The following items are finished, tested, and active in the repository:
1. **SafeStorage Layer:** Immunized entire app against Instagram in-app browser & iOS Safari private browsing storage crashes.
2. **Mobile Hero Stacking:** Clean viewport coordinates restored; mobile curtain scrolls naturally without stamping over products.
3. **Dynamic XML Sitemap & SEO Engine (`api/sitemap.js`):** Dynamic sitemap with real-time Supabase product names, prices, categories, and Google Image XML extension for Google Lens and search engine indexing.

---

## 2. Outstanding Problems & The 4 Clean Phases

All remaining unimplemented or glitching issues are organized into 4 logical phases:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Add-to-Cart & PDP Modal Stepper Overhaul (Fix the Glitch)                                │
│ Fix button stacking glitch, integrate inline stepper, and sync modal quantity with catalog card. │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: Order Delivery Fee (Rs. 300), Tarot Inversion & WhatsApp Receipt Breakdown               │
│ Enforce flat Rs. 300 shipping, Tarot Free Delivery cut, COD deposit enforcement, Step 2/3        │
│ itemization, and clear WhatsApp breakdown message.                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: Zero-Click Realtime Admin Order Ingestion (Triple-Shield)                                │
│ Ensure incoming orders appear instantly in admin.html without clicking "SYNC DATA" or reloading. │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: Admin Double-Entry Financial Ledger, Verification & Live Vercel Deployment              │
│ Itemize courier vs product funds in admin, test all cart permutations, and commit & push to live.│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🟢 PHASE 1: Add-to-Cart & PDP Modal Stepper Overhaul

**Problems Addressed:**
- The "+ Add another unit" button currently renders as an awkward secondary block below the action buttons instead of replacing the button or providing an inline stepper.
- Quantity adjusted inside the modal does not correspond cleanly with the catalog card or existing cart state.
- Button state toggles between "ADD TO CART" and "VIEW CART" without an intuitive way to adjust quantity directly in place.
- In categories containing only 1 product (e.g. niche category or single restock), the product card stretches vertically to fill the container's `min-height: 480px`, becoming disproportionately elongated compared to cards in full rows.

**Tasks:**
1. **Unify PDP Action Button Geometry:**
   - Remove the detached `#pdpAddMoreBtn` from beneath `#pdpModalActions`.
   - When an item is added to the cart, the "ADD TO CART" button transitions cleanly into an active dual state or inline stepper:
     * Option A: Split button `[ VIEW CART (X) ]` alongside a compact `[ +1 More ]` button within the same flex row.
     * Option B: In-place stepper `[ − ] [ X In Cart ] [ + ]` replacing the button, alongside a dominant `[ VIEW CART ]` CTA.
2. **Catalog Card & PDP Modal Quantity Synchronization:**
   - When a product is in cart, the product card badge and modal quantity display must reflect the exact units in `gn_cart`.
   - Pressing `+` or `−` in the modal stepper must directly adjust the cart and respect stock limits (`maxStock`).
3. **Single-Product Category Card Height & Aspect Ratio Lock:**
   - In `style.css`, update `.drop-grid` with `align-content: start;` / `align-items: start;` and set `.product-card { height: auto; align-self: start; }`.
   - Ensures that whether a category contains 1 product or 20 products, every product card preserves its exact standard dimensions, 1:1 image ratio, and balanced typography.
4. **Animation & Visual Polish:**
   - Smooth CSS transition without layout jump or popping elements below the modal viewport.

---

### 🟢 PHASE 2: Flat Rs. 300 Delivery Fee, Tarot Cut & WhatsApp Receipt

**Problems Addressed:**
- Delivery fee (flat Rs. 300 per order nationwide) must be charged once per order, while Tarot Free Delivery waives it to Rs. 0.
- COD orders must strictly require the Rs. 700 advance deposit verification screenshot (no bypass).
- Step 2 mini-summary, Step 3 confirmation screen, and the auto-generated WhatsApp message must display a clear, itemized breakdown to eliminate courier/customer disputes.

**Tasks:**
1. **Checkout Step 1 Calculations (`index.html`):**
   - `deliveryFee = (rawSubtotal <= 0 || isFreeShipping) ? 0 : 300`.
   - `finalTotal = rawSubtotal > 0 ? (Math.max(0, rawSubtotal - discount) + deliveryFee) : 0`.
   - Dedicated `#checkoutDeliveryFeeRow` showing `+Rs. 300` or `<s>Rs. 300</s> FREE (Rs. 0)`.
   - COD breakdown: Due Now = `Math.min(finalTotal, 700)`, Due at Doorstep = `Math.max(0, finalTotal - 700)`.
   - Full Advance: Due Now = `finalTotal`, Due at Doorstep = `Rs. 0`.
   - Screenshot upload strictly mandatory for all payment methods in `proceedToStep2()`.
2. **Checkout Step 2 Mini Summary:**
   - Append `Nationwide Courier Delivery: +Rs. 300` (or `FREE`) to the items list dropdown.
3. **Checkout Step 3 Receipt & WhatsApp Generator:**
   - Render `COURIER DELIVERY FEE: Rs. 300` (or `FREE`) in `#confirmedOrderReceipt`.
   - Update WhatsApp message template with itemized text:
     * Products list with quantities
     * Delivery Fee (`Rs. 300` or `FREE`)
     * Advance Paid (`Rs. 700` or full order amount)
     * Doorstep Balance Payable to Courier Rider

---

### 🟢 PHASE 3: Zero-Click Realtime Admin Order Ingestion (Triple-Shield)

**Problems Addressed:**
- In `admin.html`, new customer orders do not appear automatically; the merchant is forced to manually click "SYNC DATA" or refresh the page.

**Tasks:**
1. **Shield 1: Local Cross-Tab Broadcast (0ms Latency):**
   - In `supabase-engine.js:createOrder()`, post `{ type: 'ORDER_PLACED', order: createdOrder }` via `new BroadcastChannel('gn_store_sync')`.
   - In `admin.html`, listen on `gn_store_sync` to immediately trigger `loadOrdersAdmin(false)` when an order is placed on the same device.
2. **Shield 2: Auto-Reconnecting Realtime WebSocket:**
   - Upgrade `subscribeRealtime()` in `supabase-engine.js` with connection state monitoring (`SUBSCRIBED`, `CLOSED`, `CHANNEL_ERROR`).
   - Implement exponential backoff reconnect (1s, 2s, 5s) if connection drops.
   - On `INSERT` into `gn_orders`, invalidate `_ordersCache = null` and notify admin.
3. **Shield 3: Lifecycle Auto-Wake & 30-Second Silent Heartbeat:**
   - In `admin.html`, attach `visibilitychange` and `window.focus` listeners so the order table auto-updates whenever the merchant opens the tab or unlocks their phone.
   - Add a silent background interval (`setInterval(() => loadOrdersAdmin(false), 30000)`) active when tab is visible to guarantee ingestion even across restrictive firewalls.

---

### 🟢 PHASE 4: Admin Financial Ledger, E2E Verification & Deployment

**Problems Addressed:**
- The merchant needs complete financial clarity on every order (how much is courier fee vs product earnings vs deposit paid).
- All changes must be verified and pushed to GitHub so Vercel deploys them live.

**Tasks:**
1. **Admin Double-Entry Financial Ledger (`admin.html`):**
   - In expanded order details, display a dual-column ledger:
     * **Inflow (Source of Funds):** Subtotal + Delivery Fee − Tarot Discount = Total Order Value.
     * **Settlement (Allocation):** Advance Deposit Verified + Courier Doorstep Receivable.
     * **Logistics Net Audit:** Courier logistics cost (Rs. 300) vs Net Realized Merchant Revenue.
2. **End-to-End Cart & Order Permutation Testing:**
   - Verify 1-item, 2-item, Tarot Free Delivery, Tarot 10% Off, and full advance payments.
   - Validate JavaScript syntax across all files (`node -c`).
3. **Production Deployment:**
   - Commit all modified files with descriptive conventional commit messages.
   - Push to `origin/main` to trigger automatic live Vercel deployment.

---

## 3. CORE WEB VITALS & PERFORMANCE ACCELERATION PLAN (<2.5s Load Time & 90+ Score)

### 3.1 Field & Lab Performance Reality
* **Current Mobile Baseline:**
  - Performance Score: **66 / 100**
  - Largest Contentful Paint (LCP): **7.2s**
  - First Contentful Paint (FCP): **3.8s**
  - Total Blocking Time (TBT): **820ms**
  - Cumulative Layout Shift (CLS): **0.015** (fully stable)
* **Target Production Benchmark:**
  - Performance Score: **90–98 / 100**
  - Largest Contentful Paint (LCP): **< 2.4s** (Google "Good" zone)
  - First Contentful Paint (FCP): **< 1.1s**
  - Total Blocking Time (TBT): **< 150ms**
  - Cumulative Layout Shift (CLS): **< 0.01**

### 3.2 Non-Negotiable Guardrails (Zero-Regression Invariants)
1. **SafeStorage Immunity:** Never alter `window.SafeStorage`. Instagram In-App Browser (IAB) and iOS Safari private window session safety must remain 100% crash-proof.
2. **Synchronized Cart & PDP Steppers:** In-place quantity steppers (`[ − ] [ X In Cart ] [ + ]`), PDP modal `VIEW CART`, and catalog card mirroring must remain functionally identical.
3. **Checkout Financial Rules:**
   - Flat nationwide courier delivery: Rs. 300
   - Tarot Free Delivery waiver: Rs. 0
   - Mandatory Rs. 700 advance deposit verification screenshot requirement
   - Itemized receipts sent directly to WhatsApp
4. **Zero-Click Live Admin Orders:** The Triple-Shield (BroadcastChannel, auto-reconnecting WebSocket CDC, visibility/focus heartbeat) must remain untouched.
5. **Visual Luxury Preservation:** The obsidian-crimson-gold dark aesthetic and 1:1 square card aspect ratios must remain visually flawless.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Render-Blocking Font & Critical CSS Decoupling (FCP: 3.8s -> <1.1s)                     │
│ Eliminate blocking Google Fonts stylesheet; async-load non-critical font weights with swap;       │
│ inline critical above-the-fold CSS tokens to eliminate initial stylesheet network round-trip.    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 6: Hero Media Modernization & Single-LCP Prioritization (LCP: 7.2s -> <2.3s)                │
│ Compress monolithic desktop/mobile backgrounds into modern WebP (<100KB); enforce single LCP     │
│ fetchpriority="high" on mobile hero backdrop; eliminate competing preloads.                     │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 7: Dynamic Catalog Lazy-Loading & Native Image Decoupling                                  │
│ Guarantee loading="lazy" decoding="async" with native browser-level IntersectionObserver;        │
│ build automated client-side WebP compressor into admin.html for future inventory uploads.        │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 8: Main-Thread Script Scheduling & TBT Elimination (TBT: 820ms -> <150ms)                  │
│ Defer non-critical analytics, search tokenizer, and Supabase CDC subscription to requestIdle;   │
│ execute SafeStorage and cart restoration in zero-cost microtasks.                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 9: Vercel Edge Compression, Cache Tuning & Synthetic Benchmark Verification               │
│ Configure Brotli/Gzip and immutable asset caching in vercel.json; run simulated Lighthouse       │
│ throttled mobile runner; perform full end-to-end regression audit across mobile viewport.        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🚀 PHASE 5: Render-Blocking Font & Critical CSS Decoupling

**Root Cause:**
In `<head>`, line 52 requests 4 distinct Google font families (`Antonio`, `Inter`, `Fira Code`, `League Spartan`) across 16 different weight variants via a render-blocking stylesheet. The browser halts painting entirely while resolving this external CSS. Additionally, `style.css` is a 240KB unminified file parsed synchronously before the First Contentful Paint.

**Guarded Tasks:**
1. **Font Weights Subsetting & Non-Blocking Asynchronous Loading:**
   - Retain only the critical active font weights: `Antonio:wght@700`, `Inter:wght@400;600;700`.
   - Convert the blocking `<link rel="stylesheet">` into an asynchronous non-blocking stylesheet with fallback:
     ```html
     <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Antonio:wght@700&family=Inter:wght@400;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
     <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Antonio:wght@700&family=Inter:wght@400;600;700&display=swap"></noscript>
     ```
   - Ensure `display=swap` is present on all font families to avoid any Flash of Invisible Text (FOIT).
2. **Above-the-Fold Critical CSS Inlining:**
   - Extract the core structural tokens, header layout, background colors, and hero container rules into a small, inline `<style id="critical-hero-css">` in `<head>` (~4KB).
   - This allows mobile devices to render the dark luxury canvas immediately on the first TCP packet before `style.css` has even finished downloading.

---

### 🚀 PHASE 6: Hero Media Modernization & Single-LCP Prioritization

**Root Cause:**
On mobile devices, the Largest Contentful Paint (LCP) element is the hero backdrop (`website_bg_mobile.jpg`, 119KB) and desktop hero elements (`hero_gothic_bg.png`, 195KB; `website_bg.png`, 212KB; `gothic_card_back.jpg`, 282KB). The `<head>` currently preloads 4 different images simultaneously, forcing high-resolution images to compete for mobile bandwidth over 4G networks.

**Guarded Tasks:**
1. **Convert Core Hero Assets to WebP:**
   - Convert `website_bg_mobile.jpg` -> `website_bg_mobile.webp` (target size: ~28KB, 76% reduction).
   - Convert `hero_gothic_bg.png` -> `hero_gothic_bg.webp` (target size: ~45KB, 77% reduction).
   - Convert `gothic_cathedral_bg.jpg` -> `gothic_cathedral_bg.webp` (target size: ~38KB).
   - Convert `subject_silhouette.png` -> `subject_silhouette.webp` (target size: ~25KB).
   - Convert `gothic_card_back.jpg` -> `gothic_card_back.webp` (target size: ~55KB).
2. **Single-LCP Preload Rule:**
   - On mobile (`max-width: 768px`), strictly preload **one single asset** with `fetchpriority="high"`: `assets/website_bg_mobile.webp`.
   - On desktop (`min-width: 769px`), preload strictly `assets/hero_gothic_bg.webp`.
   - Remove all secondary preloads (`subject_silhouette.png`, secondary backdrops) from `<head>`. Let secondary elements stream progressively after the LCP image renders.

---

### 🚀 PHASE 7: Dynamic Catalog Lazy-Loading & Native Image Decoupling

**Root Cause:**
While the catalog cards have `loading="lazy"` on their `<img>` tags, initial catalog rendering still downloads all product card images immediately if cards are rendered too early or if image dimensions cause layout reassessment.

**Guarded Tasks:**
1. **Catalog Off-Screen Lazy Decoupling:**
   - Ensure only the first 4 product cards (above the mobile scroll fold) load with normal priority.
   - All remaining cards (5 through 14+) use `loading="lazy" decoding="async" fetchpriority="low"`.
   - Retain strict `aspect-ratio: 1 / 1` and dark obsidian placeholder color (`background: #12090d;`) so zero layout shifts occur while images stream into view.
2. **Admin Media Uploader Auto-WebP Compression:**
   - In `admin.html`, update the file upload handler before Supabase storage dispatch:
     * Draw image onto an HTML5 Canvas capped at 800x800 resolution (maintaining aspect ratio).
     * Export blob via `canvas.toBlob(blob, 'image/webp', 0.82)`.
     * This guarantees that future product images uploaded by the merchant are under 80KB instead of raw 3MB smartphone photos.

---

### 🚀 PHASE 8: Main-Thread Script Scheduling & TBT Elimination

**Root Cause:**
Multiple JavaScript operations execute synchronously during DOM load:
- `supabase-engine.js` starts Supabase client, connects to WebSocket CDC channel, and requests cached collections.
- `search-engine.js` builds search index tokens.
- Ticker animations and reviews carousel initialize timers.
This blocks the main thread for over 800ms, delaying user touches and scrolling on mobile devices.

**Guarded Tasks:**
1. **Prioritized Execution Ladder:**
   - **Tier 1 (Instant / 0ms):** `SafeStorage` init, basic hero paint, cart count badge from localStorage.
   - **Tier 2 (Post-LCP / ~100ms):** Render catalog grid cards from SWR cache (`gn_swr_products`).
   - **Tier 3 (Idle / `requestIdleCallback`):** Initialize `search-engine.js` indexing, establish Supabase Realtime WebSocket subscription, start reviews carousel, and load social proof widgets.
2. **Eliminate Redundant Polling on Storefront:**
   - Ensure background intervals run only when tab is visible (`document.visibilityState === 'visible'`).

---

### 🚀 PHASE 9: Vercel Edge Compression, Cache Tuning & Synthetic Verification

**Guarded Tasks:**
1. **Vercel Edge Asset Configuration (`vercel.json`):**
   - Enforce Brotli/Gzip compression headers.
   - Cache static WebP images and WOFF2 fonts with `public, max-age=31536000, immutable`.
   - Serve HTML with `public, max-age=0, must-revalidate` to ensure customer devices always fetch fresh inventory.
2. **Automated Synthetics & Verification Suite:**
   - Run mobile emulation test suite.
   - Verify cart steppers, flat Rs. 300 delivery, deposit screenshots, and zero-click admin live orders continue to function with 100% reliability.
   - Confirm Google Lighthouse mobile score is 90+ and LCP is under 2.5s.
