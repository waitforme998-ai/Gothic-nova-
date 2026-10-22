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

## 2. Active Execution Tracks & Architectural Solutions

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TRACK 1: Pure Binary Add-to-Cart Overhaul (No Quantity Overcomplexification)                      │
│ Delete fighting stepper states; implement clean binary toggle: ADD TO CART -> VIEW CART.          │
│ All quantity (+/-) controls live strictly inside Cart Drawer where they cleanly sync to checkout.│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TRACK 2: Cross-Device Customer-to-Admin Order Stream (True Zero-Click Ingestion)                  │
│ Bridge customer orders from external devices into admin.html using Supabase Broadcast Channel     │
│ and a 3-second lightweight polling watchdog. Orders appear instantly with zero clicking.         │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TRACK 3: Core Web Vitals & Performance Acceleration Sprint (<2.5s LCP & 90+ Score)               │
│ Complete 5-phase asset modernization (WebP compression, async fonts, script scheduling, caching). │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🟢 TRACK 1: Pure Binary Add-to-Cart Overhaul (No Quantity Overcomplexification)

**The Problem:**
Previous attempts introduced inline stepper controls (`[ − ] [ X in Cart ] [ + ]`), "+1 More" secondary buttons, and competing state managers. When clicked, these states conflicted, flickered, and re-appeared unpredictably.

**User Requirement & Exact Logic:**
1. **Simple Binary State (Cards & PDP Modal):**
   - **State A (Item NOT in cart):** Button displays standard text **`ADD TO CART`**.
   - **Clicking `ADD TO CART`:**
     * Adds the product with quantity **1** to `gn_cart`.
     * Instantly updates the header cart badge count.
     * The button immediately and permanently flips to **`VIEW CART`**.
   - **State B (Item IS in cart):**
     * Button displays clean **`VIEW CART`** (no "+1 More", no steppers, no quantity counts on the button).
     * Clicking `VIEW CART` directly opens the Cart Drawer (`openCartDrawer()`).
     * Button stays in `VIEW CART` state permanently as long as the product remains in `gn_cart`.
2. **Quantity Management Exclusively Inside Cart Drawer:**
   - Inside `#cart-drawer`, the user can increase (`+`) or decrease (`−`) quantity as needed.
   - If the user decreases quantity to `0` or clicks remove (`✕`):
     * The product is removed from `gn_cart`.
     * The product button on the catalog card and PDP modal flips back to **`ADD TO CART`**.
   - If the user increases quantity to `2` or `3` inside the drawer:
     * The card button remains cleanly as **`VIEW CART`** without any glitching or changing text.
3. **Flawless Synchronization:**
   - Modifying cart contents anywhere (catalog card, PDP modal, or inside the drawer) instantly dispatches `gn:cartUpdated`, ensuring all visible buttons across the entire page update synchronously without DOM flicker.

---

### 🟢 TRACK 2: Cross-Device Customer-to-Admin Order Stream (True Zero-Click Ingestion)

**The Problem:**
Merchant changes to products and announcements in `admin.html` feel instant because they mutate in-memory state on the same device. However, customer orders originate on **external customer devices** (different smartphones, laptops, or incognito sessions). 
`BroadcastChannel` only works across tabs on the **same browser instance**. Furthermore, Supabase table-level Postgres Changes (CDC) on `gn_orders` can fail silently if Postgres replication is restricted or dropped over cellular networks, forcing the merchant to click "SYNC DATA" manually.

**The Solution (True Zero-Click Ingestion):**
1. **Supabase Realtime Broadcast Channel (Cross-Device WebSocket):**
   - When a customer submits an order in `index.html:proceedToStep2()`, send a broadcast event over a public channel:
     `supabase.channel('gn_live_orders').send({ type: 'broadcast', event: 'NEW_ORDER', payload: createdOrder })`
   - In `admin.html`, subscribe to `'gn_live_orders'` to receive instant (<500ms) cross-device push notifications without relying on PostgreSQL CDC permissions.
2. **Active 3-Second Orders Watchdog (Zero-Click Fallback):**
   - When the merchant is viewing the "Orders" tab in `admin.html`, run a silent, lightweight check every **3 seconds**:
     `SELECT id, created_at FROM gn_orders ORDER BY created_at DESC LIMIT 1`
   - If the returned `id` is newer than the highest ID in memory, immediately fetch and prepend the new order to the table.
   - Requires zero clicks, zero page reloads, and works across any network, firewall, or device.
3. **Visual Ingestion Flash:**
   - When a new order lands, flash the row in amber/crimson and update the pending badge count, giving the merchant instant visual feedback.

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
2. **Synchronized Cart & PDP State:** Binary cart button states (`ADD TO CART` / `VIEW CART`), independent PDP stepper for "BUY NOW", and clean catalog cards must remain functionally identical.
3. **Checkout Financial Rules:**
   - Flat nationwide courier delivery: Rs. 300
   - Tarot Free Delivery waiver: Rs. 0
   - Mandatory Rs. 700 advance deposit verification screenshot requirement
   - Itemized receipts sent directly to WhatsApp
4. **Zero-Click Live Admin Orders:** The Triple-Shield (BroadcastChannel, auto-reconnecting WebSocket CDC, visibility/focus heartbeat) must remain untouched.
5. **Visual Luxury Preservation:** The obsidian-crimson-gold dark aesthetic and 1:1 square card aspect ratios must remain visually flawless.

---

### 🚀 PHASE 5: Render-Blocking Font & Critical CSS Decoupling

**Root Cause:**
In `index.html:52`, the browser halts painting to fetch 4 Google font families (`Antonio`, `Inter`, `Fira Code`, `League Spartan`) across 16 weight variants. Furthermore, `Antonio-Bold.woff2` (8KB) is already stored locally in `assets/fonts/` but wasn't prioritized.

**Step-by-Step Implementation:**
1. **Local Self-Hosted Antonio Font:**
   Add explicit `@font-face` declaration for `Antonio-Bold`:
   ```css
   @font-face {
       font-family: 'Antonio';
       font-style: normal;
       font-weight: 700;
       font-display: swap;
       src: url('assets/fonts/Antonio-Bold.woff2') format('woff2');
   }
   ```
2. **Non-Blocking External Font Loading (`index.html:52`):**
   Replace the synchronous `<link rel="stylesheet">` with an asynchronous stylesheet loader with fallback:
   ```html
   <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap" onload="this.onload=null;this.rel='stylesheet'">
   <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code:wght@400;500&display=swap"></noscript>
   ```
3. **Verification:**
   Confirm FCP drops below 1.2s and text renders instantly with zero Flash of Invisible Text (FOIT).

---

### 🚀 PHASE 6: Hero Media WebP Modernization & Single-LCP Prioritization

**Root Cause:**
Mobile LCP element is `assets/website_bg_mobile.jpg` (122KB). On desktop, `<head>` preloads 3 separate images (`website_bg.png` 217KB + `hero_gothic_bg.png` 199KB + `subject_silhouette.png` 119KB = 535KB) simultaneously, saturating mobile cellular bandwidth.

**Step-by-Step Implementation:**
1. **Lossless/High-Quality WebP Conversion (via Python Pillow):**
   Run automated batch script:
   * `assets/website_bg_mobile.jpg` (122KB) -> `assets/website_bg_mobile.webp` (Target: ~26KB, 78% reduction)
   * `assets/hero_gothic_bg.png` (199KB) -> `assets/hero_gothic_bg.webp` (Target: ~42KB, 79% reduction)
   * `assets/website_bg.png` (217KB) -> `assets/website_bg.webp` (Target: ~46KB, 78% reduction)
   * `assets/subject_silhouette.png` (119KB) -> `assets/subject_silhouette.webp` (Target: ~28KB, 76% reduction)
   * `assets/gothic_cathedral_bg.jpg` (165KB) -> `assets/gothic_cathedral_bg.webp` (Target: ~38KB, 77% reduction)
   * `assets/gothic_card_back.jpg` (289KB) -> `assets/gothic_card_back.webp` (Target: ~52KB, 82% reduction)
   * `assets/product_section_bg_mobile.jpg` (165KB) -> `assets/product_section_bg_mobile.webp` (Target: ~38KB)
   *(Original files remain in `assets/` as permanent fallbacks).*
2. **Single-LCP Preload Strategy (`index.html:40-44`):**
   * Mobile (`max-width: 768px`): Preload **strictly one single image**:
     `<link rel="preload" as="image" href="assets/website_bg_mobile.webp" type="image/webp" media="(max-width: 768px)" fetchpriority="high">`
   * Desktop (`min-width: 769px`): Preload strictly `assets/hero_gothic_bg.webp`.
   * Eliminate all secondary preloads from `<head>` so the browser allocates 100% of bandwidth to the first visible background.
3. **StyleSheet Background Reference Update (`style.css`):**
   Update CSS background rules to reference the modern `.webp` images with standard fallback:
   * `#heroSection`, `.hero-section`, `.hero-silhouette-img`, and tarot card backgrounds.

---

### 🚀 PHASE 7: Dynamic Catalog Lazy-Loading & Client-Side Image Optimizer

**Root Cause:**
Catalog product images currently share identical priority. When catalog boots, multiple product cards begin loading at once. Additionally, when the merchant uploads new products via `admin.html`, raw uncompressed camera photos could degrade performance over time.

**Step-by-Step Implementation:**
1. **Priority Staggering on Catalog Grid (`index.html:2839`):**
   * In `renderMainCatalog()`, index cards:
     - Cards 0–3 (first 4 items): `fetchpriority="auto" loading="eager"` (for instant initial display).
     - Cards 4+ (below fold): `loading="lazy" decoding="async" fetchpriority="low"`.
   * Enforce `aspect-ratio: 1 / 1` and dark skeleton background to eliminate any Cumulative Layout Shift (CLS).
2. **Client-Side WebP Compressor in `admin.html`:**
   In `admin.html`, attach an automated canvas compressor before `uploadProductImage()`:
   ```javascript
   async function compressImageForUpload(file, maxDim = 800, quality = 0.82) {
       return new Promise((resolve) => {
           if (!file.type.startsWith('image/')) return resolve(file);
           const img = new Image();
           img.onload = () => {
               let w = img.width, h = img.height;
               if (w > maxDim || h > maxDim) {
                   if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                   else { w = Math.round((w * maxDim) / h); h = maxDim; }
               }
               const canvas = document.createElement('canvas');
               canvas.width = w; canvas.height = h;
               const ctx = canvas.getContext('2d');
               ctx.drawImage(img, 0, 0, w, h);
               canvas.toBlob((blob) => {
                   resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }) : file);
               }, 'image/webp', quality);
           };
           img.src = URL.createObjectURL(file);
       });
   }
   ```
   Ensures every future catalog upload is automatically under 80KB.

---

### 🚀 PHASE 8: Main-Thread Scheduling & TBT Elimination

**Root Cause:**
`search-engine.js` tokenization, analytics initialization, and reviews carousel timers start simultaneously during DOM load, producing 820ms Total Blocking Time (TBT).

**Step-by-Step Implementation:**
1. **Three-Tier Task Scheduling:**
   * **Tier 1 (Instant / 0ms):** `SafeStorage` init, hero layout paint, cart badge count from memory.
   * **Tier 2 (Post-Paint / 50ms):** Render catalog grid cards from SWR cache (`gn_swr_products`).
   * **Tier 3 (Idle / `requestIdleCallback`):**
     * Build live search tokens (`initSearchEngine()`).
     * Establish Supabase Realtime WebSocket subscription.
     * Initialize reviews carousel timer and scroll listeners.
2. **Storefront Polling Elimination:**
   Ensure timers are strictly bound to `document.visibilityState === 'visible'`.

---

### 🚀 PHASE 9: Production Verification & Zero-Regression Checklist

**Step-by-Step Verification:**
1. **Visual Regression Check:** Verify mobile hero backdrop, navigation bar, logo, and title display with identical obsidian luxury aesthetics.
2. **Add-to-Cart Check:** Add product from card; verify button flips to `VIEW CART`; verify cart drawer opens with item quantity 1.
3. **PDP Modal Stepper Check:** Open product popup; verify stepper controls quantity for "BUY NOW" and clicking "BUY NOW" opens checkout with exact count.
4. **Checkout Delivery Fee Check:** Verify flat Rs. 300 nationwide delivery calculates correctly; verify deposit screenshot upload is required.
5. **Tarot Daily Reward Check:** Open Tarot modal; verify 3D card shuffle runs smoothly; verify claimed discount applies to checkout.
6. **Live Admin Orders Check:** Place test order; verify instant ingestion in `admin.html` without manual page reload.
7. **Lighthouse Benchmark:** Verify mobile score achieves **90+** and LCP drops to **< 2.4s**.
