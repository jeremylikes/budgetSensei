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
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-note').value = transaction.note || '';

            modal.style.display = 'block';
        }
    },

    async save() {
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const category = document.getElementById('transaction-category').value;
        const methodValue = document.getElementById('transaction-method').value;
        const method = methodValue || 'Default'; // Default if empty
        const recurring = 'none'; // Recurring is handled via the inline form, not the modal
        // Automatically determine type from category
        const type = DataStore.getCategoryType(category);
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
                // Update existing transaction (include recurring)
                response = await fetch(`${API.BASE}/transactions/${this.editingTransactionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, description, category, method, type, amount, note, recurring })
                });
            } else {
                // Add new transaction
                response = await fetch(`${API.BASE}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date, description, category, method, type, amount, note, recurring })
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

            // Check if this was a recurring transaction
            const responseData = await response.json();
            const recurringCount = responseData._recurringCount || 1;

            // Capture created transaction for history (only for new, single transactions)
            const createdTransaction = this.editingTransactionId === null && recurringCount === 1
                ? responseData
                : null;

            const data = await API.loadData();
            DataStore.init(data);

            const modal = document.getElementById('transaction-modal');
            if (modal) {
                modal.style.display = 'none';
                document.getElementById('transaction-form').reset();
            }
            this.editingTransactionId = null;

            // Record undo history for new transaction creation
            if (createdTransaction && window.LedgerHistory) {
                const t = createdTransaction;
                const baseBody = {
                    date: t.date,
                    description: t.description,
                    category: t.category,
                    method: t.method,
                    type: t.type,
                    amount: t.amount,
                    note: t.note || ''
                };

                const command = {
                    type: 'createTransaction',
                    transaction: { ...baseBody },
                    id: t.id,
                    async apply() {
                        // Re-create transaction
                        const response = await fetch(`${API.BASE}/transactions`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...baseBody, recurring: 'none' })
                        });
                        if (!response.ok) {
                            throw new Error('Failed to recreate transaction');
                        }
                        const created = await response.json();
                        this.id = created.id;

                        const data = await API.loadData();
                        DataStore.init(data);
                        if (window.Dashboard) Dashboard.update();
                        if (window.Ledger) Ledger.update();
                    },
                    async revert() {
                        if (!this.id) return;
                        const response = await fetch(`${API.BASE}/transactions/${this.id}`, {
                            method: 'DELETE'
                        });
                        if (!response.ok) {
                            throw new Error('Failed to delete transaction for undo');
                        }

                        const data = await API.loadData();
                        DataStore.init(data);
                        if (window.Dashboard) Dashboard.update();
                        if (window.Ledger) Ledger.update();
                    }
                };

                LedgerHistory.push(command);
            }

            // Log success message if multiple transactions were created
            if (recurringCount > 1) {
                console.log(`Created ${recurringCount} recurring transactions`);
            }
            
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

            // Capture transactions for history BEFORE deleting
            const transactionsToDelete = DataStore && Array.isArray(DataStore.transactions)
                ? DataStore.transactions.filter(t => checkedIds.includes(t.id))
                : [];

            if (confirm(`Are you sure you want to delete ${count} transaction${count > 1 ? 's' : ''} and any recurring transactions?`)) {
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

                    // Record history for bulk delete
                    if (window.LedgerHistory && transactionsToDelete.length > 0) {
                        const snapshot = transactionsToDelete.map(t => ({ ...t }));

                        const command = {
                            type: 'deleteTransactions',
                            transactions: snapshot,
                            async apply() {
                                // Re-delete current ids
                                const ids = this.transactions.map(t => t.id).filter(id => !!id);
                                const deletePromises = ids.map(async (tid) => {
                                    const resp = await fetch(`${API.BASE}/transactions/${tid}`, { method: 'DELETE' });
                                    if (!resp.ok) {
                                        throw new Error(`Failed to delete transaction ${tid}`);
                                    }
                                });
                                await Promise.all(deletePromises);

                                const data = await API.loadData();
                                DataStore.init(data);
                                if (window.Dashboard) Dashboard.update();
                                if (window.Ledger) Ledger.update();
                            },
                            async revert() {
                                // Recreate all deleted transactions
                                const recreatePromises = this.transactions.map(async (t, index) => {
                                    const body = {
                                        date: t.date,
                                        description: t.description,
                                        category: t.category,
                                        method: t.method,
                                        type: t.type,
                                        amount: t.amount,
                                        note: t.note || '',
                                        recurring: 'none'
                                    };
                                    const resp = await fetch(`${API.BASE}/transactions`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(body)
                                    });
                                    if (!resp.ok) {
                                        throw new Error('Failed to recreate transaction');
                                    }
                                    const created = await resp.json();
                                    // Update stored id so redo can delete the right rows
                                    this.transactions[index].id = created.id;
                                });

                                await Promise.all(recreatePromises);

                                const data = await API.loadData();
                                DataStore.init(data);
                                if (window.Dashboard) Dashboard.update();
                                if (window.Ledger) Ledger.update();
                            }
                        };

                        LedgerHistory.push(command);
                    }
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
            if (confirm('Are you sure you want to delete this transaction and any recurring transactions?')) {
                try {
                    // Capture transaction for history BEFORE deleting
                    const transaction = DataStore && Array.isArray(DataStore.transactions)
                        ? DataStore.transactions.find(t => t.id === id)
                        : null;

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

                    // Record history for single delete
                    if (window.LedgerHistory && transaction) {
                        const snapshot = { ...transaction };

                        const command = {
                            type: 'deleteTransaction',
                            transaction: snapshot,
                            async apply() {
                                if (!this.transaction.id) return;
                                const resp = await fetch(`${API.BASE}/transactions/${this.transaction.id}`, {
                                    method: 'DELETE'
                                });
                                if (!resp.ok) {
                                    throw new Error('Failed to delete transaction');
                                }

                                const data = await API.loadData();
                                DataStore.init(data);
                                if (window.Dashboard) Dashboard.update();
                                if (window.Ledger) Ledger.update();
                            },
                            async revert() {
                                const t = this.transaction;
                                const body = {
                                    date: t.date,
                                    description: t.description,
                                    category: t.category,
                                    method: t.method,
                                    type: t.type,
                                    amount: t.amount,
                                    note: t.note || '',
                                    recurring: 'none'
                                };
                                const resp = await fetch(`${API.BASE}/transactions`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(body)
                                });
                                if (!resp.ok) {
                                    throw new Error('Failed to recreate transaction');
                                }
                                const created = await resp.json();
                                this.transaction.id = created.id;

                                const data = await API.loadData();
                                DataStore.init(data);
                                if (window.Dashboard) Dashboard.update();
                                if (window.Ledger) Ledger.update();
                            }
                        };

                        LedgerHistory.push(command);
                    }
                } catch (error) {
                    console.error('Error deleting transaction:', error);
                    console.error('Error details:', error.message, error.stack);
                    alert(`Failed to delete transaction: ${error.message || 'Please try again.'}`);
                }
            }
        }
    }
};

// Make available globally
window.Transactions = Transactions;
