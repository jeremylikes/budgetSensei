// Dashboard functionality - Available globally as Dashboard

// Set Chart.js global font to Nunito
Chart.defaults.font.family = "'Nunito', sans-serif";

const Dashboard = {
    update() {
        const yearSelect = document.getElementById('dashboard-year');
        const monthSelect = document.getElementById('dashboard-month');
        
        // Check if elements exist before proceeding
        if (!yearSelect || !monthSelect) {
            console.warn('Dashboard date selectors not found, skipping update');
            return;
        }
        
        // Check if DataStore is ready
        if (!DataStore || !Array.isArray(DataStore.transactions)) {
            console.warn('DataStore not ready, skipping Dashboard update');
            return;
        }
        
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);

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

        // Update tooltips with percentage breakdowns
        this.updateTooltips(income, expenses, totalIncome, totalExpenses);

        this.updateCharts(income, expenses);
        this.updatePaymentMethods(filtered);
        this.updateBudget(filtered, year, month);
        this.updateCashFlowChart(year);
    },

    updateTooltips(income, expenses, totalIncome, totalExpenses) {
        // Calculate income breakdown
        const incomeData = {};
        income.forEach(t => {
            incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
        });
        
        // Calculate expense breakdown
        const expenseData = {};
        expenses.forEach(t => {
            expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        });
        
        // Create income tooltip content (sorted largest to smallest, limited to 20 items)
        const incomeItems = Object.entries(incomeData)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);
        
        const incomeBreakdown = incomeItems
            .slice(0, 20)
            .map(item => `<span class="tooltip-category">${item.category}</span> <span class="tooltip-amount">${Utils.formatCurrency(item.amount)}</span> <span class="tooltip-percent">${item.percentage.toFixed(1)}%</span>`)
            .concat(incomeItems.length > 20 ? ['...'] : [])
            .join('<br>');
        
        // Create expense tooltip content (sorted largest to smallest, limited to 20 items)
        const expenseItems = Object.entries(expenseData)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);
        
        const expenseBreakdown = expenseItems
            .slice(0, 20)
            .map(item => `<span class="tooltip-category">${item.category}</span> <span class="tooltip-amount">${Utils.formatCurrency(item.amount)}</span> <span class="tooltip-percent">${item.percentage.toFixed(1)}%</span>`)
            .concat(expenseItems.length > 20 ? ['...'] : [])
            .join('<br>');
        
        // Update tooltips
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpensesEl = document.getElementById('total-expenses');
        
        // Remove existing tooltip elements
        const existingTooltips = document.querySelectorAll('.custom-tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());
        
        if (totalIncomeEl && incomeBreakdown) {
            totalIncomeEl.classList.add('has-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.innerHTML = incomeBreakdown;
            totalIncomeEl.appendChild(tooltip);
        } else if (totalIncomeEl) {
            totalIncomeEl.classList.remove('has-tooltip');
        }
        
        if (totalExpensesEl && expenseBreakdown) {
            totalExpensesEl.classList.add('has-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.innerHTML = expenseBreakdown;
            totalExpensesEl.appendChild(tooltip);
        } else if (totalExpensesEl) {
            totalExpensesEl.classList.remove('has-tooltip');
        }
    },

    updateCharts(income, expenses) {
        // Income Chart
        const incomeData = {};
        income.forEach(t => {
            incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
        });

        const incomeCtx = document.getElementById('income-chart').getContext('2d');
        if (window.incomeChart) window.incomeChart.destroy();
        
        const incomeValues = Object.values(incomeData);
        const incomeTotal = incomeValues.reduce((sum, val) => sum + val, 0);
        
        window.incomeChart = new Chart(incomeCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(incomeData),
                datasets: [{
                    data: incomeValues,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = incomeTotal > 0 ? ((value / incomeTotal) * 100).toFixed(1) : '0.0';
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Expense Chart
        const expenseData = {};
        expenses.forEach(t => {
            expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
        });

        const expenseCtx = document.getElementById('expense-chart').getContext('2d');
        if (window.expenseChart) window.expenseChart.destroy();
        
        const expenseValues = Object.values(expenseData);
        const expenseTotal = expenseValues.reduce((sum, val) => sum + val, 0);
        
        window.expenseChart = new Chart(expenseCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(expenseData),
                datasets: [{
                    data: expenseValues,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const percentage = expenseTotal > 0 ? ((value / expenseTotal) * 100).toFixed(1) : '0.0';
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
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

        // Get only expense categories for budget table (Income categories excluded from display)
        // Handle both old format (strings) and new format (objects with name)
        console.log('DataStore.income:', DataStore.income);
        console.log('DataStore.expenses:', DataStore.expenses);
        
        const allCategories = [
            ...(DataStore.expenses || []).map(c => typeof c === 'string' ? c : (c.name || c))
        ].sort((a, b) => a.localeCompare(b));

        console.log('All categories for budget:', allCategories);

        // Build budget table
        const tbody = document.getElementById('budget-tbody');
        if (!tbody) {
            console.error('budget-tbody element not found');
            return;
        }
        tbody.innerHTML = '';

        if (allCategories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No categories available.</td></tr>';
            console.warn('No categories found in DataStore');
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
            const categoryIcon = DataStore.getCategoryIcon(category);
            if (categoryIcon) {
                categoryCell.innerHTML = `<span class="category-icon">${categoryIcon}</span> ${category}`;
            } else {
                categoryCell.textContent = category;
            }
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
            
            // Store original value when input is focused
            let originalValue = plannedInput.value;
            plannedInput.addEventListener('focus', (e) => {
                originalValue = e.target.value;
            });
            
            // Format on blur (save) - use setTimeout to allow focus to move to next input
            plannedInput.addEventListener('blur', async (e) => {
                // Use setTimeout to allow the click event on the next input to complete first
                setTimeout(async () => {
                    // Check if focus moved to another planned input
                    const activeElement = document.activeElement;
                    const isMovingToAnotherInput = activeElement && 
                        activeElement.classList.contains('budget-planned-input') &&
                        activeElement !== e.target;
                    
                    // Only save/refresh if we're not moving to another input
                    // This prevents the table from being rebuilt while trying to focus the next input
                    if (!isMovingToAnotherInput) {
                        const currentValue = e.target.value.trim();
                        // Save the value (even if empty - this will delete the budget entry)
                        // The saveBudgetAmount function handles empty values by deleting the entry
                        await this.saveBudgetAmount(e.target);
                    }
                    // If moving to another input, the save will happen when that input blurs
                }, 150);
            });
            
            // Handle Enter and Escape keys
            plannedInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    // Clear the entry and exit edit mode
                    e.target.value = '';
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

        // Update budget summary tiles
        let totalPlanned = 0;
        let totalActual = 0;
        
        allCategories.forEach(category => {
            const planned = budgetData[category] || 0;
            const actual = actualData[category] || 0;
            totalPlanned += planned;
            totalActual += actual;
        });
        
        const totalRemaining = totalPlanned - totalActual;
        
        // Update the tile elements
        const plannedTotalEl = document.getElementById('budget-planned-total');
        const actualTotalEl = document.getElementById('budget-actual-total');
        const remainingTotalEl = document.getElementById('budget-remaining-total');
        
        if (plannedTotalEl) {
            plannedTotalEl.textContent = Utils.formatCurrency(totalPlanned);
        }
        if (actualTotalEl) {
            actualTotalEl.textContent = Utils.formatCurrency(totalActual);
        }
        if (remainingTotalEl) {
            remainingTotalEl.textContent = Utils.formatCurrency(totalRemaining);
        }
        
        // Tint the Remaining card based on value using CSS classes
        const remainingTile = remainingTotalEl.closest('.tile');
        if (remainingTile) {
            // Remove any existing state classes
            remainingTile.classList.remove('remaining-negative', 'remaining-positive');
            
            if (totalRemaining < 0) {
                // Negative - red background
                remainingTile.classList.add('remaining-negative');
            } else {
                // Positive or zero - green background
                remainingTile.classList.add('remaining-positive');
            }
        }
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
