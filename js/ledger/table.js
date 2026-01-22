// Table Rendering - Available globally as LedgerTable

const LedgerTable = {
    createRow(transaction) {
        const row = document.createElement('tr');
        row.dataset.id = transaction.id;
        const note = transaction.note || '';
        
        // Checkbox cell
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkbox.addEventListener('change', () => {
            if (window.LedgerSum) {
                window.LedgerSum.update();
            }
            // Update select all checkbox state
            if (window.Ledger) {
                window.Ledger.updateSelectAllCheckbox();
            }
        });
        checkboxCell.appendChild(checkbox);
        
        // Recurring button cell (no highlighting - just a button to generate duplicates)
        const recurringCell = document.createElement('td');
        const recurringBtn = document.createElement('button');
        recurringBtn.className = 'recurring-btn';
        recurringBtn.type = 'button';
        recurringBtn.title = 'Generate recurring transactions';
        // Recycle icon SVG
        recurringBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
        </svg>`;
        recurringBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (window.LedgerNewRow && window.LedgerNewRow.showRecurringModal) {
                await window.LedgerNewRow.showRecurringModal(recurringBtn, row, transaction.id);
            }
        });
        recurringCell.appendChild(recurringBtn);
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.className = 'editable-cell';
        dateCell.textContent = Utils.formatDate(transaction.date);
        dateCell.dataset.field = 'date';
        dateCell.dataset.value = transaction.date;
        
        // Description cell
        const descCell = document.createElement('td');
        descCell.className = 'editable-cell';
        descCell.textContent = transaction.description;
        descCell.dataset.field = 'description';
        descCell.dataset.value = transaction.description;
        
        // Category cell
        const catCell = document.createElement('td');
        catCell.className = 'editable-cell';
        const categoryIcon = DataStore.getCategoryIcon(transaction.category);
        if (categoryIcon) {
            catCell.innerHTML = `<span class="category-icon">${categoryIcon}</span> ${transaction.category}`;
        } else {
            catCell.textContent = transaction.category;
        }
        catCell.dataset.field = 'category';
        catCell.dataset.value = transaction.category;
        
        // Method cell
        const methodCell = document.createElement('td');
        methodCell.className = 'editable-cell';
        const methodIcon = DataStore.getMethodIcon(transaction.method);
        if (methodIcon) {
            methodCell.innerHTML = `<span class="method-icon">${methodIcon}</span> ${transaction.method}`;
        } else {
            methodCell.textContent = transaction.method;
        }
        methodCell.dataset.field = 'method';
        methodCell.dataset.value = transaction.method;
        
        // Amount cell
        const amountCell = document.createElement('td');
        amountCell.className = 'editable-cell';
        // Add color class based on transaction type
        const transactionType = transaction.type || 'Expense'; // Default to Expense
        if (transactionType === 'Income') {
            amountCell.classList.add('amount-income');
        } else {
            amountCell.classList.add('amount-expense');
        }
        amountCell.textContent = Utils.formatCurrency(transaction.amount);
        amountCell.dataset.field = 'amount';
        amountCell.dataset.value = transaction.amount;
        amountCell.dataset.transactionType = transactionType; // Store type for updates
        
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
        }
        noteCell.appendChild(noteBox);
        
        // Delete button cell
        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => {
            // Use Transactions directly (should be available globally)
            if (typeof Transactions !== 'undefined' && Transactions.delete) {
                Transactions.delete(transaction.id);
            } else if (window.Transactions && window.Transactions.delete) {
                window.Transactions.delete(transaction.id);
            } else {
                console.error('Transactions.delete is not available');
            }
        };
        deleteCell.appendChild(deleteBtn);
        
        row.appendChild(checkboxCell);
        row.appendChild(recurringCell);
        row.appendChild(dateCell);
        row.appendChild(descCell);
        row.appendChild(catCell);
        row.appendChild(methodCell);
        row.appendChild(amountCell);
        row.appendChild(noteCell);
        row.appendChild(deleteCell);
        
        // Store original values for cancel
        row.dataset.originalData = JSON.stringify({
            date: transaction.date,
            description: transaction.description,
            category: transaction.category,
            method: transaction.method,
            type: transaction.type, // Keep for backward compatibility
            amount: transaction.amount,
            note: note,
        });
        
        // Setup inline editing handlers
        if (window.LedgerEditing) {
            window.LedgerEditing.setupRow(row);
        }
        
        return row;
    },

    updateCellDisplay(cell, field, value, transaction = null) {
        if (field === 'date') {
            cell.textContent = Utils.formatDate(value);
            cell.dataset.value = value;
        } else if (field === 'amount') {
            // Preserve color class when updating amount
            const existingType = cell.dataset.transactionType || (transaction && transaction.type) || 'Expense';
            cell.classList.remove('amount-income', 'amount-expense');
            if (existingType === 'Income') {
                cell.classList.add('amount-income');
            } else {
                cell.classList.add('amount-expense');
            }
            cell.dataset.transactionType = existingType;
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
            }
            cell.appendChild(noteBox);
            cell.dataset.value = noteValue;
        } else if (field === 'category') {
            const categoryIcon = DataStore.getCategoryIcon(value);
            if (categoryIcon) {
                cell.innerHTML = `<span class="category-icon">${categoryIcon}</span> ${value}`;
            } else {
                cell.textContent = value;
            }
            cell.dataset.value = value;
        } else if (field === 'method') {
            const methodIcon = DataStore.getMethodIcon(value);
            if (methodIcon) {
                cell.innerHTML = `<span class="method-icon">${methodIcon}</span> ${value}`;
            } else {
                cell.textContent = value;
            }
            cell.dataset.value = value;
        } else {
            cell.textContent = value;
            cell.dataset.value = value;
        }
    }
};

// Make available globally
window.LedgerTable = LedgerTable;
