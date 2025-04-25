import api from './api.js';
import components from './components.js';
import app from './app.js';
import utils from './utils.js';
import docHandler from './document.js';
import router from './router.js';
import { VALIDATION_INPUTS } from './constants.js';

class Forms {
    constructor() {
        this.login = {};
        this.register = {};
        
        
        document.addEventListener('pageShown', (event) => {
            console.log('Forms: pageShown event detected for page:', event.detail.page);
            
            // If login page is shown, initialize the forms
            if (event.detail.page === 'login') {
                console.log('Forms: Login page detected, initializing forms');
                
                // Use DocumentHandler methods instead
                docHandler.initLoginRegisterForms(this);
                docHandler.setupLoginRegisterTabs(this);
            }
        });
    }
    
    // Helper method to setup an input field with validation
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
    
    // Method to validate password match in real-time - uses utils function
    validatePasswordMatch() {
        if (!this.register.passwordField || !this.register.confirmPasswordField || !this.register.passwordMatchStatus) {
            return;
        }
        
        utils.validatePasswordMatch(
            this.register.passwordField,
            this.register.confirmPasswordField,
            this.register.passwordMatchStatus
        );
    }
    
    async handleLogin42(event) {
        console.log('Forms: Handling 42 login button click');
        if (event) {
            event.preventDefault();
        }
        
        components.showToast('info', 'Connecting', 'Initializing 42 authentication...');
        
        try {
            console.log('Forms: Requesting 42 auth URL from API');
            const result = await api.get42AuthUrl();
            
            console.log('Forms: Received API response for 42 auth:', result);
            
            if (!result.success || !result.auth_url) {
                throw new Error(result.error || 'No authorization URL received');
            }
            
            // Show success message
            components.showToast('success', 'Connected', 'Redirecting to 42 login page...');
            
            // Add a custom query parameter to the auth_url so we know we're coming from 42 login
            let redirectUrl = result.auth_url;
            
        
            window.location.href = redirectUrl;
        } catch (error) {
            console.error('42 login error:', error);
            components.showToast('error', '42 Login Failed', error.message || 'Could not connect to 42 authentication service.');
        }
    }

    async handleLoginForm(event) {
        console.log('Forms: Handling login form submission');
        
        if (event) {
            event.preventDefault();
        }
        
        // Get form values
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate required fields
        if (!username || !password) {
            components.showToast('error', 'Login Error', 'Please enter both username and password.');
            return;
        }
        
        // Validate length constraints
        if (username.length < VALIDATION_INPUTS.username.minLength) {
            components.showToast('error', 'Login Error', `Username must be at least ${VALIDATION_INPUTS.username.minLength} characters.`);
            return;
        }
        
        if (password.length < VALIDATION_INPUTS.password.minLength) {
            components.showToast('error', 'Login Error', `Password must be at least ${VALIDATION_INPUTS.password.minLength} characters.`);
            return;
        }
        
        // Show loading state
        this.setLoading(this.login.submitBtn, true);
        
        // Create login data object
        const loginData = {
            username,
            password
        };
        
        try {
            // Use the API to submit the data
            const result = await api.login(loginData);
            console.log('Forms: Login result:', result);
            // Handle the result
            if (result.success) {
                // Clear password field
                document.getElementById('loginPassword').value = '';
                
                // Reset character count
                const passwordCounter = document.querySelector('#loginPassword').parentElement.querySelector('.char-count');
                if (passwordCounter) {
                    passwordCounter.textContent = `0/${VALIDATION_INPUTS.password.maxLength}`;
                }

                app.state.user = result.data;
                
                // Show success message
                components.showToast('success', 'Login Successful', 'You have been logged in successfully.');
                
                router.navigate('/');
            } else {
                // Display error toast
                components.showToast('error', 'Login Failed', result.error || 'Invalid username or password.');
                this.setLoading(this.login.submitBtn, false);
            }
        } catch (error) {
            console.error('Login submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            this.setLoading(this.login.submitBtn, false);
        }
    }

    async handleRegistrationForm(event) {
        console.log('Forms: Handling registration form submission');
        
        if (event) {
            event.preventDefault();
        }
        
        // Get form values
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate required fields
        if (!username || !email || !password || !confirmPassword) {
            console.log("Form validation failed - empty fields");
            components.showToast('error', 'Registration Error', 'Please fill out all fields.');
            console.log("DEBUG: Returning early from registration due to empty fields");
            return; // Early return to prevent form submission
        }
        
        // Validate length constraints
        if (username.length < VALIDATION_INPUTS.username.minLength) {
            components.showToast('error', 'Registration Error', `Username must be at least ${VALIDATION_INPUTS.username.minLength} characters.`);
            return;
        }
        
        if (password.length < VALIDATION_INPUTS.password.minLength) {
            components.showToast('error', 'Registration Error', `Password must be at least ${VALIDATION_INPUTS.password.minLength} characters.`);
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            components.showToast('warning', 'Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            components.showToast('warning', 'Password Mismatch', 'Passwords do not match. Please try again.');
            return;
        }
        
        // Show loading state
        this.setLoading(this.register.submitBtn, true);
        
        // Create registration data object
        const registerData = {
            username,
            email,
            password,
            confirmPassword
        };
        
        try {
            // Use the API to submit the data
            const result = await api.submitRegisterForm(registerData);
            
            // Handle the result
            if (result.success) {
                // Show success toast
                components.showToast('success', 'Registration Successful', 'Your account has been created. Please log in.');
                
                // Clear the form
                this.register.form.reset();
                this.register.passwordMatchStatus.textContent = '';
                this.register.passwordMatchStatus.className = 'form-text mt-1';
                
                // Switch to login tab after successful registration
                docHandler.showLoginForm(this);
                
                this.setLoading(this.register.submitBtn, false);
            } else {
                // Display error toast
                components.showToast('error', 'Registration Failed', result.error || 'Please try again with a different username or email.');
                this.setLoading(this.register.submitBtn, false);
            }
        } catch (error) {
            console.error('Registration submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            this.setLoading(this.register.submitBtn, false);
        }
    }

    // Helper method to show loading state on a submitBtn
    setLoading(submitBtn, isLoading) {
        if (!submitBtn) return;
        
        if (isLoading) {
            // Store the original text
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            submitBtn.disabled = true;
        } else {
            // Restore the original text
            submitBtn.innerHTML = submitBtn.dataset.originalText || submitBtn.innerHTML;
            submitBtn.disabled = false;
        }
    }
}

// Create an instance when this module is imported
const forms = new Forms();

export default forms;