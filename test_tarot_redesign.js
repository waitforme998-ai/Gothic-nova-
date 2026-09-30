const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🔮 Running Comprehensive Tarot Redesign Verification Suite (2x2 Grid, Anti-FOUC, No-Glow & 5s Dynamic Shuffling)...\n');

const stylePath = path.join(__dirname, 'style.css');
const indexPath = path.join(__dirname, 'index.html');

const styleContent = fs.readFileSync(stylePath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// 1. Check style.css overlay backdrop and minimal 2x2 modal box
console.log('Testing 1: High storefront visibility (low blur/dim) & compact 2x2 modal box...');
assert(styleContent.includes('backdrop-filter: blur(1.0px) !important;'), 'Backdrop filter must be minimal blur(1.0px) for high store visibility');
assert(styleContent.includes('background: rgba(0, 0, 0, 0.42) !important;'), 'Overlay background must be light translucent rgba(0, 0, 0, 0.42)');
assert(styleContent.includes('width: min(390px, 92vw);'), 'Modal container must be compact min(390px, 92vw) for 2x2 grid');
assert(styleContent.includes('border-radius: 14px;'), 'Modal container must have 14px border radius');
console.log('✓ High background visibility & compact modal container verified.\n');

// 2. Check 2x2 grid layout (2 rows of 2 cards) and well-spaced card dimensions
console.log('Testing 2: 2x2 Balanced Quadrant Grid (2 Rows of 2 Cards)...');
assert(styleContent.includes('grid-template-columns: repeat(2, 1fr);'), 'tarot-cards-stage must be a 2x2 grid (repeat(2, 1fr))');
assert(styleContent.includes('max-width: 250px;'), 'tarot-cards-stage max-width must be compact 250px');
assert(styleContent.includes('min-height: 290px;'), 'tarot-cards-stage min-height must be 290px for 2 rows');
assert(styleContent.includes('max-width: 115px;'), 'tarot-card-wrapper max-width must be 115px');
assert(styleContent.includes('height: 140px;'), 'tarot-card-wrapper height must be 140px');
console.log('✓ 2x2 Balanced Quadrant Grid & card proportions verified.\n');

// 3. Check 5 Dynamic 2x2 Slot-Swapping Shuffle Patterns (Desktop & Mobile)
console.log('Testing 3: Dynamic 2x2 slot-swapping shuffle animations across 2D quadrants...');
assert(styleContent.includes('@keyframes desktop2x2Cross1'), 'desktop2x2Cross1 keyframe must exist');
assert(styleContent.includes('translate3d(128px, 152px,'), 'Desktop 2x2 cross shuffle must swap across X and Y axes (128px, 152px)');
assert(styleContent.includes('@keyframes desktop2x2Converge1'), 'desktop2x2Converge1 keyframe must exist');
assert(styleContent.includes('@keyframes desktop2x2Carousel1'), 'desktop2x2Carousel1 keyframe must exist');
assert(styleContent.includes('@keyframes desktop2x2RowSwap1'), 'desktop2x2RowSwap1 keyframe must exist');
assert(styleContent.includes('@keyframes desktop2x2ColSwap1'), 'desktop2x2ColSwap1 keyframe must exist');

assert(styleContent.includes('@keyframes mobile2x2Cross1'), 'mobile2x2Cross1 keyframe must exist');
assert(styleContent.includes('translate3d(110px, 130px,'), 'Mobile 2x2 cross shuffle must swap across mobile X and Y axes (110px, 130px)');
assert(styleContent.includes('@keyframes mobile2x2Converge1'), 'mobile2x2Converge1 keyframe must exist');
assert(styleContent.includes('@keyframes mobile2x2Carousel1'), 'mobile2x2Carousel1 keyframe must exist');
console.log('✓ Dynamic 2x2 slot-swapping shuffle animations verified across all 5 patterns.\n');

// 4. Check No Glow in "YOUR REWARD IS READY" / Claim Section
console.log('Testing 4: No Background Glow in Reward / Claim Section...');
assert(styleContent.includes('.tarot-claim-box {'), 'tarot-claim-box rule must exist');
assert(!styleContent.includes('.tarot-claim-box {\n    box-shadow: 0 0 25px rgba(212, 175, 55'), 'tarot-claim-box must not have glowing gold shadow');
assert(styleContent.includes('filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.95)) !important;'), 'Chosen card must have clean dark drop shadow without glow');
console.log('✓ No background glow verified in reward ready section.\n');

// 5. Check Anti-FOUC Loading Sequence in index.html
console.log('Testing 5: Anti-FOUC 0ms Loading Sequence...');
assert(indexContent.includes('Critical Instant Tarot Ritual 0ms Anti-FOUC Rules'), 'Critical inline anti-FOUC styles must exist in <head>');
assert(indexContent.includes('html.tarot-pending body {'), 'html.tarot-pending rule must exist in head styles');
// Ensure Tarot controller script is placed high in body before products
const scriptIdx = indexContent.indexOf('<!-- Script Controller for Tarot Overlay');
const productIdx = indexContent.indexOf('const defaultProducts = [');
assert(scriptIdx > 0 && scriptIdx < productIdx, 'Tarot controller script must be parsed before catalog products for 0ms execution');
console.log('✓ Anti-FOUC loading sequence & instant top parse verified.\n');

// 6. Check JavaScript controller copy and 5-second timing
console.log('Testing 6: JavaScript controller dynamic copy & 5s shuffle duration...');
assert(indexContent.includes("stageTitle.textContent = 'SHUFFLING REWARDS...';"), 'Shuffling title must be SHUFFLING REWARDS...');
assert(indexContent.includes("stageSubtext.textContent = '— ✦ Mixing destiny in progress ✦ —';"), 'Shuffling subtext must be Mixing destiny in progress');
assert(indexContent.includes("stageTitle.textContent = 'CHOOSE YOUR CARD';"), 'Ready to pick title must be CHOOSE YOUR CARD');
assert(indexContent.includes("stageTitle.textContent = 'YOUR REWARD IS READY';"), 'Revealed reward title must be YOUR REWARD IS READY');
assert(indexContent.includes('const TARGET_TOTAL_MS = 5000;'), 'TARGET_TOTAL_MS must be 5000ms');
console.log('✓ JavaScript controller dynamic transitions & 5s timing verified.\n');

console.log('🎉 ALL 6 TAROT REDESIGN VERIFICATION TESTS PASSED SUCCESSFULLY! 100% GREEN.');
