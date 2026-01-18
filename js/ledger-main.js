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
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No transactions found for this month.</td></tr>';
            if (window.LedgerSum) {
                LedgerSum.update();
            }
            // Update select all checkbox (will be disabled)
            this.updateSelectAllCheckbox();
            return;
        }

        filtered.forEach(t => {
            const row = window.LedgerTable ? window.LedgerTable.createRow(t) : null;
            if (row) {
                tbody.appendChild(row);
            }
        });
        
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
