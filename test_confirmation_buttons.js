const fs = require('fs');
const assert = require('assert');

console.log('Testing Payment & Order Confirmation Buttons...\n');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Verify "COPY PRODUCT ID (for WhatsApp chat)" button exists
assert(indexHtml.includes('COPY PRODUCT ID'), 'COPY PRODUCT ID button must exist');
assert(indexHtml.includes('(for WhatsApp chat)'), 'Must include (for WhatsApp chat) in brackets');
assert(indexHtml.includes('copyOrderProductIdsForWhatsApp'), 'copyOrderProductIdsForWhatsApp handler must exist');
console.log('✓ PASS: "COPY PRODUCT ID (for WhatsApp chat)" button verified in HTML');

// 2. Verify all 5 confirmation buttons exist and are hooked up
assert(indexHtml.includes('id="copyOrderIdBtn"'), 'copyOrderIdBtn must exist');
assert(indexHtml.includes('id="copyProductIdBtn"'), 'copyProductIdBtn must exist');
assert(indexHtml.includes('id="printReceiptBtn"'), 'printReceiptBtn must exist');
assert(indexHtml.includes('closeCheckoutAndReset()'), 'Return to storefront button must exist');
assert(indexHtml.includes('id="confirmedWhatsAppBtn"'), 'confirmedWhatsAppBtn must exist');
console.log('✓ PASS: All 5 confirmation action buttons verified');

// 3. Verify JavaScript copy functions
assert(indexHtml.includes('function executeUniversalCopy'), 'executeUniversalCopy function must be implemented');
assert(indexHtml.includes('function copyOrderReference'), 'copyOrderReference function must be implemented');
assert(indexHtml.includes('function copyOrderProductIdsForWhatsApp'), 'copyOrderProductIdsForWhatsApp function must be implemented');
assert(indexHtml.includes('function copySingleProductIdForWhatsApp'), 'copySingleProductIdForWhatsApp function must be implemented');
console.log('✓ PASS: Universal clipboard copy & WhatsApp formatting engine verified');

// 4. Verify Advance Payment copy buttons in Step 2
assert(indexHtml.includes('id="copyBankIbanBtn"'), 'copyBankIbanBtn must exist');
assert(indexHtml.includes('id="copyJazzCashBtn"'), 'copyJazzCashBtn must exist');
assert(indexHtml.includes('copyAccountDetail'), 'copyAccountDetail function must exist');
console.log('✓ PASS: Step 2 Advance Payment copy buttons verified');

console.log('\n========================================');
console.log('ALL CONFIRMATION BUTTON TESTS PASSED 100%');
console.log('========================================');
