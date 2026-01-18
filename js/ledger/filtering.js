// Filtering Functionality - Available globally as LedgerFiltering

const LedgerFiltering = {
    filters: {
        date: null,
        category: null,
        method: null
    },
    searchTerm: '',

    setup() {
        // Setup filter icons for Date, Category, and Method
        this.setupFilterIcon('date');
        this.setupFilterIcon('category');
        this.setupFilterIcon('method');
        
        // Setup search input
        this.setupSearch();
    },
    
    setupSearch() {
        const searchInput = document.getElementById('ledger-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            if (window.Ledger) {
                Ledger.update();
            }
        });
    },

    setupFilterIcon(field) {
        const header = document.querySelector(`th.sortable[data-sort="${field}"]`);
        if (!header) return;

        // Create filter icon button
        const filterBtn = document.createElement('button');
        filterBtn.className = 'filter-icon-btn';
        filterBtn.dataset.field = field;
        filterBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';
        filterBtn.title = `Filter by ${field}`;
        
        // Insert before sort indicator
        const sortIndicator = header.querySelector('.sort-indicator');
        if (sortIndicator) {
            header.insertBefore(filterBtn, sortIndicator);
        } else {
            // If no sort indicator, append to header
            header.appendChild(filterBtn);
        }

        // Create dropdown container - append to body for proper positioning
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown';
        dropdown.dataset.field = field;
        dropdown.style.display = 'none';
        document.body.appendChild(dropdown);

        // Toggle dropdown on click
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent header click from triggering sort
            this.toggleDropdown(field, filterBtn, dropdown);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!header.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
                filterBtn.classList.remove('active');
            }
        });
    },

    toggleDropdown(field, button, dropdown) {
        const isOpen = dropdown.style.display === 'block';
        
        // Close all other dropdowns
        document.querySelectorAll('.filter-dropdown').forEach(dd => {
            if (dd !== dropdown) {
                dd.style.display = 'none';
            }
        });
        document.querySelectorAll('.filter-icon-btn').forEach(btn => {
            if (btn !== button) {
                btn.classList.remove('active');
            }
        });

        if (isOpen) {
            dropdown.style.display = 'none';
            button.classList.remove('active');
        } else {
            this.populateDropdown(field, dropdown);
            // Position dropdown relative to the button
            const buttonRect = button.getBoundingClientRect();
            dropdown.style.left = buttonRect.left + 'px';
            dropdown.style.top = (buttonRect.bottom + 2) + 'px';
            dropdown.style.display = 'block';
            button.classList.add('active');
        }
    },

    populateDropdown(field, dropdown) {
        // Clear existing options
        dropdown.innerHTML = '';

        // Get unique values from current month's transactions
        const year = parseInt(document.getElementById('ledger-year').value);
        const month = parseInt(document.getElementById('ledger-month').value);
        let transactions = Utils.getTransactionsForMonth(DataStore.transactions, year, month);

        // Get unique values for the field
        const uniqueValues = new Set();
        transactions.forEach(t => {
            let value = null;
            if (field === 'date') {
                value = t.date; // Store full date string
            } else if (field === 'category') {
                value = t.category;
            } else if (field === 'method') {
                value = t.method;
            }
            if (value) {
                uniqueValues.add(value);
            }
        });

        // Create "Clear Filter" option
        const clearOption = document.createElement('div');
        clearOption.className = 'filter-option';
        clearOption.textContent = 'Clear Filter';
        clearOption.addEventListener('click', () => {
            this.clearFilter(field);
        });
        dropdown.appendChild(clearOption);

        // Add separator
        if (uniqueValues.size > 0) {
            const separator = document.createElement('div');
            separator.className = 'filter-separator';
            dropdown.appendChild(separator);
        }

        // Sort and add unique values
        const sortedValues = Array.from(uniqueValues).sort((a, b) => {
            if (field === 'date') {
                return new Date(a) - new Date(b);
            }
            return a.localeCompare(b);
        });

        sortedValues.forEach(value => {
            const option = document.createElement('div');
            option.className = 'filter-option';
            
            // Format display value
            let displayValue = value;
            if (field === 'date') {
                displayValue = Utils.formatDate(value);
            }
            
            const textSpan = document.createElement('span');
            textSpan.textContent = displayValue;
            option.appendChild(textSpan);
            option.dataset.value = value;
            
            // Highlight if this value is currently filtered
            if (this.filters[field] === value) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', () => {
                this.applyFilter(field, value);
            });
            
            dropdown.appendChild(option);
        });

        // If no values, show message
        if (uniqueValues.size === 0) {
            const noData = document.createElement('div');
            noData.className = 'filter-option disabled';
            noData.textContent = 'No data available';
            dropdown.appendChild(noData);
        }
    },

    applyFilter(field, value) {
        this.filters[field] = value;
        this.updateFilterIcon(field);
        
        // Close dropdown
        const dropdown = document.querySelector(`.filter-dropdown[data-field="${field}"]`);
        const button = document.querySelector(`.filter-icon-btn[data-field="${field}"]`);
        if (dropdown) dropdown.style.display = 'none';
        if (button) button.classList.remove('active');

        // Trigger update
        if (window.Ledger) {
            window.Ledger.update();
        }
    },

    clearFilter(field) {
        this.filters[field] = null;
        this.updateFilterIcon(field);
        
        // Close dropdown
        const dropdown = document.querySelector(`.filter-dropdown[data-field="${field}"]`);
        const button = document.querySelector(`.filter-icon-btn[data-field="${field}"]`);
        if (dropdown) dropdown.style.display = 'none';
        if (button) button.classList.remove('active');

        // Trigger update
        if (window.Ledger) {
            window.Ledger.update();
        }
    },

    updateFilterIcon(field) {
        const button = document.querySelector(`.filter-icon-btn[data-field="${field}"]`);
        if (!button) return;

        if (this.filters[field]) {
            button.classList.add('has-filter');
        } else {
            button.classList.remove('has-filter');
        }
    },

    applyFilters(transactions) {
        let filtered = [...transactions];

        // Apply date filter
        if (this.filters.date) {
            filtered = filtered.filter(t => t.date === this.filters.date);
        }

        // Apply category filter
        if (this.filters.category) {
            filtered = filtered.filter(t => t.category === this.filters.category);
        }

        // Apply method filter
        if (this.filters.method) {
            filtered = filtered.filter(t => t.method === this.filters.method);
        }

        // Apply search filter
        if (this.searchTerm && this.searchTerm.trim()) {
            const searchLower = this.searchTerm.trim().toLowerCase();
            try {
                const regex = new RegExp(searchLower, 'i');
                filtered = filtered.filter(t => {
                    // Search across all relevant fields
                    const dateFormatted = Utils.formatDate(t.date); // mm/dd/yyyy format
                    const dateRaw = t.date; // yyyy-mm-dd format
                    const description = t.description || '';
                    const category = t.category || '';
                    const method = t.method || '';
                    const amount = String(t.amount);
                    const amountFormatted = Utils.formatCurrency(t.amount);
                    const note = t.note || '';
                    
                    return regex.test(dateFormatted) ||
                           regex.test(dateRaw) ||
                           regex.test(description) ||
                           regex.test(category) ||
                           regex.test(method) ||
                           regex.test(amount) ||
                           regex.test(amountFormatted) ||
                           regex.test(note);
                });
            } catch (e) {
                // If regex is invalid, fall back to simple string matching
                filtered = filtered.filter(t => {
                    const dateFormatted = Utils.formatDate(t.date);
                    const description = (t.description || '').toLowerCase();
                    const category = (t.category || '').toLowerCase();
                    const method = (t.method || '').toLowerCase();
                    const amount = String(t.amount);
                    const amountFormatted = Utils.formatCurrency(t.amount).toLowerCase();
                    const note = (t.note || '').toLowerCase();
                    
                    return dateFormatted.toLowerCase().includes(searchLower) ||
                           description.includes(searchLower) ||
                           category.includes(searchLower) ||
                           method.includes(searchLower) ||
                           amount.includes(searchLower) ||
                           amountFormatted.includes(searchLower) ||
                           note.includes(searchLower);
                });
            }
        }

        return filtered;
    },

    clearAllFilters() {
        this.filters.date = null;
        this.filters.category = null;
        this.filters.method = null;
        this.searchTerm = '';
        
        // Clear search input
        const searchInput = document.getElementById('ledger-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        document.querySelectorAll('.filter-icon-btn').forEach(btn => {
            btn.classList.remove('has-filter', 'active');
        });
        document.querySelectorAll('.filter-dropdown').forEach(dd => {
            dd.style.display = 'none';
        });
    }
};

// Make available globally
window.LedgerFiltering = LedgerFiltering;
