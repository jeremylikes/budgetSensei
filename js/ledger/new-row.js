// New Row Creation - Available globally as LedgerNewRow

const LedgerNewRow = {
    add() {
        const tbody = document.getElementById('ledger-tbody');
        
        // Remove any existing new row
        const existingNewRow = tbody.querySelector('tr.new-row');
        if (existingNewRow) {
            existingNewRow.remove();
        }
        
        const row = document.createElement('tr');
        row.className = 'new-row';
        row.dataset.isNew = 'true';
        
        // Cancel button cell (replaces checkbox for new rows)
        const checkboxCell = document.createElement('td');
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-new-row-btn';
        cancelBtn.innerHTML = '×';
        cancelBtn.title = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            row.remove();
        });
        checkboxCell.appendChild(cancelBtn);
        
        // Date cell
        const dateCell = document.createElement('td');
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        
        // Default to the selected year and month from the date selectors
        const yearSelect = document.getElementById('ledger-year');
        const monthSelect = document.getElementById('ledger-month');
        const selectedYear = yearSelect ? parseInt(yearSelect.value) : new Date().getFullYear();
        const selectedMonth = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth() + 1;
        
        // If selected month/year matches current month/year, use current day; otherwise use day 1
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        let dayToUse = 1; // Default to day 1
        if (selectedYear === currentYear && selectedMonth === currentMonth) {
            dayToUse = currentDay; // Use current day if same month/year
        }
        
        const defaultDate = new Date(selectedYear, selectedMonth - 1, dayToUse);
        dateInput.valueAsDate = defaultDate;
        
        dateInput.required = true;
        dateInput.dataset.field = 'date';
        dateInput.addEventListener('input', () => this.validate());
        dateCell.appendChild(dateInput);
        
        // Description cell
        const descCell = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.maxLength = 40;
        descInput.required = true;
        descInput.dataset.field = 'description';
        descInput.addEventListener('input', () => this.validate());
        descCell.appendChild(descInput);
        
        // Category cell
        const catCell = document.createElement('td');
        const catSelect = document.createElement('select');
        catSelect.required = true;
        catSelect.dataset.field = 'category';
        catSelect.addEventListener('change', () => this.validate());
        // Combine income and expenses, sort alphabetically
        // Handle both old format (strings) and new format (objects with name)
        const allCategories = [
            ...(DataStore.income || []).map(c => typeof c === 'string' ? c : (c.name || c)),
            ...(DataStore.expenses || []).map(c => typeof c === 'string' ? c : (c.name || c))
        ].sort((a, b) => a.localeCompare(b));
        allCategories.forEach(cat => {
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
        methodSelect.addEventListener('change', () => this.validate());
        DataStore.methods.forEach(method => {
            const option = document.createElement('option');
            option.value = method;
            option.textContent = method;
            methodSelect.appendChild(option);
        });
        methodCell.appendChild(methodSelect);
        
        // Amount cell
        const amountCell = document.createElement('td');
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.placeholder = '0.00';
        amountInput.required = true;
        amountInput.dataset.field = 'amount';
        amountInput.addEventListener('input', (e) => {
            this.validate();
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
            this.validate();
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
        saveBtn.addEventListener('click', () => this.save(row));
        deleteCell.appendChild(saveBtn);
        
        row.appendChild(checkboxCell);
        row.appendChild(dateCell);
        row.appendChild(descCell);
        row.appendChild(catCell);
        row.appendChild(methodCell);
        row.appendChild(amountCell);
        row.appendChild(noteCell);
        row.appendChild(deleteCell);
        
        // Insert at the beginning of tbody
        tbody.insertBefore(row, tbody.firstChild);
        
        // Add Escape key handler to cancel adding new transaction
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                const newRow = document.querySelector('tr.new-row');
                if (newRow) {
                    newRow.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Focus on description field
        descInput.focus();
    },

    validate() {
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
        
        const date = dateInput ? dateInput.value : '';
        const description = descInput ? descInput.value.trim() : '';
        const amountValue = amountInput ? amountInput.value.trim() : '';
        const category = catSelect ? catSelect.value : '';
        const method = methodSelect ? methodSelect.value : '';
        
        const amount = parseFloat(amountValue);
        
        const isValid = date && 
                       description && 
                       category && 
                       method && 
                       amountValue &&
                       !isNaN(amount) && 
                       amount > 0;
        
        saveBtn.disabled = !isValid;
    },

    async save(row) {
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
        const noteInput = row.querySelector('textarea');
        
        if (!dateInput || !descInput || !amountInput || !catSelect || !methodSelect) {
            alert('Error: Could not find all required fields. Please refresh the page and try again.');
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
        
        const date = dateInput.value;
        const description = descInput.value.trim();
        const category = catSelect.value;
        const method = methodSelect.value;
        // Automatically determine type from category
        const type = DataStore.getCategoryType(category);
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
            
            // Trigger update via Ledger
            if (window.Ledger) {
                window.Ledger.update();
            }
            if (window.Dashboard) {
                window.Dashboard.update();
            }
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
    }
};

// Make available globally
window.LedgerNewRow = LedgerNewRow;
