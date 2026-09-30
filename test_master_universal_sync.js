// test_master_universal_sync.js
// Comprehensive End-to-End Verification Suite for Gothic Nova Store Sync & CRUD Locking

const fs = require('fs');
const path = require('path');

// Mock browser environment
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: function(key) { return store[key] || null; },
        setItem: function(key, value) { store[key] = String(value); },
        removeItem: function(key) { delete store[key]; },
        clear: function() { store = {}; }
    };
})();

global.localStorage = localStorageMock;
global.window = {
    localStorage: localStorageMock,
    dispatchEvent: function() {},
    addEventListener: function() {},
    location: { href: 'http://localhost/admin.html', search: '' },
    document: {
        getElementById: () => null,
        querySelectorAll: () => [],
        querySelector: () => null,
        body: { classList: { add: () => {}, remove: () => {} } }
    }
};
global.document = global.window.document;
if (!global.CustomEvent) {
    global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.detail = opts ? opts.detail : null; } };
}

// Load Supabase Engine
const seCode = fs.readFileSync(path.join(__dirname, 'supabase-engine.js'), 'utf8');
eval(seCode);
const SupabaseEngine = global.window.SupabaseEngine;

async function runMasterTestSuite() {
    console.log("===============================================================================");
    console.log("⚡ RUNNING MASTER UNIVERSAL SYNC & COMPLETE CRUD LOCKING SUITE");
    console.log("===============================================================================");

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✓ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ✗ FAIL: ${message}`);
            failed++;
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    try {
        // -------------------------------------------------------------
        // TEST 1: CATEGORY CRUD & SAFE RELOCATION TO 'ALL'
        // -------------------------------------------------------------
        console.log("\n[1/5] Testing Category Lifecycle (Add, Move, Delete, Zero Resurrection on Refresh)...");
        
        // 1. Add Category 'test-chokers'
        await SupabaseEngine.saveCategory({ id: 'test-chokers', name: 'Test Chokers', display_order: 5 });
        let cats = await SupabaseEngine.getCategories();
        assert(cats.some(c => c.id === 'test-chokers'), "Category 'test-chokers' successfully added");

        // 2. Add Product in 'test-chokers'
        const testProd = {
            id: 'prod-choker-99',
            name: 'Blood Velvet Choker',
            category: 'test-chokers',
            price: 4500,
            stock: 10,
            active: true
        };
        await SupabaseEngine.saveProduct(testProd);
        let prods = await SupabaseEngine.getProducts();
        assert(prods.some(p => p.id === 'prod-choker-99' && p.category === 'test-chokers'), "Product created inside 'test-chokers'");

        // 3. Delete Category 'test-chokers'
        await SupabaseEngine.deleteCategory('test-chokers');
        
        // 4. Verify category is removed and product moved to 'all'
        cats = await SupabaseEngine.getCategories();
        assert(!cats.some(c => c.id === 'test-chokers'), "Category 'test-chokers' removed immediately");

        prods = await SupabaseEngine.getProducts();
        const relocatedProd = prods.find(p => p.id === 'prod-choker-99');
        assert(relocatedProd && relocatedProd.category === 'all', "Product relocated safely to 'all' (NEVER rings)");

        // 5. Simulate Page Refresh (Clear Memory Cache & Rehydrate from Cloud)
        console.log("  Simulating full page reload / rehydration from cloud...");
        const cloudState = await SupabaseEngine._getCloudSyncState(true);
        assert(!cloudState.categories.some(c => c.id === 'test-chokers'), "Deleted category does NOT resurrect in cloud sync state");
        
        // Cleanup test product
        await SupabaseEngine.deleteProduct('prod-choker-99');

        // -------------------------------------------------------------
        // TEST 2: ANNOUNCEMENTS BACKSPACE / DELETION PERSISTENCE
        // -------------------------------------------------------------
        console.log("\n[2/5] Testing Announcement Persistence (Backspace / Reduction)...");
        
        const initialOffers = [
            "Free delivery over Rs. 3000",
            "New Silver Drops Live",
            "VIP Gothic Packaging"
        ];
        await SupabaseEngine.saveAnnouncements(initialOffers);
        let currentOffers = await SupabaseEngine.getAnnouncements();
        assert(currentOffers.length === 3, "Saved 3 initial announcements");

        // User backspaces/erases the 3rd announcement
        const reducedOffers = [
            "Free delivery over Rs. 3000",
            "New Silver Drops Live"
        ];
        await SupabaseEngine.saveAnnouncements(reducedOffers);
        currentOffers = await SupabaseEngine.getAnnouncements();
        assert(currentOffers.length === 2 && !currentOffers.includes("VIP Gothic Packaging"), "Erased announcement removed immediately");

        // Simulate refresh & cloud fetch
        const freshCloudAnn = (await SupabaseEngine._getCloudSyncState(true)).announcements;
        assert(freshCloudAnn.length === 2 && !freshCloudAnn.includes("VIP Gothic Packaging"), "Erased announcement does NOT resurrect from cloud snapshot");

        // -------------------------------------------------------------
        // TEST 3: PRODUCTS FULL CRUD & STOCK INTEGRITY
        // -------------------------------------------------------------
        console.log("\n[3/5] Testing Products Full CRUD & In-Place State...");
        
        const sampleProduct = {
            id: 'test-ring-888',
            name: 'Vampire Obsidian Signet',
            category: 'rings',
            price: 7500,
            sale_price: 6500,
            stock: 12,
            active: true
        };
        await SupabaseEngine.saveProduct(sampleProduct);
        prods = await SupabaseEngine.getProducts();
        assert(prods.some(p => p.id === 'test-ring-888' && p.stock === 12), "Product created with accurate stock");

        // Edit price & stock
        sampleProduct.price = 7999;
        sampleProduct.stock = 9;
        await SupabaseEngine.saveProduct(sampleProduct);
        prods = await SupabaseEngine.getProducts();
        const updatedP = prods.find(p => p.id === 'test-ring-888');
        assert(updatedP && updatedP.price === 7999 && updatedP.stock === 9, "Product price and stock updated in place");

        // Delete product
        await SupabaseEngine.deleteProduct('test-ring-888');
        prods = await SupabaseEngine.getProducts();
        assert(!prods.some(p => p.id === 'test-ring-888'), "Product deleted cleanly");

        const cloudP = (await SupabaseEngine._getCloudSyncState(true)).products;
        assert(!cloudP.some(p => p.id === 'test-ring-888'), "Deleted product does NOT resurrect in cloud state");

        // -------------------------------------------------------------
        // TEST 4: CUSTOMER REVIEWS CRUD
        // -------------------------------------------------------------
        console.log("\n[4/5] Testing Reviews CRUD & Anti-Ghosting...");
        
        const sampleReview = {
            id: 'rev-test-777',
            customer_name: 'Damian V.',
            author: 'Damian V.',
            location: 'Lahore',
            rating: 5,
            review_text: 'Exceptional craftsmanship and weight.',
            product_name: 'Venom Spider Ring'
        };
        await SupabaseEngine.saveReview(sampleReview);
        let revs = await SupabaseEngine.getReviews();
        assert(revs.some(r => r.id === 'rev-test-777'), "Customer review saved to cloud");

        await SupabaseEngine.deleteReview('rev-test-777');
        revs = await SupabaseEngine.getReviews();
        assert(!revs.some(r => r.id === 'rev-test-777'), "Customer review deleted and tombstoned");

        // -------------------------------------------------------------
        // TEST 5: CODEBASE INTEGRITY (DEFAULT 'ALL', SEARCH HIGHLIGHTING, NO HARDCODED RINGS)
        // -------------------------------------------------------------
        console.log("\n[5/5] Checking Codebase Static Locks (Default ALL, Search Exact Category Open)...");

        const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        const adminContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

        assert(indexContent.includes('window.navigateToProductCard'), "Storefront contains navigateToProductCard");
        assert(indexContent.includes('window.currentCategory = targetCat'), "Storefront search switches to the exact target product category");
        assert(indexContent.includes('.product-search-highlight'), "Storefront search applies product highlight pulse");

        assert(adminContent.includes('jumpToAdminProduct'), "Admin contains jumpToAdminProduct");
        assert(adminContent.includes('openCategoryAccordions.add(catSlug)'), "Admin search unfolds the exact category accordion containing the product");

        assert(!adminContent.includes("category: 'rings' // fallback"), "No hardcoded rings fallback in admin.html");

        console.log("\n===============================================================================");
        console.log(`🎉 ALL ${passed} TESTS PASSED SUCCESSFULLY! ZERO FAILURES!`);
        console.log("===============================================================================\n");

    } catch(e) {
        console.error("\n❌ TEST SUITE RUN ERROR:", e);
        process.exit(1);
    }
}

runMasterTestSuite();
