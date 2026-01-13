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
                    
                    // Update content after a brief delay to ensure tab is visible first
                    setTimeout(() => {
                        try {
                            if (targetTab === 'dashboard') {
                                Dashboard.update();
                            } else if (targetTab === 'ledger') {
                                Ledger.update();
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

        // Add change listeners
        document.getElementById('dashboard-year').addEventListener('change', () => Dashboard.update());
        document.getElementById('dashboard-month').addEventListener('change', () => Dashboard.update());
        document.getElementById('ledger-year').addEventListener('change', () => Ledger.update());
        document.getElementById('ledger-month').addEventListener('change', () => Ledger.update());
    },

    setupTransactionModal() {
        // Setup inline add button
        const addInlineBtn = document.getElementById('add-transaction-inline-btn');
        if (addInlineBtn) {
            addInlineBtn.addEventListener('click', () => {
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
    },

    populateCategoryMethodDropdowns() {
        const categorySelect = document.getElementById('transaction-category');
        const methodSelect = document.getElementById('transaction-method');

        if (categorySelect) {
            categorySelect.innerHTML = '';
            // Sort categories alphabetically
            const sortedCategories = [...DataStore.categories].sort((a, b) => a.localeCompare(b));
            sortedCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
            });
        }

        if (methodSelect) {
            methodSelect.innerHTML = '';
            // Sort methods alphabetically
            const sortedMethods = [...DataStore.methods].sort((a, b) => a.localeCompare(b));
            sortedMethods.forEach(method => {
                const option = document.createElement('option');
                option.value = method;
                option.textContent = method;
                methodSelect.appendChild(option);
            });
        }
    }
};
