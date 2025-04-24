import hooks from './hooks.js';
import components from './components.js';
import user from './user.js';
import store from './store.js';
import { VALIDATION_INPUTS } from './constants.js';

class Forms {
    constructor() {
        this.login = {};
        this.register = {};
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        console.log('Forms: Initializing forms');
        
        // Now it's safe to query for DOM elements if the page is loaded
        this.initLoginRegisterForms();
        
        // Check if we're on the login page
        if (window.location.pathname.includes('login')) {
            
            // Set up login/register tabs
            const loginTab = document.getElementById('loginTab');
            const registerTab = document.getElementById('registerTab');
            
            if (loginTab && registerTab) {
                // Default to showing login form
                this.showLoginForm();
                
            } else {
                console.warn('Forms: Login page tabs not found');
            }
        }
    }
    
    initLoginRegisterForms() {
        
        // Login form elements
        this.login = {
            tab: document.getElementById('loginTab'),
            container: document.getElementById('loginFormContainer'),
            form: document.getElementById('loginForm'),
            submitBtn: document.getElementById('loginBtn'),
            login42Link: document.getElementById('login42Link'),
            usernameField: document.getElementById('loginUsername'),
            passwordField: document.getElementById('loginPassword')
        };
        
        // Register form elements
        this.register = {
            tab: document.getElementById('registerTab'),
            container: document.getElementById('registerFormContainer'),
            form: document.getElementById('registerForm'),
            submitBtn: document.getElementById('registerBtn'),
            usernameField: document.getElementById('registerUsername'),
            emailField: document.getElementById('registerEmail'),
            passwordField: document.getElementById('registerPassword'),
            confirmPasswordField: document.getElementById('confirmPassword'),
            passwordMatchStatus: document.getElementById('passwordMatchStatus')
        };
        
        // Add event listeners for login/register
        if (this.login.form) {
            this.login.form.addEventListener('submit', this.submitLoginForm.bind(this));
            
            // Add input validation for login fields
            if (this.login.usernameField) {
                this.login.usernameField.maxLength = VALIDATION_INPUTS.username.maxLength;
                this.login.usernameField.addEventListener('input', this.validateInputLength.bind(this, 'username'));
                this.initializeCharCount(this.login.usernameField, 'username');
            }
            
            if (this.login.passwordField) {
                this.login.passwordField.maxLength = VALIDATION_INPUTS.password.maxLength;
                this.login.passwordField.addEventListener('input', this.validateInputLength.bind(this, 'password'));
                this.initializeCharCount(this.login.passwordField, 'password');
            }
        }
        
        if (this.login.login42Link) {
            this.login.login42Link.onclick = this.handleLogin42.bind(this);
        }
        
        if (this.register.form) {
            this.register.form.addEventListener('submit', this.submitRegisterForm.bind(this));
            
            // Add real-time password validation and input length validation for register fields
            if (this.register.usernameField) {
                this.register.usernameField.maxLength = VALIDATION_INPUTS.username.maxLength;
                this.register.usernameField.addEventListener('input', this.validateInputLength.bind(this, 'username'));
                this.initializeCharCount(this.register.usernameField, 'username');
            }
            
            if (this.register.emailField) {
                this.register.emailField.maxLength = VALIDATION_INPUTS.email.maxLength;
                this.register.emailField.addEventListener('input', this.validateInputLength.bind(this, 'email'));
                this.initializeCharCount(this.register.emailField, 'email');
            }
            
            if (this.register.passwordField) {
                this.register.passwordField.maxLength = VALIDATION_INPUTS.password.maxLength;
                this.register.passwordField.addEventListener('input', event => {
                    this.validateInputLength('password', event);
                    this.validatePasswordMatch();
                });
                this.initializeCharCount(this.register.passwordField, 'password');
            }
            
            if (this.register.confirmPasswordField) {
                this.register.confirmPasswordField.maxLength = VALIDATION_INPUTS.password.maxLength;
                this.register.confirmPasswordField.addEventListener('input', event => {
                    this.validateInputLength('password', event);
                    this.validatePasswordMatch();
                });
                this.initializeCharCount(this.register.confirmPasswordField, 'password');
            }
        }
        
        if (this.login.tab && this.register.tab) {
            this.login.tab.addEventListener('click', this.showLoginForm.bind(this));
            this.register.tab.addEventListener('click', this.showRegisterForm.bind(this));
        }
    }

    // Method to show the login form tab
    showLoginForm() {
        // Try to get fresh references to elements, as they might have changed due to navigation
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either our stored references or the fresh ones
        const tab1 = this.login.tab || loginTab;
        const tab2 = this.register.tab || registerTab;
        const container1 = this.login.container || loginContainer;
        const container2 = this.register.container || registerContainer;
        
        if (!tab1 || !container1 || !tab2 || !container2) {
            console.warn('Forms: Cannot switch tabs - missing elements:', {
                loginTab: !!tab1,
                loginContainer: !!container1,
                registerTab: !!tab2,
                registerContainer: !!container2
            });
            return;
        }
        
        // Activate login tab
        tab1.classList.add('active');
        tab2.classList.remove('active');
        
        // Show login form, hide register form
        container1.classList.add('show', 'active');
        container1.classList.remove('fade');
        
        container2.classList.remove('show', 'active');
        container2.classList.add('fade');
    }
    
    // Method to show the register form tab
    showRegisterForm() {
        console.log('Forms: Switching to register tab');
        
        // Try to get fresh references to elements, as they might have changed due to navigation
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either our stored references or the fresh ones
        const tab1 = this.login.tab || loginTab;
        const tab2 = this.register.tab || registerTab;
        const container1 = this.login.container || loginContainer;
        const container2 = this.register.container || registerContainer;
        
        if (!tab1 || !container1 || !tab2 || !container2) {
            console.warn('Forms: Cannot switch tabs - missing elements:', {
                loginTab: !!tab1,
                loginContainer: !!container1,
                registerTab: !!tab2,
                registerContainer: !!container2
            });
            return;
        }
        
        // Activate register tab
        tab2.classList.add('active');
        tab1.classList.remove('active');
        
        // Show register form, hide login form
        container2.classList.add('show', 'active');
        container2.classList.remove('fade');
        
        container1.classList.remove('show', 'active');
        container1.classList.add('fade');
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

    async submitLoginForm(event) {
        event.preventDefault();
        
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
            // Use the hook to submit the data
            const result = await hooks.useSubmitLoginForm(loginData);
            
            // Handle the result
            if (result.success) {
                // Save username (but not password) in store for future use
                store.saveFormData('loginForm', { username });
                
                // Clear password field
                document.getElementById('loginPassword').value = '';
                
                // Reset character count
                const passwordCounter = document.querySelector('#loginPassword').parentElement.querySelector('.char-count');
                if (passwordCounter) {
                    passwordCounter.textContent = `0/${VALIDATION_INPUTS.password.maxLength}`;
                }
                
                // Fetch user data to update UI
                await hooks.useFetchUserData(true);
                
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

    async submitRegisterForm(event) {
        event.preventDefault();
        
        // Get form values
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate required fields
        if (!username || !email || !password || !confirmPassword) {
            components.showToast('error', 'Registration Error', 'Please fill out all fields.');
            return;
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
            // Use the hook to submit the data
            const result = await hooks.useSubmitRegisterForm(registerData);
            
            console.log('result', result);
            
            // Handle the result
            if (result.success) {
                // Show success toast
                components.showToast('success', 'Registration Successful', 'Your account has been created. Please log in.');
                
                // Clear the form
                this.register.form.reset();
                this.register.passwordMatchStatus.textContent = '';
                this.register.passwordMatchStatus.className = 'form-text mt-1';
                
                // Switch to login form
                this.showLoginForm();
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

    async handleLogin42(event) {
        
        if (event) {
            event.preventDefault();
            // event.stopPropagation();
        }
        
        // Show loading message
        components.showToast('info', 'Connecting', 'Initializing 42 authentication...');
        
        try {
            
            // Call the backend directly to get the auth URL - NOTE: adding trailing slash back
            const response = await fetch('/api/users/oauth/42/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('42 OAuth error details:', text);
                    throw new Error('Failed to initiate 42 login: ' + text);
                });
            }
            
            const data = await response.json();
            
            if (!data.auth_url) {
                throw new Error('No authorization URL received from server');
            }
            
            // Show success message
            components.showToast('success', 'Connected', 'Redirecting to 42 login page...');
            
            window.location.href = data.auth_url;            
        } catch (error) {
            console.error('42 login error:', error);
            components.showToast('error', '42 Login Failed', error.message || 'Could not connect to 42 authentication service.');
        }
    }

    /**
     * Restore saved form data to a form
     * @param {HTMLFormElement} form - The form element to restore data to
     * @param {Object} formData - The form data to restore
     */
    restoreFormData(form, formData) {
        if (!form || !formData) return;
        
        try {
            // Restore each field
            Object.entries(formData).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"], #${key}`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value === true || value === 'true';
                    } else if (input.tagName === 'SELECT') {
                        const option = input.querySelector(`option[value="${value}"]`);
                        if (option) {
                            option.selected = true;
                        }
                    } else {
                        input.value = value;
                    }
                }
            });
            
        } catch (error) {
            console.error('Forms: Error restoring form data:', error);
        }
    }

    // Method to validate password match in real-time
    validatePasswordMatch() {
        if (!this.register.passwordField || !this.register.confirmPasswordField || !this.register.passwordMatchStatus) {
            return;
        }
        
        const password = this.register.passwordField.value;
        const confirmPassword = this.register.confirmPasswordField.value;
        
        // Only show validation when confirm password has content
        if (!confirmPassword) {
            this.register.passwordMatchStatus.textContent = '';
            this.register.passwordMatchStatus.className = 'form-text mt-1';
            this.register.confirmPasswordField.classList.remove('is-valid', 'is-invalid');
            return;
        }
        
        // Check if passwords match
        if (password === confirmPassword) {
            this.register.passwordMatchStatus.textContent = 'Passwords match';
            this.register.passwordMatchStatus.className = 'form-text mt-1 text-success';
            this.register.confirmPasswordField.classList.add('is-valid');
            this.register.confirmPasswordField.classList.remove('is-invalid');
        } else {
            this.register.passwordMatchStatus.textContent = 'Passwords do not match';
            this.register.passwordMatchStatus.className = 'form-text mt-1 text-danger';
            this.register.confirmPasswordField.classList.add('is-invalid');
            this.register.confirmPasswordField.classList.remove('is-valid');
        }
    }

    // Add method to initialize character counts
    initializeCharCount(inputElement, fieldType) {
        if (!inputElement) return;
        
        const charCountElement = inputElement.parentElement.querySelector('.char-count');
        if (charCountElement) {
            const currentLength = inputElement.value.length;
            const maxLength = VALIDATION_INPUTS[fieldType].maxLength;
            charCountElement.textContent = `${currentLength}/${maxLength}`;
            
            // Change color when approaching the limit, keeping text visible
            if (maxLength - currentLength <= 5) {
                charCountElement.classList.add('text-danger');
                charCountElement.classList.remove('text-white');
            } else {
                charCountElement.classList.remove('text-danger');
                charCountElement.classList.add('text-white');
            }
        }
    }
    
    // Add method to validate input length
    validateInputLength(fieldType, event) {
        const input = event.target;
        const value = input.value;
        const validation = VALIDATION_INPUTS[fieldType];
        
        // Check if exceeding max length (should not happen due to maxLength attribute, but as a safeguard)
        if (value.length > validation.maxLength) {
            // Truncate the input value
            input.value = value.slice(0, validation.maxLength);
            
            // Show warning toast
            components.showToast('warning', 'Input Limit Reached', 
                `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} cannot exceed ${validation.maxLength} characters.`);
            return;
        }
        
        // Update character count indicator
        const charCountElement = input.parentElement.querySelector('.char-count');
        
        if (charCountElement) {
            charCountElement.textContent = `${value.length}/${validation.maxLength}`;
            
            // Change color when approaching the limit, keeping text visible
            if (validation.maxLength - value.length <= 5) {
                charCountElement.classList.add('text-danger');
                charCountElement.classList.remove('text-white');
            } else {
                charCountElement.classList.remove('text-danger');
                charCountElement.classList.add('text-white');
            }
        }
    }
}

// Create an instance when this module is imported
const forms = new Forms();

export default forms;