// Theme Management Module - Available globally as Theme
// Handles dark/light mode switching and persistence

const Theme = {
    STORAGE_KEY: 'budgetSensei_theme',
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    
    init() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || this.THEMES.LIGHT;
        this.setTheme(savedTheme);
        
        // Set up header toggle button (only if not already set up)
        const headerToggle = document.getElementById('theme-toggle-header');
        if (headerToggle && !headerToggle.dataset.themeInitialized) {
            headerToggle.dataset.themeInitialized = 'true';
            headerToggle.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // Set up settings toggle button (only if not already set up)
        const settingsToggle = document.getElementById('theme-toggle-settings');
        if (settingsToggle && !settingsToggle.dataset.themeInitialized) {
            settingsToggle.dataset.themeInitialized = 'true';
            settingsToggle.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // Update toggle states
        this.updateToggleStates();
    },
    
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.THEMES.LIGHT;
    },
    
    setTheme(theme) {
        if (theme !== this.THEMES.LIGHT && theme !== this.THEMES.DARK) {
            theme = this.THEMES.LIGHT;
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateToggleStates();
    },
    
    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.THEMES.LIGHT ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.setTheme(newTheme);
    },
    
    updateToggleStates() {
        const currentTheme = this.getCurrentTheme();
        const isDark = currentTheme === this.THEMES.DARK;
        
        // Update header toggle
        const headerToggle = document.getElementById('theme-toggle-header');
        if (headerToggle) {
            headerToggle.setAttribute('aria-pressed', isDark);
            headerToggle.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
            
            // Update icon
            const icon = headerToggle.querySelector('svg');
            if (icon) {
                if (isDark) {
                    // Sun icon for dark mode (clicking will switch to light)
                    icon.innerHTML = `
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    `;
                } else {
                    // Moon icon for light mode (clicking will switch to dark)
                    icon.innerHTML = `
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    `;
                }
            }
        }
        
        // Update settings toggle
        const settingsToggle = document.getElementById('theme-toggle-settings');
        if (settingsToggle) {
            settingsToggle.setAttribute('aria-pressed', isDark);
            const label = settingsToggle.closest('.user-settings-section')?.querySelector('.user-settings-label');
            const toggleLabel = settingsToggle.querySelector('.theme-toggle-label');
            if (label) {
                label.textContent = `Theme: ${isDark ? 'Dark Mode' : 'Light Mode'}`;
            }
            if (toggleLabel) {
                toggleLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
            }
        }
    }
};

// Make available globally
window.Theme = Theme;

// Initialize theme immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Theme.init();
    });
} else {
    // DOM is already ready
    Theme.init();
}
