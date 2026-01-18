// Authentication Module
// Handles user login, registration, and session management

const Auth = {
    currentUser: null,
    isLoggingOut: false,
    isLoggingIn: false,
    
    // Check if user is authenticated
    async checkSession() {
        try {
            // Create timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('/api/auth/session', {
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                return false;
            }
            
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
        // Wait for any logout in progress to complete
        if (this.isLoggingOut) {
            console.log('Waiting for logout to complete before login...');
            while (this.isLoggingOut) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Additional delay to ensure session is fully cleared
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        if (this.isLoggingIn) {
            console.log('Login already in progress');
            return { success: false, error: 'Login already in progress. Please wait.' };
        }
        
        this.isLoggingIn = true;
        try {
            // Create timeout controller for older browsers
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                this.isLoggingIn = false;
                return { success: false, error: errorData.error || 'Login failed' };
            }
            
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                this.isLoggingIn = false;
                return { success: true };
            } else {
                this.isLoggingIn = false;
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Error logging in:', error);
            this.isLoggingIn = false;
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                return { success: false, error: 'Connection timeout. Please try again.' };
            }
            if (error.message && error.message.includes('fetch')) {
                return { success: false, error: 'Failed to connect to server. Please check if the server is running.' };
            }
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
        if (this.isLoggingOut) {
            console.log('Logout already in progress, waiting...');
            // Wait for existing logout to complete
            while (this.isLoggingOut) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return true;
        }
        
        this.isLoggingOut = true;
        try {
            // Create timeout controller for older browsers
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Logout failed:', errorData.error || response.statusText);
                // Still clear current user even if logout request failed
                this.currentUser = null;
                this.isLoggingOut = false;
                return false;
            }
            
            const data = await response.json();
            this.currentUser = null;
            
            // Wait a bit to ensure session is fully destroyed
            await new Promise(resolve => setTimeout(resolve, 200));
            
            this.isLoggingOut = false;
            return data.success === true;
        } catch (error) {
            console.error('Error logging out:', error);
            // Clear current user even if request failed
            this.currentUser = null;
            this.isLoggingOut = false;
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
        
        // Show login form (will be updated after validateLoginForm is defined)
        
        // Handle login
        const loginSubmit = document.getElementById('login-submit');
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');
        
        // Function to validate and enable/disable login button
        const validateLoginForm = () => {
            if (loginSubmit && loginUsername && loginPassword) {
                const username = loginUsername.value.trim();
                const password = loginPassword.value.trim();
                const isValid = username.length > 0 && password.length > 0;
                loginSubmit.disabled = !isValid;
                // Update opacity for visual feedback
                if (loginSubmit.style) {
                    loginSubmit.style.opacity = isValid ? '1' : '0.6';
                }
            }
        };
        
        // Ensure login button starts disabled
        if (loginSubmit) {
            loginSubmit.disabled = true;
            if (loginSubmit.style) {
                loginSubmit.style.opacity = '0.6';
            }
        }
        
        // Add input listeners to username and password fields
        if (loginUsername) {
            loginUsername.addEventListener('input', validateLoginForm);
            loginUsername.addEventListener('keyup', validateLoginForm);
            loginUsername.addEventListener('paste', () => {
                // Delay to allow paste to complete
                setTimeout(validateLoginForm, 10);
            });
        }
        if (loginPassword) {
            loginPassword.addEventListener('input', validateLoginForm);
            loginPassword.addEventListener('keyup', validateLoginForm);
            loginPassword.addEventListener('paste', () => {
                // Delay to allow paste to complete
                setTimeout(validateLoginForm, 10);
            });
        }
        
        // Show login form (with validation)
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerForm) registerForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (loginError) loginError.textContent = '';
                if (registerError) registerError.textContent = '';
                // Re-validate when switching to login form
                setTimeout(validateLoginForm, 10);
            });
        }
        
        // Run initial validation on page load
        setTimeout(validateLoginForm, 100);
        
        if (loginSubmit) {
            loginSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const username = loginUsername ? loginUsername.value.trim() : '';
                const password = loginPassword ? loginPassword.value.trim() : '';
                
                if (!username || !password) {
                    if (loginError) loginError.textContent = 'Please enter username and password';
                    return;
                }
                
                // Disable submit button to prevent double-clicks
                if (loginSubmit) {
                    loginSubmit.disabled = true;
                    loginSubmit.textContent = 'Logging in...';
                }
                
                const result = await this.login(username, password);
                if (result.success) {
                    // Small delay to ensure login completes before reload
                    await new Promise(resolve => setTimeout(resolve, 100));
                    this.hideLoginScreen();
                    // Reload the app
                    location.reload();
                } else {
                    if (loginError) loginError.textContent = result.error;
                    // Re-enable submit button on error (but keep validation)
                    validateLoginForm();
                    if (loginSubmit && username && password) {
                        loginSubmit.textContent = 'Login';
                    }
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
                // Disable button to prevent double-clicks
                logoutBtn.disabled = true;
                logoutBtn.textContent = 'Logging out...';
                
                // Disable login button and form inputs to prevent login during logout
                const loginSubmit = document.getElementById('login-submit');
                const loginUsername = document.getElementById('login-username');
                const loginPassword = document.getElementById('login-password');
                
                if (loginSubmit) {
                    loginSubmit.disabled = true;
                    loginSubmit.textContent = 'Please wait...';
                }
                if (loginUsername) loginUsername.disabled = true;
                if (loginPassword) loginPassword.disabled = true;
                
                try {
                    const success = await this.logout();
                    // Wait for logout to fully complete (already done in logout function, but extra safety)
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Re-enable login form now that logout is complete
                    if (loginSubmit) {
                        loginSubmit.disabled = false;
                        loginSubmit.textContent = 'Login';
                    }
                    if (loginUsername) loginUsername.disabled = false;
                    if (loginPassword) loginPassword.disabled = false;
                    
                    this.showLoginScreen();
                    // Clear any pending login attempts
                    this.isLoggingIn = false;
                    location.reload();
                } catch (error) {
                    console.error('Error during logout:', error);
                    // Re-enable login form even if logout failed
                    if (loginSubmit) {
                        loginSubmit.disabled = false;
                        loginSubmit.textContent = 'Login';
                    }
                    if (loginUsername) loginUsername.disabled = false;
                    if (loginPassword) loginPassword.disabled = false;
                    
                    // Still show login screen and reload even if logout request failed
                    this.isLoggingOut = false;
                    this.isLoggingIn = false;
                    this.showLoginScreen();
                    location.reload();
                }
            });
        }
    }
};
