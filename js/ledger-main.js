// Ledger Main Coordinator - Available globally as Ledger
// This file orchestrates all ledger modules

const Ledger = {
    update() {
        const year = parseInt(document.getElementById('ledger-year').value);
        const month = parseInt(document.getElementById('ledger-month').value);

        let filtered = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
        
        // Apply sorting
        if (window.LedgerSorting) {
            filtered = Utils.sortTransactions(filtered, LedgerSorting.sortColumn, LedgerSorting.sortDirection);
        } else {
            filtered = Utils.sortTransactions(filtered, 'date', 'desc');
        }

        const tbody = document.getElementById('ledger-tbody');
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No transactions found for this month.</td></tr>';
            if (window.LedgerSum) {
                LedgerSum.update();
            }
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
    },

    setupSortableColumns() {
        if (window.LedgerSorting) {
            LedgerSorting.setup();
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
