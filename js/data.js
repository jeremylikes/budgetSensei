// Data Storage - Shared state - Available globally as DataStore

const DataStore = {
    transactions: [],
    categories: [],
    methods: [],
    sortColumn: 'date',
    sortDirection: 'desc', // 'asc' or 'desc'

    init(data) {
        this.transactions = data.transactions || [];
        this.categories = data.categories || ['Groceries', 'Rent', 'Utilities', 'Work Income'];
        this.methods = data.methods || ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
    }
};
