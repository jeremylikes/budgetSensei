// Authentication Module
// Handles user login, registration, and session management

const Auth = {
    currentUser: null,
    
    // Check if user is authenticated
    async checkSession() {
        try {
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.authenticated) {
                this.currentUser = data.user;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    },
    
    // Login
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Register
    async register(username, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Error registering:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Logout
    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            this.currentUser = null;
            return true;
        } catch (error) {
            console.error('Error logging out:', error);
            return false;
        }
    },
    
    // Show login screen
    showLoginScreen() {
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'none';
        }
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
    },
    
    // Hide login screen
    hideLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'block';
        }
    },
    
    // Setup login screen UI
    setupLoginScreen() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegisterLink = document.getElementById('show-register');
        const showLoginLink = document.getElementById('show-login');
        const loginError = document.getElementById('login-error');
        const registerError = document.getElementById('register-error');
        
        // Show register form
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginForm) loginForm.style.display = 'none';
                if (registerForm) registerForm.style.display = 'block';
                if (loginError) loginError.textContent = '';
                if (registerError) registerError.textContent = '';
            });
        }
        
        // Show login form
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerForm) registerForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (loginError) loginError.textContent = '';
                if (registerError) registerError.textContent = '';
            });
        }
        
        // Handle login
        const loginSubmit = document.getElementById('login-submit');
        if (loginSubmit) {
            loginSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                
                if (!username || !password) {
                    if (loginError) loginError.textContent = 'Please enter username and password';
                    return;
                }
                
                const result = await this.login(username, password);
                if (result.success) {
                    this.hideLoginScreen();
                    // Reload the app
                    location.reload();
                } else {
                    if (loginError) loginError.textContent = result.error;
                }
            });
        }
        
        // Handle register
        const registerSubmit = document.getElementById('register-submit');
        if (registerSubmit) {
            registerSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const username = document.getElementById('register-username').value;
                const password = document.getElementById('register-password').value;
                const confirmPassword = document.getElementById('register-confirm-password').value;
                
                if (!username || !password || !confirmPassword) {
                    if (registerError) registerError.textContent = 'Please fill in all fields';
                    return;
                }
                
                if (password.length < 8) {
                    if (registerError) registerError.textContent = 'Password must be at least 8 characters';
                    return;
                }
                
                if (password !== confirmPassword) {
                    if (registerError) registerError.textContent = 'Passwords do not match';
                    return;
                }
                
                // Validate username format
                if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                    if (registerError) registerError.textContent = 'Username can only contain letters, numbers, and underscores';
                    return;
                }
                
                const result = await this.register(username, password);
                if (result.success) {
                    this.hideLoginScreen();
                    // Reload the app
                    location.reload();
                } else {
                    if (registerError) registerError.textContent = result.error;
                }
            });
        }
        
        // Handle logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
                this.showLoginScreen();
                location.reload();
            });
        }
    }
};
