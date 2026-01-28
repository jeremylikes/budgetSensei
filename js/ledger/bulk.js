// Bulk Operations - Available globally as LedgerBulk

const LedgerBulk = {
    async updateField(field, value, currentTransactionId = null, options = {}) {
        const { skipHistory = false } = options;
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

            // Capture "before" values for history (except for recurring generation)
            const changesForHistory = [];

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

                // Only include recurring if it's being set (for generating duplicates)
                if (field === 'recurring' && value && value !== 'none') {
                    updateData.recurring = value;
                }

                // Capture "before" based on field
                if (!skipHistory && field !== 'recurring') {
                    let beforeValue;
                    if (field === 'amount') {
                        beforeValue = transaction.amount;
                    } else if (field === 'note') {
                        beforeValue = transaction.note || '';
                    } else if (field === 'category') {
                        beforeValue = {
                            category: transaction.category,
                            type: transaction.type
                        };
                    } else {
                        beforeValue = transaction[field];
                    }
                    changesForHistory.push({ id, before: beforeValue });
                }

                // Update the specific field
                if (field === 'amount') {
                    updateData.amount = parseFloat(value);
                } else if (field === 'note') {
                    // For notes, ensure empty string is saved (not null/undefined)
                    updateData.note = value || '';
                } else if (field === 'category') {
                    // When category changes, automatically update type based on category
                    updateData.category = value;
                    updateData.type = DataStore.getCategoryType(value);
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

            // Record history (only for non-recurring field updates)
            if (!skipHistory && field !== 'recurring' && window.LedgerHistory && changesForHistory.length > 0) {
                const afterValue = value;

                const command = {
                    type: 'bulkUpdateField',
                    field,
                    changes: changesForHistory,
                    async apply() {
                        // Re-apply new value to all affected transactions
                        const applyPromises = changesForHistory.map(change => {
                            return LedgerBulk.updateTransactionField(change.id, field, afterValue, { skipHistory: true });
                        });
                        await Promise.all(applyPromises);
                    },
                    async revert() {
                        // Restore previous values
                        const revertPromises = changesForHistory.map(change => {
                            if (field === 'category' && change.before && typeof change.before === 'object') {
                                return LedgerBulk.updateTransactionField(change.id, 'category', change.before.category, { skipHistory: true });
                            }
                            return LedgerBulk.updateTransactionField(change.id, field, change.before, { skipHistory: true });
                        });
                        await Promise.all(revertPromises);
                    }
                };

                LedgerHistory.push(command);
            }

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

    async updateTransactionField(id, field, value, options = {}) {
        const { skipHistory = false } = options;
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
        
        // Capture "before" for history
        let beforeValue = null;
        if (!skipHistory) {
            if (field === 'amount') {
                beforeValue = transaction.amount;
            } else if (field === 'note') {
                beforeValue = transaction.note || '';
            } else if (field === 'category') {
                beforeValue = {
                    category: transaction.category,
                    type: transaction.type
                };
            } else {
                beforeValue = transaction[field];
            }
        }

        // Update the specific field
        if (field === 'amount') {
            updateData.amount = parseFloat(value);
        } else if (field === 'note') {
            // For notes, ensure empty string is saved (not null/undefined)
            updateData.note = value || '';
        } else if (field === 'category') {
            // When category changes, automatically update type based on category
            updateData.category = value;
            updateData.type = DataStore.getCategoryType(value);
        } else if (field === 'recurring') {
            // For recurring, only include it if it's set (to generate duplicates)
            // Don't store it in the database
            if (value && value !== 'none') {
                updateData.recurring = value;
            }
        } else {
            updateData[field] = value;
        }
        
        console.log(`[updateTransactionField] Updating transaction ${id}, field: ${field}, value: ${value}`);

        const response = await fetch(`${API.BASE}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update transaction');
        }
        
        // Get the updated transaction from response
        const updatedTransaction = await response.json();

        // Refresh data and update views
        const refreshedData = await API.loadData();
        DataStore.init(refreshedData);

        // Record history for single-field updates (when not part of an undo/redo)
        if (!skipHistory && window.LedgerHistory && field !== 'recurring') {
            const command = {
                type: 'singleUpdateField',
                field,
                id,
                before: beforeValue,
                after: value,
                async apply() {
                    await LedgerBulk.updateTransactionField(id, field, value, { skipHistory: true });
                },
                async revert() {
                    if (field === 'category' && beforeValue && typeof beforeValue === 'object') {
                        await LedgerBulk.updateTransactionField(id, 'category', beforeValue.category, { skipHistory: true });
                    } else {
                        await LedgerBulk.updateTransactionField(id, field, beforeValue, { skipHistory: true });
                    }
                }
            };
            LedgerHistory.push(command);
        }

        // Trigger updates
        if (window.Dashboard) {
            window.Dashboard.update();
        }
        if (window.Ledger) {
            window.Ledger.update();
        }

        // Return the updated transaction for caller to use
        return updatedTransaction;
    }
};

// Make available globally
window.LedgerBulk = LedgerBulk;
