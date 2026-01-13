// Dashboard functionality - Available globally as Dashboard

const Dashboard = {
    update() {
        const year = parseInt(document.getElementById('dashboard-year').value);
        const month = parseInt(document.getElementById('dashboard-month').value);

        const filtered = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
        const income = filtered.filter(t => t.type === 'Income');
        const expenses = filtered.filter(t => t.type === 'Expense');

        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const netIncome = totalIncome - totalExpenses;

        document.getElementById('net-income').textContent = Utils.formatCurrency(netIncome);
        document.getElementById('total-income').textContent = Utils.formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = Utils.formatCurrency(totalExpenses);

        this.updateCharts(income, expenses);
        this.updatePaymentMethods(filtered);
        this.updateBudget(filtered, year, month);
    },

    updateCharts(income, expenses) {
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
    },

    updatePaymentMethods(transactions) {
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
                    <span>${Utils.formatCurrency(amount)}</span>
                `;
                list.appendChild(item);
            });
    },

    async updateBudget(transactions, year, month) {
        // Calculate actual amounts per category (from transactions)
        const actualData = {};
        transactions.forEach(t => {
            actualData[t.category] = (actualData[t.category] || 0) + t.amount;
        });

        // Load budget amounts from API
        let budgetData = {};
        try {
            const response = await fetch(`${API.BASE}/budgets/${year}/${month}`);
            if (response.ok) {
                budgetData = await response.json();
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
        }

        // Get only expense categories and sort alphabetically
        const allCategories = (DataStore.expenses || []).slice().sort((a, b) => a.localeCompare(b));

        // Build budget table
        const tbody = document.getElementById('budget-tbody');
        tbody.innerHTML = '';

        if (allCategories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No categories available.</td></tr>';
            return;
        }

        allCategories.forEach(category => {
            const row = document.createElement('tr');
            const actual = actualData[category] || 0;
            const planned = budgetData[category] || null;
            const difference = planned !== null ? planned - actual : null;

            // Category name
            const categoryCell = document.createElement('td');
            categoryCell.textContent = category;
            row.appendChild(categoryCell);

            // Planned input
            const plannedCell = document.createElement('td');
            const plannedInput = document.createElement('input');
            plannedInput.type = 'text';
            plannedInput.className = 'budget-planned-input';
            plannedInput.value = planned !== null ? planned.toFixed(2) : '';
            plannedInput.placeholder = '0.00';
            plannedInput.dataset.category = category;
            plannedInput.dataset.year = year;
            plannedInput.dataset.month = month;
            
            // Format on blur (save)
            plannedInput.addEventListener('blur', async (e) => {
                await this.saveBudgetAmount(e.target);
            });
            
            // Save on Enter key
            plannedInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
            
            plannedCell.appendChild(plannedInput);
            row.appendChild(plannedCell);

            // Actual amount
            const actualCell = document.createElement('td');
            actualCell.textContent = Utils.formatCurrency(actual);
            row.appendChild(actualCell);

            // Difference - color code for expenses only
            // Actual > Planned (negative difference) = red (bad, spent more)
            // Actual < Planned (positive difference) = green (good, spent less)
            const differenceCell = document.createElement('td');
            if (difference !== null) {
                differenceCell.textContent = Utils.formatCurrency(difference);
                
                if (difference < 0) {
                    differenceCell.style.color = '#d32f2f'; // Red - spent more than planned
                    differenceCell.style.fontWeight = 'bold';
                } else if (difference > 0) {
                    differenceCell.style.color = '#2e7d32'; // Green - spent less than planned
                    differenceCell.style.fontWeight = 'bold';
                } else {
                    differenceCell.style.color = '#000'; // Black - exactly on budget
                }
            } else {
                differenceCell.textContent = '—';
                differenceCell.style.color = '#999';
            }
            row.appendChild(differenceCell);

            tbody.appendChild(row);
        });
    },

    async saveBudgetAmount(input) {
        const category = input.dataset.category;
        const year = parseInt(input.dataset.year);
        const month = parseInt(input.dataset.month);
        const value = input.value.trim();

        // If empty, delete the budget entry
        if (!value || value === '') {
            try {
                const response = await fetch(`${API.BASE}/budgets/${encodeURIComponent(category)}/${year}/${month}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    // Refresh budget display
                    const filtered = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
                    this.updateBudget(filtered, year, month);
                }
            } catch (error) {
                console.error('Error deleting budget:', error);
                alert('Failed to delete budget amount. Please try again.');
            }
            return;
        }

        // Validate and parse amount
        const amount = parseFloat(value);
        if (isNaN(amount) || amount < 0) {
            alert('Please enter a valid non-negative number.');
            input.focus();
            return;
        }

        // Save budget amount
        try {
            const response = await fetch(`${API.BASE}/budgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: category,
                    year: year,
                    month: month,
                    planned_amount: amount
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save budget');
            }

            // Refresh budget display to update difference
            const filtered = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
            this.updateBudget(filtered, year, month);
        } catch (error) {
            console.error('Error saving budget:', error);
            alert('Failed to save budget amount. Please try again.');
            input.focus();
        }
    }
};
