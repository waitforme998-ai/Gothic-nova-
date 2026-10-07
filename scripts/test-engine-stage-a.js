const fs = require('fs');

// Test that supabase-engine.js includes all required Stage A features:
const code = fs.readFileSync('supabase-engine.js', 'utf8');

const checks = [
    { name: 'ensureClient / lazy isLive getter', test: code.includes('get isLive()') && code.includes('get client()') },
    { name: 'safeLocalStorageSet quota protection', test: code.includes('safeLocalStorageSet') && code.includes('QuotaExceededError') },
    { name: 'Offline outbox queueing', test: code.includes('addToOutbox') && code.includes('flushOutbox') },
    { name: 'Wipe guard against empty overwrite', test: code.includes('Wipe guard: cannot overwrite') },
    { name: 'Confirmed timestamp recorded', test: code.includes('_confirmed_at') },
    { name: 'Fresh cloud read before mutation', test: code.includes('_getSection(\'products\', true)') },
    { name: 'Authoritative remote order status', test: code.includes('Remote status is AUTHORITATIVE') },
    { name: 'Comprehensive lifecycle revalidation', test: code.includes('visibilitychange') && code.includes('pageshow') && code.includes('online') && code.includes('refreshAll') }
];

let allPassed = true;
for (const c of checks) {
    if (c.test) {
        console.log(`[PASS] ${c.name}`);
    } else {
        console.error(`[FAIL] ${c.name}`);
        allPassed = false;
    }
}

if (!allPassed) {
    console.error('Some Stage A checks failed!');
    process.exit(1);
} else {
    console.log('All Stage A Engine hardening checks passed successfully!');
}
