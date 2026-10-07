const fs = require('fs');
const vm = require('vm');

function checkHtmlScripts(filename) {
    const html = fs.readFileSync(filename, 'utf8');
    const regex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null) {
        count++;
        const code = match[1];
        try {
            new vm.Script(code);
        } catch (e) {
            console.error(`Syntax error in ${filename} script #${count}:`, e.message);
            process.exit(1);
        }
    }
    console.log(`Verified ${count} inline scripts in ${filename}: All valid syntax.`);
}

checkHtmlScripts('index.html');
checkHtmlScripts('admin.html');
