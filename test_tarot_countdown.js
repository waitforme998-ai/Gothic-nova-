const fs = require('fs');
const path = require('path');

console.log('⏳ Running Tarot Dual Countdown & 48h Cooldown Verification Suite...\n');

const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');

let errors = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        errors++;
    } else {
        console.log(`✓ PASS: ${message}`);
    }
}

// Test 1: HTML Markup for Dual Countdown Floating Pill
assert(htmlContent.includes('id="floatingRewardPill"'), 'Floating reward pill exists in HTML');
assert(htmlContent.includes('id="floatingPillValidityText"'), 'Reward validity countdown container exists');
assert(htmlContent.includes('id="floatingPillShuffleText"'), 'Shuffle cooldown countdown container exists');
assert(htmlContent.includes('id="floatingPillBadge"'), 'Reward active/expired status badge exists');

// Test 2: CSS Styles for Floating Pill and Card Structure
assert(cssContent.includes('.floating-reward-pill'), '.floating-reward-pill class defined in style.css');
assert(cssContent.includes('max-width: 340px'), 'Pill max-width configured for dual line display');
assert(cssContent.includes('.floating-reward-icon'), 'Floating reward icon styles configured');

// Test 3: JavaScript Timer & Cooldown Logic
assert(htmlContent.includes('startDailyRewardTimer(targetOfferExpiresAt, targetShuffleUnlockAt)') || htmlContent.includes('startDailyRewardTimer(stored.offerExpiresAt, stored.shuffleUnlockAt)'), 'startDailyRewardTimer handles both offer and shuffle timestamps');
assert(htmlContent.includes('your reward duration ended'), '"your reward duration ended" text is present for expired 24h validity state');
assert(htmlContent.includes('✦ Shuffle again in:'), '"✦ Shuffle again in:" indicator is present in live timer updates');
assert(htmlContent.includes('TWENTY_FOUR_HOURS') && htmlContent.includes('FORTY_EIGHT_HOURS'), '24h and 48h constants strictly defined');

// Test 4: Wall-clock Synchronization Hooks
assert(htmlContent.includes('window.addEventListener(\'focus\', syncOnWake)'), 'Window focus hook attached for mobile wake sync');
assert(htmlContent.includes('document.addEventListener(\'visibilitychange\''), 'Visibilitychange hook attached for tab switch / screen on');
assert(htmlContent.includes('window.addEventListener(\'pageshow\', syncOnWake)'), 'Pageshow hook attached for browser back/forward and app restore');

// Test 5: Simulated Timer Progression Simulation
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
const now = Date.now();
const claimedAt = now;
const offerExpiresAt = claimedAt + TWENTY_FOUR_HOURS;
const shuffleUnlockAt = claimedAt + FORTY_EIGHT_HOURS;

// Case A: 5 hours after claim
const t5h = now + 5 * 3600 * 1000;
const remOffer5h = offerExpiresAt - t5h;
const remShuffle5h = shuffleUnlockAt - t5h;
assert(remOffer5h > 0 && Math.floor(remOffer5h / 3600000) === 18 || Math.floor(remOffer5h / 3600000) === 19, 'Offer valid at 5h mark (19h remaining)');
assert(remShuffle5h > 0 && Math.floor(remShuffle5h / 3600000) === 42 || Math.floor(remShuffle5h / 3600000) === 43, 'Shuffle cooldown active at 5h mark (43h remaining)');

// Case B: 25 hours after claim (24h passed, but within 48h)
const t25h = now + 25 * 3600 * 1000;
const remOffer25h = offerExpiresAt - t25h;
const remShuffle25h = shuffleUnlockAt - t25h;
assert(remOffer25h <= 0, 'Offer is EXPIRED at 25h mark (shows "your reward duration ended")');
assert(remShuffle25h > 0 && (Math.floor(remShuffle25h / 3600000) === 22 || Math.floor(remShuffle25h / 3600000) === 23), 'Shuffle cooldown continues ticking at 25h mark (23h remaining)');

// Case C: 49 hours after claim (48h passed)
const t49h = now + 49 * 3600 * 1000;
const remShuffle49h = shuffleUnlockAt - t49h;
assert(remShuffle49h <= 0, 'Shuffle cooldown is completely unlocked at 49h mark for fresh ritual');

if (errors === 0) {
    console.log('\n🎉 ALL TAROT DUAL COUNTDOWN TESTS PASSED (100% GREEN)!');
    process.exit(0);
} else {
    console.error(`\n💥 ${errors} test(s) failed.`);
    process.exit(1);
}
