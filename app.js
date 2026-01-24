// Main Application Coordinator
// This file orchestrates all modules and initializes the application

// Update username greeting in user menu
function updateUsernameGreeting() {
    const greeting = document.getElementById('username-greeting');
    if (greeting && Auth.currentUser && Auth.currentUser.username) {
        greeting.textContent = `Hi, ${Auth.currentUser.username}-Sensei`;
    } else if (greeting) {
        greeting.textContent = '';
    }
}

// Handle sign out from user menu
async function handleSignOut() {
    if (Auth && Auth.logout) {
        try {
            const success = await Auth.logout();
            // Wait for logout to fully complete
            await new Promise(resolve => setTimeout(resolve, 200));
            Auth.showLoginScreen();
            location.reload();
        } catch (error) {
            console.error('Error during logout:', error);
            // Still show login screen even if logout request failed
            Auth.showLoginScreen();
            location.reload();
        }
    }
}

// Setup user menu dropdown
function setupUserMenu() {
    const userBtn = document.getElementById('user-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (!userBtn || !userMenu) return;
    
    // Update username greeting
    updateUsernameGreeting();
    
    // Toggle menu on button click
    userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!userBtn.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.remove('show');
        }
    });
    
    // Handle menu items
    const menuItems = userMenu.querySelectorAll('.user-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            userMenu.classList.remove('show');
            
            if (item.id === 'user-menu-settings') {
                // Switch to Settings tab
                const settingsTab = document.getElementById('settings');
                if (settingsTab) {
                    // Hide all tabs
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    document.querySelectorAll('.tab-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    // Show settings tab
                    settingsTab.classList.add('active');
                    // Initialize user settings - always call init to ensure event listeners are attached
                    setTimeout(() => {
                        console.log('Initializing settings page...');
                        console.log('window.UserSettings:', window.UserSettings);
                        console.log('UserSettings type:', typeof window.UserSettings);
                        
                        if (window.UserSettings && typeof window.UserSettings === 'object') {
                            // Always re-initialize to ensure event listeners are attached when tab becomes visible
                            if (typeof window.UserSettings.init === 'function') {
                                console.log('Calling UserSettings.init()');
                                // Reset initialized flag to force re-setup
                                window.UserSettings.initialized = false;
                                window.UserSettings.init();
                            } else {
                                console.error('UserSettings.init is not a function!', window.UserSettings);
                            }
                        } else {
                            console.error('UserSettings not found on window! Available globals:', Object.keys(window).filter(k => k.includes('User') || k.includes('Settings')));
                        }
                    }, 150);
                }
            } else if (item.id === 'user-menu-signout') {
                // Handle sign out
                handleSignOut();
            }
        });
    });
}

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
        setupUserMenu();
        
        // Update Add Transaction button state on initial load
        if (window.Ledger && window.Ledger.updateAddTransactionButton) {
            window.Ledger.updateAddTransactionButton();
        }
        
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
        
        // Initialize user settings
        if (window.UserSettings && window.UserSettings.init) {
            UserSettings.init();
        }
        
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
    
    // Handle URL parameters (verification, password reset, etc.)
    Auth.handleUrlParameters();
    
    // Check if we're on a special page that doesn't require auth
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify') === 'email' ? urlParams.get('token') : null;
    const resetToken = urlParams.get('reset') === 'password' ? urlParams.get('token') : null;
    const verified = urlParams.get('verified') === 'true';
    const emailAssociated = urlParams.get('email_associated') === 'true';
    
    // If we're on a verification or reset page, don't check auth yet
    if (verifyToken || resetToken || verified || emailAssociated) {
        return; // Let handleUrlParameters handle the display
    }
    
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
