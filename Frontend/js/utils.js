class Utils {
    constructor() {
        this.authToken = null;
    }
    
    getUrlParameter(name) {
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
    
    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; Secure; SameSite=Strict";
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        this.authToken = parts.length === 2 ? parts.pop().split(';').shift() : null;
        return this.authToken;
    }
    
    deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; Secure; SameSite=Strict';
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
    initializeCharCount(inputElement, fieldType, validationRules) {
        if (!inputElement) return;
        
        const charCountElement = inputElement.parentElement.querySelector('.char-count');
        if (charCountElement) {
            const currentLength = inputElement.value.length;
            const maxLength = validationRules[fieldType].maxLength;
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
    validateInputLength(fieldType, event, validationRules, componentsRef) {
        const input = event.target;
        const value = input.value;
        const validation = validationRules[fieldType];
        
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
}

// Create and export a singleton instance
const utils = new Utils();

export default utils;
