# Gothic Nova Tarot Card Redesign Implementation Plan

> **For Claude / Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Gothic Nova Daily Tarot Card ritual from an unbound full-screen display into an enclosed, luxury e-commerce modal card with subtle background blur, strictly bounded 5-second shuffling animations with zero container overflow, synchronized 3-stage shopping reward copy, and full preservation of the 48-hour cooldown / 24-hour expiration discount engine.

**Architecture:** 
- **Backdrop & Container:** Convert `.daily-tarot-overlay` to a lightweight dark backdrop (`backdrop-filter: blur(3.5px)`, `background: rgba(0,0,0,0.75)`) so the underlying Gothic Nova storefront remains crisp and recognizable. Enclose all tarot UI into `.tarot-stage-container` styled as a centered luxury modal card (`max-width: 840px`, gold/crimson border, subtle box-shadow, internal scroll if needed).
- **Animation Boundary:** Enforce strict containment on `.tarot-cards-stage` (`overflow: hidden`, fixed aspect-ratio cards) and rewrite all 5 shuffle keyframes to clamp translations within `±32px X` and `±12px Y` so cards never breach the modal borders.
- **Copy & State Flow:** Coordinate 3 distinct stages (Stage 1: Preview & Shuffle Callout -> Stage 2: 5s Shuffle & Card Selection -> Stage 3: Revealed Reward & Claim) with unified e-commerce shopping reward terminology.

**Tech Stack:** Vanilla JavaScript (ES6+), CSS3 (Modern Flexbox/Grid, 3D CSS Transforms, Keyframes, Custom Properties), HTML5, Canvas 2D Particle Engine.

---

## What You SHOULD Do vs What You SHOULD NOT Do

### ✅ What You SHOULD Do (Core Requirements)
1. **Enclose Everything in a Modal Box:** Wrap all tarot elements (header, cards stage, shuffle button, claim container) inside a beautifully proportioned luxury modal card (`max-width: 840px`, `width: min(840px, 94vw)`), with rounded corners (`12px`), 1px gold/crimson border, and subtle dark obsidian-crimson gradient background.
2. **Subtle Background Blur (Conserve Storefront Readability):** Set the overlay backdrop filter to `blur(3.5px)` with `rgba(0, 0, 0, 0.75)` background so the customer clearly sees they are on the Gothic Nova website.
3. **Strict Bounded Shuffling (0% Container Overflow):** Clamp all shuffle keyframes (Translations limited to `±28px` to `±32px` on X and `±10px` to `±14px` on Y) and set `overflow: hidden` on the card stage container so cards NEVER escape the modal borders on any device.
4. **Exact 5.0s Shuffle Duration:** Ensure the active shuffle loop in `triggerMajesticShuffle()` runs for precisely 5.0 seconds (10 passes × 460ms + 200ms initial flip + 200ms final resolution).
5. **Synchronize 3-Stage E-Commerce Copy:**
   - **Stage 1 (Initial Preview):** Eyebrow `✦ DAILY SHOPPING REWARD ✦`, Title `UNLOCK YOUR SHOPPING BENEFIT`, Subtitle `— ✦ Preview rewards below • Click shuffle to draw today's offer ✦ —`, Button `✦ SHUFFLE CARDS (5s)`.
   - **Stage 2 (Shuffling & Pick):** While shuffling: Title `SHUFFLING REWARDS...`. When done: Title `CHOOSE YOUR CARD`, Subtitle `— ✦ Pick 1 card to reveal your shopping benefit for the next 24 hours ✦ —`.
   - **Stage 3 (Claimed / Revealed):** Title `YOUR REWARD IS READY`, Subtitle `— ✦ Offer active for 24 hours • Shuffle cooldown 48 hours ✦ —`, Button `CLAIM & ENTER STORE →`.
6. **Keep Free Gift Generic:** Keep the free gift copy generic (`✦ Free Gift Included (In Parcel)`) without disclosing or promising any specific product name or SKU.
7. **Preserve Cooldowns & Checkout Sync:** Maintain the 48-hour cooldown (`gn_tarot_ritual_v14`), 24-hour expiration countdown timer on `#floatingRewardPill`, and automatic cart/checkout discount application.

---

### ❌ What You SHOULD NOT Do (Strict Prohibitions)
1. ❌ **DO NOT** use heavy backdrop blurs (`blur(24px)` or `blur(32px)`) or opaque black backgrounds that hide the storefront.
2. ❌ **DO NOT** let card animations translate, scale, or fly outside the `.tarot-stage-container` or `.tarot-cards-stage` box boundaries.
3. ❌ **DO NOT** disclose specific gift item names (e.g., "Silver Obsidian Ring", "Skull Pendant") in the reward card, toast, receipt, or cart.
4. ❌ **DO NOT** alter or break the 48-hour cooldown or 24-hour countdown timer logic in localStorage.
5. ❌ **DO NOT** re-introduce duplicate buttons (like `PRINT RECEIPT` or duplicate `COPY PRODUCT ID` buttons) in the order confirmation screen.
6. ❌ **DO NOT** introduce external CSS/JS dependencies (keep vanilla HTML/CSS/JS).

---

## Detailed Task Breakdown

### Task 1: Modal Box Enclosure & Low Blur Backdrop in `style.css`

**Files:**
- Modify: `style.css:6300-6470`

**Step 1: Update `.daily-tarot-overlay` and `.tarot-stage-container` in `style.css`**
- Change `.daily-tarot-overlay` to:
  ```css
  .daily-tarot-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(3.5px);
      -webkit-backdrop-filter: blur(3.5px);
      display: none;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      padding: 16px;
      box-sizing: border-box;
      transition: opacity 0.3s ease;
  }
  .daily-tarot-overlay.card-focused {
      backdrop-filter: blur(3.5px);
      -webkit-backdrop-filter: blur(3.5px);
  }
  ```
- Change `.tarot-stage-container` to:
  ```css
  .tarot-stage-container {
      position: relative;
      z-index: 5;
      width: min(840px, 94vw);
      max-height: calc(100vh - 36px);
      max-height: calc(100dvh - 36px);
      background: radial-gradient(ellipse at 50% 10%, rgba(26, 10, 18, 0.98) 0%, rgba(10, 4, 8, 0.99) 70%, #030103 100%);
      border: 1px solid rgba(212, 175, 55, 0.38);
      border-radius: 12px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(139, 0, 0, 0.3), inset 0 0 1px 1px rgba(212, 175, 55, 0.15);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      margin: auto;
      padding: 24px 20px;
      box-sizing: border-box;
      overflow-y: auto;
      overflow-x: hidden;
  }
  ```

**Step 2: Adjust Title Typography for Box Proportions**
- Adjust `.tarot-title` font size:
  ```css
  .tarot-title {
      font-family: var(--font-heading, 'Antonio', sans-serif);
      font-size: clamp(2.2rem, 5.2vw, 3.4rem);
      font-weight: 900;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      margin: 0;
      line-height: 1.1;
  }
  ```

---

### Task 2: Strict Bounded Shuffling & 0% Container Overflow in `style.css`

**Files:**
- Modify: `style.css:6520-7050` (Desktop & Base) and `style.css:7260-7600` (Mobile Media Queries)

**Step 1: Enforce Container Containment on `.tarot-cards-stage`**
```css
.tarot-cards-stage {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    width: 100%;
    max-width: 780px;
    perspective: 1200px;
    margin: 4px 0 8px 0;
    position: relative;
    min-height: 280px;
    align-items: center;
    justify-items: center;
    box-sizing: border-box;
    overflow: hidden; /* Strict Zero-Overflow */
    border-radius: 8px;
    padding: 8px 4px;
}
.tarot-card-wrapper {
    position: relative;
    width: 100%;
    max-width: 175px;
    height: 265px;
    cursor: default;
    perspective: 1000px;
    transform-style: preserve-3d;
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease, filter 0.3s ease;
    border-radius: 10px;
}
```

**Step 2: Clamp All 5 Desktop and Mobile Shuffle Pattern Keyframes**
- Clamp all translation values so cards never exceed `±32px` along the X-axis and `±12px` along the Y-axis:
```css
/* Example Clamped Pattern 1 */
@keyframes desktopLoopShuffle1 {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(28px, -10px, 0) scale(1.02); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes desktopLoopShuffle2 {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(-28px, 10px, 0) scale(0.98); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes desktopLoopShuffle3 {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(24px, 8px, 0) scale(1.02); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes desktopLoopShuffle4 {
    0%   { transform: translate3d(0, 0, 0) scale(1); }
    50%  { transform: translate3d(-24px, -8px, 0) scale(0.98); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
}
```
- Apply similar clamped limits to patterns 2, 3, 4, 5 and mobile keyframes (`@media (max-width: 680px)`).

---

### Task 3: Synchronize 3-Stage Copy & 5-Second Shuffle in `index.html`

**Files:**
- Modify: `index.html:4200-4365` (HTML Structure)
- Modify: `index.html:4380-5380` (JavaScript Controller)

**Step 1: Update Initial HTML Markup in `index.html`**
- Set initial HTML header and button text:
```html
<div class="tarot-header" style="text-align: center;">
    <div class="tarot-eyebrow font-mono" style="color: #e5c158; text-transform: uppercase; font-weight: 800; letter-spacing: 0.2em;">✦ DAILY SHOPPING REWARD ✦</div>
    <h2 class="tarot-title" id="tarotStageTitle">UNLOCK YOUR SHOPPING BENEFIT</h2>
    <div class="tarot-subtext font-mono" id="tarotStageSubtext">— ✦ Preview rewards below • Click shuffle to draw today's offer ✦ —</div>
</div>
```
- Set shuffle button:
```html
<button type="button" id="tarotShuffleBtn" class="tarot-shuffle-btn" onclick="triggerMajesticShuffle()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <polyline points="16 3 21 3 21 8"></polyline>
        <line x1="4" y1="20" x2="21" y2="3"></line>
        <polyline points="21 16 21 21 16 21"></polyline>
        <line x1="15" y1="15" x2="21" y2="21"></line>
        <line x1="4" y1="4" x2="9" y2="9"></line>
    </svg>
    <span>✦ SHUFFLE CARDS (5s)</span>
</button>
```

**Step 2: Update `initTarotRitual()`, `triggerMajesticShuffle()`, and `handleTarotCardSelect()` Dynamic Copy**
- In `initTarotRitual()`:
  - Fresh / Initial state: Title `UNLOCK YOUR SHOPPING BENEFIT`, Subtext `— ✦ Preview rewards below • Click shuffle to draw today's offer ✦ —`.
  - Ready to pick state: Title `CHOOSE YOUR CARD`, Subtext `— ✦ Pick 1 card to reveal your shopping benefit for the next 24 hours ✦ —`.
  - Revealed state: Title `YOUR REWARD IS READY`, Subtext `— ✦ Offer active for 24 hours • Shuffle cooldown 48 hours ✦ —`.
- In `triggerMajesticShuffle()`:
  - Start: Title `SHUFFLING REWARDS...`, Subtext `— ✦ Mixing destiny in progress ✦ —`.
  - Ensure total active duration = 5,000ms (10 passes × 460ms = 4600ms + 200ms flip + 200ms resolution).
  - End of shuffle: Title `CHOOSE YOUR CARD`, Subtext `— ✦ Pick 1 card to reveal your shopping benefit for the next 24 hours ✦ —`.
- In `handleTarotCardSelect()`:
  - Title `YOUR REWARD IS READY`, Subtext `— ✦ Offer active for 24 hours • Shuffle cooldown 48 hours ✦ —`.

---

### Task 4: Verification & Automated Testing

**Files:**
- Create/Run: `test_tarot_redesign.js`
- Run: `verify_all_pages.js`
- Run: `sync_verification.test.js`
- Run: `test_confirmation_buttons.js`

**Step 1: Write Verification Script `test_tarot_redesign.js`**
- Test that:
  1. `.daily-tarot-overlay` has `backdrop-filter: blur(3.5px)` and `rgba(0, 0, 0, 0.75)` in `style.css`.
  2. `.tarot-stage-container` has bounded modal card styling (`max-width: 840px`, border, border-radius).
  3. `.tarot-cards-stage` has `overflow: hidden;`.
  4. Shuffle keyframes do not exceed `32px` translations.
  5. Initial copy in `index.html` matches `UNLOCK YOUR SHOPPING BENEFIT` and `✦ DAILY SHOPPING REWARD ✦`.
  6. Shuffle duration in JS controller targets `5000ms`.
  7. Generic gift copy is preserved.

**Step 2: Run Verification Suites**
```bash
node test_tarot_redesign.js
node sync_verification.test.js
node test_confirmation_buttons.js
node verify_all_pages.js
```
Expected output: All test suites PASS with 100% green status.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-09-30-tarot-redesign.md`.
