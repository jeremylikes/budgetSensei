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
    },

    /**
     * Calculate the next date for a recurring transaction
     * @param {Date} startDate - The starting date
     * @param {string} frequency - 'weekly', 'bi-weekly', or 'monthly'
     * @param {number} originalDay - The original day from the start date (for monthly)
     * @returns {Date} - The next date in the sequence
     */
    getNextRecurringDate(startDate, frequency, originalDay = null) {
        const nextDate = new Date(startDate);
        
        switch (frequency) {
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'bi-weekly':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'monthly':
                const currentMonth = nextDate.getMonth();
                const currentYear = nextDate.getFullYear();
                
                // Use original day if provided, otherwise use current date's day
                const targetDay = originalDay !== null ? originalDay : nextDate.getDate();
                
                // Move to next month
                let nextMonth = currentMonth + 1;
                let nextYear = currentYear;
                
                if (nextMonth > 11) {
                    nextMonth = 0;
                    nextYear++;
                }
                
                // Get the last day of the target month
                const lastDayOfMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
                
                // Use the original day if it exists in the month, otherwise use the last day
                const dayToUse = Math.min(targetDay, lastDayOfMonth);
                
                nextDate.setFullYear(nextYear, nextMonth, dayToUse);
                break;
            default:
                return null;
        }
        
        return nextDate;
    },

    /**
     * Parse date string (YYYY-MM-DD) without timezone issues
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {Date} - Date object in local timezone
     */
    parseDateString(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length !== 3) {
            return new Date(dateStr); // Fallback
        }
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
    },

    /**
     * Format date as YYYY-MM-DD without timezone issues
     * @param {Date} date - Date object
     * @returns {string} - Date string in YYYY-MM-DD format
     */
    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Generate all recurring transaction dates from start date until end of year
     * @param {string} startDateStr - Start date in YYYY-MM-DD format
     * @param {string} frequency - 'weekly', 'bi-weekly', or 'monthly'
     * @returns {string[]} - Array of dates in YYYY-MM-DD format
     */
    generateRecurringDates(startDateStr, frequency) {
        if (!frequency || frequency === 'none') {
            return [startDateStr];
        }
        
        const dates = [];
        const startDate = this.parseDateString(startDateStr);
        const currentYear = new Date().getFullYear();
        const endOfYear = new Date(currentYear, 11, 31); // December 31 of current year
        
        // Store the original day for monthly recurring transactions
        // Parse from string to avoid timezone issues
        const originalDay = frequency === 'monthly' ? parseInt(startDateStr.split('-')[2], 10) : null;
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endOfYear) {
            dates.push(this.formatDateString(currentDate));
            
            // Get next date (pass originalDay for monthly to preserve the original day)
            const nextDate = this.getNextRecurringDate(currentDate, frequency, originalDay);
            if (!nextDate || nextDate <= currentDate) {
                break; // Safety check to prevent infinite loops
            }
            currentDate = nextDate;
        }
        
        return dates;
    }
};
