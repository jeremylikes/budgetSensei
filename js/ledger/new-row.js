// New Row Creation - Available globally as LedgerNewRow

const LedgerNewRow = {
    escapeHandler: null,  // Store escape handler so we can remove it when needed
    
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
            // Remove escape handler
            if (this.escapeHandler) {
                document.removeEventListener('keydown', this.escapeHandler);
                this.escapeHandler = null;
            }
            // Update Add Transaction button state
            if (window.Ledger && window.Ledger.updateAddTransactionButton) {
                window.Ledger.updateAddTransactionButton();
            }
        });
        checkboxCell.appendChild(cancelBtn);
        
        // Recurring button cell (between cancel and description)
        const recurringCell = document.createElement('td');
        const recurringBtn = document.createElement('button');
        recurringBtn.className = 'recurring-btn';
        recurringBtn.type = 'button';
        recurringBtn.title = 'Set recurring frequency';
        recurringBtn.dataset.recurring = 'none'; // Default value
        // Recycle icon SVG
        recurringBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
        </svg>`;
        recurringBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.showRecurringModal(recurringBtn, row);
        });
        recurringCell.appendChild(recurringBtn);
        
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
        
        // Format as YYYY-MM-DD to avoid timezone issues with valueAsDate
        const yearStr = String(selectedYear);
        const monthStr = String(selectedMonth).padStart(2, '0');
        const dayStr = String(dayToUse).padStart(2, '0');
        dateInput.value = `${yearStr}-${monthStr}-${dayStr}`;
        
        dateInput.required = true;
        dateInput.autocomplete = 'off';
        dateInput.dataset.field = 'date';
        dateInput.addEventListener('input', () => this.validate());
        dateCell.appendChild(dateInput);
        
        // Description cell
        const descCell = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.maxLength = 40;
        descInput.required = true;
        descInput.autocomplete = 'off';
        descInput.dataset.field = 'description';
        descInput.addEventListener('input', () => this.validate());
        descCell.appendChild(descInput);
        
        // Category cell
        const catCell = document.createElement('td');
        const catSelect = document.createElement('select');
        catSelect.required = true;
        catSelect.autocomplete = 'off';
        catSelect.dataset.field = 'category';
        catSelect.addEventListener('change', () => this.validate());
        // Combine income and expenses, sort alphabetically
        // Handle both old format (strings) and new format (objects with name)
        let allCategories = [
            ...(DataStore.income || []).map(c => typeof c === 'string' ? c : (c.name || c)),
            ...(DataStore.expenses || []).map(c => typeof c === 'string' ? c : (c.name || c))
        ].filter(cat => cat !== 'Default'); // Filter out Default
        
        // If no user-defined categories exist, include Default as a fallback
        if (allCategories.length === 0) {
            allCategories = ['Default'];
        }
        
        allCategories.sort((a, b) => a.localeCompare(b));
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
        methodSelect.required = false;
        methodSelect.autocomplete = 'off';
        methodSelect.dataset.field = 'method';
        methodSelect.addEventListener('change', () => this.validate());
        
        // Get methods, use Default if none exist
        // Handle both old format (strings) and new format (objects with name)
        let methods = [...DataStore.methods]
            .map(m => typeof m === 'string' ? m : (m.name || m))
            .filter(m => m !== 'Default');
        if (methods.length === 0) {
            methods = ['Default'];
        }
        methods.sort((a, b) => a.localeCompare(b));
        methods.forEach(method => {
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
        amountInput.autocomplete = 'off';
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
        noteInput.maxLength = 40;
        noteInput.placeholder = 'Optional note...';
        noteInput.autocomplete = 'off';
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
        row.appendChild(recurringCell);
        row.appendChild(dateCell);
        row.appendChild(descCell);
        row.appendChild(catCell);
        row.appendChild(methodCell);
        row.appendChild(amountCell);
        row.appendChild(noteCell);
        row.appendChild(deleteCell);
        
        // Insert at the beginning of tbody
        tbody.insertBefore(row, tbody.firstChild);
        
        // Remove any existing escape handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Add Escape key handler to cancel adding new transaction
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                const newRow = document.querySelector('tr.new-row');
                if (newRow) {
                    newRow.remove();
                    document.removeEventListener('keydown', this.escapeHandler);
                    this.escapeHandler = null;
                    // Update Add Transaction button state
                    if (window.Ledger && window.Ledger.updateAddTransactionButton) {
                        window.Ledger.updateAddTransactionButton();
                    }
                }
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
        
        // Update Add Transaction button state when new row is added
        if (window.Ledger && window.Ledger.updateAddTransactionButton) {
            window.Ledger.updateAddTransactionButton();
        }
        
        // Focus on description field
        descInput.focus();
        
        // Add Enter key handler to all inputs in the new row
        const handleEnterKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newRow = document.querySelector('tr.new-row');
                if (newRow) {
                    const saveBtn = newRow.querySelector('.save-inline-btn');
                    // Only save if the save button is enabled (form is valid)
                    if (saveBtn && !saveBtn.disabled) {
                        this.save(newRow);
                    }
                }
            }
        };
        
        // Add Enter key listeners to all inputs and selects
        if (dateInput) dateInput.addEventListener('keydown', handleEnterKey);
        if (descInput) descInput.addEventListener('keydown', handleEnterKey);
        if (amountInput) amountInput.addEventListener('keydown', handleEnterKey);
        if (catSelect) catSelect.addEventListener('keydown', handleEnterKey);
        if (methodSelect) methodSelect.addEventListener('keydown', handleEnterKey);
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
                       //method && 
                       amountValue &&
                       !isNaN(amount) && 
                       amount > 0;
        
        saveBtn.disabled = !isValid;
    },

    async save(row) {
        // Update Add Transaction button state after saving
        const updateButtonState = () => {
            if (window.Ledger && window.Ledger.updateAddTransactionButton) {
                window.Ledger.updateAddTransactionButton();
            }
        };
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
        const recurringBtn = row.querySelector('.recurring-btn');
        const noteInput = row.querySelector('textarea');
        
        if (!dateInput || !descInput || !amountInput || !catSelect /*|| !methodSelect*/) {
            alert('Error: Could not find all required fields. Please refresh the page and try again.');
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
        
        const date = dateInput.value;
        const description = descInput.value.trim();
        const category = catSelect.value;
        const method = methodSelect.value;
        // Only send recurring if it's set (not 'none' or null)
        const recurringBtnValue = recurringBtn ? recurringBtn.dataset.recurring : null;
        const recurring = (recurringBtnValue && recurringBtnValue !== 'none') ? recurringBtnValue : 'none';
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

        // Capture existing transaction IDs for history diff
        const previousIds = (DataStore && Array.isArray(DataStore.transactions))
            ? new Set(DataStore.transactions.map(t => t.id))
            : new Set();
        
        try {
            const response = await fetch(`${API.BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description, category, method, type, amount, note, recurring })
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
            
            // Check if this was a recurring transaction
            const responseData = await response.json();
            const recurringCount = responseData._recurringCount || 1;
            
            // Clear the recurring button highlight after save (no longer needed)
            if (recurringBtn) {
                recurringBtn.dataset.recurring = 'none';
                this.updateRecurringButtonStyle(recurringBtn, 'none');
            }
            
            // Success - reload data and update views
            const data = await API.loadData();
            DataStore.init(data);

            // Determine newly created transactions (could be 1 or many if recurring)
            const newTransactions = DataStore.transactions.filter(t => !previousIds.has(t.id));

            // Remove the new row
            row.remove();
            
            // Log success message if multiple transactions were created
            if (recurringCount > 1) {
                console.log(`Created ${recurringCount} recurring transactions`);
            }
            
            // Update Add Transaction button state
            updateButtonState();
            
            // Trigger update via Ledger
            if (window.Ledger) {
                window.Ledger.update();
            }
            if (window.Dashboard) {
                window.Dashboard.update();
            }

            // Record history for created transactions
            if (window.LedgerHistory && newTransactions.length > 0) {
                const snapshot = newTransactions.map(t => ({
                    id: t.id,
                    body: {
                        date: t.date,
                        description: t.description,
                        category: t.category,
                        method: t.method,
                        type: t.type,
                        amount: t.amount,
                        note: t.note || ''
                    }
                }));

                const command = {
                    type: 'createTransactions',
                    transactions: snapshot,
                    async apply() {
                        // Re-create all transactions from stored bodies
                        const recreatePromises = this.transactions.map(async (entry, index) => {
                            const resp = await fetch(`${API.BASE}/transactions`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...entry.body, recurring: 'none' })
                            });
                            if (!resp.ok) {
                                throw new Error('Failed to recreate transaction');
                            }
                            const created = await resp.json();
                            this.transactions[index].id = created.id;
                        });
                        await Promise.all(recreatePromises);

                        const data = await API.loadData();
                        DataStore.init(data);
                        if (window.Dashboard) Dashboard.update();
                        if (window.Ledger) Ledger.update();
                    },
                    async revert() {
                        // Delete all currently-tracked ids
                        const ids = this.transactions.map(t => t.id).filter(id => !!id);
                        const deletePromises = ids.map(async (tid) => {
                            const resp = await fetch(`${API.BASE}/transactions/${tid}`, { method: 'DELETE' });
                            if (!resp.ok) {
                                throw new Error('Failed to delete transaction');
                            }
                        });
                        await Promise.all(deletePromises);

                        const data = await API.loadData();
                        DataStore.init(data);
                        if (window.Dashboard) Dashboard.update();
                        if (window.Ledger) Ledger.update();
                    }
                };

            LedgerHistory.push(command);
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
    },

    async showRecurringModal(recurringBtn, row, transactionId = null, isRoot = false) {
        // Remove any existing modal
        const existingModal = document.getElementById('recurring-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Get current recurring value from button dataset (for new rows)
        let currentRecurring = recurringBtn ? (recurringBtn.dataset.recurring || null) : null;
        
        // If this is a root transaction, infer the recurring frequency from branch dates
        if (isRoot && transactionId && window.LedgerTable) {
            const branches = window.LedgerTable.getBranchTransactions(transactionId);
            if (branches.length > 0) {
                // Get the root transaction
                const rootTransaction = DataStore.transactions.find(t => t.id === transactionId);
                if (rootTransaction) {
                    // Sort branches by date
                    const sortedBranches = branches.sort((a, b) => new Date(a.date) - new Date(b.date));
                    // Calculate average days between transactions
                    const rootDate = new Date(rootTransaction.date);
                    const firstBranchDate = new Date(sortedBranches[0].date);
                    const daysDiff = Math.round((firstBranchDate - rootDate) / (1000 * 60 * 60 * 24));
                    
                    // Infer frequency based on days difference
                    if (daysDiff >= 25 && daysDiff <= 35) {
                        currentRecurring = 'monthly';
                    } else if (daysDiff >= 12 && daysDiff <= 16) {
                        currentRecurring = 'bi-weekly';
                    } else if (daysDiff >= 5 && daysDiff <= 9) {
                        currentRecurring = 'weekly';
                    }
                }
            }
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'recurring-modal';
        modal.className = 'recurring-modal-overlay';
        
        // If this is a root transaction, show read-only mode
        const isReadOnly = isRoot && transactionId;
        const saveButtonText = isReadOnly ? 'Close' : 'Save';
        const modalTitle = isReadOnly ? 'Recurring Settings (Read-Only)' : 'Recurring Frequency';
        const readonlyClass = isReadOnly ? 'readonly' : '';
        
        modal.innerHTML = `
            <div class="recurring-modal-content">
                <h3>${modalTitle}</h3>
                ${isReadOnly ? '<p style="color: #666; font-size: 14px; margin-bottom: 15px;">This transaction has recurring transactions. Settings cannot be modified.</p>' : ''}
                <div class="recurring-options ${readonlyClass}">
                    <button class="recurring-option ${currentRecurring === 'weekly' ? 'active' : ''} ${isReadOnly ? 'disabled' : ''}" data-value="weekly" ${isReadOnly ? 'disabled' : ''}>
                        <span class="option-label">Weekly</span>
                    </button>
                    <button class="recurring-option ${currentRecurring === 'bi-weekly' ? 'active' : ''} ${isReadOnly ? 'disabled' : ''}" data-value="bi-weekly" ${isReadOnly ? 'disabled' : ''}>
                        <span class="option-label">Bi-weekly</span>
                    </button>
                    <button class="recurring-option ${currentRecurring === 'monthly' ? 'active' : ''} ${isReadOnly ? 'disabled' : ''}" data-value="monthly" ${isReadOnly ? 'disabled' : ''}>
                        <span class="option-label">Monthly</span>
                    </button>
                </div>
                <div class="recurring-modal-actions">
                    <button class="recurring-cancel-btn">${isReadOnly ? 'Close' : 'Cancel'}</button>
                    ${!isReadOnly ? '<button class="recurring-save-btn">Save</button>' : ''}
                </div>
            </div>
        `;

        // Initialize selectedValue with current value if it exists
        let selectedValue = currentRecurring;

        // Handle option selection (only if not read-only)
        if (!isReadOnly) {
            modal.querySelectorAll('.recurring-option').forEach(option => {
                option.addEventListener('click', () => {
                    modal.querySelectorAll('.recurring-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    selectedValue = option.dataset.value;
                });
            });
        }

        // Handle save (only if not read-only)
        if (!isReadOnly) {
            const saveBtn = modal.querySelector('.recurring-save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    // Only proceed if a value was selected
                    if (!selectedValue) {
                        modal.remove();
                        return;
                    }
                    
                    // If this is an existing transaction, generate recurring duplicates
                    if (transactionId && window.LedgerBulk) {
                        try {
                            // Update the transaction with recurring to generate duplicates
                            // The backend will generate duplicates but not store the recurring field
                            await window.LedgerBulk.updateTransactionField(transactionId, 'recurring', selectedValue);
                            
                            // Refresh the view to show the new transactions
                            if (window.Ledger) {
                                await window.Ledger.update();
                            }
                        } catch (error) {
                            console.error('Error generating recurring transactions:', error);
                            alert('Failed to generate recurring transactions. Please try again.');
                            modal.remove();
                            return;
                        }
                    } else {
                        // For new rows, store the selected value and highlight the button
                        recurringBtn.dataset.recurring = selectedValue;
                        this.updateRecurringButtonStyle(recurringBtn, selectedValue);
                    }
                    
                    modal.remove();
                });
            }
        }

        // Handle cancel
        modal.querySelector('.recurring-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    },

    updateRecurringButtonStyle(btn, recurring) {
        // Only highlight for new rows (not persisted transactions)
        // Highlight in yellow if a recurring value is set
        if (recurring && recurring !== 'none') {
            btn.classList.add('recurring-active');
        } else {
            btn.classList.remove('recurring-active');
        }
    }
};

// Make available globally
window.LedgerNewRow = LedgerNewRow;
