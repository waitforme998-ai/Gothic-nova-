# Gothic Nova — Complete Feature Specification

> **Documentation Suite Navigation:**
> - 📘 **System Architecture (The HOW & WHAT):** [ARCHITECTURE.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/ARCHITECTURE.md) (System topology, component directory, data flow pipelines, and layout specifications)
> - 📜 **Functional Feature Specification (The CAPABILITIES):** [FEATURES.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/FEATURES.md) (This file — Complete catalog of all 10 user-facing & admin subsystems)
> - 📗 **Anti-Hallucination Data Dictionary (The CONTRACT):** [SCHEMA_AND_CONVENTIONS.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/SCHEMA_AND_CONVENTIONS.md) (Product/Order property contracts, dual-property access rules, and SafeStorage keys)
> - 📕 **Historical Decisions & Invariants (The WHY):** [DECISIONS.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/DECISIONS.md) (ADR-001 through ADR-028: Problem statements, failure modes, trade-offs, and invariant rules)
> - 📙 **Agency Replication Playbook (The REUSE):** [REUSABLE_STORE_BLUEPRINT.md](file:///c:/Users/tasaw/Desktop/gothic-nova-store/structure/REUSABLE_STORE_BLUEPRINT.md) (Deploying this engine for any new client in 24 hours)

---

## 1. Storefront Visuals & Atmospheric Brand Identity

* **Custom Antonio Typography:** Full character-set Antonio display font loaded across all brand headings, product cards, prices, and navigation labels with zero font flicker (FOUT).
* **Cinematic Static Wall Backdrop:** High-resolution gothic cathedral architecture backdrop fixed to the viewport canvas (`website_bg.webp`) with parallax crawling curtain topology.
* **Floating Subject Silhouette:** Transparent cutout sculpture (`subject_silhouette.png`) anchored above the herofold creating 3D depth against the cathedral backdrop.
* **Kinetic Marquee Banner:** Smooth infinite horizontal scrolling marquee broadcasting curated brand mantras ("LIMITED RUNS • HANDCRAFTED 316L STEEL • NATIONWIDE COD").
* **Subtle Sound Ambiance Toggle:** Low-profile ambient audio player in the navigation bar enabling shoppers to toggle immersive gothic atmospheric audio.

---

## 2. Catalog Discovery & Search Engine

* **Real-Time Client-Side Search:** Zero-latency instant search filtering products by title, category, metal material, and keywords with highlight counts and clear triggers.
* **Category Taxonomy Pills:** Filter bar dynamically rendered from active database categories (e.g. Rings, Chains, Chokers, Pendants) with active state indicators.
* **Dynamic Product Cards:** Grid cards featuring WebP product photography, Antonio typography, real-time stock badges (`IN STOCK`, `LOW STOCK`, `SOLD OUT`), and clear `VIEW OPTIONS` triggers.
* **Dual-Price Rendering:** Strike-through original pricing alongside highlighted sale pricing with automatic discount calculation.

---

## 3. Product Quick-View (PDP Modal)

* **Interactive Lightbox Experience:** Tap any product card to open a dark-glassmorphic quick-view modal without triggering a disruptive full-page URL reload.
* **Length-Gated Description Accordion (ADR-016):**
  * Descriptions $\le 20$ words render directly under the price row.
  * Descriptions $> 20$ words automatically collapse under a minimalist `DETAILS ▾` toggle button to ensure action CTAs remain above the mobile screen fold.
* **High-Resolution Photo Gallery:** Multi-image gallery supporting tap-to-expand image lightbox with pinch-to-zoom and full-screen view.
* **Quantity Steppers:** Native touch-optimized `+` and `−` stepper controls with real-time stock clamping preventing overselling.

---

## 4. Sliding Cart Drawer Engine

* **Anchored Flexbox Topology:** Header and checkout footer remain rigidly anchored to the viewport edges while the internal item list smoothly scrolls, even on compact 360px mobile viewports.
* **Real-Time Inventory Synchronization:** Adding items dynamically inspects current stock levels and alerts shoppers when maximum inventory has been reached.
* **Persistent Session Storage:** Uses `SafeStorage` to preserve cart contents across tab reloads, background app switches, and Instagram In-App Browser sessions.
* **Item Management:** In-drawer quantity modifications and 1-tap item removals with instant order subtotal recalculation.

---

## 5. Mystery Tarot Card Rewards Gamification

* **Pre-Checkout Gamification:** Customers can draw an interactive mystery Tarot Card before placing an order to reveal exclusive store rewards.
* **Dynamic Reward Engine:**
  * Free Shipping (`TAROT: FREE DELIVERY`)
  * Order Upgrade (`TAROT: FREE GIFT`)
  * Percentage / Value Discounts (`TAROT: 10% OFF`)
* **Metadata Binding:** The unlocked reward code and description are permanently attached to the order record in PostgreSQL for fulfillment tracking.

---

## 6. Checkout & Delivery Address Intake

* **Streamlined 2-Step Flow:** Single-page modal checkout breaking down delivery address entry and payment verification into low-friction micro-steps.
* **Pakistani Geography Intake:** Fields for Customer Name, 11-digit Phone Number, House/Flat No, Street Address, City selection across all Pakistan provinces, and Nearest Landmark.
* **Dual Delivery Rate Calculation:** Standard nationwide shipping (Rs. 300) automatically overridden to Rs. 0 when Free Delivery tarot reward is active.

---

## 7. Advance Verification & Payment Proof Pipeline

* **Rs. 700 Verification Deposit Calculator:** Cash on Delivery orders calculate an initial Rs. 700 advance verification deposit (Rs. 400 processing + Rs. 300 courier fee) with remaining balance due at doorstep.
* **Live Bank & Wallet Accounts:** Direct payment instructions for:
  * **Bank Makramah Limited (BML):** Account title with 1-tap IBAN copy button.
  * **JazzCash Mobile Wallet:** Account title with 1-tap account number copy button.
* **Client-Side Image Compression:** Payment receipt screenshots uploaded by customers are automatically downscaled via HTML5 Canvas (max 1200px, 82% JPEG quality) keeping uploads under 150 KB for instant mobile transmission.
* **Cloud Media Storage:** Slips are securely uploaded to Supabase storage bucket `payment_slips` and linked directly to the order row.

---

## 8. Customer Social Proof & Reviews System

* **Verified Reviews Carousel:** Displays real customer feedback, star ratings (1–5 stars), and uploaded customer photo artifacts.
* **On-Site Review Intake:** Shoppers can submit written feedback and attach photos directly from their phone camera.
* **Admin Moderation & Inline Edit:** Store owners can approve, edit, re-star, or delete customer reviews directly in the Admin Panel without touching SQL tables.

---

## 9. Admin Operations & Management Console (`admin.html`)

* **0ms SWR Startup Hydration:** Orders and catalog data hydrate instantaneously from local ring-buffers on initial page paint before network requests fire.
* **Decoupled Orders Fast-Path (<200ms):** Orders revalidation runs independently from catalog products, eliminating historical startup blocking.
* **Native Web Push & Audio Chimes (PWA Style):**
  * Real-time order arrivals trigger an OS-level desktop/mobile notification with the store logo.
  * Synthesized in-memory dual-tone metallic audio chime (880Hz $\rightarrow$ 1320Hz) via native Web Audio API (0 KB audio file download).
* **Deep-Link Order Routing (`?order=ID`):** Clicking a notification or direct URL targets the exact order row in sub-100ms, force-opens the orders section, and applies a 3-second focus highlight.
* **Payment Slip Lightbox:** 1-tap view of uploaded customer transfer screenshots with an "Open Full Size ↗" inspector.
* **1-Tap Customer WhatsApp Contact:** Each order card features a direct WhatsApp button opening a pre-formatted greeting message addressed to the customer's phone number.
* **Catalog & Category Manager:** Single and bulk product creation, photo uploads to Supabase storage, stock adjustments, low-stock threshold triggers, and category taxonomy editing.
* **Live Revenue & Valuation Metrics:** Real-time dashboards calculating total retail inventory valuation, delivered revenue, and active catalog size.

---

## 10. SEO, Resilience & Infrastructure Architecture

* **Dynamic XML Sitemap (`/sitemap.xml`):** Serverless dynamic route generating a 43+ URL XML sitemap matching live database inventory, rewritten to `/api/sitemap` to prevent Vercel `cleanUrls` 308 redirect collisions.
* **Googlebot-Favicon Compliant Suite:** Dedicated 48×48, 96×96, 192×192, and 180×180 PNG icons paired with root `/favicon.ico` ensuring Google Search SERP snippets display the brand emblem rather than a generic globe icon.
* **Schema.org Rich Product Metadata:** Dynamic JSON-LD structured data generated on every product view containing item name, price, availability, and Pakistani e-commerce fallback copy.
* **Instagram In-App Browser Sandbox Immunity (`SafeStorage`):** Fail-safe storage layer that intercepts `localStorage` quota exceptions in restricted mobile webviews (Instagram, TikTok, Safari Private) and transparently falls back to an in-memory ring-buffer.
* **Disaster Recovery Backup Engine:** Standalone CLI tool (`scripts/backup-store.js`) that captures clean, lightweight JSON backups of live database configurations to `docs/backups/latest_clean_store_backup.json`.
