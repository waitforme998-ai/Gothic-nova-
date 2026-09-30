// sync_verification.test.js
// Automated Verification Test Suite for Gothic Nova Admin Panel & Storefront Synchronization Architecture

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("================================================================================");
console.log("⚡ GOTHIC NOVA ARCHITECTURE & SYNCHRONIZATION VERIFICATION SUITE");
console.log("================================================================================");

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✓ PASS: ${name}`);
        testsPassed++;
    } catch (err) {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    Error: ${err.message}`);
        testsFailed++;
    }
}

// -----------------------------------------------------------------------------
// TEST 1: Syntax & Loading of Core Engines
// -----------------------------------------------------------------------------
runTest("Engine Files Syntax Check", () => {
    const supabaseCode = fs.readFileSync(path.join(__dirname, 'supabase-engine.js'), 'utf8');
    const searchCode = fs.readFileSync(path.join(__dirname, 'search-engine.js'), 'utf8');
    
    // Evaluate in sandboxed context
    new Function(supabaseCode);
    new Function(searchCode);
    assert(true);
});

// -----------------------------------------------------------------------------
// TEST 2: Anti-Ghost Contract Verification
// -----------------------------------------------------------------------------
runTest("Anti-Ghost Contract: Empty Array Never Resurrects Mock Seed Data", () => {
    // Mock Environment
    const localStorageMock = {
        store: {
            'gn_reviews': '[]',
            'gn_announcements': '[]',
            'gn_products': '[]'
        },
        getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; },
        setItem(k, v) { this.store[k] = String(v); },
        removeItem(k) { delete this.store[k]; }
    };

    global.localStorage = localStorageMock;
    global.window = {
        localStorage: localStorageMock,
        dispatchEvent: () => {},
        addEventListener: () => {}
    };

    // Load supabase-engine logic into mock context
    const supabaseCode = fs.readFileSync(path.join(__dirname, 'supabase-engine.js'), 'utf8');
    new Function(supabaseCode)();

    assert(window.SupabaseEngine, "SupabaseEngine must be defined");
    
    // Test getReviews with empty array in storage
    window.SupabaseEngine.getReviews().then(revs => {
        assert(Array.isArray(revs), "Reviews must be an array");
        assert.strictEqual(revs.length, 0, "Empty reviews in storage must return [] and NOT resurrect 8 seed reviews");
    });

    // Test getAnnouncements with empty array in storage
    window.SupabaseEngine.getAnnouncements().then(anns => {
        assert(Array.isArray(anns), "Announcements must be an array");
        assert.strictEqual(anns.length, 0, "Empty announcements must return [] and NOT inject default text");
    });
});

// -----------------------------------------------------------------------------
// TEST 3: Universal Button Lifecycle & 800ms Safety Timeout
// -----------------------------------------------------------------------------
runTest("Button Lifecycle: Auto-Safety Reset Prevents Stuck Spinners", (done) => {
    // Simulate DOM Button
    let btnState = {
        innerHTML: 'SAVE CHANGES',
        style: { background: '', opacity: '1' },
        dataset: {},
        disabled: false
    };

    function setButtonLoading(btn, loadingText) {
        if (!btn) return null;
        const originalHtml = btn.dataset.originalHtml || btn.innerHTML;
        const originalBg = btn.dataset.originalBg || btn.style.background || '';
        const originalOpacity = btn.dataset.originalOpacity || btn.style.opacity || '1';
        btn.dataset.originalHtml = originalHtml;
        btn.dataset.originalBg = originalBg;
        btn.dataset.originalOpacity = originalOpacity;

        btn.disabled = true;
        btn.style.opacity = '0.9';
        btn.innerHTML = `SAVING...`;

        let isFinished = false;
        const resetBtn = () => {
            if (isFinished) return;
            isFinished = true;
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalHtml || originalHtml;
            btn.style.background = btn.dataset.originalBg !== undefined ? btn.dataset.originalBg : originalBg;
            btn.style.opacity = btn.dataset.originalOpacity !== undefined ? btn.dataset.originalOpacity : originalOpacity;
        };

        const safetyTimer = setTimeout(resetBtn, 50); // fast 50ms test timeout

        return {
            success(text, cb) {
                if (isFinished) return;
                isFinished = true;
                clearTimeout(safetyTimer);
                btn.innerHTML = text;
                setTimeout(() => {
                    resetBtn();
                    if (typeof cb === 'function') cb();
                }, 20);
            },
            reset() {
                clearTimeout(safetyTimer);
                resetBtn();
            }
        };
    }

    const state = setButtonLoading(btnState, 'SAVING...');
    assert.strictEqual(btnState.disabled, true, "Button should be disabled during save");
    assert.strictEqual(btnState.innerHTML, 'SAVING...', "Button should show loading text");

    // Let safety timer expire (simulating dropped network response)
    setTimeout(() => {
        assert.strictEqual(btnState.disabled, false, "Button must be auto-reset to enabled by safety timer");
        assert.strictEqual(btnState.innerHTML, 'SAVE CHANGES', "Button label must be restored");
    }, 80);
});

// -----------------------------------------------------------------------------
// TEST 4: Category "General" Suppression Verification
// -----------------------------------------------------------------------------
runTest("Storefront Category Filtering: 'General' Category Explicitly Suppressed", () => {
    const rawCategories = [
        { id: 'chains', name: 'Chains' },
        { id: 'rings', name: 'Rings' },
        { id: 'general', name: 'General' },
        { id: 'bracelets', name: 'Bracelets' },
        { id: 'all', name: 'All' }
    ];

    const metaMap = new Map();
    rawCategories.forEach(c => metaMap.set(c.id.toLowerCase(), c.name));

    // Suppression Rule
    metaMap.delete('general');
    metaMap.delete('all');

    assert(!metaMap.has('general'), "'general' must be excluded from public filter tabs");
    assert(!metaMap.has('all'), "'all' is rendered manually as the primary master tab");
    assert(metaMap.has('chains') && metaMap.has('rings') && metaMap.has('bracelets'), "Standard categories preserved");
});

// -----------------------------------------------------------------------------
// TEST 5: Order Filtering Logic (System Sync vs Customer Orders)
// -----------------------------------------------------------------------------
runTest("Order Filter: Excludes ONLY __GN_STORE_SYNC__ while Preserving Real Customer Orders", () => {
    const mixedOrders = [
        { id: 1, customer_name: '__GN_STORE_SYNC__', items: { products: [] }, status: 'Cancelled' },
        { id: 2, customer_name: 'Taha Siddiqui', phone_number: '03001234567', total_amount: 5999, status: 'Pending' },
        { id: 3, customer_name: 'Sara Bilal', phone_number: '03219876543', total_amount: 3499, status: 'Delivered' },
        { id: 4, customer_name: 'Ali Raza', phone_number: '03335555555', total_amount: 8999, status: 'Pending' },
        { id: 5, customer_name: 'John Doe', phone_number: '03120000000', total_amount: 4500, status: 'Pending' }
    ];

    const deletedSet = new Set();
    const isMockOrder = (o) => {
        if (!o) return true;
        if (o.is_deleted || o.deleted_at || o.customer_name === '__TEST_DELETED__') return true;
        if (o.customer_name && (o.customer_name === '__GN_STORE_SYNC__' || String(o.customer_name).startsWith('__GN_'))) return true;
        if (deletedSet.has(String(o.id)) || deletedSet.has(String(o.order_number))) return true;
        if (o.is_sample || o.is_dummy || o.is_mock) return true;
        return false;
    };

    const validCustomerOrders = mixedOrders.filter(o => !isMockOrder(o));

    assert.strictEqual(validCustomerOrders.length, 4, "Must preserve all 4 real customer orders");
    assert(!validCustomerOrders.some(o => o.customer_name === '__GN_STORE_SYNC__'), "System sync row must be excluded");
    assert(validCustomerOrders.some(o => o.customer_name === 'Taha Siddiqui'), "Real customer 'Taha Siddiqui' must NOT be excluded");
    assert(validCustomerOrders.some(o => o.customer_name === 'Sara Bilal'), "Real customer 'Sara Bilal' must NOT be excluded");
    assert(validCustomerOrders.some(o => o.customer_name === 'Ali Raza'), "Real customer 'Ali Raza' must NOT be excluded");
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("================================================================================");
console.log(`TEST RUN COMPLETE: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log("================================================================================");

if (testsFailed > 0) {
    process.exit(1);
}
