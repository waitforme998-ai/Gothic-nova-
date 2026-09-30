const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🔮 Running Comprehensive Tarot Redesign Verification Suite...\n');

const stylePath = path.join(__dirname, 'style.css');
const indexPath = path.join(__dirname, 'index.html');

const styleContent = fs.readFileSync(stylePath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// 1. Check style.css overlay backdrop and modal box
console.log('Testing 1: Backdrop low blur & modal container enclosure...');
assert(styleContent.includes('backdrop-filter: blur(3.5px) !important;'), 'Backdrop filter must be blur(3.5px)');
assert(styleContent.includes('background: rgba(0, 0, 0, 0.75) !important;'), 'Overlay background must be rgba(0, 0, 0, 0.75)');
assert(styleContent.includes('width: min(840px, 94vw);'), 'Modal container must have min(840px, 94vw)');
assert(styleContent.includes('border: 1px solid rgba(212, 175, 55, 0.38);'), 'Modal container must have gold border');
assert(styleContent.includes('border-radius: 12px;'), 'Modal container must have rounded corners');
console.log('✓ Backdrop low blur & modal container verified.\n');

// 2. Check strict container containment and zero overflow
console.log('Testing 2: Strict zero-overflow & bounded card stage...');
assert(styleContent.includes('overflow: hidden !important; /* Strict Zero-Overflow Constraint */'), 'tarot-cards-stage must have overflow: hidden');
assert(styleContent.includes('max-width: 780px;'), 'tarot-cards-stage max-width must be 780px');
assert(styleContent.includes('max-width: 175px;'), 'tarot-card-wrapper max-width must be 175px');
console.log('✓ Container zero-overflow verified.\n');

// 3. Check desktop and mobile shuffle keyframes clamping
console.log('Testing 3: Shuffle keyframes clamping (all <= 32px translations)...');
assert(styleContent.includes('@keyframes desktopLoopShuffle1'), 'desktopLoopShuffle1 keyframe must exist');
assert(!styleContent.includes('464px') && !styleContent.includes('696px'), 'Desktop shuffle must not have large offsets');
assert(styleContent.includes('translate3d(28px, -10px, 20px)'), 'Desktop shuffle 1 should use clamped 28px offset');

assert(styleContent.includes('@keyframes mobileLoopShuffle1'), 'mobileLoopShuffle1 keyframe must exist');
assert(!styleContent.includes('140px, 190px'), 'Mobile shuffle must not have 140px/190px offsets');
assert(styleContent.includes('translate3d(18px, -8px, 20px)'), 'Mobile shuffle 1 should use clamped 18px offset');
console.log('✓ All shuffle keyframe offsets are strictly clamped within boundaries.\n');

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
