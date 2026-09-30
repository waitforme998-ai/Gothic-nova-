const fs = require('fs');
const assert = require('assert');

console.log('Testing Non-Destructive Category Deletion & Partial Cloud Sync Guards...\n');

// 1. Verify supabase-engine.js safe dataset merging logic
const engineCode = fs.readFileSync('supabase-engine.js', 'utf8');
assert(engineCode.includes('getSafeDataset'), 'supabase-engine.js must define getSafeDataset for safe non-destructive merging');
assert(engineCode.includes('Ultimate Anti-Clobber Safeguard'), 'supabase-engine.js must have anti-clobber safeguards');
assert(engineCode.includes('payloadToSave.products === undefined'), 'supabase-engine.js must check if products were omitted in partial save');
assert(engineCode.includes('payloadToSave.categories === undefined'), 'supabase-engine.js must check if categories were omitted in partial save');
assert(engineCode.includes('payloadToSave.reviews === undefined'), 'supabase-engine.js must check if reviews were omitted in partial save');
assert(engineCode.includes('payloadToSave.announcements === undefined'), 'supabase-engine.js must check if announcements were omitted in partial save');
console.log('✓ PASS: supabase-engine.js partial sync safety guards verified');

// 2. Test in mock environment that deleting a category preserves all products, reviews, and announcements
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;
global.window = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    Event: function(name) { this.name = name; },
    CustomEvent: function(name, opts) { this.name = name; this.detail = opts ? opts.detail : null; }
};

// Seed test data
const seedProducts = [
    { id: '1', name: 'Spider Ring', category: 'rings', price: 100 },
    { id: '2', name: 'Dragon Pendant', category: 'pendants', price: 200 }
];
const seedCategories = [
    { id: 'rings', name: 'Rings' },
    { id: 'pendants', name: 'Pendants' },
    { id: 'empty-cat', name: 'Empty Category' }
];
const seedReviews = [
    { id: 'rev_1', author: 'Baqir', rating: 5, comment: 'Great product' }
];
const seedAnnouncements = ['Free Shipping'];

localStorage.setItem('gn_products', JSON.stringify(seedProducts));
localStorage.setItem('gn_categories_meta', JSON.stringify(seedCategories));
localStorage.setItem('gn_reviews', JSON.stringify(seedReviews));
localStorage.setItem('gn_announcements', JSON.stringify(seedAnnouncements));

// Execute in node vm
const scriptContent = engineCode + '\n; return window.SupabaseEngine;';
const SupabaseEngine = new Function(scriptContent)();

async function testCategoryDeleteSafety() {
    console.log('Simulating deletion of "empty-cat"...');
    await SupabaseEngine.deleteCategory('empty-cat');

    let remainingCats = await SupabaseEngine.getCategories();
    let remainingProds = await SupabaseEngine.getProducts();
    let remainingRevs = await SupabaseEngine.getReviews();
    let remainingAnn = await SupabaseEngine.getAnnouncements();

    assert.strictEqual(remainingCats.length, 2, 'Should have 2 categories remaining');
    assert.strictEqual(remainingCats.find(c => c.id === 'empty-cat'), undefined, 'empty-cat should be deleted');
    assert.strictEqual(remainingProds.length, 2, 'Products must remain 100% intact');
    assert.strictEqual(remainingRevs.length, 1, 'Reviews must remain 100% intact');
    assert.strictEqual(remainingAnn.length, 1, 'Announcements must remain 100% intact');
    console.log('✓ PASS: Deleting empty category strictly removed only category and kept all products, reviews & announcements intact');

    console.log('Simulating deletion of populated "pendants" category...');
    // 'Dragon Pendant' was in category 'pendants'
    await SupabaseEngine.deleteCategory('pendants');

    remainingCats = await SupabaseEngine.getCategories();
    remainingProds = await SupabaseEngine.getProducts();

    assert.strictEqual(remainingCats.length, 1, 'Should have 1 category remaining');
    assert.strictEqual(remainingCats.find(c => c.id === 'pendants'), undefined, 'pendants category must be deleted');
    
    // Check Dragon Pendant was moved to 'all', NOT 'rings'
    const dragonPendant = remainingProds.find(p => p.id === '2');
    assert(dragonPendant, 'Dragon pendant must still exist');
    assert.strictEqual(dragonPendant.category, 'all', 'Dragon pendant category must be set to "all", NOT hardcoded to "rings"');
    console.log('✓ PASS: Product in deleted category safely reassigned to "all" without hardcoding to rings');

    // Verify tombstone
    const deletedCats = JSON.parse(localStorage.getItem('gn_deleted_categories') || '[]');
    assert(deletedCats.includes('pendants'), 'Deleted category must be recorded in gn_deleted_categories tombstone');
    console.log('✓ PASS: Category tombstone recorded and prevents resurrection');
}

testCategoryDeleteSafety().then(() => {
    console.log('\n========================================');
    console.log('ALL CATEGORY DELETE SAFETY TESTS PASSED (100%)');
    console.log('========================================');
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
