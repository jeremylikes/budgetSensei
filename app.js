// API Base URL - automatically detects if running locally or on server
const API_BASE = window.location.origin + '/api';

// Data Storage - Load from API
let transactions = [];
let categories = [];
let methods = [];

async function loadDataFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/data`);
        const data = await response.json();
        transactions = data.transactions || [];
        categories = data.categories || ['Groceries', 'Rent', 'Utilities', 'Work Income'];
        methods = data.methods || ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
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
    await loadDataFromAPI();
    setupTabs();
    setupDateSelectors();
    setupDataTab();
    setupTransactionModal();
    updateDashboard();
    updateLedger();
}

// Tab Navigation
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            if (targetTab === 'dashboard') {
                updateDashboard();
            } else if (targetTab === 'ledger') {
                updateLedger();
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
    const modal = document.getElementById('transaction-modal');
    const addBtn = document.getElementById('add-transaction-btn');
    const cancelBtn = document.getElementById('cancel-transaction');
    const form = document.getElementById('transaction-form');
    const closeBtn = document.querySelector('.close');

    addBtn.addEventListener('click', () => {
        editingTransactionId = null;
        document.querySelector('#transaction-modal h2').textContent = 'Add New Transaction';
        populateCategoryMethodDropdowns();
        document.getElementById('transaction-date').valueAsDate = new Date();
        form.reset();
        modal.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
        editingTransactionId = null;
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
        editingTransactionId = null;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
            editingTransactionId = null;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransaction();
    });

    // Validate amount input (7 whole numbers, 2 decimals)
    const amountInput = document.getElementById('transaction-amount');
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
        if (editingTransactionId !== null) {
            // Update existing transaction
            const response = await fetch(`${API_BASE}/transactions/${editingTransactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description, category, method, type, amount, note })
            });
            if (!response.ok) throw new Error('Failed to update transaction');
        } else {
            // Add new transaction
            const response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, description, category, method, type, amount, note })
            });
            if (!response.ok) throw new Error('Failed to add transaction');
        }

        await loadDataFromAPI(); // Refresh data from server

        document.getElementById('transaction-modal').style.display = 'none';
        document.getElementById('transaction-form').reset();
        editingTransactionId = null;
        
        updateDashboard();
        updateLedger();
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Failed to save transaction. Please try again.');
    }
}

async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            const response = await fetch(`${API_BASE}/transactions/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete transaction');
            
            await loadDataFromAPI(); // Refresh data from server
            updateDashboard();
            updateLedger();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction. Please try again.');
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

    const filtered = getTransactionsForMonth(year, month)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('ledger-tbody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No transactions found for this month.</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const row = document.createElement('tr');
        const note = t.note || '';
        // Add class and title attribute for rows with notes
        if (note) {
            row.classList.add('has-note');
            row.setAttribute('title', note);
        }
        row.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td>${t.method}</td>
            <td>${t.type}</td>
            <td>${formatCurrency(t.amount)}</td>
            <td>
                <button class="edit-btn" onclick="editTransaction(${t.id})" title="Edit">
                    ✏️
                </button>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})" title="Delete">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


