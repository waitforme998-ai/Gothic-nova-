const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

// Match all onclick attributes
const onclickRegex = /onclick=["']([^"']+)["']/gi;
let match;
const fnCalls = new Set();
const rawOnclicks = [];

while ((match = onclickRegex.exec(content)) !== null) {
    const raw = match[1].trim();
    rawOnclicks.push(raw);
    
    // Split on semicolon if multiple statements
    const parts = raw.split(';');
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        if (part.startsWith('event.')) continue;
        if (part.startsWith('document.')) continue;
        
        // Extract function name
        const fnNameMatch = part.match(/^([a-zA-Z0-9_$]+)\s*\(/);
        if (fnNameMatch) {
            fnCalls.add(fnNameMatch[1]);
        }
    }
}

console.log('Total onclick attributes found:', rawOnclicks.length);
console.log('Unique functions called by onclick:', Array.from(fnCalls).length);

const missing = [];
const found = [];

fnCalls.forEach(fn => {
    // Check if function is defined in scripts
    const hasDef = content.includes('function ' + fn) || 
                    content.includes(fn + ' =') || 
                    content.includes(fn + '=') || 
                    content.includes('window.' + fn);
    if (hasDef) {
        found.push(fn);
    } else {
        missing.push(fn);
    }
});

console.log('\n--- FOUND HANDLERS (' + found.length + ') ---');
found.sort().forEach(f => console.log('✓ ' + f));

console.log('\n--- MISSING HANDLERS (' + missing.length + ') ---');
missing.sort().forEach(f => console.log('✗ ' + f));
