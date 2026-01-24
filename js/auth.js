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
            } else if (data.requiresEmail) {
                // User needs to associate an email
                this.isLoggingIn = false;
                return { success: false, requiresEmail: true, username: data.username || username };
            } else if (data.requiresVerification) {
                // User has email but needs to verify it
                this.isLoggingIn = false;
                return { success: false, requiresVerification: true, username: data.username || username, email: data.email };
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
    async register(username, password, email) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password, email })
            });
            const data = await response.json();
            if (data.success) {
                return { success: true, requiresVerification: data.requiresVerification };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Error registering:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Request password reset
    async requestPasswordReset(email) {
        try {
            const response = await fetch('/api/auth/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            return { success: data.success, message: data.message || data.error };
        } catch (error) {
            console.error('Error requesting password reset:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Request email association (for existing accounts)
    async requestEmailAssociation(username, email) {
        try {
            const response = await fetch('/api/auth/request-email-association', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email })
            });
            const data = await response.json();
            if (data.success) {
                return { 
                    success: true, 
                    emailSent: data.emailSent !== false, // Default to true if not specified
                    message: data.message || 'Verification email sent' 
                };
            } else {
                return { success: false, error: data.error || 'Failed to send verification email' };
            }
        } catch (error) {
            console.error('Error requesting email association:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Resend verification email (for accounts with unverified email)
    async resendVerification(username) {
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (data.success) {
                return { success: true, message: data.message || 'Verification email sent' };
            } else {
                return { success: false, error: data.error || 'Failed to resend verification email' };
            }
        } catch (error) {
            console.error('Error resending verification email:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Reset password
    async resetPassword(token, password, confirmPassword) {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token, password, confirmPassword })
            });
            const data = await response.json();
            if (data.success) {
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Password reset failed' };
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            return { success: false, error: 'Failed to connect to server' };
        }
    },
    
    // Show email association page
    showEmailAssociationPage(username) {
        this.showLoginScreen();
        this.showPage('email-association-page');
        // Store username for the form
        const emailAssociationForm = document.getElementById('email-association-form');
        if (emailAssociationForm && username) {
            emailAssociationForm.dataset.username = username;
        }
        // Clear any error messages
        const emailAssociationError = document.getElementById('email-association-error');
        const emailAssociationSuccess = document.getElementById('email-association-success');
        if (emailAssociationError) emailAssociationError.textContent = '';
        if (emailAssociationSuccess) emailAssociationSuccess.textContent = '';
        // Clear email field
        const emailInput = document.getElementById('email-association-email');
        if (emailInput) emailInput.value = '';
    },
    
    // Show resend verification page
    showResendVerificationPage(username, email) {
        this.showLoginScreen();
        this.showPage('resend-verification-page');
        // Store username for the form
        const resendVerificationForm = document.getElementById('resend-verification-form');
        if (resendVerificationForm && username) {
            resendVerificationForm.dataset.username = username;
        }
        // Display email address
        const emailDisplay = document.getElementById('resend-verification-email-display');
        if (emailDisplay && email) {
            emailDisplay.textContent = `Email: ${email}`;
        }
        // Clear any error/success messages
        const resendError = document.getElementById('resend-verification-error');
        const resendSuccess = document.getElementById('resend-verification-success');
        if (resendError) resendError.textContent = '';
        if (resendSuccess) resendSuccess.textContent = '';
    },
    
    // Show specific page in login screen
    showPage(pageId) {
        // Make sure login screen is visible
        this.showLoginScreen();
        
        // Hide all pages
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        const checkEmailPage = document.getElementById('check-email-page');
        const accountVerifiedPage = document.getElementById('account-verified-page');
        const resetPasswordPage = document.getElementById('reset-password-page');
        const resetSuccessPage = document.getElementById('reset-success-page');
        const emailAssociationPage = document.getElementById('email-association-page');
        const emailAssociationSuccessPage = document.getElementById('email-association-success-page');
        const resendVerificationPage = document.getElementById('resend-verification-page');
        
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        if (checkEmailPage) checkEmailPage.style.display = 'none';
        if (accountVerifiedPage) accountVerifiedPage.style.display = 'none';
        if (resetPasswordPage) resetPasswordPage.style.display = 'none';
        if (resetSuccessPage) resetSuccessPage.style.display = 'none';
        if (emailAssociationPage) emailAssociationPage.style.display = 'none';
        if (emailAssociationSuccessPage) emailAssociationSuccessPage.style.display = 'none';
        if (resendVerificationPage) resendVerificationPage.style.display = 'none';
        
        // Show requested page
        const page = document.getElementById(pageId);
        if (page) {
            page.style.display = 'block';
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
    
    // Handle URL parameters (verification token, reset token, etc.)
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const verifyToken = urlParams.get('verify') === 'email' ? urlParams.get('token') : null;
        const resetToken = urlParams.get('reset') === 'password' ? urlParams.get('token') : null;
        const verified = urlParams.get('verified') === 'true';
        const emailAssociated = urlParams.get('email_associated') === 'true';
        const error = urlParams.get('error');
        
        // Show login screen if we have URL parameters
        if (verifyToken || resetToken || verified || emailAssociated || error) {
            this.showLoginScreen();
        }
        
        if (verifyToken) {
            // Verification is handled server-side via redirect
            // Just show appropriate page based on URL
            if (verified) {
                this.showPage('account-verified-page');
            } else if (emailAssociated) {
                this.showPage('email-association-success-page');
            } else if (error) {
                const loginError = document.getElementById('login-error');
                if (loginError) {
                    let errorMsg = 'Verification failed';
                    if (error === 'invalid_token') errorMsg = 'Invalid verification link';
                    else if (error === 'token_expired') errorMsg = 'Verification link has expired. Please try again.';
                    else if (error === 'missing_token') errorMsg = 'Missing verification token';
                    loginError.textContent = errorMsg;
                }
                this.showPage('login-form');
            }
        } else if (resetToken) {
            // Show reset password page
            this.showPage('reset-password-page');
        } else if (verified) {
            // New account verified
            this.showPage('account-verified-page');
        } else if (emailAssociated) {
            // Email association successful
            this.showPage('email-association-success-page');
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
                    if (loginError) loginError.textContent = 'Please enter username or email and password';
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
                } else if (result.requiresEmail) {
                    // User needs to associate an email
                    this.showEmailAssociationPage(result.username || username);
                } else if (result.requiresVerification) {
                    // User has email but needs to verify it
                    this.showResendVerificationPage(result.username || username, result.email);
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
                const username = document.getElementById('register-username').value.trim();
                const email = document.getElementById('register-email').value.trim();
                const password = document.getElementById('register-password').value;
                const confirmPassword = document.getElementById('register-confirm-password').value;
                
                if (!username || !email || !password || !confirmPassword) {
                    if (registerError) registerError.textContent = 'Please fill in all fields';
                    return;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    if (registerError) registerError.textContent = 'Please enter a valid email address';
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
                
                registerSubmit.disabled = true;
                registerSubmit.textContent = 'Creating account...';
                
                const result = await this.register(username, password, email);
                if (result.success) {
                    if (result.requiresVerification) {
                        if (result.emailSent === false) {
                            // Email failed to send - show error message
                            if (registerError) {
                                registerError.textContent = result.message || 'Account created but verification email could not be sent. Please contact support.';
                                registerError.style.display = 'block';
                            }
                            // Still show the form so they can see the error
                            registerSubmit.disabled = false;
                            registerSubmit.textContent = 'Create Account';
                        } else {
                            // Show check email page
                            this.showPage('check-email-page');
                        }
                    } else {
                        this.hideLoginScreen();
                        location.reload();
                    }
                } else {
                    if (registerError) registerError.textContent = result.error;
                    registerSubmit.disabled = false;
                    registerSubmit.textContent = 'Create Account';
                }
            });
        }
        
        // Handle forgot password
        const showForgotPasswordLink = document.getElementById('show-forgot-password');
        if (showForgotPasswordLink) {
            showForgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('forgot-password-form');
                const forgotError = document.getElementById('forgot-password-error');
                const forgotSuccess = document.getElementById('forgot-password-success');
                if (forgotError) forgotError.textContent = '';
                if (forgotSuccess) forgotSuccess.textContent = '';
            });
        }
        
        const showLoginFromForgotLink = document.getElementById('show-login-from-forgot');
        if (showLoginFromForgotLink) {
            showLoginFromForgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('login-form');
            });
        }
        
        const forgotPasswordSubmit = document.getElementById('forgot-password-submit');
        if (forgotPasswordSubmit) {
            forgotPasswordSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgot-password-email').value.trim();
                const forgotError = document.getElementById('forgot-password-error');
                const forgotSuccess = document.getElementById('forgot-password-success');
                
                if (!email) {
                    if (forgotError) forgotError.textContent = 'Please enter your email address';
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    if (forgotError) forgotError.textContent = 'Please enter a valid email address';
                    return;
                }
                
                forgotPasswordSubmit.disabled = true;
                forgotPasswordSubmit.textContent = 'Sending...';
                
                const result = await this.requestPasswordReset(email);
                if (result.success) {
                    if (forgotError) forgotError.textContent = '';
                    if (forgotSuccess) forgotSuccess.textContent = result.message || 'Password reset link sent! Check your email.';
                } else {
                    if (forgotError) forgotError.textContent = result.error || result.message || 'Failed to send reset link';
                    if (forgotSuccess) forgotSuccess.textContent = '';
                }
                
                forgotPasswordSubmit.disabled = false;
                forgotPasswordSubmit.textContent = 'Send Reset Link';
            });
        }
        
        // Handle reset password form
        const resetPasswordSubmit = document.getElementById('reset-password-submit');
        const resetPasswordNew = document.getElementById('reset-password-new');
        const resetPasswordConfirm = document.getElementById('reset-password-confirm');
        const resetError = document.getElementById('reset-password-error');
        
        // Function to check if passwords match and show/hide button
        const checkPasswordMatch = () => {
            const newPassword = resetPasswordNew ? resetPasswordNew.value : '';
            const confirmPassword = resetPasswordConfirm ? resetPasswordConfirm.value : '';
            
            // Hide button if passwords don't match or are too short
            if (!newPassword || !confirmPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
                if (resetPasswordSubmit) {
                    resetPasswordSubmit.style.display = 'none';
                }
                if (resetError && newPassword && confirmPassword && newPassword !== confirmPassword) {
                    resetError.textContent = 'Passwords do not match';
                } else if (resetError && newPassword && confirmPassword && newPassword.length < 8) {
                    resetError.textContent = 'Password must be at least 8 characters';
                } else if (resetError && (!newPassword || !confirmPassword)) {
                    resetError.textContent = '';
                }
            } else {
                // Show button if passwords match and meet requirements
                if (resetPasswordSubmit) {
                    resetPasswordSubmit.style.display = 'block';
                }
                if (resetError) {
                    resetError.textContent = '';
                }
            }
        };
        
        // Initially hide the button
        if (resetPasswordSubmit) {
            resetPasswordSubmit.style.display = 'none';
        }
        
        // Add input listeners to check password match in real-time
        if (resetPasswordNew) {
            resetPasswordNew.addEventListener('input', checkPasswordMatch);
            resetPasswordNew.addEventListener('keyup', checkPasswordMatch);
        }
        if (resetPasswordConfirm) {
            resetPasswordConfirm.addEventListener('input', checkPasswordMatch);
            resetPasswordConfirm.addEventListener('keyup', checkPasswordMatch);
        }
        
        if (resetPasswordSubmit) {
            resetPasswordSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                const newPassword = resetPasswordNew ? resetPasswordNew.value : '';
                const confirmPassword = resetPasswordConfirm ? resetPasswordConfirm.value : '';
                
                if (!token) {
                    if (resetError) resetError.textContent = 'Invalid reset token';
                    return;
                }
                
                if (!newPassword || !confirmPassword) {
                    if (resetError) resetError.textContent = 'Please fill in all fields';
                    return;
                }
                
                if (newPassword.length < 8) {
                    if (resetError) resetError.textContent = 'Password must be at least 8 characters';
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    if (resetError) resetError.textContent = 'Passwords do not match';
                    return;
                }
                
                resetPasswordSubmit.disabled = true;
                resetPasswordSubmit.textContent = 'Resetting...';
                
                const result = await this.resetPassword(token, newPassword, confirmPassword);
                if (result.success) {
                    this.showPage('reset-success-page');
                } else {
                    if (resetError) resetError.textContent = result.error;
                    resetPasswordSubmit.disabled = false;
                    resetPasswordSubmit.textContent = 'Reset Password';
                }
            });
        }
        
        // Handle go to login links
        const goToLoginLink = document.getElementById('go-to-login');
        if (goToLoginLink) {
            goToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.replaceState({}, document.title, window.location.pathname);
                this.showPage('login-form');
            });
        }
        
        const goToLoginFromResetLink = document.getElementById('go-to-login-from-reset');
        if (goToLoginFromResetLink) {
            goToLoginFromResetLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.replaceState({}, document.title, window.location.pathname);
                this.showPage('login-form');
            });
        }
        
        const goToLoginFromEmailAssociationLink = document.getElementById('go-to-login-from-email-association');
        if (goToLoginFromEmailAssociationLink) {
            goToLoginFromEmailAssociationLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.replaceState({}, document.title, window.location.pathname);
                this.showPage('login-form');
            });
        }
        
        const goToLoginFromResendVerificationLink = document.getElementById('go-to-login-from-resend-verification');
        if (goToLoginFromResendVerificationLink) {
            goToLoginFromResendVerificationLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('login-form');
            });
        }
        
        // Handle resend verification form
        const resendVerificationSubmit = document.getElementById('resend-verification-submit');
        if (resendVerificationSubmit) {
            resendVerificationSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const resendVerificationForm = document.getElementById('resend-verification-form');
                const username = resendVerificationForm ? resendVerificationForm.dataset.username : '';
                const resendError = document.getElementById('resend-verification-error');
                const resendSuccess = document.getElementById('resend-verification-success');
                
                if (!username) {
                    if (resendError) resendError.textContent = 'Username not found. Please try logging in again.';
                    return;
                }
                
                resendVerificationSubmit.disabled = true;
                resendVerificationSubmit.textContent = 'Sending...';
                
                const result = await this.resendVerification(username);
                if (result.success) {
                    if (resendError) resendError.textContent = '';
                    if (resendSuccess) resendSuccess.textContent = result.message || 'Verification email sent! Please check your email.';
                    // Show check email page
                    this.showPage('check-email-page');
                } else {
                    if (resendError) resendError.textContent = result.error;
                    if (resendSuccess) resendSuccess.textContent = '';
                    resendVerificationSubmit.disabled = false;
                    resendVerificationSubmit.textContent = 'Resend Verification Email';
                }
            });
        }
        
        // Handle email association form
        const emailAssociationSubmit = document.getElementById('email-association-submit');
        if (emailAssociationSubmit) {
            emailAssociationSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const emailAssociationForm = document.getElementById('email-association-form');
                const username = emailAssociationForm ? emailAssociationForm.dataset.username : '';
                const email = document.getElementById('email-association-email').value.trim();
                const emailAssociationError = document.getElementById('email-association-error');
                const emailAssociationSuccess = document.getElementById('email-association-success');
                
                if (!email) {
                    if (emailAssociationError) emailAssociationError.textContent = 'Please enter your email address';
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    if (emailAssociationError) emailAssociationError.textContent = 'Please enter a valid email address';
                    return;
                }
                
                if (!username) {
                    if (emailAssociationError) emailAssociationError.textContent = 'Username not found. Please try logging in again.';
                    return;
                }
                
                emailAssociationSubmit.disabled = true;
                emailAssociationSubmit.textContent = 'Sending...';
                
                const result = await this.requestEmailAssociation(username, email);
                if (result.success) {
                    if (result.emailSent === false) {
                        // Email wasn't sent, show error message
                        if (emailAssociationError) {
                            emailAssociationError.textContent = result.message || 'Account updated, but verification email could not be sent.';
                        }
                        if (emailAssociationSuccess) emailAssociationSuccess.textContent = '';
                        emailAssociationSubmit.disabled = false;
                        emailAssociationSubmit.textContent = 'Send Verification Link';
                    } else {
                        // Email was sent, show check email page
                        if (emailAssociationError) emailAssociationError.textContent = '';
                        if (emailAssociationSuccess) emailAssociationSuccess.textContent = result.message || 'Verification email sent! Please check your email.';
                        this.showPage('check-email-page');
                    }
                } else {
                    if (emailAssociationError) emailAssociationError.textContent = result.error;
                    if (emailAssociationSuccess) emailAssociationSuccess.textContent = '';
                    emailAssociationSubmit.disabled = false;
                    emailAssociationSubmit.textContent = 'Send Verification Link';
                }
            });
        }
        
        // Check URL parameters on page load
        this.handleUrlParameters();
        
        // Handle logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                // Disable button to prevent double-clicks
                logoutBtn.disabled = true;
                logoutBtn.style.opacity = '0.5';
                
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
