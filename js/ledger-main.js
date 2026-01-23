// Ledger Main Coordinator - Available globally as Ledger
// This file orchestrates all ledger modules

const Ledger = {
    update() {
        const year = parseInt(document.getElementById('ledger-year').value);
        const month = parseInt(document.getElementById('ledger-month').value);

        let filtered = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
        
        // Apply filters
        if (window.LedgerFiltering) {
            filtered = window.LedgerFiltering.applyFilters(filtered);
        }
        
        // Apply sorting
        if (window.LedgerSorting) {
            filtered = Utils.sortTransactions(filtered, LedgerSorting.sortColumn, LedgerSorting.sortDirection);
        } else {
            filtered = Utils.sortTransactions(filtered, 'date', 'desc');
        }

        const tbody = document.getElementById('ledger-tbody');
        
        // Preserve new row if it exists
        const existingNewRow = tbody.querySelector('tr.new-row');
        let newRowData = null;
        if (existingNewRow) {
            // Save the new row's input values
            // Note: data-field is on the input/select elements, not the td
            newRowData = {
                date: existingNewRow.querySelector('input[data-field="date"]')?.value || '',
                description: existingNewRow.querySelector('input[data-field="description"]')?.value || '',
                category: existingNewRow.querySelector('select[data-field="category"]')?.value || '',
                method: existingNewRow.querySelector('select[data-field="method"]')?.value || '',
                type: existingNewRow.querySelector('select[data-field="type"]')?.value || 'Expense',
                amount: existingNewRow.querySelector('input[data-field="amount"]')?.value || '',
                note: existingNewRow.querySelector('textarea')?.value || '',
                recurring: existingNewRow.querySelector('button.recurring-btn')?.dataset.recurring || 'none'
            };
        }
        
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No transactions found for this month.</td></tr>';
            
            // Restore new row if it existed
            if (newRowData && window.LedgerNewRow) {
                window.LedgerNewRow.add();
                this.restoreNewRowData(newRowData);
            }
            
            if (window.LedgerSum) {
                LedgerSum.update();
            }
            // Update select all checkbox (will be disabled)
            this.updateSelectAllCheckbox();
            this.updateAddTransactionButton();
            return;
        }

        filtered.forEach(t => {
            const row = window.LedgerTable ? window.LedgerTable.createRow(t) : null;
            if (row) {
                tbody.appendChild(row);
            }
        });
        
        // Restore new row at the top if it existed
        if (newRowData && window.LedgerNewRow) {
            window.LedgerNewRow.add();
            this.restoreNewRowData(newRowData);
        }
        
        // Update sort indicators
        if (window.LedgerSorting) {
            LedgerSorting.updateIndicators();
        }
        
        // Update sum display
        if (window.LedgerSum) {
            LedgerSum.update();
        }

        // Update select all checkbox
        this.updateSelectAllCheckbox();
        this.updateAddTransactionButton();
    },
    
    restoreNewRowData(newRowData) {
        const newRow = document.querySelector('tr.new-row');
        if (!newRow) return;
        
        // Restore input values
        // Note: data-field is on the input/select elements, not the td
        const dateInput = newRow.querySelector('input[data-field="date"]');
        const descInput = newRow.querySelector('input[data-field="description"]');
        const catSelect = newRow.querySelector('select[data-field="category"]');
        const methodSelect = newRow.querySelector('select[data-field="method"]');
        const typeSelect = newRow.querySelector('select[data-field="type"]');
        const amountInput = newRow.querySelector('input[data-field="amount"]');
        const noteTextarea = newRow.querySelector('textarea');
        const recurringBtn = newRow.querySelector('button.recurring-btn');
        
        if (dateInput) dateInput.value = newRowData.date;
        if (descInput) descInput.value = newRowData.description;
        if (catSelect) catSelect.value = newRowData.category;
        if (methodSelect) methodSelect.value = newRowData.method;
        if (typeSelect) typeSelect.value = newRowData.type;
        if (amountInput) amountInput.value = newRowData.amount;
        if (noteTextarea) noteTextarea.value = newRowData.note;
        if (recurringBtn) {
            recurringBtn.dataset.recurring = newRowData.recurring;
            // Restore the yellow highlight if recurring was set
            if (window.LedgerNewRow && window.LedgerNewRow.updateRecurringButtonStyle) {
                window.LedgerNewRow.updateRecurringButtonStyle(recurringBtn, newRowData.recurring);
            }
        }
        
        // Re-validate the row
        if (window.LedgerNewRow && window.LedgerNewRow.validate) {
            window.LedgerNewRow.validate(newRow);
        }
        
        // Re-attach escape handler if it was set
        if (window.LedgerNewRow && window.LedgerNewRow.escapeHandler) {
            // Remove old handler if exists
            document.removeEventListener('keydown', window.LedgerNewRow.escapeHandler);
            // Re-add it
            document.addEventListener('keydown', window.LedgerNewRow.escapeHandler);
        }
    },
    
    updateAddTransactionButton() {
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        const hasNewRow = document.querySelector('tr.new-row') !== null;
        
        if (addTransactionBtn) {
            addTransactionBtn.disabled = hasNewRow;
            if (hasNewRow) {
                addTransactionBtn.style.opacity = '0.6';
                addTransactionBtn.style.cursor = 'not-allowed';
            } else {
                addTransactionBtn.style.opacity = '1';
                addTransactionBtn.style.cursor = 'pointer';
            }
        }
    },

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (!selectAllCheckbox) return;

        const tbody = document.getElementById('ledger-tbody');
        const checkboxes = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:not([disabled])');
        
        // Disable if no transactions
        if (checkboxes.length === 0) {
            selectAllCheckbox.disabled = true;
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            return;
        }

        selectAllCheckbox.disabled = false;

        // Check if all are selected
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = Array.from(checkboxes).some(cb => cb.checked);

        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    },

    setupSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (!selectAllCheckbox) return;

        selectAllCheckbox.addEventListener('change', (e) => {
            const tbody = document.getElementById('ledger-tbody');
            const checkboxes = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:not([disabled])');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });

            // Update sum display
            if (window.LedgerSum) {
                LedgerSum.update();
            }
        });
    },

    setupSortableColumns() {
        if (window.LedgerSorting) {
            LedgerSorting.setup();
        }
    },

    setupFilters() {
        if (window.LedgerFiltering) {
            LedgerFiltering.setup();
        }
    },

    addNewInlineRow() {
        if (window.LedgerNewRow) {
            LedgerNewRow.add();
        }
    }
};

// Make Ledger available globally
window.Ledger = Ledger;
