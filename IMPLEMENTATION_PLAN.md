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
