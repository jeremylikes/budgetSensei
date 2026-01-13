// API Functions - Available globally as API

const API = {
    BASE: window.location.origin + '/api',

    async loadData() {
        try {
            const response = await fetch(`${API.BASE}/data`);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            
            // Check if server is not running
            if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
                console.error('Server connection failed. Make sure the server is running on port 3000.');
                // Show a warning to the user
                const warningShown = sessionStorage.getItem('serverWarningShown');
                if (!warningShown) {
                    alert('Warning: Cannot connect to the server. Please make sure the server is running.\n\nStart the server with: npm start\n\nThis warning will not show again during this session.');
                    sessionStorage.setItem('serverWarningShown', 'true');
                }
            }
            
            // Fallback to defaults if API fails
            return { 
                transactions: [], 
                categories: ['Groceries', 'Rent', 'Utilities', 'Work Income'],
                methods: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer']
            };
        }
    }
};
