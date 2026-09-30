const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('⚡ TAROT REWARD TEXT SIMPLIFICATION & ZERO-REGRESSION VERIFICATION');
console.log('='.repeat(80));

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

let failed = false;

// Check 1: index.html INITIAL_REWARDS_CONFIG
console.log('1. Checking INITIAL_REWARDS_CONFIG in index.html...');
if (
    indexHtml.includes('id: "reward_upgrade"') &&
    indexHtml.includes('title: "ORDER UPGRADE"') &&
    indexHtml.includes('desc: "Order Upgrade"') &&
    indexHtml.includes('subtext: "Order Upgrade"')
) {
    console.log('  ✓ PASS: INITIAL_REWARDS_CONFIG for ORDER UPGRADE simplified to pure "Order Upgrade"');
} else {
    console.error('  ✗ FAIL: INITIAL_REWARDS_CONFIG for ORDER UPGRADE not simplified properly');
    failed = true;
}

// Check 2: No deluxe box or packaging mentions in Tarot rewards
console.log('2. Checking for removal of deluxe box / VIP packaging text in Tarot configs...');
if (
    !indexHtml.includes('Tarot Reward &bull; VIP Box Packaging') &&
    !indexHtml.includes('✦ VIP Packaging Upgrade') &&
    !adminHtml.includes('Pack in Deluxe Box') &&
    !adminHtml.includes('VIP Luxury Packaging Upgrade') &&
    !adminHtml.includes('TAROT: VIP UPGRADE')
) {
    console.log('  ✓ PASS: All VIP luxury packaging / deluxe box text completely removed from both index.html and admin.html');
} else {
    console.error('  ✗ FAIL: Residual deluxe/VIP packaging text found');
    failed = true;
}

// Check 3: index.html Checkout Step 1 & 2
console.log('3. Checking Checkout Step 1 & 2 reward labels in index.html...');
if (
    indexHtml.includes('✦ Order Upgrade') &&
    indexHtml.includes('✦ Free Gift') &&
    indexHtml.includes('ORDER UPGRADE') &&
    indexHtml.includes('FREE GIFT')
) {
    console.log('  ✓ PASS: Checkout Step 1 & 2 display clean "✦ Order Upgrade" and "✦ Free Gift"');
} else {
    console.error('  ✗ FAIL: Checkout labels missing');
    failed = true;
}

// Check 4: admin.html Order Cards & Badges
console.log('4. Checking Admin Order Cards & Badges in admin.html...');
if (
    adminHtml.includes("pillText = 'TAROT: ORDER UPGRADE';") &&
    adminHtml.includes("TAROT REWARD: Order Upgrade (${escapeHtml(rw.code || 'TAROT')})") &&
    adminHtml.includes("TAROT REWARD: Free Gift (${escapeHtml(rw.code || 'TAROT')})") &&
    adminHtml.includes("TAROT REWARD: Free Delivery (${escapeHtml(rw.code || 'TAROT')})")
) {
    console.log('  ✓ PASS: Admin panel displays concise TAROT: ORDER UPGRADE and reward banners');
} else {
    console.error('  ✗ FAIL: Admin order cards not updated properly');
    failed = true;
}

console.log('='.repeat(80));
if (!failed) {
    console.log('ALL TAROT TEXT SIMPLIFICATION CHECKS PASSED (100%)');
} else {
    console.log('TAROT VERIFICATION FAILED');
    process.exit(1);
}
console.log('='.repeat(80));
