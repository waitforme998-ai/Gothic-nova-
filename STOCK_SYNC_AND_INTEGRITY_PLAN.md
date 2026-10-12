# Plan: High-Integrity Stock Synchronization & Zero-Fake-Success Architecture

## 1. Objectives & User Directives
1. **Dynamic Stock Ceiling:** Storefront quantity selector (modal, cart, checkout) must be capped strictly by the actual available product stock (`product.stock`).
2. **Configurable Default Stock:** Eliminate all hardcoded `10` stock defaults; make default stock an editable setting.
3. **Zero Fake Success States:** Never use unverified optimistic UI. When stock, products, categories, announcements, or reviews are created, edited, or deleted, the UI must wait for the authoritative Supabase response before updating state and showing success. If the write fails, show the exact error and do not mutate UI state.
4. **Instant Multi-Device Realtime Sync:** Confirmed stock updates must broadcast across all devices (via `BroadcastChannel` and Supabase PostgreSQL changes).
5. **Preserve Complete Stability:** Do not break category add/delete, product add/delete/edit, announcement add/delete/edit, or review add/delete/edit.

---

## 2. Root Cause Analysis

| Component | Current Defect | Impact |
| :--- | :--- | :--- |
| **Storefront Quantity** | Cart & modal quantity selectors rely on fallback ceilings or don't clamp when stock decreases. | Customer can order more items than exist in inventory. |
| **Hardcoded Default Stock** | Code across `admin.html` and `supabase-engine.js` has hardcoded `stock: 10` in multiple places. | Forces arbitrary 10 stock on new items instead of merchant preference. |
| **Admin Stock Buttons** | `adjustCatalogStock` optimistically changes in-memory stock, calls `renderDashboard()`, and fires background `saveProduct` without awaiting. | Fake success: UI shows new stock even if the network or Supabase rejects the write. |
| **Cart Auto-Clamp** | When stock drops below customer's cart quantity in realtime, the cart does not clamp down. | Customer checkout fails or causes negative stock. |

---

## 3. Implementation Steps

### Phase 1: Engine Layer (`supabase-engine.js`)
1. **Atomic Stock Updater (`updateProductStock(id, newStock)`):**
   - Directly mutates the product within the section row and commits to Supabase `gn_orders`.
   - Awaits database write confirmation.
   - Returns `{ ok: true, product }` on success, or throws explicit error on failure.
2. **Default Stock Setting Configuration:**
   - Store configurable default stock (default 1) in settings section.
   - Replace all hardcoded `10` fallbacks with dynamic store default.

### Phase 2: Admin Panel (`admin.html`)
1. **Awaited Stock Controls (`+` / `-` / Restock):**
   - When merchant clicks `+` or `-` on a product card:
     - Disable button and show mini spinner.
     - Await `SupabaseEngine.updateProductStock(...)`.
     - On success: update in-memory products, re-render DOM, toast confirmation.
     - On failure: show error toast, do NOT update UI.
2. **Awaited Product / Category / Announcement / Review CRUD:**
   - Every modal save and deletion awaits the database write.
   - If rejected, button resets and error toast is displayed. Zero fake success.
3. **Editable Default Stock Control:**
   - Add default stock setting in admin catalog toolbar.

### Phase 3: Storefront (`index.html`)
1. **Strict Dynamic Stock Limiter:**
   - Modal quantity plus button disabled when `qty >= product.stock`.
   - Cart quantity increment disabled when `cartItem.qty >= product.stock`.
   - Sold out badge and disabled Add to Cart when `stock <= 0`.
2. **Realtime Cart Stock Clamping:**
   - On `gn:productsUpdated` / `productsUpdated`, check all items in `window.gn_cart`.
   - If `cart[pid].qty > updatedStock`, clamp `cart[pid].qty = updatedStock` and show notice.

### Phase 4: Verification & Automated Testing
1. Automated headless test of stock increment/decrement awaiting Supabase.
2. Simulated database failure test ensuring zero fake success.
3. Storefront clamp test with stock set to 2 and cart attempting 3.
4. Production build deployment and live Vercel CDP verification.
