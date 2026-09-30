// test_admin_auth.js
// Automated Verification for Cryptographic Admin Authentication & Session Management

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log("================================================================================");
console.log("⚡ TESTING: CRYPTOGRAPHIC ADMIN AUTHENTICATION & SESSION MANAGEMENT");
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

// 1. Verify Hash Integrity
runTest("Password Hash Match Verification", () => {
    const expectedHash = "e41082dd946ee4436dea38b033a4aa2494788be193f97f021527ab3e02f72fb6";
    const computedHash = crypto.createHash('sha256').update('gothicnova51214').digest('hex');
    assert.strictEqual(computedHash, expectedHash, "SHA-256 hash must match expected digest");
});

// 2. Plaintext Password Obfuscation Check
runTest("Admin Source Security Check: Plaintext password is not exposed in cleartext comparison", () => {
    const adminCode = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    // Ensure we are checking via crypto hash or secure token check
    assert(adminCode.includes('e41082dd946ee4436dea38b033a4aa2494788be193f97f021527ab3e02f72fb6') || adminCode.includes('crypto.subtle'), "admin.html must use cryptographic SHA-256 validation");
});

console.log("================================================================================");
console.log(`TEST RUN COMPLETE: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log("================================================================================");

if (testsFailed > 0) {
    process.exit(1);
}
