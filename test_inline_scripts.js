const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    const srcMatch = match[0].match(/src=["'](.*?)["']/i);
    if (!srcMatch) {
        try {
            new Function(match[1]);
            console.log(`Script #${count}: OK (${match[1].length} chars)`);
        } catch(e) {
            console.error(`Syntax error in inline script #${count}:`, e.message);
        }
    } else {
        console.log(`Script #${count} external: ${srcMatch[1]}`);
    }
}
console.log('Tested all inline scripts, total count:', count);
