// Ledger functionality - Available globally as Ledger

const Ledger = {
    sortColumn: 'date',
    sortDirection: 'desc',

    update() {
        const year = parseInt(document.getElementById('ledger-year').value);
        const month = parseInt(document.getElementById('ledger-month').value);

        let filtered = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
        
        // Apply sorting
        filtered = Utils.sortTransactions(filtered, this.sortColumn, this.sortDirection);

        const tbody = document.getElementById('ledger-tbody');
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No transactions found for this month.</td></tr>';
            return;
        }

        filtered.forEach(t => {
            const row = this.createEditableRow(t);
            tbody.appendChild(row);
        });
        
        // Update sort indicators
        this.updateSortIndicators();
        
        // Update sum display
        this.updateSum();
    },

    createEditableRow(t) {
        const row = document.createElement('tr');
        row.dataset.id = t.id;
        const note = t.note || '';
        
        // Checkbox cell
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkbox.addEventListener('change', () => this.updateSum());
        checkboxCell.appendChild(checkbox);
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.className = 'editable-cell';
        dateCell.textContent = Utils.formatDate(t.date);
        dateCell.dataset.field = 'date';
        dateCell.dataset.value = t.date;
        
        // Description cell
        const descCell = document.createElement('td');
        descCell.className = 'editable-cell';
        descCell.textContent = t.description;
        descCell.dataset.field = 'description';
        descCell.dataset.value = t.description;
        
        // Category cell
        const catCell = document.createElement('td');
        catCell.className = 'editable-cell';
        catCell.textContent = t.category;
        catCell.dataset.field = 'category';
        catCell.dataset.value = t.category;
        
        // Method cell
        const methodCell = document.createElement('td');
        methodCell.className = 'editable-cell';
        methodCell.textContent = t.method;
        methodCell.dataset.field = 'method';
        methodCell.dataset.value = t.method;
        
        // Type cell
        const typeCell = document.createElement('td');
        typeCell.className = 'editable-cell';
        typeCell.textContent = t.type;
        typeCell.dataset.field = 'type';
        typeCell.dataset.value = t.type;
        
        // Amount cell
        const amountCell = document.createElement('td');
        amountCell.className = 'editable-cell';
        amountCell.textContent = Utils.formatCurrency(t.amount);
        amountCell.dataset.field = 'amount';
        amountCell.dataset.value = t.amount;
        
        // Note cell (editable)
        const noteCell = document.createElement('td');
        noteCell.className = 'note-cell editable-cell';
        noteCell.dataset.field = 'note';
        noteCell.dataset.value = note || '';
        const noteBox = document.createElement('div');
        noteBox.className = 'note-box';
        if (note && note.trim()) {
            noteBox.classList.add('has-note');
            noteBox.setAttribute('data-note', note);
            // Don't set title attribute - we use custom JavaScript tooltip instead
            // Setting title would show native browser tooltip (white text) alongside our custom one
        }
        noteCell.appendChild(noteBox);
        
        // Delete button cell
        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => Transactions.delete(t.id);
        deleteCell.appendChild(deleteBtn);
        
        row.appendChild(checkboxCell);
        row.appendChild(dateCell);
        row.appendChild(descCell);
        row.appendChild(catCell);
        row.appendChild(methodCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(noteCell);
        row.appendChild(deleteCell);
        
        // Store original values for cancel
        row.dataset.originalData = JSON.stringify({
            date: t.date,
            description: t.description,
            category: t.category,
            method: t.method,
            type: t.type,
            amount: t.amount,
            note: note
        });
        
        // Add click handlers for inline editing
        this.setupInlineEditing(row);
        
        return row;
    },

    setupInlineEditing(row) {
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
        
        // Note: Click-away is now handled in enterEditMode with mousedown for better responsiveness
    },

    enterEditMode(row, cell) {
        // Hide any active tooltip when entering edit mode
        hideNoteTooltip();
        
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
                        this.bulkUpdateField(editingField, editingValue, editingTransactionId).catch(err => {
                            console.error('Error saving field when switching edits:', err);
                        });
                    } else if (editingTransactionId) {
                        // Single edit - save in background
                        this.updateTransactionField(editingTransactionId, editingField, editingValue).catch(err => {
                            console.error('Error saving field when switching edits:', err);
                        });
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
        
        let input;
        
        if (field === 'category') {
            input = document.createElement('select');
            DataStore.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                if (cat === currentValue) option.selected = true;
                input.appendChild(option);
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
        } else if (field === 'type') {
            input = document.createElement('select');
            ['Income', 'Expense'].forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                if (type === currentValue) option.selected = true;
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
            input.maxLength = 20;
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
                if (isChecked) {
                    // Bulk edit: apply to all checked rows (including this one)
                    await this.bulkUpdateField(field, newValue, transactionId);
                    // bulkUpdateField already calls this.update() which refreshes everything
                    // No need to call exitEditMode since table is rebuilt
                } else {
                    // Single row update
                    await this.updateTransactionField(transactionId, field, newValue);
                    // updateTransactionField already calls this.update() which refreshes everything
                    // No need to call exitEditMode since table is rebuilt
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
        
        // Note: Click-away is handled by a single global handler (see below)
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
                if (checkedCell && checkedCell !== cell) {
                    this.updateCellDisplay(checkedCell, field, value);
                }
            });
        }
        
        // Update current cell
        this.updateCellDisplay(cell, field, value);
    },

    updateCellDisplay(cell, field, value) {
        if (field === 'date') {
            cell.textContent = Utils.formatDate(value);
            cell.dataset.value = value;
        } else if (field === 'amount') {
            cell.textContent = Utils.formatCurrency(parseFloat(value));
            cell.dataset.value = value;
        } else if (field === 'note') {
            // Update note box display
            cell.textContent = ''; // Clear cell
            const noteBox = document.createElement('div');
            noteBox.className = 'note-box';
            const noteValue = value || '';
            if (noteValue && noteValue.trim()) {
                noteBox.classList.add('has-note');
                noteBox.setAttribute('data-note', noteValue);
                // Don't set title attribute - we use custom JavaScript tooltip instead
            }
            cell.appendChild(noteBox);
            cell.dataset.value = noteValue;
        } else {
            cell.textContent = value;
            cell.dataset.value = value;
        }
    },

    async bulkUpdateField(field, value, currentTransactionId = null) {
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
            Dashboard.update();
            this.update();
        } catch (error) {
            console.error('Error bulk updating transactions:', error);
            alert('Failed to update some transactions. Please try again.');
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
        Dashboard.update();
        this.update(); // Refresh the ledger to show updated values (this will also update sum)
    },

    addNewInlineRow() {
        const tbody = document.getElementById('ledger-tbody');
        
        // Remove any existing new row
        const existingNewRow = tbody.querySelector('tr.new-row');
        if (existingNewRow) {
            existingNewRow.remove();
        }
        
        const row = document.createElement('tr');
        row.className = 'new-row';
        row.dataset.isNew = 'true';
        
        // Checkbox cell (disabled for new rows)
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkbox.disabled = true;
        checkboxCell.appendChild(checkbox);
        
        // Date cell
        const dateCell = document.createElement('td');
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.valueAsDate = new Date();
        dateInput.required = true;
        dateInput.dataset.field = 'date';
        dateInput.addEventListener('input', () => this.validateNewRow());
        dateCell.appendChild(dateInput);
        
        // Description cell
        const descCell = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.maxLength = 40;
        descInput.required = true;
        descInput.dataset.field = 'description';
        descInput.addEventListener('input', () => this.validateNewRow());
        descCell.appendChild(descInput);
        
        // Category cell
        const catCell = document.createElement('td');
        const catSelect = document.createElement('select');
        catSelect.required = true;
        catSelect.dataset.field = 'category';
        catSelect.addEventListener('change', () => this.validateNewRow());
        DataStore.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            catSelect.appendChild(option);
        });
        catCell.appendChild(catSelect);
        
        // Method cell
        const methodCell = document.createElement('td');
        const methodSelect = document.createElement('select');
        methodSelect.required = true;
        methodSelect.dataset.field = 'method';
        methodSelect.addEventListener('change', () => this.validateNewRow());
        DataStore.methods.forEach(method => {
            const option = document.createElement('option');
            option.value = method;
            option.textContent = method;
            methodSelect.appendChild(option);
        });
        methodCell.appendChild(methodSelect);
        
        // Type cell
        const typeCell = document.createElement('td');
        const typeSelect = document.createElement('select');
        typeSelect.required = true;
        typeSelect.dataset.field = 'type';
        typeSelect.addEventListener('change', () => this.validateNewRow());
        ['Income', 'Expense'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            if (type === 'Expense') option.selected = true;
            typeSelect.appendChild(option);
        });
        typeCell.appendChild(typeSelect);
        
        // Amount cell
        const amountCell = document.createElement('td');
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.placeholder = '0.00';
        amountInput.required = true;
        amountInput.dataset.field = 'amount';
        amountInput.addEventListener('input', (e) => {
            this.validateNewRow();
            // Format amount input
            let value = e.target.value;
            value = value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            const finalParts = value.split('.');
            if (finalParts[0].length > 7) {
                finalParts[0] = finalParts[0].substring(0, 7);
            }
            if (finalParts.length > 1 && finalParts[1].length > 2) {
                finalParts[1] = finalParts[1].substring(0, 2);
            }
            e.target.value = finalParts.join('.');
        });
        amountInput.addEventListener('blur', (e) => {
            let value = e.target.value.trim();
            if (value && !isNaN(value)) {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    e.target.value = num.toFixed(2);
                }
            }
            this.validateNewRow();
        });
        amountCell.appendChild(amountInput);
        
        // Note cell
        const noteCell = document.createElement('td');
        const noteInput = document.createElement('textarea');
        noteInput.className = 'note-input';
        noteInput.rows = 1;
        noteInput.maxLength = 20;
        noteInput.placeholder = 'Optional note...';
        noteCell.appendChild(noteInput);
        
        // Delete/Save button cell (Save button for new row)
        const deleteCell = document.createElement('td');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-inline-btn';
        saveBtn.innerHTML = '✓';
        saveBtn.title = 'Save';
        saveBtn.disabled = true;
        saveBtn.addEventListener('click', () => this.saveNewInlineRow(row));
        deleteCell.appendChild(saveBtn);
        
        row.appendChild(checkboxCell);
        row.appendChild(dateCell);
        row.appendChild(descCell);
        row.appendChild(catCell);
        row.appendChild(methodCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(noteCell);
        row.appendChild(deleteCell);
        
        // Insert at the beginning of tbody
        tbody.insertBefore(row, tbody.firstChild);
        
        // Focus on description field
        descInput.focus();
    },

    validateNewRow() {
        const newRow = document.querySelector('tr.new-row');
        if (!newRow) return;
        
        const saveBtn = newRow.querySelector('.save-inline-btn');
        if (!saveBtn) return;
        
        // Get inputs and selects using data attributes for reliability
        const dateInput = newRow.querySelector('input[data-field="date"]');
        const descInput = newRow.querySelector('input[data-field="description"]');
        const amountInput = newRow.querySelector('input[data-field="amount"]');
        const catSelect = newRow.querySelector('select[data-field="category"]');
        const methodSelect = newRow.querySelector('select[data-field="method"]');
        const typeSelect = newRow.querySelector('select[data-field="type"]');
        
        const date = dateInput ? dateInput.value : '';
        const description = descInput ? descInput.value.trim() : '';
        const amountValue = amountInput ? amountInput.value.trim() : '';
        const category = catSelect ? catSelect.value : '';
        const method = methodSelect ? methodSelect.value : '';
        const type = typeSelect ? typeSelect.value : '';
        
        const amount = parseFloat(amountValue);
        
        const isValid = date && 
                       description && 
                       category && 
                       method && 
                       type && 
                       amountValue &&
                       !isNaN(amount) && 
                       amount > 0;
        
        saveBtn.disabled = !isValid;
    },

    async saveNewInlineRow(row) {
        // Disable save button to prevent double-clicks
        const saveBtn = row.querySelector('.save-inline-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
        }
        
        // Use data-field attributes for reliable field selection
        const dateInput = row.querySelector('input[data-field="date"]');
        const descInput = row.querySelector('input[data-field="description"]');
        const amountInput = row.querySelector('input[data-field="amount"]');
        const catSelect = row.querySelector('select[data-field="category"]');
        const methodSelect = row.querySelector('select[data-field="method"]');
        const typeSelect = row.querySelector('select[data-field="type"]');
        const noteInput = row.querySelector('textarea');
        
        if (!dateInput || !descInput || !amountInput || !catSelect || !methodSelect || !typeSelect) {
            alert('Error: Could not find all required fields. Please refresh the page and try again.');
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
        
        const date = dateInput.value;
        const description = descInput.value.trim();
        const category = catSelect.value;
        const method = methodSelect.value;
        const type = typeSelect.value;
        let amountValue = amountInput.value.trim();
        const note = noteInput ? noteInput.value.trim() : '';
        
        // Clean amount value - remove any non-numeric characters except decimal point
        amountValue = amountValue.replace(/[^\d.]/g, '');
        
        // Parse amount
        const amount = parseFloat(amountValue);
        
        // Validate amount
        if (!amountValue || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            amountInput.focus();
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
        
        try {
            const response = await fetch(`${API.BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description, category, method, type, amount, note })
            });
            
            if (!response.ok) {
                let errorMessage = 'Failed to save transaction. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                    console.error('Server error response:', errorData);
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);
                }
                throw new Error(errorMessage);
            }
            
            // Success - reload data and update views
            const data = await API.loadData();
            DataStore.init(data);
            this.update();
            Dashboard.update();
        } catch (error) {
            console.error('Error saving transaction:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                date,
                description,
                category,
                method,
                type,
                amount
            });
            
            let errorMessage = 'Failed to save transaction. ';
            if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
                errorMessage += 'The server may not be running. Please make sure the server is started on port 3000.';
            } else {
                errorMessage += error.message || 'Please try again.';
            }
            alert(errorMessage);
            
            // Re-enable save button on error
            if (saveBtn) saveBtn.disabled = false;
        }
    },

    updateSum() {
        const tbody = document.getElementById('ledger-tbody');
        const checkboxes = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox');
        const sumDisplay = document.getElementById('ledger-sum');
        const sumAmount = document.getElementById('ledger-sum-amount');
        
        let sum = 0;
        let hasChecked = false;
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked && !checkbox.disabled) {
                hasChecked = true;
                const row = checkbox.closest('tr');
                const amountCell = row.querySelector('td[data-field="amount"]');
                if (amountCell) {
                    const amount = parseFloat(amountCell.dataset.value);
                    if (!isNaN(amount)) {
                        sum += amount;
                    }
                }
            }
        });
        
        if (hasChecked) {
            sumDisplay.style.display = 'block';
            sumAmount.textContent = Utils.formatCurrency(sum);
        } else {
            sumDisplay.style.display = 'none';
        }
    },

    setupSortableColumns() {
        const sortableHeaders = document.querySelectorAll('th.sortable');
        
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                const defaultDir = header.dataset.default;
                
                // If clicking the same column, toggle direction
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    // New column, use its default direction
                    this.sortColumn = column;
                    this.sortDirection = defaultDir;
                }
                
                this.update();
            });
        });
    },

    updateSortIndicators() {
        const sortableHeaders = document.querySelectorAll('th.sortable');
        
        sortableHeaders.forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            const column = header.dataset.sort;
            
            if (this.sortColumn === column) {
                indicator.textContent = this.sortDirection === 'asc' ? '▲' : '▼';
                indicator.style.opacity = '1';
            } else {
                // Show default indicator for other columns
                const defaultDir = header.dataset.default;
                indicator.textContent = defaultDir === 'asc' ? '▲' : '▼';
                indicator.style.opacity = '0.3';
            }
        });
    }
};

// Setup note tooltips with dynamic positioning to break out of table constraints
// Use event delegation that works for dynamically created elements
// Only set up once - check if already set up
if (!window._noteTooltipsSetup) {
    window._noteTooltipsSetup = true;
    
    // Use event delegation for note boxes (works for dynamically created elements)
    document.addEventListener('mouseenter', (e) => {
        const noteBox = e.target.closest('.note-box.has-note');
        if (noteBox && !noteBox.closest('tr.editing')) {
            const note = noteBox.getAttribute('data-note');
            if (note) {
                showNoteTooltip(noteBox, note);
            }
        }
    }, true);
    
    document.addEventListener('mouseleave', (e) => {
        const noteBox = e.target.closest('.note-box.has-note');
        if (noteBox) {
            hideNoteTooltip();
        }
    }, true);
}

// Global click-away handler for inline editing
// Single handler that works for all editing fields - more reliable than per-row handlers
if (!window._clickAwayHandlerSetup) {
    window._clickAwayHandlerSetup = true;
    
    document.addEventListener('mousedown', (e) => {
        // Find any active editing input
        const editingInput = document.querySelector('.inline-edit-input');
        if (!editingInput) return; // No active editing
        
        const editingRow = editingInput.closest('tr.editing');
        if (!editingRow) return; // Not in edit mode
        
        const editingCell = editingInput.closest('td.editing');
        if (!editingCell) return;
        
        // Check if click is outside the input
        if (!editingInput.contains(e.target)) {
            // If clicking outside the row entirely (whitespace, body, container, etc.), save immediately
            if (!editingRow.contains(e.target)) {
                // Clicked outside the row - save and close immediately
                e.preventDefault(); // Prevent any default behavior
                editingInput.blur();
                return;
            }
            
            // If clicking in the row but not in the editing cell, might be clicking another cell
            // Don't prevent default - let the cell click handler process it
            if (!editingCell.contains(e.target)) {
                // Small delay to let cell click handler process first
                setTimeout(() => {
                    // Double-check the input is still active and wasn't replaced
                    const stillEditing = document.querySelector('.inline-edit-input');
                    if (stillEditing === editingInput && editingRow.classList.contains('editing')) {
                        editingInput.blur();
                    }
                }, 10);
            }
        }
    }, true);
}

let noteTooltip = null;

function showNoteTooltip(element, note) {
    // Don't show tooltip if we're editing
    if (element.closest('tr.editing')) {
        return;
    }
    
    // Remove existing tooltip immediately (don't wait for fade out)
    if (noteTooltip) {
        noteTooltip.remove();
        noteTooltip = null;
    }
    
    // Create tooltip element
    noteTooltip = document.createElement('div');
    noteTooltip.className = 'note-tooltip';
    noteTooltip.textContent = note;
    document.body.appendChild(noteTooltip);
    
    // Force a reflow to get accurate dimensions with width: max-content
    noteTooltip.style.visibility = 'hidden';
    noteTooltip.style.display = 'block';
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = noteTooltip.getBoundingClientRect();
    
    // Position above the element, centered
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 8;
    
    // Adjust if tooltip goes off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
        // Show below if not enough space above
        top = rect.bottom + 8;
    }
    
    noteTooltip.style.left = left + 'px';
    noteTooltip.style.top = top + 'px';
    noteTooltip.style.opacity = '1';
    noteTooltip.style.visibility = 'visible';
}

function hideNoteTooltip() {
    if (noteTooltip) {
        // Remove immediately (no fade) when hiding for edit mode
        noteTooltip.remove();
        noteTooltip = null;
    }
}
