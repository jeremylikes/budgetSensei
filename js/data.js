// Data Storage - Shared state - Available globally as DataStore

const DataStore = {
    transactions: [],
    income: [],
    expenses: [],
    methods: [],
    sortColumn: 'date',
    sortDirection: 'desc', // 'asc' or 'desc'

    init(data) {
        this.transactions = data.transactions || [];
        // Handle both old format (array of strings) and new format (array of objects)
        const incomeData = data.income || ['Default', 'Work Income'];
        const expensesData = data.expenses || ['Default', 'Groceries', 'Rent', 'Utilities'];
        
        this.income = incomeData.map(item => {
            if (typeof item === 'string') {
                return { name: item, icon: '' };
            }
            return { name: item.name || item, icon: item.icon || '' };
        });
        
        this.expenses = expensesData.map(item => {
            if (typeof item === 'string') {
                return { name: item, icon: '' };
            }
            return { name: item.name || item, icon: item.icon || '' };
        });
        
        this.methods = data.methods || ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
    },
    
    // Helper to get all categories (for backward compatibility during migration)
    get categories() {
        return [...this.income.map(c => c.name || c), ...this.expenses.map(c => c.name || c)];
    },
    
    // Helper to get category type
    getCategoryType(categoryName) {
        if (this.income.some(c => (c.name || c) === categoryName)) {
            return 'Income';
        } else if (this.expenses.some(c => (c.name || c) === categoryName)) {
            return 'Expense';
        }
        return 'Expense'; // Default
    }
};
