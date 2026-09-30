const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🔮 Running Comprehensive Tarot Redesign Verification Suite (Minimal Modal & Dynamic Slot Shuffling)...\n');

const stylePath = path.join(__dirname, 'style.css');
const indexPath = path.join(__dirname, 'index.html');

const styleContent = fs.readFileSync(stylePath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// 1. Check style.css overlay backdrop and minimal modal box
console.log('Testing 1: High storefront visibility (low blur/dim) & compact modal box...');
assert(styleContent.includes('backdrop-filter: blur(1.5px) !important;'), 'Backdrop filter must be minimal blur(1.5px) for store visibility');
assert(styleContent.includes('background: rgba(0, 0, 0, 0.50) !important;'), 'Overlay background must be light rgba(0, 0, 0, 0.50)');
assert(styleContent.includes('width: min(520px, 92vw);'), 'Modal container must be compact min(520px, 92vw)');
assert(styleContent.includes('border-radius: 14px;'), 'Modal container must have 14px border radius');
console.log('✓ High background visibility & compact modal container verified.\n');

// 2. Check compact card stage and well-spaced card dimensions
console.log('Testing 2: Compact, well-spaced card stage...');
assert(styleContent.includes('overflow: hidden !important;'), 'tarot-cards-stage must have overflow: hidden');
assert(styleContent.includes('max-width: 470px;'), 'tarot-cards-stage max-width must be compact 470px');
assert(styleContent.includes('max-width: 105px;'), 'tarot-card-wrapper max-width must be compact 105px');
assert(styleContent.includes('height: 155px;'), 'tarot-card-wrapper height must be compact 155px');
console.log('✓ Compact, well-spaced card dimensions verified.\n');

// 3. Check 5 Dynamic Slot-Swapping Shuffle Patterns (Desktop & Mobile)
console.log('Testing 3: Dynamic slot-swapping shuffle animations across stage...');
assert(styleContent.includes('@keyframes desktopGrandCross1'), 'desktopGrandCross1 keyframe must exist');
assert(styleContent.includes('translate3d(345px,'), 'Desktop shuffle pattern 1 must swap full stage width (345px)');
assert(styleContent.includes('@keyframes desktopDeckConverge1'), 'desktopDeckConverge1 keyframe must exist');
assert(styleContent.includes('@keyframes desktopCarousel1'), 'desktopCarousel1 keyframe must exist');
assert(styleContent.includes('@keyframes desktopCascade1'), 'desktopCascade1 keyframe must exist');
assert(styleContent.includes('@keyframes desktopVortex1'), 'desktopVortex1 keyframe must exist');

assert(styleContent.includes('@keyframes mobileGrandCross1'), 'mobileGrandCross1 keyframe must exist');
assert(styleContent.includes('translate3d(216px,'), 'Mobile shuffle pattern 1 must swap full mobile stage width (216px)');
assert(styleContent.includes('@keyframes mobileDeckConverge1'), 'mobileDeckConverge1 keyframe must exist');
assert(styleContent.includes('@keyframes mobileCarousel1'), 'mobileCarousel1 keyframe must exist');
console.log('✓ Dynamic slot-swapping shuffle animations verified across all 5 patterns.\n');

// 4. Check HTML Markup for Initial 3-Stage Shopping Reward Copy
console.log('Testing 4: HTML Markup initial copy...');
assert(indexContent.includes('✦ DAILY SHOPPING REWARD ✦'), 'Eyebrow must be ✦ DAILY SHOPPING REWARD ✦');
assert(indexContent.includes('UNLOCK YOUR SHOPPING BENEFIT'), 'Initial Title must be UNLOCK YOUR SHOPPING BENEFIT');
assert(indexContent.includes('✦ SHUFFLE CARDS (5s)'), 'Button text must be ✦ SHUFFLE CARDS (5s)');
console.log('✓ Initial HTML markup verified.\n');

// 5. Check JavaScript controller copy and 5-second timing
console.log('Testing 5: JavaScript controller dynamic copy & 5s shuffle duration...');
assert(indexContent.includes("stageTitle.textContent = 'SHUFFLING REWARDS...';"), 'Shuffling title must be SHUFFLING REWARDS...');
assert(indexContent.includes("stageSubtext.textContent = '— ✦ Mixing destiny in progress ✦ —';"), 'Shuffling subtext must be Mixing destiny in progress');
assert(indexContent.includes("stageTitle.textContent = 'CHOOSE YOUR CARD';"), 'Ready to pick title must be CHOOSE YOUR CARD');
assert(indexContent.includes("stageTitle.textContent = 'YOUR REWARD IS READY';"), 'Revealed reward title must be YOUR REWARD IS READY');
assert(indexContent.includes('const TARGET_TOTAL_MS = 5000;'), 'TARGET_TOTAL_MS must be 5000ms');
console.log('✓ JavaScript controller dynamic transitions & 5s timing verified.\n');

// 6. Check generic gift integrity (no specific product disclosed)
console.log('Testing 6: Generic gift copy integrity...');
assert(indexContent.includes('Free Gift Enclosed in Parcel') || indexContent.includes('Artifact Enclosed in Parcel'), 'Gift copy must be generic');
assert(!indexContent.includes('Gothic Velvet Cape as your free gift'), 'Must not promise specific product name in gift reward');
console.log('✓ Generic gift integrity verified.\n');

console.log('🎉 ALL 6 TAROT REDESIGN VERIFICATION TESTS PASSED SUCCESSFULLY! 100% GREEN.');
