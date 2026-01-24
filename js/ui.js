// UI Setup - Available globally as UI

const UI = {
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                try {
                    const targetTab = btn.getAttribute('data-tab');
                    
                    if (!targetTab) {
                        console.error('Tab button missing data-tab attribute');
                        return;
                    }
                    
                    const targetElement = document.getElementById(targetTab);
                    if (!targetElement) {
                        console.error(`Tab content element not found: ${targetTab}`);
                        return;
                    }
                    
                    tabButtons.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    btn.classList.add('active');
                    targetElement.classList.add('active');
                    
                    // Sync date selectors when switching tabs
                    const dashboardYear = document.getElementById('dashboard-year');
                    const dashboardMonth = document.getElementById('dashboard-month');
                    const ledgerYear = document.getElementById('ledger-year');
                    const ledgerMonth = document.getElementById('ledger-month');
                    
                    if (targetTab === 'dashboard' && ledgerYear && ledgerMonth && dashboardYear && dashboardMonth) {
                        // Sync ledger to dashboard
                        dashboardYear.value = ledgerYear.value;
                        dashboardMonth.value = ledgerMonth.value;
                    } else if (targetTab === 'ledger' && dashboardYear && dashboardMonth && ledgerYear && ledgerMonth) {
                        // Sync dashboard to ledger
                        ledgerYear.value = dashboardYear.value;
                        ledgerMonth.value = dashboardMonth.value;
                    }
                    
                    // Update content after a brief delay to ensure tab is visible first
                    setTimeout(() => {
                        try {
                            if (targetTab === 'dashboard') {
                                Dashboard.update();
                            } else if (targetTab === 'ledger') {
                                Ledger.update();
                            } else if (targetTab === 'settings') {
                                if (window.UserSettings && window.UserSettings.loadUserData) {
                                    UserSettings.loadUserData();
                                }
                            }
                        } catch (error) {
                            console.error(`Error updating ${targetTab} tab:`, error);
                        }
                    }, 0);
                } catch (error) {
                    console.error('Error switching tabs:', error);
                }
            });
        });
    },

    setupDateSelectors() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        // Populate years (2015 to 2100)
        const yearSelects = document.querySelectorAll('.year-select');
        yearSelects.forEach(select => {
            for (let year = 2015; year <= 2100; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) option.selected = true;
                select.appendChild(option);
            }
        });

        // Populate months
        const monthSelects = document.querySelectorAll('.month-select');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        monthSelects.forEach(select => {
            monthNames.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index + 1;
                option.textContent = month;
                if (index + 1 === currentMonth) option.selected = true;
                select.appendChild(option);
            });
        });

        // Sync function to keep selectors in sync
        const syncDateSelectors = (sourceYearId, sourceMonthId, targetYearId, targetMonthId) => {
            const sourceYear = document.getElementById(sourceYearId);
            const sourceMonth = document.getElementById(sourceMonthId);
            const targetYear = document.getElementById(targetYearId);
            const targetMonth = document.getElementById(targetMonthId);
            
            if (sourceYear && sourceMonth && targetYear && targetMonth) {
                targetYear.value = sourceYear.value;
                targetMonth.value = sourceMonth.value;
            }
        };

        // Add change listeners with synchronization
        const dashboardYear = document.getElementById('dashboard-year');
        const dashboardMonth = document.getElementById('dashboard-month');
        const ledgerYear = document.getElementById('ledger-year');
        const ledgerMonth = document.getElementById('ledger-month');

        if (dashboardYear) {
            dashboardYear.addEventListener('change', () => {
                syncDateSelectors('dashboard-year', 'dashboard-month', 'ledger-year', 'ledger-month');
                Dashboard.update();
            });
        }

        if (dashboardMonth) {
            dashboardMonth.addEventListener('change', () => {
                syncDateSelectors('dashboard-year', 'dashboard-month', 'ledger-year', 'ledger-month');
                Dashboard.update();
            });
        }

        if (ledgerYear) {
            ledgerYear.addEventListener('change', () => {
                syncDateSelectors('ledger-year', 'ledger-month', 'dashboard-year', 'dashboard-month');
                // Clear filters when month/year changes
                if (window.LedgerFiltering) {
                    window.LedgerFiltering.clearAllFilters();
                }
                Ledger.update();
            });
        }

        if (ledgerMonth) {
            ledgerMonth.addEventListener('change', () => {
                syncDateSelectors('ledger-year', 'ledger-month', 'dashboard-year', 'dashboard-month');
                // Clear filters when month/year changes
                if (window.LedgerFiltering) {
                    window.LedgerFiltering.clearAllFilters();
                }
                Ledger.update();
            });
        }
    },

    setupTransactionModal() {
        // Setup Add Transaction button in the filter strip
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                Ledger.addNewInlineRow();
            });
        }

        // Keep modal setup for backward compatibility (if modal still exists)
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            const cancelBtn = document.getElementById('cancel-transaction');
            const form = document.getElementById('transaction-form');
            const closeBtn = document.querySelector('.close');

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                    if (form) form.reset();
                    Transactions.editingTransactionId = null;
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                    if (form) form.reset();
                    Transactions.editingTransactionId = null;
                });
            }

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    Transactions.save();
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    if (form) form.reset();
                    Transactions.editingTransactionId = null;
                }
            });
        }

        // Validate amount input (7 whole numbers, 2 decimals)
        const amountInput = document.getElementById('transaction-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                let value = e.target.value;
                
                // Remove any non-digit or non-decimal characters (allow digits and single decimal point)
                value = value.replace(/[^\d.]/g, '');
                
                // Prevent multiple decimal points - keep only the first one
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                
                // Split by decimal point
                const finalParts = value.split('.');
                
                // Limit whole number part to 7 digits
                if (finalParts[0].length > 7) {
                    finalParts[0] = finalParts[0].substring(0, 7);
                }
                
                // Limit decimal part to 2 digits
                if (finalParts.length > 1 && finalParts[1].length > 2) {
                    finalParts[1] = finalParts[1].substring(0, 2);
                }
                
                // Reconstruct value
                e.target.value = finalParts.join('.');
            });
            
            // Format on blur to ensure 2 decimal places if decimal entered
            amountInput.addEventListener('blur', (e) => {
                let value = e.target.value.trim();
                if (value && !isNaN(value)) {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        // Format to 2 decimal places
                        e.target.value = num.toFixed(2);
                    }
                }
            });
        }
        
        // Add Enter key handler to all form inputs to save when form is valid
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Check if form is valid by checking all required fields
                const date = document.getElementById('transaction-date')?.value;
                const description = document.getElementById('transaction-description')?.value.trim();
                const category = document.getElementById('transaction-category')?.value;
                const method = document.getElementById('transaction-method')?.value;
                const amountValue = document.getElementById('transaction-amount')?.value.trim();
                const amount = parseFloat(amountValue);
                
                // Form is valid if all required fields are filled and amount is valid
                // Method is optional
                const isValid = date && 
                               description && 
                               category && 
                               amountValue &&
                               !isNaN(amount) && 
                               amount > 0;
                
                // Only save if form is valid
                if (isValid) {
                    Transactions.save();
                }
            }
        };
        
        // Add Enter key listeners to all form inputs
        const dateInput = document.getElementById('transaction-date');
        const descInput = document.getElementById('transaction-description');
        const catSelect = document.getElementById('transaction-category');
        const methodSelect = document.getElementById('transaction-method');
        const noteTextarea = document.getElementById('transaction-note');
        
        if (dateInput) dateInput.addEventListener('keydown', handleEnterKey);
        if (descInput) descInput.addEventListener('keydown', handleEnterKey);
        if (amountInput) amountInput.addEventListener('keydown', handleEnterKey);
        if (catSelect) catSelect.addEventListener('keydown', handleEnterKey);
        if (methodSelect) methodSelect.addEventListener('keydown', handleEnterKey);
        if (noteTextarea) noteTextarea.addEventListener('keydown', handleEnterKey);
    },

    populateCategoryMethodDropdowns() {
        const categorySelect = document.getElementById('transaction-category');
        const methodSelect = document.getElementById('transaction-method');

        if (categorySelect) {
            categorySelect.innerHTML = '';
            // Combine income and expenses, sort alphabetically
            // Handle both old format (strings) and new format (objects with name)
            let allCategories = [
                ...(DataStore.income || []).map(c => typeof c === 'string' ? c : (c.name || c)),
                ...(DataStore.expenses || []).map(c => typeof c === 'string' ? c : (c.name || c))
            ].filter(cat => cat !== 'Default'); // Filter out Default
            
            // If no user-defined categories exist, include Default as a fallback
            if (allCategories.length === 0) {
                allCategories = ['Default'];
            }
            
            allCategories.sort((a, b) => a.localeCompare(b));
            allCategories.forEach(catName => {
                const option = document.createElement('option');
                option.value = catName;
                // Get icon if available
                const categoryIcon = DataStore.getCategoryIcon(catName);
                if (categoryIcon) {
                    option.textContent = `${categoryIcon} ${catName}`;
                } else {
                    option.textContent = catName;
                }
                categorySelect.appendChild(option);
            });
        }

        if (methodSelect) {
            methodSelect.innerHTML = '';
            // Get methods, filter out Default unless it's the only option
            // Handle both old format (strings) and new format (objects with name)
            let methods = [...DataStore.methods]
                .map(m => typeof m === 'string' ? m : (m.name || m))
                .filter(m => m !== 'Default');
            
            // If no user-defined methods exist, include Default as a fallback
            if (methods.length === 0) {
                methods = ['Default'];
            }
            
            // Sort methods alphabetically
            methods.sort((a, b) => a.localeCompare(b));
            methods.forEach(methodName => {
                const option = document.createElement('option');
                option.value = methodName;
                // Get icon if available
                const methodData = DataStore.methods.find(m => {
                    const mName = typeof m === 'string' ? m : (m.name || m);
                    return mName === methodName;
                });
                const methodIcon = (methodData && typeof methodData === 'object' && methodData.icon) ? methodData.icon : '';
                if (methodIcon) {
                    option.textContent = `${methodIcon} ${methodName}`;
                } else {
                    option.textContent = methodName;
                }
                methodSelect.appendChild(option);
            });
        }
    }
};
