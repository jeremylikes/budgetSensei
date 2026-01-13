// API Base URL - automatically detects if running locally or on server
const API_BASE = window.location.origin + '/api';

// Data Storage - Load from API
let transactions = [];
let categories = [];
let methods = [];

// Sorting state
let sortColumn = 'date';
let sortDirection = 'desc'; // 'asc' or 'desc'

async function loadDataFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/data`);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        transactions = data.transactions || [];
        categories = data.categories || ['Groceries', 'Rent', 'Utilities', 'Work Income'];
        methods = data.methods || ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        
        // Check if server is not running
        if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
            console.error('Server connection failed. Make sure the server is running on port 3000.');
            // Show a warning to the user
            const warningShown = sessionStorage.getItem('serverWarningShown');
            if (!warningShown) {
                alert('Warning: Cannot connect to the server. Please make sure the server is running.\n\nStart the server with: npm start\n\nThis warning will not show again during this session.');
                sessionStorage.setItem('serverWarningShown', 'true');
            }
        }
        
        // Fallback to defaults if API fails
        transactions = [];
        categories = ['Groceries', 'Rent', 'Utilities', 'Work Income'];
        methods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
        return { transactions, categories, methods };
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    try {
        await loadDataFromAPI();
        setupTabs();
        setupDateSelectors();
        setupDataTab();
        setupTransactionModal();
        setupSortableColumns();
        updateDashboard();
        updateLedger();
    } catch (error) {
        console.error('Error initializing app:', error);
        // Still try to set up tabs even if other initialization fails
        setupTabs();
    }
}

// Tab Navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                const targetTab = btn.getAttribute('data-tab');
                
                if (!targetTab) {
                    console.error('Tab button missing data-tab attribute');
                    return;
                }
                
                const targetElement = document.getElementById(targetTab);
                if (!targetElement) {
                    console.error(`Tab content element not found: ${targetTab}`);
                    return;
                }
                
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                targetElement.classList.add('active');
                
                // Update content after a brief delay to ensure tab is visible first
                setTimeout(() => {
                    try {
                        if (targetTab === 'dashboard') {
                            updateDashboard();
                        } else if (targetTab === 'ledger') {
                            updateLedger();
                        }
                    } catch (error) {
                        console.error(`Error updating ${targetTab} tab:`, error);
                    }
                }, 0);
            } catch (error) {
                console.error('Error switching tabs:', error);
            }
        });
    });
}

// Date Selectors
function setupDateSelectors() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Populate years (2015 to 2100)
    const yearSelects = document.querySelectorAll('.year-select');
    yearSelects.forEach(select => {
        for (let year = 2015; year <= 2100; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            select.appendChild(option);
        }
    });

    // Populate months
    const monthSelects = document.querySelectorAll('.month-select');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthSelects.forEach(select => {
        monthNames.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            if (index + 1 === currentMonth) option.selected = true;
            select.appendChild(option);
        });
    });

    // Add change listeners
    document.getElementById('dashboard-year').addEventListener('change', updateDashboard);
    document.getElementById('dashboard-month').addEventListener('change', updateDashboard);
    document.getElementById('ledger-year').addEventListener('change', updateLedger);
    document.getElementById('ledger-month').addEventListener('change', updateLedger);
}

// Transaction Modal
let editingTransactionId = null;

function setupTransactionModal() {
    // Setup inline add button
    const addInlineBtn = document.getElementById('add-transaction-inline-btn');
    if (addInlineBtn) {
        addInlineBtn.addEventListener('click', () => {
            addNewInlineRow();
        });
    }

    // Keep modal setup for backward compatibility (if modal still exists)
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        const cancelBtn = document.getElementById('cancel-transaction');
        const form = document.getElementById('transaction-form');
        const closeBtn = document.querySelector('.close');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                form.reset();
                editingTransactionId = null;
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                form.reset();
                editingTransactionId = null;
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                saveTransaction();
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (form) form.reset();
                editingTransactionId = null;
            }
        });
    }

    // Validate amount input (7 whole numbers, 2 decimals)
    const amountInput = document.getElementById('transaction-amount');
    if (amountInput) {
        amountInput.addEventListener('input', (e) => {
            let value = e.target.value;
            
            // Remove any non-digit or non-decimal characters (allow digits and single decimal point)
            value = value.replace(/[^\d.]/g, '');
            
            // Prevent multiple decimal points - keep only the first one
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Split by decimal point
            const finalParts = value.split('.');
            
            // Limit whole number part to 7 digits
            if (finalParts[0].length > 7) {
                finalParts[0] = finalParts[0].substring(0, 7);
            }
            
            // Limit decimal part to 2 digits
            if (finalParts.length > 1 && finalParts[1].length > 2) {
                finalParts[1] = finalParts[1].substring(0, 2);
            }
            
            // Reconstruct value
            e.target.value = finalParts.join('.');
        });
        
        // Format on blur to ensure 2 decimal places if decimal entered
        amountInput.addEventListener('blur', (e) => {
            let value = e.target.value.trim();
            if (value && !isNaN(value)) {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    // Format to 2 decimal places
                    e.target.value = num.toFixed(2);
                }
            }
        });
    }
}

function populateCategoryMethodDropdowns() {
    const categorySelect = document.getElementById('transaction-category');
    const methodSelect = document.getElementById('transaction-method');

    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    methodSelect.innerHTML = '';
    methods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        methodSelect.appendChild(option);
    });
}

async function editTransaction(id) {
    await loadDataFromAPI(); // Refresh data
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    editingTransactionId = id;
    document.querySelector('#transaction-modal h2').textContent = 'Edit Transaction';
    
    populateCategoryMethodDropdowns();
    
    document.getElementById('transaction-date').value = transaction.date;
    document.getElementById('transaction-description').value = transaction.description;
    document.getElementById('transaction-category').value = transaction.category;
    document.getElementById('transaction-method').value = transaction.method;
    document.getElementById('transaction-type').value = transaction.type;
    document.getElementById('transaction-amount').value = transaction.amount;
    document.getElementById('transaction-note').value = transaction.note || '';

    document.getElementById('transaction-modal').style.display = 'block';
}

async function saveTransaction() {
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
        if (editingTransactionId !== null) {
            // Update existing transaction
            response = await fetch(`${API_BASE}/transactions/${editingTransactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description, category, method, type, amount, note })
            });
        } else {
            // Add new transaction
            response = await fetch(`${API_BASE}/transactions`, {
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

        await loadDataFromAPI(); // Refresh data from server

        document.getElementById('transaction-modal').style.display = 'none';
        document.getElementById('transaction-form').reset();
        editingTransactionId = null;
        
        updateDashboard();
        updateLedger();
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
}

async function deleteTransaction(id) {
    // Check for bulk deletion
    const tbody = document.getElementById('ledger-tbody');
    const checkedRows = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:checked');
    
    if (checkedRows.length > 0) {
        // Bulk delete
        const checkedIds = Array.from(checkedRows).map(checkbox => {
            const row = checkbox.closest('tr');
            return parseInt(row.dataset.id);
        });
        
        const count = checkedIds.length;
        if (confirm(`Are you sure you want to delete ${count} transaction${count > 1 ? 's' : ''}?`)) {
            try {
                // Delete all checked transactions
                await Promise.all(checkedIds.map(id => 
                    fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' })
                ));
                
                await loadDataFromAPI();
                updateDashboard();
                updateLedger();
            } catch (error) {
                console.error('Error deleting transactions:', error);
                alert('Failed to delete transactions. Please try again.');
            }
        }
    } else {
        // Single delete
        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                const response = await fetch(`${API_BASE}/transactions/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to delete transaction');
                
                await loadDataFromAPI(); // Refresh data from server
                updateDashboard();
                updateLedger(); // This will also update the sum
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Failed to delete transaction. Please try again.');
            }
        }
    }
}

// Dashboard
function updateDashboard() {
    const year = parseInt(document.getElementById('dashboard-year').value);
    const month = parseInt(document.getElementById('dashboard-month').value);

    const filtered = getTransactionsForMonth(year, month);
    const income = filtered.filter(t => t.type === 'Income');
    const expenses = filtered.filter(t => t.type === 'Expense');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    document.getElementById('net-income').textContent = formatCurrency(netIncome);
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);

    updateCharts(income, expenses);
    updatePaymentMethods(filtered);
}

function getTransactionsForMonth(year, month) {
    return transactions.filter(t => {
        // Parse date string directly to avoid timezone issues
        // Date is stored as YYYY-MM-DD format
        const dateParts = t.date.split('-');
        if (dateParts.length !== 3) {
            // Fallback to Date object if format is unexpected
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year && tDate.getMonth() + 1 === month;
        }
        const tYear = parseInt(dateParts[0], 10);
        const tMonth = parseInt(dateParts[1], 10);
        return tYear === year && tMonth === month;
    });
}

function updateCharts(income, expenses) {
    // Income Chart
    const incomeData = {};
    income.forEach(t => {
        incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
    });

    const incomeCtx = document.getElementById('income-chart').getContext('2d');
    if (window.incomeChart) window.incomeChart.destroy();
    window.incomeChart = new Chart(incomeCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(incomeData),
            datasets: [{
                data: Object.values(incomeData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });

    // Expense Chart
    const expenseData = {};
    expenses.forEach(t => {
        expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
    });

    const expenseCtx = document.getElementById('expense-chart').getContext('2d');
    if (window.expenseChart) window.expenseChart.destroy();
    window.expenseChart = new Chart(expenseCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseData),
            datasets: [{
                data: Object.values(expenseData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function updatePaymentMethods(transactions) {
    const methodData = {};
    transactions.forEach(t => {
        methodData[t.method] = (methodData[t.method] || 0) + t.amount;
    });

    const list = document.getElementById('payment-methods-list');
    list.innerHTML = '';

    if (Object.keys(methodData).length === 0) {
        list.innerHTML = '<p>No payment methods used this month.</p>';
        return;
    }

    Object.entries(methodData)
        .sort((a, b) => b[1] - a[1])
        .forEach(([method, amount]) => {
            const item = document.createElement('div');
            item.className = 'payment-item';
            item.innerHTML = `
                <span><strong>${method}</strong></span>
                <span>${formatCurrency(amount)}</span>
            `;
            list.appendChild(item);
        });
}

// Ledger
function updateLedger() {
    const year = parseInt(document.getElementById('ledger-year').value);
    const month = parseInt(document.getElementById('ledger-month').value);

    let filtered = getTransactionsForMonth(year, month);
    
    // Apply sorting
    filtered = sortTransactions(filtered, sortColumn, sortDirection);

    const tbody = document.getElementById('ledger-tbody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No transactions found for this month.</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const row = createEditableRow(t);
        tbody.appendChild(row);
    });
    
    // Update sort indicators
    updateSortIndicators();
    
    // Update sum display
    updateSum();
}

// Add new inline row for creating a transaction
function addNewInlineRow() {
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
    dateInput.addEventListener('input', validateNewRow);
    dateCell.appendChild(dateInput);
    
    // Description cell
    const descCell = document.createElement('td');
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.maxLength = 40;
    descInput.required = true;
    descInput.dataset.field = 'description';
    descInput.addEventListener('input', validateNewRow);
    descCell.appendChild(descInput);
    
    // Category cell
    const catCell = document.createElement('td');
    const catSelect = document.createElement('select');
    catSelect.required = true;
    catSelect.dataset.field = 'category';
    catSelect.addEventListener('change', validateNewRow);
    categories.forEach(cat => {
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
    methodSelect.addEventListener('change', validateNewRow);
    methods.forEach(method => {
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
    typeSelect.addEventListener('change', validateNewRow);
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
        validateNewRow();
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
        validateNewRow();
    });
    amountCell.appendChild(amountInput);
    
    // Note cell
    const noteCell = document.createElement('td');
    const noteInput = document.createElement('textarea');
    noteInput.className = 'note-input';
    noteInput.rows = 1;
    noteInput.maxLength = 500;
    noteInput.placeholder = 'Optional note...';
    noteCell.appendChild(noteInput);
    
    // Delete/Save button cell (Save button for new row)
    const deleteCell = document.createElement('td');
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-inline-btn';
    saveBtn.innerHTML = '✓';
    saveBtn.title = 'Save';
    saveBtn.disabled = true;
    saveBtn.addEventListener('click', () => saveNewInlineRow(row));
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
}

// Validate new row and enable/disable save button
function validateNewRow() {
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
}

// Save new inline row
async function saveNewInlineRow(row) {
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
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, description, category, method, type, amount, note })
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to save transaction. Please try again.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
            }
            throw new Error(errorMessage);
        }
        
        await loadDataFromAPI();
        updateLedger();
        updateDashboard();
    } catch (error) {
        console.error('Error saving transaction:', error);
        let errorMessage = 'Failed to save transaction. ';
        if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
            errorMessage += 'The server may not be running. Please make sure the server is started on port 3000.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        alert(errorMessage);
    }
}

// Update sum of checked items
function updateSum() {
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
        sumAmount.textContent = formatCurrency(sum);
    } else {
        sumDisplay.style.display = 'none';
    }
}

// Sort transactions based on column and direction
function sortTransactions(transactions, column, direction) {
    const sorted = [...transactions];
    
    sorted.sort((a, b) => {
        let comparison = 0;
        
        switch (column) {
            case 'date':
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                comparison = dateA - dateB;
                break;
            case 'description':
                comparison = a.description.localeCompare(b.description);
                break;
            case 'category':
                comparison = a.category.localeCompare(b.category);
                break;
            case 'method':
                comparison = a.method.localeCompare(b.method);
                break;
            case 'type':
                // Expense comes before Income in default (desc)
                if (a.type === b.type) {
                    comparison = 0;
                } else if (a.type === 'Expense') {
                    comparison = -1;
                } else {
                    comparison = 1;
                }
                break;
            case 'amount':
                comparison = a.amount - b.amount;
                break;
            default:
                return 0;
        }
        
        return direction === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
}

// Setup sortable column headers
function setupSortableColumns() {
    const sortableHeaders = document.querySelectorAll('th.sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            const defaultDir = header.dataset.default;
            
            // If clicking the same column, toggle direction
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, use its default direction
                sortColumn = column;
                sortDirection = defaultDir;
            }
            
            updateLedger();
        });
    });
}

// Update sort indicators in headers
function updateSortIndicators() {
    const sortableHeaders = document.querySelectorAll('th.sortable');
    
    sortableHeaders.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        const column = header.dataset.sort;
        
        if (sortColumn === column) {
            indicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
            indicator.style.opacity = '1';
        } else {
            // Show default indicator for other columns
            const defaultDir = header.dataset.default;
            indicator.textContent = defaultDir === 'asc' ? '▲' : '▼';
            indicator.style.opacity = '0.3';
        }
    });
}

// Create an editable row for inline editing
function createEditableRow(t) {
    const row = document.createElement('tr');
    row.dataset.id = t.id;
    const note = t.note || '';
    
    // Note indicator is now in the note cell, not on the row
    
    // Checkbox cell
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'row-checkbox';
    checkbox.addEventListener('change', updateSum);
    checkboxCell.appendChild(checkbox);
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.className = 'editable-cell';
    dateCell.textContent = formatDate(t.date);
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
    amountCell.textContent = formatCurrency(t.amount);
    amountCell.dataset.field = 'amount';
    amountCell.dataset.value = t.amount;
    
    // Note cell (contains a box matching delete button size)
    const noteCell = document.createElement('td');
    noteCell.className = 'note-cell';
    const noteBox = document.createElement('div');
    noteBox.className = 'note-box';
    if (note) {
        noteBox.classList.add('has-note');
        noteBox.title = note;
        noteBox.setAttribute('data-note', note);
    }
    noteCell.appendChild(noteBox);
    
    // Delete button cell
    const deleteCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = () => deleteTransaction(t.id);
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
    setupInlineEditing(row);
    
    return row;
}

// Setup inline editing for a row
function setupInlineEditing(row) {
    const cells = row.querySelectorAll('.editable-cell');
    
    cells.forEach(cell => {
        cell.addEventListener('click', (e) => {
            // Don't edit if already editing another cell in this row
            if (row.classList.contains('editing')) {
                return;
            }
            
            e.stopPropagation();
            enterEditMode(row, cell);
        });
    });
}

// Enter edit mode for a cell
function enterEditMode(row, cell) {
    const field = cell.dataset.field;
    const currentValue = cell.dataset.value;
    const transactionId = parseInt(row.dataset.id);
    
    row.classList.add('editing');
    cell.classList.add('editing');
    
    let input;
    
    if (field === 'category') {
        input = document.createElement('select');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if (cat === currentValue) option.selected = true;
            input.appendChild(option);
        });
    } else if (field === 'method') {
        input = document.createElement('select');
        methods.forEach(method => {
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
            cancelEdit(row, cell, currentValue);
            return;
        }
        
        // Validate amount
        if (field === 'amount') {
            const amount = parseFloat(newValue);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount greater than 0');
                cancelEdit(row, cell, currentValue);
                return;
            }
        }
        
        // Check if this row is checked for bulk editing
        const checkbox = row.querySelector('.row-checkbox');
        const isChecked = checkbox && checkbox.checked;
        
        if (isChecked) {
            // Bulk edit: apply to all checked rows
            await bulkUpdateField(field, newValue, transactionId);
        } else {
            // Single row update
            await updateTransactionField(transactionId, field, newValue);
        }
        
        exitEditMode(row, cell, field, newValue);
    };
    
    const cancelEdit = (row, cell, originalValue) => {
        exitEditMode(row, cell, field, originalValue, true);
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur(); // Triggers saveEdit
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit(row, cell, currentValue);
        }
    });
}

// Exit edit mode and update display
function exitEditMode(row, cell, field, value, isCancel = false) {
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
                updateCellDisplay(checkedCell, field, value);
            }
        });
    }
    
    // Update current cell
    updateCellDisplay(cell, field, value);
}

// Helper function to update cell display
function updateCellDisplay(cell, field, value) {
    if (field === 'date') {
        cell.textContent = formatDate(value);
        cell.dataset.value = value;
    } else if (field === 'amount') {
        cell.textContent = formatCurrency(parseFloat(value));
        cell.dataset.value = value;
    } else {
        cell.textContent = value;
        cell.dataset.value = value;
    }
}

// Bulk update a field for all checked transactions
async function bulkUpdateField(field, value, excludeId = null) {
    const tbody = document.getElementById('ledger-tbody');
    const checkedRows = tbody.querySelectorAll('tr:not(.new-row) .row-checkbox:checked');
    
    const checkedIds = new Set();
    
    // Add all checked transaction IDs
    checkedRows.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const id = parseInt(row.dataset.id);
        if (id) checkedIds.add(id);
    });
    
    // Include the current row being edited
    if (excludeId) {
        checkedIds.add(excludeId);
    }
    
    if (checkedIds.size === 0) {
        return;
    }
    
    try {
        // Load latest data first
        await loadDataFromAPI();
        
        // Update all checked transactions in parallel
        const updatePromises = Array.from(checkedIds).map(async (id) => {
            const transaction = transactions.find(t => t.id === id);
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
            
            const response = await fetch(`${API_BASE}/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) throw new Error(`Failed to update transaction ${id}`);
        });
        
        await Promise.all(updatePromises);
        
        // Refresh data once after all updates
        await loadDataFromAPI();
        updateDashboard();
        updateLedger();
    } catch (error) {
        console.error('Error bulk updating transactions:', error);
        alert('Failed to update some transactions. Please try again.');
    }
}

// Update a single field of a transaction
async function updateTransactionField(id, field, value) {
    await loadDataFromAPI(); // Refresh to get latest data
    const transaction = transactions.find(t => t.id === id);
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
    
    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Failed to update transaction');
        
        await loadDataFromAPI(); // Refresh data
        updateDashboard();
        updateLedger(); // Refresh the ledger to show updated values (this will also update sum)
    } catch (error) {
        console.error('Error updating transaction:', error);
        alert('Failed to update transaction. Please try again.');
        throw error; // Re-throw so bulk update can handle it
    }
}

// Customize Tab
function setupDataTab() {
    // Categories
    document.getElementById('add-category-btn').addEventListener('click', async () => {
        const input = document.getElementById('new-category');
        const value = input.value.trim();
        if (value && !categories.includes(value)) {
            try {
                const response = await fetch(`${API_BASE}/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: value })
                });
                if (!response.ok) throw new Error('Failed to add category');
                
                await loadDataFromAPI();
                input.value = '';
                updateCategoriesList();
            } catch (error) {
                console.error('Error adding category:', error);
                alert('Failed to add category. It may already exist.');
            }
        }
    });

    // Methods
    document.getElementById('add-method-btn').addEventListener('click', async () => {
        const input = document.getElementById('new-method');
        const value = input.value.trim();
        if (value && !methods.includes(value)) {
            try {
                const response = await fetch(`${API_BASE}/methods`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: value })
                });
                if (!response.ok) throw new Error('Failed to add method');
                
                await loadDataFromAPI();
                input.value = '';
                updateMethodsList();
            } catch (error) {
                console.error('Error adding method:', error);
                alert('Failed to add payment method. It may already exist.');
            }
        }
    });

    updateCategoriesList();
    updateMethodsList();
}

function updateCategoriesList() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';

    categories.forEach((cat, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="category-name">${cat}</span>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editCategory(${index})" title="Edit">✏️</button>
                <button class="delete-btn" onclick="deleteCategory('${cat}')" title="Delete">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateMethodsList() {
    const list = document.getElementById('methods-list');
    list.innerHTML = '';

    methods.forEach((method, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="method-name">${method}</span>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editMethod(${index})" title="Edit">✏️</button>
                <button class="delete-btn" onclick="deleteMethod('${method}')" title="Delete">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function editCategory(index) {
    await loadDataFromAPI(); // Refresh data
    const oldValue = categories[index];
    const newValue = prompt('Edit category:', oldValue);
    
    if (newValue && newValue.trim() && newValue.trim() !== oldValue) {
        const trimmedValue = newValue.trim();
        try {
            const response = await fetch(`${API_BASE}/categories/${index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedValue })
            });
            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update category');
                return;
            }
            
            await loadDataFromAPI();
            updateCategoriesList();
            updateDashboard();
            updateLedger();
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Failed to update category. Please try again.');
        }
    }
}

async function editMethod(index) {
    await loadDataFromAPI(); // Refresh data
    const oldValue = methods[index];
    const newValue = prompt('Edit payment method:', oldValue);
    
    if (newValue && newValue.trim() && newValue.trim() !== oldValue) {
        const trimmedValue = newValue.trim();
        try {
            const response = await fetch(`${API_BASE}/methods/${index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedValue })
            });
            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update payment method');
                return;
            }
            
            await loadDataFromAPI();
            updateMethodsList();
            updateDashboard();
            updateLedger();
        } catch (error) {
            console.error('Error updating method:', error);
            alert('Failed to update payment method. Please try again.');
        }
    }
}

async function deleteCategory(category) {
    if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
        try {
            const response = await fetch(`${API_BASE}/categories/${encodeURIComponent(category)}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete category');
            
            await loadDataFromAPI();
            updateCategoriesList();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category. Please try again.');
        }
    }
}

async function deleteMethod(method) {
    if (confirm(`Are you sure you want to delete the payment method "${method}"?`)) {
        try {
            const response = await fetch(`${API_BASE}/methods/${encodeURIComponent(method)}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete method');
            
            await loadDataFromAPI();
            updateMethodsList();
        } catch (error) {
            console.error('Error deleting method:', error);
            alert('Failed to delete payment method. Please try again.');
        }
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    // Parse date string directly to avoid timezone issues
    // Date is stored as YYYY-MM-DD format
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
        // Fallback to Date object if format is unexpected
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateParts[2], 10);
    
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


