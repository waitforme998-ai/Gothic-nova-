const fs = require('fs');

function auditHtml(filename) {
    console.log(`\n========================================`);
    console.log(`AUDITING ${filename}`);
    console.log(`========================================`);
    const content = fs.readFileSync(filename, 'utf8');
    const onclickRegex = /onclick=["']([^"']+)["']/gi;
    let match;
    const fnCalls = new Set();
    const rawOnclicks = [];

    while ((match = onclickRegex.exec(content)) !== null) {
        const raw = match[1].trim();
        rawOnclicks.push(raw);
        const parts = raw.split(';');
        for (let part of parts) {
            part = part.trim();
            if (!part || part.startsWith('event.') || part.startsWith('document.')) continue;
            const fnNameMatch = part.match(/^([a-zA-Z0-9_$]+)\s*\(/);
            if (fnNameMatch) {
                const name = fnNameMatch[1];
                if (['if', 'for', 'switch', 'while', 'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout'].includes(name)) continue;
                fnCalls.add(name);
            }
        }
    }

    console.log(`Total onclick attributes: ${rawOnclicks.length}`);
    console.log(`Unique functions called: ${fnCalls.size}`);

    const missing = [];
    const found = [];

    fnCalls.forEach(fn => {
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

    console.log(`✓ Found: ${found.length}`);
    if (missing.length > 0) {
        console.log(`✗ Missing (${missing.length}):`, missing);
    } else {
        console.log(`🎉 ALL ${found.length} HANDLERS VERIFIED 100%!`);
    }

    return { file: filename, total: rawOnclicks.length, unique: fnCalls.size, found: found.length, missing };
}

const resAdmin = auditHtml('admin.html');
const resIndex = auditHtml('index.html');
