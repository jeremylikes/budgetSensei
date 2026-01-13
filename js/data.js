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
        this.income = data.income || ['Default', 'Work Income'];
        this.expenses = data.expenses || ['Default', 'Groceries', 'Rent', 'Utilities'];
        this.methods = data.methods || ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
    },
    
    // Helper to get all categories (for backward compatibility during migration)
    get categories() {
        return [...this.income, ...this.expenses];
    },
    
    // Helper to get category type
    getCategoryType(categoryName) {
        if (this.income.includes(categoryName)) {
            return 'Income';
        } else if (this.expenses.includes(categoryName)) {
            return 'Expense';
        }
        return 'Expense'; // Default
    }
};
