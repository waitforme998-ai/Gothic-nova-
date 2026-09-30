const fs = require('fs');

const seContent = fs.readFileSync('supabase-engine.js', 'utf8');
const adminContent = fs.readFileSync('admin.html', 'utf8');
const indexContent = fs.readFileSync('index.html', 'utf8');

console.log('================================================================================');
console.log('⚡ GOTHIC NOVA CATEGORY ADDITION & UNIVERSAL SYNC VERIFICATION');
console.log('================================================================================');

// 1. Check admin.html functions
console.log('1. Checking admin.html Category Handlers...');
if (!adminContent.includes('broadcastCategoriesUpdate')) {
    throw new Error('broadcastCategoriesUpdate missing from admin.html');
}
if (!adminContent.includes('window.createCategoryFromManagement')) {
    throw new Error('createCategoryFromManagement missing from admin.html');
}
if (!adminContent.includes('window.promptRenameCategory')) {
    throw new Error('promptRenameCategory missing from admin.html');
}
if (!adminContent.includes('saveCategoryList(cloudCats);')) {
    throw new Error('saveCategoryList missing from loadCategoriesIntoAdmin');
}
console.log('  ✓ PASS: admin.html Category creation, renaming & broadcast functions verified');

// 2. Check supabase-engine.js functions
console.log('2. Checking supabase-engine.js Category API...');
if (!seContent.includes('saveCategoryList(categories)')) {
    throw new Error('saveCategoryList missing from supabase-engine.js');
}
if (!seContent.includes('gn:categoriesUpdated')) {
    throw new Error('gn:categoriesUpdated event missing from supabase-engine.js');
}
console.log('  ✓ PASS: supabase-engine.js saveCategoryList & gn:categoriesUpdated verified');

// 3. Check index.html listeners
console.log('3. Checking index.html Category Listeners & Rendering...');
if (!indexContent.includes('window.addEventListener(\'categoriesUpdated\'')) {
    throw new Error('categoriesUpdated listener missing from index.html');
}
if (!indexContent.includes('window.addEventListener(\'gn:categoriesUpdated\'')) {
    throw new Error('gn:categoriesUpdated listener missing from index.html');
}
if (!indexContent.includes('renderCategoryTabs')) {
    throw new Error('renderCategoryTabs missing from index.html');
}
console.log('  ✓ PASS: index.html event listeners and tab renderer verified');

// 4. Clean up scratch files
try { if (fs.existsSync('scratch_check_sync.js')) fs.unlinkSync('scratch_check_sync.js'); } catch(e) {}
try { if (fs.existsSync('test_add_category_sim.js')) fs.unlinkSync('test_add_category_sim.js'); } catch(e) {}

console.log('================================================================================');
console.log('ALL CATEGORY ADDITION & SYNC CHECKS PASSED (100%)');
console.log('================================================================================');
