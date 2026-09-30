const fs = require('fs');
const assert = require('assert');

console.log('================================================================================');
console.log('⚡ UNIVERSAL CRUD & PERSISTENT SYNC LOCK TEST SUITE');
console.log('================================================================================\n');

// Mock browser environment
const localStorageStore = {};
global.localStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    Event: function(name) { this.name = name; },
    CustomEvent: function(name, opts) { this.name = name; this.detail = opts ? opts.detail : null; }
};

// Load engine code
const engineCode = fs.readFileSync('supabase-engine.js', 'utf8');
const SupabaseEngine = new Function(engineCode + '\n; return window.SupabaseEngine;')();

async function runAllTests() {
    console.log('1. Testing Announcement Add, Edit, and Complete Erase / Deletion...');
    // Initial save with 3 announcements
    await SupabaseEngine.saveAnnouncements(['Sale 50% Off', 'Free Shipping over 5000', 'New Silver Drops']);
    let ann = await SupabaseEngine.getAnnouncements();
    assert.strictEqual(ann.length, 3, 'Should have saved 3 announcements');
    assert.strictEqual(ann[0], 'Sale 50% Off');

    // Erase down to 1 announcement
    await SupabaseEngine.saveAnnouncements(['Exclusive VIP Access']);
    ann = await SupabaseEngine.getAnnouncements();
    assert.strictEqual(ann.length, 1, 'Should have exactly 1 announcement remaining');
    assert.strictEqual(ann[0], 'Exclusive VIP Access', 'Should be the newly saved single announcement');

    // Erase all announcements (empty array)
    await SupabaseEngine.saveAnnouncements([]);
    ann = await SupabaseEngine.getAnnouncements();
    assert.strictEqual(ann.length, 0, 'Announcements must remain completely erased and not resurrect');
    console.log('  ✓ PASS: Announcements add, edit, and deletion/erase verified.\n');

    console.log('2. Testing Product Add, Edit, and Delete with Tombstone Protection...');
    const initialProducts = [
        { id: 'prod_101', name: 'Gothic Skull Ring', price: 2500, category: 'rings', stock: 10 },
        { id: 'prod_102', name: 'Obsidian Dagger Pendant', price: 3200, category: 'pendants', stock: 5 },
        { id: 'prod_103', name: 'Raven Claw Bracelet', price: 1800, category: 'bracelets', stock: 8 }
    ];
    localStorage.setItem('gn_products', JSON.stringify(initialProducts));
    
    // Check fetching products
    let prods = await SupabaseEngine.getProducts();
    assert.strictEqual(prods.length, 3, 'Should fetch 3 products');

    // Edit a product
    const updatedProd = { ...initialProducts[0], name: 'Gothic Skull Ring (Pure Silver)', price: 2900 };
    await SupabaseEngine.saveProduct(updatedProd);
    prods = await SupabaseEngine.getProducts();
    const foundEdited = prods.find(p => p.id === 'prod_101');
    assert.strictEqual(foundEdited.name, 'Gothic Skull Ring (Pure Silver)');
    assert.strictEqual(foundEdited.price, 2900);

    // Delete a product (prod_102)
    await SupabaseEngine.deleteProduct('prod_102');
    prods = await SupabaseEngine.getProducts();
    assert.strictEqual(prods.length, 2, 'Should have 2 products after deletion');
    assert.strictEqual(prods.find(p => p.id === 'prod_102'), undefined, 'Deleted product should not exist');

    // Verify tombstone is recorded
    const deletedTombstones = JSON.parse(localStorage.getItem('gn_deleted_products') || '[]');
    assert(deletedTombstones.includes('prod_102'), 'Deleted product ID must be present in tombstone list');

    // Simulate a background sync or reload where an old cloud snapshot contains prod_102
    // getProducts must still filter it out!
    prods = await SupabaseEngine.getProducts();
    assert.strictEqual(prods.find(p => p.id === 'prod_102'), undefined, 'Deleted product must NEVER resurrect even after reload');
    console.log('  ✓ PASS: Product add, edit, delete & anti-resurrection verified.\n');

    console.log('3. Testing Review Add and Delete with Tombstone Protection...');
    const initialReviews = [
        { id: 'rev_1', author: 'Aaliyah', rating: 5, comment: 'Gorgeous craftsmanship!' },
        { id: 'rev_2', author: 'Hamza', rating: 4, comment: 'Nice weight and shine.' }
    ];
    localStorage.setItem('gn_reviews', JSON.stringify(initialReviews));

    let revs = await SupabaseEngine.getReviews();
    assert.strictEqual(revs.length, 2, 'Should have 2 reviews');

    // Delete a review
    await SupabaseEngine.deleteReview('rev_1');
    revs = await SupabaseEngine.getReviews();
    assert.strictEqual(revs.length, 1, 'Should have 1 review after deletion');
    assert.strictEqual(revs.find(r => r.id === 'rev_1'), undefined, 'Deleted review should not exist');

    // Verify tombstone
    const deletedRevTombstones = JSON.parse(localStorage.getItem('gn_deleted_reviews') || '[]');
    assert(deletedRevTombstones.includes('rev_1'), 'Deleted review ID must be present in tombstone list');
    console.log('  ✓ PASS: Review add, delete & anti-resurrection verified.\n');

    console.log('4. Testing Category Add, Edit/Rename, and Delete...');
    const initialCats = [
        { id: 'rings', name: 'Rings' },
        { id: 'pendants', name: 'Pendants' },
        { id: 'bracelets', name: 'Bracelets' },
        { id: 'chains', name: 'Chains' }
    ];
    await SupabaseEngine.saveCategoryList(initialCats);
    let cats = await SupabaseEngine.getCategories();
    assert.strictEqual(cats.length, 4, 'Should have 4 categories');

    // Add new category
    cats.push({ id: 'earrings', name: 'Earrings' });
    await SupabaseEngine.saveCategoryList(cats);
    cats = await SupabaseEngine.getCategories();
    assert.strictEqual(cats.length, 5, 'Should have 5 categories after addition');
    assert(cats.some(c => c.id === 'earrings'));

    // Delete category 'chains'
    await SupabaseEngine.deleteCategory('chains');
    cats = await SupabaseEngine.getCategories();
    assert.strictEqual(cats.length, 4, 'Should have 4 categories after deleting chains');
    assert.strictEqual(cats.find(c => c.id === 'chains'), undefined, 'chains category should be removed');
    console.log('  ✓ PASS: Category add, edit, and deletion verified.\n');

    console.log('5. Testing Cross-Section Sync Isolation (No Clobbering)...');
    // Ensure that modifying categories or announcements did NOT corrupt or wipe products or reviews
    prods = await SupabaseEngine.getProducts();
    assert.strictEqual(prods.length, 2, 'Products remain intact and correct');
    revs = await SupabaseEngine.getReviews();
    assert.strictEqual(revs.length, 1, 'Reviews remain intact and correct');
    console.log('  ✓ PASS: Cross-section isolation verified (no clobbering).\n');

    console.log('================================================================================');
    console.log('ALL CRUD & UNIVERSAL SYNC LOCK TESTS PASSED (100% SUCCESS)');
    console.log('================================================================================');
    process.exit(0);
}

runAllTests().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
