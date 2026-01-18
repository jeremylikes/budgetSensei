// Main Application Coordinator
// This file orchestrates all modules and initializes the application

async function initializeApp() {
    try {
        // Load data from API
        const data = await API.loadData();
        DataStore.init(data);
        
        // Debug: Log data loading
        console.log('Data loaded:', {
            transactions: DataStore.transactions.length,
            income: DataStore.income.length,
            expenses: DataStore.expenses.length,
            methods: DataStore.methods.length
        });
        
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
        
        // Update category lists immediately after setup (they're called in setup, but ensure they run)
        DataManagement.updateIncomeList();
        DataManagement.updateExpensesList();
        DataManagement.updateMethodsList();
        
        // Initialize views - ensure everything is ready before updating
        // Use multiple animation frames to ensure DOM is fully rendered and data is ready
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Small delay to ensure all DOM manipulation is complete
                setTimeout(() => {
                    // Verify DataStore has been initialized and has data
                    if (DataStore && Array.isArray(DataStore.transactions)) {
                        console.log('Updating Dashboard with', DataStore.transactions.length, 'transactions');
                        // Check if Dashboard tab is active/visible before updating
                        const dashboardTab = document.getElementById('dashboard');
                        if (dashboardTab && dashboardTab.classList.contains('active')) {
                            // Force update Dashboard with current data
                            Dashboard.update();
                        }
                        Ledger.update();
                    } else {
                        console.warn('DataStore not ready, will retry...');
                        // Retry after a longer delay
                        setTimeout(() => {
                            if (DataStore && Array.isArray(DataStore.transactions)) {
                                console.log('Retrying Dashboard update with', DataStore.transactions.length, 'transactions');
                                const dashboardTab = document.getElementById('dashboard');
                                if (dashboardTab && dashboardTab.classList.contains('active')) {
                                    Dashboard.update();
                                }
                                Ledger.update();
                            }
                        }, 200);
                    }
                }, 100);
            });
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        // Still try to set up tabs even if other initialization fails
        UI.setupTabs();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Setup login screen UI first
    Auth.setupLoginScreen();
    
    // Check authentication
    const isAuthenticated = await Auth.checkSession();
    if (!isAuthenticated) {
        Auth.showLoginScreen();
        return;
    }
    
    // User is authenticated, proceed with app initialization
    Auth.hideLoginScreen();
    await initializeApp();
});
