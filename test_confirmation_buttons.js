const fs = require('fs');
const assert = require('assert');

console.log('Testing Payment & Order Confirmation Layout & Buttons...\n');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Verify "COPY ORDER ID (for WhatsApp chat)" button exists in action buttons
assert(indexHtml.includes('id="copyOrderIdBtn"'), 'copyOrderIdBtn must exist');
assert(indexHtml.includes('COPY ORDER ID (for WhatsApp chat)'), 'Must include (for WhatsApp chat) in brackets in copy order id button');
assert(indexHtml.includes('copyOrderReference'), 'copyOrderReference handler must exist');
console.log('✓ PASS: "COPY ORDER ID (for WhatsApp chat)" button verified');

// 2. Verify PRINT RECEIPT button and redundant copy buttons are removed from confirmation action buttons
assert(!indexHtml.includes('id="printReceiptBtn"'), 'printReceiptBtn must be removed entirely');
assert(!indexHtml.includes('id="copyProductIdBtn"'), 'copyProductIdBtn must be removed from confirmation actions');
assert(!indexHtml.includes('confirmed-item-copy-btn'), 'Product cards in confirmation receipt must NOT have copy buttons');
console.log('✓ PASS: print receipt and redundant item copy buttons completely removed');

// 3. Verify confirmation layout buttons
assert(indexHtml.includes('closeCheckoutAndReset()'), 'Return to storefront button must exist');
assert(indexHtml.includes('id="confirmedWhatsAppBtn"'), 'confirmedWhatsAppBtn must exist');
console.log('✓ PASS: Confirmation action buttons (Order ID copy, Return Storefront, WhatsApp) verified');

// 4. Verify Gift is generic and does NOT specify any product name
assert(!indexHtml.includes('FREE GOTHIC ARTIFACT (CLAIMED REWARD)'), 'Must not name specific artifact as gift');
assert(indexHtml.includes("id: 'free_gift'"), 'Free gift payload must use generic free_gift id');
assert(indexHtml.includes("name: '✦ Free Gift (Included in Parcel)'"), 'Free gift must have clean generic title');
console.log('✓ PASS: Free gift is generic and does not disclose specific products');

// 5. Verify Advance Payment copy buttons in Step 2
assert(indexHtml.includes('id="copyBankIbanBtn"'), 'copyBankIbanBtn must exist');
assert(indexHtml.includes('id="copyJazzCashBtn"'), 'copyJazzCashBtn must exist');
assert(indexHtml.includes('copyAccountDetail'), 'copyAccountDetail function must exist');
console.log('✓ PASS: Step 2 Advance Payment copy buttons verified');

console.log('\n========================================');
console.log('ALL CONFIRMATION SECTION TESTS PASSED 100%');
console.log('========================================');
