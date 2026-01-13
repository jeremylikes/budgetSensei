// Bulk Operations - Available globally as LedgerBulk

const LedgerBulk = {
    async updateField(field, value, currentTransactionId = null) {
        const tbody = document.getElementById('ledger-tbody');
        const checkedRows = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:checked');
        
        const checkedIds = new Set();
        
        // Add all checked transaction IDs
        checkedRows.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const id = parseInt(row.dataset.id);
            if (id) checkedIds.add(id);
        });
        
        // Also include the current row being edited if it has an ID (in case checkbox wasn't found)
        if (currentTransactionId) {
            checkedIds.add(currentTransactionId);
        }
        
        if (checkedIds.size === 0) {
            console.warn('No checked transactions found for bulk update');
            return;
        }
        
        console.log(`Bulk updating ${checkedIds.size} transactions: ${field} = ${value}`);
        
        try {
            // Load latest data first
            const data = await API.loadData();
            DataStore.init(data);
            
            // Update all checked transactions in parallel
            const updatePromises = Array.from(checkedIds).map(async (id) => {
                const transaction = DataStore.transactions.find(t => t.id === id);
                if (!transaction) return;
                
                const updateData = {
                    date: transaction.date,
                    description: transaction.description,
                    category: transaction.category,
                    method: transaction.method,
                    type: transaction.type,
                    amount: transaction.amount,
                    note: transaction.note || ''
                };
                
                // Update the specific field
                if (field === 'amount') {
                    updateData.amount = parseFloat(value);
                } else if (field === 'note') {
                    // For notes, ensure empty string is saved (not null/undefined)
                    updateData.note = value || '';
                } else {
                    updateData[field] = value;
                }
                
                const response = await fetch(`${API.BASE}/transactions/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) throw new Error(`Failed to update transaction ${id}`);
            });
            
            await Promise.all(updatePromises);
            
            // Refresh data once after all updates
            const refreshedData = await API.loadData();
            DataStore.init(refreshedData);
            
            // Trigger updates
            if (window.Dashboard) {
                window.Dashboard.update();
            }
            if (window.Ledger) {
                window.Ledger.update();
            }
        } catch (error) {
            console.error('Error bulk updating transactions:', error);
            alert('Failed to update some transactions. Please try again.');
            throw error; // Re-throw to be caught by caller
        }
    },

    async updateTransactionField(id, field, value) {
        const data = await API.loadData();
        DataStore.init(data);
        const transaction = DataStore.transactions.find(t => t.id === id);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        const updateData = {
            date: transaction.date,
            description: transaction.description,
            category: transaction.category,
            method: transaction.method,
            type: transaction.type,
            amount: transaction.amount,
            note: transaction.note || ''
        };
        
        // Update the specific field
        if (field === 'amount') {
            updateData.amount = parseFloat(value);
        } else if (field === 'note') {
            // For notes, ensure empty string is saved (not null/undefined)
            updateData.note = value || '';
        } else {
            updateData[field] = value;
        }
        
        const response = await fetch(`${API.BASE}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update transaction');
        }
        
        // Refresh data and update views
        const refreshedData = await API.loadData();
        DataStore.init(refreshedData);
        
        // Trigger updates
        if (window.Dashboard) {
            window.Dashboard.update();
        }
        if (window.Ledger) {
            window.Ledger.update();
        }
    }
};

// Make available globally
window.LedgerBulk = LedgerBulk;
