// Transaction Operations - Available globally as Transactions

const Transactions = {
    editingTransactionId: null,

    async edit(id) {
        const data = await API.loadData();
        DataStore.init(data);
        const transaction = DataStore.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.editingTransactionId = id;
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            document.querySelector('#transaction-modal h2').textContent = 'Edit Transaction';
            
            UI.populateCategoryMethodDropdowns();
            
            document.getElementById('transaction-date').value = transaction.date;
            document.getElementById('transaction-description').value = transaction.description;
            document.getElementById('transaction-category').value = transaction.category;
            document.getElementById('transaction-method').value = transaction.method;
            document.getElementById('transaction-type').value = transaction.type;
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-note').value = transaction.note || '';

            modal.style.display = 'block';
        }
    },

    async save() {
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const category = document.getElementById('transaction-category').value;
        const method = document.getElementById('transaction-method').value;
        const type = document.getElementById('transaction-type').value;
        const amountValue = document.getElementById('transaction-amount').value.trim();
        const amount = parseFloat(amountValue);
        const note = document.getElementById('transaction-note').value.trim();
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        try {
            let response;
            if (this.editingTransactionId !== null) {
                // Update existing transaction
                response = await fetch(`${API.BASE}/transactions/${this.editingTransactionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, description, category, method, type, amount, note })
                });
            } else {
                // Add new transaction
                response = await fetch(`${API.BASE}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, description, category, method, type, amount, note })
                });
            }
            
            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = 'Failed to save transaction. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                    console.error('Server error:', errorData);
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);
                }
                throw new Error(errorMessage);
            }

            const data = await API.loadData();
            DataStore.init(data);

            const modal = document.getElementById('transaction-modal');
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('transaction-form').reset();
            }
            this.editingTransactionId = null;
            
            Dashboard.update();
            Ledger.update();
        } catch (error) {
            console.error('Error saving transaction:', error);
            
            // Provide more helpful error messages
            let errorMessage = 'Failed to save transaction. ';
            if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
                errorMessage += 'The server may not be running. Please make sure the server is started on port 3000.';
            } else {
                errorMessage += error.message || 'Please try again.';
            }
            
            alert(errorMessage);
        }
    },

    async delete(id) {
        // Check for bulk deletion
        const tbody = document.getElementById('ledger-tbody');
        if (!tbody) {
            console.error('Ledger tbody not found');
            return;
        }
        
        const checkedRows = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:checked');
        
        if (checkedRows.length > 0) {
            // Bulk delete
            const checkedIds = Array.from(checkedRows).map(checkbox => {
                const row = checkbox.closest('tr');
                return parseInt(row.dataset.id);
            }).filter(id => !isNaN(id)); // Filter out invalid IDs
            
            if (checkedIds.length === 0) {
                alert('No valid transactions selected for deletion.');
                return;
            }
            
            const count = checkedIds.length;
            if (confirm(`Are you sure you want to delete ${count} transaction${count > 1 ? 's' : ''}?`)) {
                try {
                    // Delete all checked transactions and check responses
                    const deletePromises = checkedIds.map(async (id) => {
                        const response = await fetch(`${API.BASE}/transactions/${id}`, { method: 'DELETE' });
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.error || `Failed to delete transaction ${id}`);
                        }
                        return response.json();
                    });
                    
                    await Promise.all(deletePromises);
                    
                    // Reload data and update views
                    const data = await API.loadData();
                    DataStore.init(data);
                    Dashboard.update();
                    Ledger.update();
                } catch (error) {
                    console.error('Error deleting transactions:', error);
                    console.error('Error details:', error.message, error.stack);
                    alert(`Failed to delete transactions: ${error.message || 'Please try again.'}`);
                    
                    // Still try to refresh the view in case some deletions succeeded
                    try {
                        const data = await API.loadData();
                        DataStore.init(data);
                        Dashboard.update();
                        Ledger.update();
                    } catch (refreshError) {
                        console.error('Error refreshing after failed delete:', refreshError);
                    }
                }
            }
        } else {
            // Single delete
            if (confirm('Are you sure you want to delete this transaction?')) {
                try {
                    const response = await fetch(`${API.BASE}/transactions/${id}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to delete transaction');
                    }
                    
                    const data = await API.loadData();
                    DataStore.init(data);
                    Dashboard.update();
                    Ledger.update();
                } catch (error) {
                    console.error('Error deleting transaction:', error);
                    console.error('Error details:', error.message, error.stack);
                    alert(`Failed to delete transaction: ${error.message || 'Please try again.'}`);
                }
            }
        }
    }
};
