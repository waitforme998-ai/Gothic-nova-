// Test script to verify Tarot Reward rendering across all 4 card perks
const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Check that checkoutTarotRewardBanner exists in DOM
if (!indexHtml.includes('id="checkoutTarotRewardBanner"')) {
    console.error("FAIL: #checkoutTarotRewardBanner missing in index.html");
    process.exit(1);
}

// Check that renderCheckoutTarotRewardBanner exists in JS
if (!indexHtml.includes('function renderCheckoutTarotRewardBanner(')) {
    console.error("FAIL: renderCheckoutTarotRewardBanner function missing in index.html");
    process.exit(1);
}

// Check that all 4 reward types are handled
const rewardTypes = ['percentage_discount', 'free_shipping', 'free_gift', 'order_upgrade'];
for (const rType of rewardTypes) {
    if (!indexHtml.includes(`activeReward.type === '${rType}'`)) {
        console.error(`FAIL: Reward type ${rType} not handled in updateCheckoutTotals / renderCheckoutTarotRewardBanner`);
        process.exit(1);
    }
}

console.log("PASS: All 4 Tarot reward types are handled in markup and JavaScript!");
