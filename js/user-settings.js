// User Settings Module
// Handles user settings page functionality: username editing, password visibility, password reset

const UserSettings = {
    originalUsername: '',
    isEditingUsername: false,
    resetCode: null,
    isPasswordResetMode: false,
    isRequestingResetCode: false,
    initialized: false,

    init() {
        console.log('UserSettings.init() called');
        
        // Always set up event listeners when init is called (in case tab wasn't visible before)
        const usernameInput = document.getElementById('username-edit');
        const passwordResetBtn = document.getElementById('password-reset-btn');
        const codeInput = document.getElementById('reset-code-input');
        const newPasswordInput = document.getElementById('new-password-input');
        const verifyPasswordInput = document.getElementById('verify-password-input');
        const updateBtn = document.getElementById('password-update-btn');
        
        console.log('Elements found:', {
            usernameInput: !!usernameInput,
            passwordResetBtn: !!passwordResetBtn
        });
        
        // Always set up event listeners (remove old ones first if needed)
        if (usernameInput) {
            // Remove old listeners by cloning the element
            const newInput = usernameInput.cloneNode(true);
            usernameInput.parentNode.replaceChild(newInput, usernameInput);
            this.setupUsernameEditing();
        } else {
            console.error('Username input not found!');
        }
        
        if (passwordResetBtn) {
            // Remove old listeners by cloning elements
            const newResetBtn = passwordResetBtn.cloneNode(true);
            passwordResetBtn.parentNode.replaceChild(newResetBtn, passwordResetBtn);
            
            if (codeInput) {
                const newCodeInput = codeInput.cloneNode(true);
                codeInput.parentNode.replaceChild(newCodeInput, codeInput);
            }
            
            if (newPasswordInput) {
                const newNewPasswordInput = newPasswordInput.cloneNode(true);
                newPasswordInput.parentNode.replaceChild(newNewPasswordInput, newPasswordInput);
            }
            
            if (verifyPasswordInput) {
                const newVerifyPasswordInput = verifyPasswordInput.cloneNode(true);
                verifyPasswordInput.parentNode.replaceChild(newVerifyPasswordInput, verifyPasswordInput);
            }
            
            if (updateBtn) {
                const newUpdateBtn = updateBtn.cloneNode(true);
                updateBtn.parentNode.replaceChild(newUpdateBtn, updateBtn);
            }
            
            this.setupPasswordReset();
        } else {
            console.error('Password reset button not found!');
        }
        
        this.initialized = true;
        this.loadUserData();
    },

    loadUserData() {
        console.log('loadUserData called, Auth.currentUser:', Auth?.currentUser);
        if (Auth && Auth.currentUser && Auth.currentUser.username) {
            const username = Auth.currentUser.username;
            this.originalUsername = username;
            
            console.log('Loading username:', username);
            
            // Set title
            const titleEl = document.getElementById('user-settings-name');
            if (titleEl) {
                titleEl.textContent = username;
                console.log('Title set to:', username);
            } else {
                console.warn('Title element not found');
            }
            
            // Set username input
            const usernameInput = document.getElementById('username-edit');
            if (usernameInput) {
                usernameInput.value = username;
                console.log('Username input set to:', username);
            } else {
                console.warn('Username input element not found');
            }
        } else {
            console.warn('Auth.currentUser not available yet', {
                hasAuth: !!Auth,
                hasCurrentUser: !!(Auth && Auth.currentUser),
                username: Auth?.currentUser?.username
            });
        }
    },

    setupUsernameEditing() {
        const usernameInput = document.getElementById('username-edit');
        const saveBtn = document.getElementById('username-save-btn');
        
        if (!usernameInput || !saveBtn) {
            console.error('Username input or save button not found', {
                usernameInput: !!usernameInput,
                saveBtn: !!saveBtn
            });
            return;
        }

        console.log('Setting up username editing');
        
        // Make sure the field has the user's name FIRST
        if (Auth && Auth.currentUser && Auth.currentUser.username) {
            usernameInput.value = Auth.currentUser.username;
            this.originalUsername = Auth.currentUser.username;
            console.log('Username set to:', Auth.currentUser.username);
        } else {
            console.warn('Auth.currentUser not available, username field will be empty');
        }
        
        // Remove readonly attribute to make it clickable, but style it as readonly
        // We'll manage the readonly state ourselves
        usernameInput.readOnly = true;
        usernameInput.setAttribute('readonly', 'readonly');
        usernameInput.style.cursor = 'pointer';
        usernameInput.style.backgroundColor = '#f9f9f9';

        // Click to edit - use mousedown for better compatibility
        usernameInput.addEventListener('mousedown', (e) => {
            if (usernameInput.readOnly || usernameInput.hasAttribute('readonly')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Username field clicked - entering edit mode');
                this.startEditingUsername();
            }
        });

        // Also handle click as backup
        usernameInput.addEventListener('click', (e) => {
            if (usernameInput.readOnly || usernameInput.hasAttribute('readonly')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Username field clicked (click event) - entering edit mode');
                this.startEditingUsername();
            }
        });

        // Handle focus event as well
        usernameInput.addEventListener('focus', (e) => {
            if (usernameInput.readOnly || usernameInput.hasAttribute('readonly')) {
                e.preventDefault();
                console.log('Username field focused - entering edit mode');
                this.startEditingUsername();
            }
        });

        // Enter to save
        usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !usernameInput.readOnly) {
                e.preventDefault();
                this.saveUsername();
            } else if (e.key === 'Escape' && !usernameInput.readOnly) {
                e.preventDefault();
                this.cancelEditingUsername();
            }
        });

        // Save button
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.saveUsername();
        });

        console.log('Username editing setup complete');
    },

    startEditingUsername() {
        const usernameInput = document.getElementById('username-edit');
        const saveBtn = document.getElementById('username-save-btn');
        
        if (!usernameInput || !saveBtn) {
            console.error('Username input or save button not found in startEditingUsername');
            return;
        }

        console.log('Starting username edit mode');
        this.isEditingUsername = true;
        usernameInput.readOnly = false;
        usernameInput.removeAttribute('readonly');
        usernameInput.style.cursor = 'text';
        usernameInput.style.backgroundColor = 'white';
        
        // Show save button
        saveBtn.style.display = 'block';
        saveBtn.style.visibility = 'visible';
        saveBtn.disabled = false;
        
        // Focus and select text
        setTimeout(() => {
            usernameInput.focus();
            usernameInput.select();
        }, 10);
    },

    cancelEditingUsername() {
        const usernameInput = document.getElementById('username-edit');
        const saveBtn = document.getElementById('username-save-btn');
        
        if (!usernameInput || !saveBtn) return;

        console.log('Cancelling username edit');
        this.isEditingUsername = false;
        usernameInput.value = this.originalUsername;
        usernameInput.readOnly = true;
        usernameInput.setAttribute('readonly', 'readonly');
        usernameInput.style.cursor = 'pointer';
        usernameInput.style.backgroundColor = '#f9f9f9';
        saveBtn.style.display = 'none';
        saveBtn.style.visibility = 'hidden';
    },

    async saveUsername() {
        const usernameInput = document.getElementById('username-edit');
        const saveBtn = document.getElementById('username-save-btn');
        
        if (!usernameInput || !saveBtn) return;

        const newUsername = usernameInput.value.trim();
        
        if (!newUsername) {
            alert('Username cannot be empty');
            this.cancelEditingUsername();
            return;
        }

        if (newUsername === this.originalUsername) {
            this.cancelEditingUsername();
            return;
        }

        // Disable input and button
        usernameInput.disabled = true;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const response = await fetch('/api/user/update-username', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username: newUsername })
            });

            const result = await response.json();

            if (result.success) {
                console.log('Username updated successfully');
                this.originalUsername = newUsername;
                usernameInput.readOnly = true;
                usernameInput.setAttribute('readonly', 'readonly');
                usernameInput.style.cursor = 'pointer';
                usernameInput.style.backgroundColor = '#f9f9f9';
                saveBtn.style.display = 'none';
                saveBtn.style.visibility = 'hidden';
                
                // Update title
                const titleEl = document.getElementById('user-settings-name');
                if (titleEl) {
                    titleEl.textContent = newUsername;
                }
                
                // Update Auth.currentUser
                if (Auth && Auth.currentUser) {
                    Auth.currentUser.username = newUsername;
                }
                
                // Update greeting in user menu
                if (window.updateUsernameGreeting) {
                    window.updateUsernameGreeting();
                }
            } else {
                alert(result.error || 'Failed to update username');
                this.cancelEditingUsername();
            }
        } catch (error) {
            console.error('Error updating username:', error);
            alert('Failed to update username. Please try again.');
            this.cancelEditingUsername();
        } finally {
            usernameInput.disabled = false;
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
            this.isEditingUsername = false;
        }
    },

    setupPasswordReset() {
        const resetBtn = document.getElementById('password-reset-btn');
        const resetSection = document.getElementById('password-reset-section');
        const codeInput = document.getElementById('reset-code-input');
        const newPasswordFields = document.getElementById('new-password-fields');
        const newPasswordInput = document.getElementById('new-password-input');
        const verifyPasswordInput = document.getElementById('verify-password-input');
        const updateBtn = document.getElementById('password-update-btn');
        
        if (!resetBtn || !resetSection || !codeInput || !newPasswordFields || 
            !newPasswordInput || !verifyPasswordInput || !updateBtn) {
            console.warn('Password reset elements not found', {
                resetBtn: !!resetBtn,
                resetSection: !!resetSection,
                codeInput: !!codeInput,
                newPasswordFields: !!newPasswordFields,
                newPasswordInput: !!newPasswordInput,
                verifyPasswordInput: !!verifyPasswordInput,
                updateBtn: !!updateBtn
            });
            return;
        }
        
        console.log('Setting up password reset');

        // Reset button - send code
        resetBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Reset button clicked, isPasswordResetMode:', this.isPasswordResetMode);
            
            if (this.isPasswordResetMode) {
                // Reset the flow
                this.resetPasswordFlow();
                return;
            }

            // Prevent multiple simultaneous requests
            if (this.isRequestingResetCode) {
                console.log('Reset code request already in progress, ignoring click');
                return;
            }

            console.log('Requesting password reset code...');
            this.isRequestingResetCode = true;
            resetBtn.disabled = true;
            resetBtn.textContent = 'Sending...';

            try {
                const response = await fetch('/api/user/request-password-reset-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (result.success) {
                    this.isPasswordResetMode = true;
                    resetSection.style.display = 'block';
                    codeInput.disabled = false;
                    codeInput.focus();
                    resetBtn.textContent = 'Cancel';
                    resetBtn.disabled = false;
                } else {
                    alert(result.error || 'Failed to send reset code');
                    resetBtn.disabled = false;
                    resetBtn.textContent = 'Reset';
                }
            } catch (error) {
                console.error('Error requesting reset code:', error);
                alert('Failed to send reset code. Please try again.');
                resetBtn.disabled = false;
                resetBtn.textContent = 'Reset';
            } finally {
                this.isRequestingResetCode = false;
            }
        });

        // Code input - verify code
        codeInput.addEventListener('input', async (e) => {
            const code = e.target.value.trim();
            
            if (code.length === 7) {
                codeInput.disabled = true;
                
                try {
                    const response = await fetch('/api/user/verify-reset-code', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ code: code })
                    });

                    const result = await response.json();

                    if (result.success) {
                        // Show new password fields
                        newPasswordFields.style.display = 'flex';
                        newPasswordInput.focus();
                    } else {
                        alert(result.error || 'Invalid code');
                        codeInput.value = '';
                        codeInput.disabled = false;
                        codeInput.focus();
                    }
                } catch (error) {
                    console.error('Error verifying code:', error);
                    alert('Failed to verify code. Please try again.');
                    codeInput.disabled = false;
                }
            }
        });

        // Password fields - check match and enable update button
        const checkPasswordMatch = () => {
            const newPassword = newPasswordInput.value;
            const verifyPassword = verifyPasswordInput.value;
            
            if (newPassword && verifyPassword && newPassword === verifyPassword && newPassword.length >= 6) {
                updateBtn.disabled = false;
            } else {
                updateBtn.disabled = true;
            }
        };

        newPasswordInput.addEventListener('input', checkPasswordMatch);
        verifyPasswordInput.addEventListener('input', checkPasswordMatch);

        // Update button - reset password
        updateBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newPassword = newPasswordInput.value;
            const verifyPassword = verifyPasswordInput.value;

            if (newPassword !== verifyPassword) {
                alert('Passwords do not match');
                return;
            }

            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }

            updateBtn.disabled = true;
            updateBtn.textContent = 'Updating...';

            try {
                const response = await fetch('/api/user/update-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ password: newPassword })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Password updated successfully');
                    this.resetPasswordFlow();
                } else {
                    alert(result.error || 'Failed to update password');
                    updateBtn.disabled = false;
                    updateBtn.textContent = 'Reset';
                }
            } catch (error) {
                console.error('Error updating password:', error);
                alert('Failed to update password. Please try again.');
                updateBtn.disabled = false;
                updateBtn.textContent = 'Reset';
            }
        });
    },

    resetPasswordFlow() {
        const resetSection = document.getElementById('password-reset-section');
        const codeInput = document.getElementById('reset-code-input');
        const newPasswordFields = document.getElementById('new-password-fields');
        const newPasswordInput = document.getElementById('new-password-input');
        const verifyPasswordInput = document.getElementById('verify-password-input');
        const updateBtn = document.getElementById('password-update-btn');
        const resetBtn = document.getElementById('password-reset-btn');
        
        this.isPasswordResetMode = false;
        this.isRequestingResetCode = false;
        resetSection.style.display = 'none';
        codeInput.value = '';
        codeInput.disabled = true;
        newPasswordFields.style.display = 'none';
        newPasswordInput.value = '';
        verifyPasswordInput.value = '';
        updateBtn.disabled = true;
        updateBtn.textContent = 'Reset';
        resetBtn.textContent = 'Reset';
    }
};

// Make UserSettings available globally
window.UserSettings = UserSettings;
