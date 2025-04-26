import { VALIDATION_INPUTS } from './constants.js';
import components from './components.js';

class Utils {
    constructor() {
        this.access_token = null;
        this.VALIDATION_INPUTS = VALIDATION_INPUTS;
    }
    
    // Helper method to find elements by ID (from document.js)
    getById(id) {
        return document.getElementById(id);
    }
    
    // Helper method to find elements by selector (from document.js)
    queryAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    // Helper method to find first element matching selector (from document.js)
    query(selector) {
        return document.querySelector(selector);
    }
    
    // Get the main app container (from document.js)
    getAppContainer() {
        return this.getById('App');
    }
    
    // Get the page section (from document.js)
    getPageSection() {
        return this.getById('pageSection');
    }
    
    // Get login/register tabs (from document.js)
    getLoginRegisterTabs() {
        return {
            loginTab: this.getById('loginTab'),
            registerTab: this.getById('registerTab')
        };
    }
    
    getUrlParameter(name) {
        console.log('Getting URL parameter:', name);
        
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    startProgressAnimation(progressBar) {
        if (!progressBar) {
            console.error('Utils: progressBar element not provided for animation');
            return null;
        }
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
            
            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 100);
        
        return progressInterval;
    }
    
    // Set a cookie - with expiration defaulting to 40 minutes if not specified
    setCookie(name, value) {
        let expires = ""; const date = new Date();
        date.setTime(date.getTime() + (60 * 60 * 1000)); // 1 hour
        expires = "; expires=" + date.toUTCString();
        
        document.cookie = name + "=" + (value || "") + expires + "; path=/; Secure; SameSite=Strict";
    }

    // Get a cookie by name
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        const cookieValue = parts.length === 2 ? parts.pop().split(';').shift() : null;
        
        // Update the auth token if that's what was requested
        if (name === 'access_token') {
            this.access_token = cookieValue;
        }
        
        return cookieValue;
    }
    
    // Delete a cookie by setting its expiration to January 1, 2025
    deleteCookie(name) {
        document.cookie = name + '=; expires=Wed, 01 Jan 2025 00:00:00 GMT; path=/; Secure; SameSite=Strict';
    }
    

    cleanUp() {
        console.log('Utils: Cleaning up');
        // Clear auth token cookie
        this.deleteCookie('access_token');
        
        // Clear all possible auth tokens from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Clear user data
        localStorage.removeItem('user');
        
        // Reset internal state
        this.access_token = null;
        
    }
    
    // Validate password matching
    validatePasswordMatch(passwordField, confirmPasswordField, statusElement) {
        if (!passwordField || !confirmPasswordField || !statusElement) {
            return;
        }
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        // Only show validation when confirm password has content
        if (!confirmPassword) {
            statusElement.textContent = '';
            statusElement.className = 'form-text mt-1';
            confirmPasswordField.classList.remove('is-valid', 'is-invalid');
            return;
        }
        
        // Check if passwords match
        if (password === confirmPassword) {
            statusElement.textContent = 'Passwords match';
            statusElement.className = 'form-text mt-1 text-success';
            confirmPasswordField.classList.add('is-valid');
            confirmPasswordField.classList.remove('is-invalid');
        } else {
            statusElement.textContent = 'Passwords do not match';
            statusElement.className = 'form-text mt-1 text-danger';
            confirmPasswordField.classList.add('is-invalid');
            confirmPasswordField.classList.remove('is-valid');
        }
    }

    // Initialize character count display
    initializeCharCount(inputElement, fieldType) {
        if (!inputElement) return;
        
        const charCountElement = inputElement.parentElement.querySelector('.char-count');
        if (charCountElement) {
            const currentLength = inputElement.value.length;
            const maxLength = this.VALIDATION_INPUTS[fieldType].maxLength;
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
    
    // Validate input length with character counter
    validateInputLength(fieldType, event, componentsRef) {
        const input = event.target;
        const value = input.value;
        const validation = this.VALIDATION_INPUTS[fieldType];
        
        // Check if exceeding max length (should not happen due to maxLength attribute, but as a safeguard)
        if (value.length > validation.maxLength) {
            // Truncate the input value
            input.value = value.slice(0, validation.maxLength);
            
            // Show warning toast if components reference is provided
            if (componentsRef) {
                componentsRef.showToast('warning', 'Input Limit Reached', 
                    `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} cannot exceed ${validation.maxLength} characters.`);
            }
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

    // Helper method to setup an input field with validation
    setupInputField(inputField, fieldType, componentsRef) {
        if (!inputField) return;
        
        inputField.maxLength = this.VALIDATION_INPUTS[fieldType].maxLength;
        inputField.addEventListener('input', (event) => {
            this.validateInputLength(fieldType, event, componentsRef);
        });
        this.initializeCharCount(inputField, fieldType);
    }

    setupPasswordField(passwordField, fieldType, validatePasswordMatchFn) {
        if (!passwordField) return;
        
        this.setupInputField(passwordField, fieldType, components);
        
        passwordField.addEventListener('input', () => {
            validatePasswordMatchFn();
        });
    }

    // New method to set up password fields with validation
    setupPasswordValidation(passwordField, confirmPasswordField, statusElement) {
        if (!passwordField || !confirmPasswordField || !statusElement) return;
        
        // Setup character count for both fields
        this.setupInputField(passwordField, 'password', components);
        this.setupInputField(confirmPasswordField, 'password', components);
        
        // Add input event listeners for password validation
        const validateFn = () => this.validatePasswordMatch(passwordField, confirmPasswordField, statusElement);
        
        passwordField.addEventListener('input', validateFn);
        confirmPasswordField.addEventListener('input', validateFn);
    }

    // Validate password match for a form
    validatePasswordMatchFields(passwordField, confirmPasswordField, statusElement) {
        if (!passwordField || !confirmPasswordField || !statusElement) {
            return;
        }
        
        this.validatePasswordMatch(
            passwordField,
            confirmPasswordField,
            statusElement
        );
    }

    setFormLoading(submitBtn, isLoading) {
        if (!submitBtn) return;
        
        if (isLoading) {
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            submitBtn.disabled = true;
        } else {
            submitBtn.innerHTML = submitBtn.dataset.originalText || submitBtn.innerHTML;
            submitBtn.disabled = false;
        }
    }
    
    // Initialize logout button (from document.js)
    initLogoutButton(app) {
        // Use app's existing flag to track initialization
        if (app.logoutInitialized) return;
        
        document.addEventListener('click', (event) => {
            const logoutBtn = event.target.closest('#logoutBtn');
            if (logoutBtn) {
                event.preventDefault();
                app.logout(); // Use the app's logout method
            }
        });
        
        // Set the flag on the app instance
        app.logoutInitialized = true;
    }

 
}

// Create and export a singleton instance
const utils = new Utils();

export default utils;
