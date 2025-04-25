import api from './api.js';
import components from './components.js';
import app from './app.js';
import utils from './utils.js';
import docHandler from './document.js';
import router from './router.js';
import { VALIDATION_INPUTS } from './constants.js';

class Profile {
    constructor() {
        this.profileForm = {};
        
        // Listen for page shown events
        document.addEventListener('pageShown', (event) => {
            // Initialize profile form when profile page is shown
            if (event.detail.page === 'profile') {
                this.initProfilePage();
            }
        });
        
        // Listen for 2FA toggle switch changes
        document.addEventListener('change', (event) => {
            // Handle 2FA toggle in header dropdown
            if (event.target.id === 'enable2FASwitch') {
                this.toggle2FA(event.target.checked);
            }
            // Handle 2FA toggle in profile page
            else if (event.target.id === 'setting2fa') {
                this.toggle2FA(event.target.checked);
            }
        });
    }
    
    // Initialize the profile page
    initProfilePage() {
        // Get profile form elements
        this.profileForm = docHandler.getProfileForm();
        
        // Populate profile form with user data
        this.populateProfileData();
        
        // Set up form submission handler
        if (this.profileForm.form) {
            this.profileForm.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleProfileForm();
            });
        }
        
        // Setup input validation for form fields
        if (this.profileForm.displayNameField) {
            this.setupInputField(this.profileForm.displayNameField, 'username');
        }
        
        if (this.profileForm.emailField) {
            this.setupInputField(this.profileForm.emailField, 'email');
        }
        
        if (this.profileForm.passwordField) {
            this.setupPasswordField(this.profileForm.passwordField, 'password');
        }
        
        if (this.profileForm.confirmPasswordField) {
            this.setupPasswordField(this.profileForm.confirmPasswordField, 'password');
        }
    }
    
    // Helper method to setup input fields with validation
    setupInputField(inputField, fieldType) {
        if (!inputField) return;
        
        inputField.maxLength = VALIDATION_INPUTS[fieldType].maxLength;
        inputField.addEventListener('input', (event) => {
            utils.validateInputLength(fieldType, event, VALIDATION_INPUTS, components);
        });
        utils.initializeCharCount(inputField, fieldType, VALIDATION_INPUTS);
    }
    
    // Helper method to setup password fields with validation
    setupPasswordField(passwordField, fieldType) {
        if (!passwordField) return;
        
        passwordField.maxLength = VALIDATION_INPUTS[fieldType].maxLength;
        
        passwordField.addEventListener('input', event => {
            utils.validateInputLength(fieldType, event, VALIDATION_INPUTS, components);
            this.validatePasswordMatch();
        });
        
        utils.initializeCharCount(passwordField, fieldType, VALIDATION_INPUTS);
    }
    
    // Method to validate password match
    validatePasswordMatch() {
        if (!this.profileForm.passwordField || !this.profileForm.confirmPasswordField) {
            return;
        }
        
        const password = this.profileForm.passwordField.value;
        const confirmPassword = this.profileForm.confirmPasswordField.value;
        
        // Only check if both fields have values
        if (!password || !confirmPassword) return;
        
        if (password !== confirmPassword) {
            components.showToast('warning', 'Password Mismatch', 'Passwords do not match.');
        }
    }
    
    // Populate the profile form with user data
    populateProfileData() {
        if (!app.state.user) {
            // Don't redirect here since the app.js profile route already handles redirection
            return;
        }
        
        const user = app.state.user;
        
        // Set user profile data
        if (this.profileForm.profileUsername) {
            this.profileForm.profileUsername.textContent = user.username || 'Username';
        }
        
        if (this.profileForm.profileIntraLogin && user.intra_login) {
            this.profileForm.profileIntraLogin.textContent = user.intra_login;
        }
        
        if (this.profileForm.profileAvatar) {
            // Use user avatar if available, otherwise use default
            this.profileForm.profileAvatar.src = user.avatar_url || '../public/assets/images/default-avatar.png';
        }
        
        // Set form input values
        if (this.profileForm.displayNameField) {
            this.profileForm.displayNameField.value = user.username || '';
        }
        
        if (this.profileForm.emailField) {
            this.profileForm.emailField.value = user.email || '';
        }
        
        // Set stats data
        if (this.profileForm.statsTotalGames) {
            this.profileForm.statsTotalGames.textContent = user.total_games || '0';
        }
        
        if (this.profileForm.statsWins) {
            this.profileForm.statsWins.textContent = user.wins || '0';
        }
        
        if (this.profileForm.statsLosses) {
            this.profileForm.statsLosses.textContent = user.losses || '0';
        }
        
        if (this.profileForm.statsWinRate) {
            this.profileForm.statsWinRate.textContent = user.win_rate ? `${user.win_rate}%` : '0%';
        }
        
        if (this.profileForm.statsRank) {
            this.profileForm.statsRank.textContent = user.rank || 'Beginner';
        }
        
        // Set 2FA toggle state
        if (this.profileForm.twoFASwitch) {
            this.profileForm.twoFASwitch.checked = app.getIs2FAEnabled ? app.getIs2FAEnabled() : false;
        }
    }
    
    // Handle profile form submission
    async handleProfileForm() {
        if (!this.profileForm.form) return;
        
        // Get form values
        const displayName = this.profileForm.displayNameField ? this.profileForm.displayNameField.value : '';
        const email = this.profileForm.emailField ? this.profileForm.emailField.value : '';
        const password = this.profileForm.passwordField ? this.profileForm.passwordField.value : '';
        const confirmPassword = this.profileForm.confirmPasswordField ? this.profileForm.confirmPasswordField.value : '';
        
        // Validate form inputs
        if (!displayName || !email) {
            components.showToast('error', 'Update Failed', 'Display name and email are required.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            components.showToast('warning', 'Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        // Check if passwords match if both are provided
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                components.showToast('warning', 'Password Mismatch', 'Passwords do not match. Please try again.');
                return;
            }
            
            // Validate password length
            if (password && password.length < VALIDATION_INPUTS.password.minLength) {
                components.showToast('error', 'Invalid Password', `Password must be at least ${VALIDATION_INPUTS.password.minLength} characters.`);
                return;
            }
        }
        
        // Show loading state
        this.setLoading(this.profileForm.saveBtn, true);
        
        // Create update data object
        const updateData = {
            username: displayName,
            email: email
        };
        
        // Only include password if provided
        if (password) {
            updateData.password = password;
        }
        
        try {
            // Call API to update profile (You'll need to implement this in your API)
            // const result = await api.updateProfile(updateData);
            
            // For now, just simulate success
            const result = { success: true };
            
            if (result.success) {
                // Update local user data
                if (app.state.user) {
                    app.state.user.username = displayName;
                    app.state.user.email = email;
                }
                
                // Show success message
                components.showToast('success', 'Profile Updated', 'Your profile has been updated successfully.');
                
                // Clear password fields
                if (this.profileForm.passwordField) {
                    this.profileForm.passwordField.value = '';
                }
                
                if (this.profileForm.confirmPasswordField) {
                    this.profileForm.confirmPasswordField.value = '';
                }
                
                // Update UI
                docHandler.updateUIAuthState(app);
            } else {
                // Show error message
                components.showToast('error', 'Update Failed', result.error || 'Failed to update profile. Please try again.');
            }
            
            // Reset loading state
            this.setLoading(this.profileForm.saveBtn, false);
        } catch (error) {
            console.error('Profile update error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            this.setLoading(this.profileForm.saveBtn, false);
        }
    }
    
    // Toggle 2FA status
    async toggle2FA(enabled) {
        // Show toast indicating the action
        components.showToast('info', '2FA Update', `${enabled ? 'Enabling' : 'Disabling'} two-factor authentication...`);
        
        try {
            // Call API to toggle 2FA (You'll need to implement this in your API)
            // const result = await api.toggle2FA(enabled);
            
            // For now, just simulate success
            const result = { success: true };
            
            if (result.success) {
                // Update user state
                if (app.state.user) {
                    app.state.user.is_two_factor_enabled = enabled;
                }
                
                // Show success message
                components.showToast(
                    'success', 
                    '2FA Updated', 
                    `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'} successfully.`
                );
                
                // Update all UI elements
                docHandler.updateUIAuthState(app);
            } else {
                // Show error message
                components.showToast(
                    'error', 
                    '2FA Update Failed', 
                    result.error || `Failed to ${enabled ? 'enable' : 'disable'} two-factor authentication.`
                );
                
                // Revert toggle switches
                docHandler.update2FASwitch(app);
            }
        } catch (error) {
            console.error('2FA toggle error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            
            // Revert toggle switches
            docHandler.update2FASwitch(app);
        }
    }
    
    // Helper method to show loading state on a button
    setLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            // Store the original text
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
            button.disabled = true;
        } else {
            // Restore the original text
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.disabled = false;
        }
    }
}

// Create a singleton instance
const profile = new Profile();

export default profile; 