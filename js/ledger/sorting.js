// Sorting Functionality - Available globally as LedgerSorting

const LedgerSorting = {
    sortColumn: 'date',
    sortDirection: 'desc',

    setup() {
        const sortableHeaders = document.querySelectorAll('th.sortable');
        
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                const defaultDir = header.dataset.default;
                
                // If clicking the same column, toggle direction
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    // New column, use its default direction
                    this.sortColumn = column;
                    this.sortDirection = defaultDir;
                }
                
                // Trigger update via Ledger
                if (window.Ledger) {
                    window.Ledger.update();
                }
            });
        });
    },

    updateIndicators() {
        const sortableHeaders = document.querySelectorAll('th.sortable');
        
        sortableHeaders.forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            const column = header.dataset.sort;
            
            if (this.sortColumn === column) {
                indicator.textContent = this.sortDirection === 'asc' ? '▲' : '▼';
                indicator.style.opacity = '1';
            } else {
                // Show default indicator for other columns
                const defaultDir = header.dataset.default;
                indicator.textContent = defaultDir === 'asc' ? '▲' : '▼';
                indicator.style.opacity = '0.3';
            }
        });
    }
};

// Make available globally
window.LedgerSorting = LedgerSorting;
