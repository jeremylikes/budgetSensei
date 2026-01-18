// Main Application Coordinator
// This file orchestrates all modules and initializes the application

async function initializeApp() {
    try {
        // Load data from API
        const data = await API.loadData();
        DataStore.init(data);
        
        // Setup UI components
        UI.setupTabs();
        UI.setupDateSelectors();
        UI.setupTransactionModal();
        UI.populateCategoryMethodDropdowns();
        
        // Setup ledger sorting
        Ledger.setupSortableColumns();
        
        // Setup ledger filtering
        Ledger.setupFilters();
        
        // Setup select all checkbox
        Ledger.setupSelectAll();
        
        // Setup data management (categories & methods)
        DataManagement.setup();
        
        // Initialize views
        Dashboard.update();
        Ledger.update();
    } catch (error) {
        console.error('Error initializing app:', error);
        // Still try to set up tabs even if other initialization fails
        UI.setupTabs();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});
