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

        // Calculate Saving %
        // Saving % = Total Savings / Total Income
        let savingPercent = 0;
        if (totalIncome > 0) {
            savingPercent = (netIncome / totalIncome) * 100;
        }

        document.getElementById('net-income').textContent = Utils.formatCurrency(netIncome);
        document.getElementById('total-income').textContent = Utils.formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = Utils.formatCurrency(totalExpenses);
        document.getElementById('saving-percent').textContent = savingPercent.toFixed(1) + '%';

        this.updateCharts(income, expenses);
        this.updatePaymentMethods(filtered);
        this.updateBudget(filtered, year, month);
        this.updateCashFlowChart(year);
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

        // Get all categories (both income and expense) and sort alphabetically
        const allCategories = [...(DataStore.income || []), ...(DataStore.expenses || [])].sort((a, b) => a.localeCompare(b));

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
            
            // Determine category type
            const categoryType = DataStore.getCategoryType(category);
            
            // Calculate Remaining based on category type
            // Income: Remaining = Actual - Planned
            // Expense: Remaining = Planned - Actual
            let remaining = null;
            if (planned !== null) {
                if (categoryType === 'Income') {
                    remaining = actual - planned;
                } else {
                    remaining = planned - actual;
                }
            }

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

            // Remaining - color code based on value
            // Remaining = 0: black
            // Remaining < 0: red
            // Remaining > 0: green
            const remainingCell = document.createElement('td');
            if (remaining !== null) {
                remainingCell.textContent = Utils.formatCurrency(remaining);
                
                if (remaining < 0) {
                    remainingCell.style.color = '#d32f2f'; // Red
                    remainingCell.style.fontWeight = 'bold';
                } else if (remaining > 0) {
                    remainingCell.style.color = '#2e7d32'; // Green
                    remainingCell.style.fontWeight = 'bold';
                } else {
                    remainingCell.style.color = '#000'; // Black - exactly on target
                }
            } else {
                remainingCell.textContent = '—';
                remainingCell.style.color = '#999';
            }
            row.appendChild(remainingCell);

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
    },

    updateCashFlowChart(year) {
        // Calculate monthly savings for the selected year
        const monthlySavings = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let month = 1; month <= 12; month++) {
            const monthTransactions = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
            const monthIncome = monthTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
            const monthExpenses = monthTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
            const savings = monthIncome - monthExpenses;
            monthlySavings.push(savings);
        }

        // Calculate yearly average - only average months that have transactions
        // Count months with data (where there are transactions)
        const monthsWithData = [];
        for (let month = 1; month <= 12; month++) {
            const monthTransactions = Utils.getTransactionsForMonth(DataStore.transactions, year, month);
            if (monthTransactions.length > 0) {
                monthsWithData.push(monthlySavings[month - 1]);
            }
        }
        
        // If we have months with data, average those; otherwise use 0
        let yearlyAverage = 0;
        if (monthsWithData.length > 0) {
            const totalSavings = monthsWithData.reduce((sum, val) => sum + val, 0);
            yearlyAverage = totalSavings / monthsWithData.length;
        }

        // Create chart
        const ctx = document.getElementById('cash-flow-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (window.cashFlowChart) {
            window.cashFlowChart.destroy();
        }

        window.cashFlowChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: 'Total Savings',
                        type: 'bar',
                        data: monthlySavings,
                        backgroundColor: monthlySavings.map(val => val >= 0 ? '#2e7d32' : '#d32f2f'),
                        borderColor: monthlySavings.map(val => val >= 0 ? '#2e7d32' : '#d32f2f'),
                        borderWidth: 1,
                        order: 2
                    },
                    {
                        label: 'Yearly Average',
                        type: 'line',
                        data: Array(12).fill(yearlyAverage),
                        borderColor: '#333',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#333',
                        pointHoverBackgroundColor: '#333',
                        pointBackgroundColor: '#333',
                        pointBorderColor: '#333',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        intersect: false,
                        mode: 'index',
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return 'Total Savings: ' + Utils.formatCurrency(context.parsed.y);
                                } else {
                                    return 'Yearly Average: ' + Utils.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};
