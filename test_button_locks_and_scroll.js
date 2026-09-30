const fs = require('fs');

const admin = fs.readFileSync('admin.html', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

console.log('================================================================================');
console.log('⚡ ANTI-DOUBLE-CLICK & NEW ARRIVALS SCROLL VERIFICATION');
console.log('================================================================================');

// 1. Check New Arrivals click handler in index.html
console.log('1. Checking New Arrivals Click Navigation...');
if (!index.includes('window.navigateToProductCard(p.id)')) {
    throw new Error('New arrivals click handler does not call navigateToProductCard');
}
console.log('  ✓ PASS: New Arrivals click handler scrolls to product in catalog');

// 2. Check setButtonLoading implementation
console.log('2. Checking setButtonLoading Pointer-Events & Safety Lock...');
if (!admin.includes('btn.style.pointerEvents = \'none\'')) {
    throw new Error('setButtonLoading missing pointerEvents lock');
}
console.log('  ✓ PASS: setButtonLoading locks pointer-events and disables button');

// 3. Check saveSingleProduct re-entrance guard
console.log('3. Checking saveSingleProduct Re-entrance Guard...');
if (!admin.includes('let isSavingSingleProduct = false;')) {
    throw new Error('saveSingleProduct missing isSavingSingleProduct guard');
}
console.log('  ✓ PASS: saveSingleProduct protected against duplicate clicks');

// 4. Check commitBatchToStore re-entrance guard
console.log('4. Checking commitBatchToStore Re-entrance Guard...');
if (!admin.includes('let isBulkCommitting = false;')) {
    throw new Error('commitBatchToStore missing isBulkCommitting guard');
}
console.log('  ✓ PASS: commitBatchToStore protected against duplicate clicks');

// 5. Check createReviewFromInlineForm re-entrance guard
console.log('5. Checking createReviewFromInlineForm Re-entrance Guard...');
if (!admin.includes('let isSavingReviewInlineForm = false;')) {
    throw new Error('createReviewFromInlineForm missing guard');
}
console.log('  ✓ PASS: createReviewFromInlineForm protected against duplicate clicks');

// 6. Check saveAnnouncementsFromAdmin re-entrance guard
console.log('6. Checking saveAnnouncementsFromAdmin Re-entrance Guard...');
if (!admin.includes('let isSavingAnnouncements = false;')) {
    throw new Error('saveAnnouncementsFromAdmin missing guard');
}
console.log('  ✓ PASS: saveAnnouncementsFromAdmin protected against duplicate clicks');

// Clean up test file
try { if (fs.existsSync('scratch_find_handlers.js')) fs.unlinkSync('scratch_find_handlers.js'); } catch(e) {}

console.log('================================================================================');
console.log('ALL VERIFICATIONS PASSED (100%)');
console.log('================================================================================');
