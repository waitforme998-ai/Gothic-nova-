const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

// 1. Find all static buttons in admin.html
const buttonRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];
while ((match = buttonRegex.exec(content)) !== null) {
    const attrs = match[1];
    const inner = match[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const id = (attrs.match(/id=['"]([^'"]+)['"]/) || [])[1] || 'no-id';
    const onclick = (attrs.match(/onclick=['"]([^'"]+)['"]/) || [])[1] || 'no-onclick';
    const type = (attrs.match(/type=['"]([^'"]+)['"]/) || [])[1] || 'button';
    buttons.push({ id, onclick, inner, type });
}

console.log('Total static buttons in admin.html:', buttons.length);
buttons.forEach((b, idx) => {
    console.log(`${idx + 1}. [${b.id}] | onclick: ${b.onclick} | text: "${b.inner}"`);
});

// 2. Find dynamically rendered buttons in template strings
console.log('\n--- DYNAMICALLY RENDERED BUTTONS IN JS TEMPLATES ---');
const dynamicBtnRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
const jsSection = content.substring(content.indexOf('<script>'));
let dynMatch;
const dynButtons = [];
while ((dynMatch = dynamicBtnRegex.exec(jsSection)) !== null) {
    const attrs = dynMatch[1];
    const inner = dynMatch[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    const onclick = (attrs.match(/onclick=['"]([^'"]+)['"]/) || [])[1] || 'no-onclick';
    dynButtons.push({ onclick, inner });
}
console.log('Total dynamic template buttons:', dynButtons.length);
dynButtons.forEach((b, idx) => {
    console.log(`D${idx + 1}. onclick: ${b.onclick} | text: "${b.inner}"`);
});
