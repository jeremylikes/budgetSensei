// Sum Calculation - Available globally as LedgerSum

const LedgerSum = {
    update() {
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
    }
};

// Make available globally
window.LedgerSum = LedgerSum;
