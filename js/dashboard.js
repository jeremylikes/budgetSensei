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
    }
};
