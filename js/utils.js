// Utility Functions - Available globally as Utils

const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate(dateString) {
        // Parse date string directly to avoid timezone issues
        // Date is stored as YYYY-MM-DD format
        const dateParts = dateString.split('-');
        if (dateParts.length !== 3) {
            // Fallback to Date object if format is unexpected
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        }
        
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        
        // Return in mm/dd/yyyy format
        return `${month}/${day}/${year}`;
    },

    getTransactionsForMonth(transactions, year, month) {
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
    },

    sortTransactions(transactions, column, direction) {
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
};
