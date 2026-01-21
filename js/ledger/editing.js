// Inline Editing - Available globally as LedgerEditing

const LedgerEditing = {
    setupRow(row) {
        const cells = row.querySelectorAll('.editable-cell');
        
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                // If clicking on the input itself while editing this cell, don't do anything
                const existingInput = cell.querySelector('.inline-edit-input');
                if (existingInput && existingInput.contains(e.target)) {
                    return;
                }
                
                // Don't trigger if clicking on the note box itself (we want to edit the cell)
                if (e.target.closest('.note-box')) {
                    // Allow clicking through to edit the cell
                }
                
                // Stop propagation to prevent mousedown handler from interfering
                e.stopPropagation();
                // enterEditMode will handle closing any other editing fields first
                this.enterEditMode(row, cell);
            });
        });
    },

    enterEditMode(row, cell) {
        // Hide any active tooltip when entering edit mode
        if (window.LedgerTooltips) {
            window.LedgerTooltips.hide();
        }
        
        // First, close ALL other editing fields in ANY row (including this row if editing different cell)
        // Get all editing inputs directly - more reliable than querying rows
        const allEditingInputs = document.querySelectorAll('.inline-edit-input');
        
        allEditingInputs.forEach(editingInput => {
            const editingCell = editingInput.closest('td.editing');
            const editingRow = editingInput.closest('tr.editing');
            
            if (editingCell && editingRow && (editingRow !== row || editingCell !== cell)) {
                // Get the current value and field before closing
                const editingField = editingCell.dataset.field;
                const editingValue = editingInput.value.trim();
                const originalValue = editingCell.dataset.value;
                const editingTransactionId = parseInt(editingRow.dataset.id);
                
                // If value changed, save it
                if (editingValue !== originalValue) {
                    // Validate amount if needed
                    if (editingField === 'amount') {
                        const amount = parseFloat(editingValue);
                        if (isNaN(amount) || amount <= 0) {
                            // Invalid amount, cancel edit
                            this.exitEditMode(editingRow, editingCell, editingField, originalValue, true);
                            return;
                        }
                    }
                    
                    // Check if bulk editing
                    const checkbox = editingRow.querySelector('.row-checkbox');
                    const isChecked = checkbox && checkbox.checked;
                    
                    if (isChecked && editingTransactionId) {
                        // Bulk edit - save in background
                        if (window.LedgerBulk) {
                            window.LedgerBulk.updateField(editingField, editingValue, editingTransactionId).catch(err => {
                                console.error('Error saving field when switching edits:', err);
                            });
                        }
                    } else if (editingTransactionId) {
                        // Single edit - save in background
                        if (window.LedgerBulk) {
                            window.LedgerBulk.updateTransactionField(editingTransactionId, editingField, editingValue).catch(err => {
                                console.error('Error saving field when switching edits:', err);
                            });
                        }
                    }
                }
                
                // Immediately exit edit mode for this cell (don't wait for save)
                this.exitEditMode(editingRow, editingCell, editingField, editingValue !== originalValue ? editingValue : originalValue, editingValue === originalValue);
            }
        });
        
        // Also check for any rows with editing class but no input (cleanup)
        const allEditingRows = document.querySelectorAll('tr.editing');
        allEditingRows.forEach(editingRow => {
            if (!editingRow.querySelector('.inline-edit-input')) {
                editingRow.classList.remove('editing');
                const editingCell = editingRow.querySelector('td.editing');
                if (editingCell) editingCell.classList.remove('editing');
            }
        });
        
        const field = cell.dataset.field;
        const currentValue = cell.dataset.value;
        const transactionId = parseInt(row.dataset.id);
        
        row.classList.add('editing');
        cell.classList.add('editing');
        
        let input = this.createInput(field, currentValue);
        
        input.className = 'inline-edit-input';
        cell.textContent = '';
        cell.appendChild(input);
        input.focus();
        if (input.select) input.select();
        
        // Save on blur or Enter key
        const saveEdit = async () => {
            const newValue = input.value.trim();
            if (newValue === currentValue) {
                this.cancelEdit(row, cell, currentValue);
                return;
            }
            
            // Validate amount
            if (field === 'amount') {
                const amount = parseFloat(newValue);
                if (isNaN(amount) || amount <= 0) {
                    alert('Please enter a valid amount greater than 0');
                    this.cancelEdit(row, cell, currentValue);
                    return;
                }
            }
            
            // Check if this row is checked for bulk editing
            const checkbox = row.querySelector('.row-checkbox');
            const isChecked = checkbox && checkbox.checked;
            
            // Remove editing classes before update (since update() will rebuild table)
            row.classList.remove('editing');
            cell.classList.remove('editing');
            
            try {
                if (isChecked && window.LedgerBulk) {
                    // Bulk edit: apply to all checked rows (including this one)
                    await window.LedgerBulk.updateField(field, newValue, transactionId);
                    // updateField already calls Ledger.update() which refreshes everything
                } else if (window.LedgerBulk) {
                    // Single row update
                    await window.LedgerBulk.updateTransactionField(transactionId, field, newValue);
                    // updateTransactionField already calls Ledger.update() which refreshes everything
                }
            } catch (error) {
                console.error('Error saving field:', error);
                alert('Failed to save changes. Please try again.');
                // Restore editing state on error so user can try again
                row.classList.add('editing');
                cell.classList.add('editing');
                cell.textContent = '';
                cell.appendChild(input);
                input.focus();
            }
        };
        
        const cancelEdit = (row, cell, originalValue) => {
            this.exitEditMode(row, cell, field, originalValue, true);
        };
        
        // Use flags to control save behavior
        let isSaving = false;
        let shouldCancel = false;
        
        const handleSave = async () => {
            if (isSaving || shouldCancel) return;
            isSaving = true;
            try {
                await saveEdit();
            } finally {
                isSaving = false;
            }
        };
        
        input.addEventListener('blur', () => {
            // Small delay to allow Escape key handler to set shouldCancel flag
            setTimeout(() => {
                if (!shouldCancel) {
                    handleSave();
                } else {
                    shouldCancel = false; // Reset flag
                }
            }, 10);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // For textarea (note field), allow Enter for newlines
                // For other inputs, Enter saves
                if (field === 'note' && input.tagName === 'TEXTAREA') {
                    // Allow Enter to create newlines in textarea
                    return;
                } else {
                    e.preventDefault();
                    input.blur(); // Triggers saveEdit
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                // Set flag to prevent save, then cancel
                shouldCancel = true;
                input.blur(); // Remove focus
                cancelEdit(row, cell, currentValue);
            } else if (e.key === 'Enter' && e.ctrlKey && field === 'note') {
                // Ctrl+Enter saves for note textarea
                e.preventDefault();
                input.blur(); // Triggers saveEdit
            } else if (e.key === 'Tab') {
                // Tab key saves and moves to next field
                e.preventDefault();
                input.blur(); // Triggers saveEdit
                // After save, focus will naturally move to next element
            }
        });
    },

    createInput(field, currentValue) {
        let input;
        
        if (field === 'category') {
            input = document.createElement('select');
            // Combine income and expenses, sort alphabetically
            // Handle both old format (strings) and new format (objects with name)
            let allCategories = [
                ...(DataStore.income || []).map(c => typeof c === 'string' ? c : (c.name || c)),
                ...(DataStore.expenses || []).map(c => typeof c === 'string' ? c : (c.name || c))
            ].filter(cat => cat !== 'Default'); // Filter out Default
            
            // If no user-defined categories exist, include Default as a fallback
            // Also include Default if the current transaction is using it (for orphaned transactions)
            if (allCategories.length === 0 || currentValue === 'Default') {
                if (!allCategories.includes('Default')) {
                    allCategories.push('Default');
                }
            }
            
            allCategories.sort((a, b) => a.localeCompare(b));
            allCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                if (cat === currentValue) option.selected = true;
                input.appendChild(option);
            });
            
            // Auto-update type when category changes
            input.addEventListener('change', () => {
                const row = input.closest('tr');
                if (row) {
                    const newCategory = input.value;
                    const newType = DataStore.getCategoryType(newCategory);
                    // Update the transaction type in the background (not displayed, but stored)
                    row.dataset.transactionType = newType;
                    // Update amount cell color immediately
                    const amountCell = row.querySelector('td[data-field="amount"]');
                    if (amountCell) {
                        amountCell.classList.remove('amount-income', 'amount-expense');
                        if (newType === 'Income') {
                            amountCell.classList.add('amount-income');
                        } else {
                            amountCell.classList.add('amount-expense');
                        }
                        amountCell.dataset.transactionType = newType;
                    }
                }
            });
        } else if (field === 'method') {
            input = document.createElement('select');
            DataStore.methods.forEach(method => {
                const option = document.createElement('option');
                option.value = method;
                option.textContent = method;
                if (method === currentValue) option.selected = true;
                input.appendChild(option);
            });
        } else if (field === 'date') {
            input = document.createElement('input');
            input.type = 'date';
            input.value = currentValue;
        } else if (field === 'amount') {
            input = document.createElement('input');
            input.type = 'text';
            input.value = currentValue;
            input.style.textAlign = 'right';
        } else if (field === 'note') {
            input = document.createElement('textarea');
            input.value = currentValue || '';
            input.rows = 3;
            input.maxLength = 40;
            input.style.width = '100%';
            input.style.minWidth = '200px';
            input.style.resize = 'vertical';
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = currentValue;
            if (field === 'description') {
                input.maxLength = 40;
            }
        }
        
        return input;
    },

    exitEditMode(row, cell, field, value, isCancel = false) {
        row.classList.remove('editing');
        cell.classList.remove('editing');
        
        const input = cell.querySelector('.inline-edit-input');
        if (input) input.remove();
        
        if (isCancel) {
            // Restore original value
            const originalData = JSON.parse(row.dataset.originalData);
            value = originalData[field];
        }
        
        // Check if bulk editing - update all checked rows visually
        const checkbox = row.querySelector('.row-checkbox');
        const isChecked = checkbox && checkbox.checked && !isCancel;
        
        if (isChecked) {
            // Update all checked rows visually
            const tbody = document.getElementById('ledger-tbody');
            const checkedRows = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:checked');
            
            checkedRows.forEach(cb => {
                const checkedRow = cb.closest('tr');
                const checkedCell = checkedRow.querySelector(`td[data-field="${field}"]`);
                if (checkedCell && checkedCell !== cell && window.LedgerTable) {
                    window.LedgerTable.updateCellDisplay(checkedCell, field, value);
                }
            });
        }
        
        // Update current cell
        if (window.LedgerTable) {
            window.LedgerTable.updateCellDisplay(cell, field, value);
        }
    },

    cancelEdit(row, cell, originalValue) {
        const field = cell.dataset.field;
        this.exitEditMode(row, cell, field, originalValue, true);
    }
};

// Make available globally
window.LedgerEditing = LedgerEditing;
