const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const functionsToCheck = [
    'togglePasswordVisibility',
    'openAdminExpandingSearch',
    'triggerUnifiedFileInput',
    'resumeBulkDraft',
    'confirmDiscardBulkDraft',
    'universalAdminRefresh',
    'clearOrderInlineSearch',
    'setOrderFilter',
    'openProductModal',
    'createCategoryFromManagement',
    'toggleAddReviewForm',
    'createReviewFromInlineForm',
    'saveAnnouncementsFromAdmin',
    'closeDeleteModal',
    'closeAllModals',
    'confirmClearBulkQueue',
    'startBulkNamingWizard',
    'addMoreFilesToBatch',
    'showBulkReviewScreen',
    'confirmDiscardBulkBatch',
    'returnToBulkWizard',
    'commitBatchToStore',
    'saveSingleProduct',
    'saveReviewFromModal',
    'closePaymentProofModal',
    'clearAdminSearch',
    'closeAdminExpandingSearch',
    'applyAdminSearchQuery',
    'quickDeleteProductCard',
    'adjustCatalogStock',
    'openEditProductModal',
    'quickRestockProduct',
    'setAdminCategoryFilter',
    'promptRenameCategory',
    'handleCategoryDeleteClick',
    'toggleOrderStatusDropdown',
    'deleteOrderAdmin',
    'openPaymentProofModal',
    'openAddReviewInlineForm',
    'toggleReviewAccordion',
    'deleteReviewAdmin',
    'saveReviewInline',
    'removeSingleStockImage',
    'removeBulkWizardItem',
    'removeWizardStockImage',
    'triggerWizardStockUpload',
    'toggleWizardBulkCategoryDropdown',
    'viewOrderDetailsSheet'
];

console.log("Checking all " + functionsToCheck.length + " handler functions in admin.html:");
let missing = 0;
functionsToCheck.forEach(fn => {
    const hasDecl = content.includes('function ' + fn) || content.includes(fn + ' =') || content.includes('window.' + fn);
    if (hasDecl) {
        console.log(`✓ ${fn} is defined`);
    } else {
        console.log(`✗ MISSING: ${fn}`);
        missing++;
    }
});

console.log("\nTotal missing functions: " + missing);
