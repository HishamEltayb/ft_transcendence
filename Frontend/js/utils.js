import { VALIDATION_INPUTS } from './constants.js';
import components from './components.js';

class Utils {
    constructor() {
        this.access_token = null;
        this.VALIDATION_INPUTS = VALIDATION_INPUTS;
    }
    
    getById(id) {
        return document.getElementById(id);
    }
    
    queryAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    query(selector) {
        return document.querySelector(selector);
    }
    
    getAppContainer() {
        return this.getById('App');
    }
    
    getPageSection() {
        return this.getById('pageSection');
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
            
            if (progress >= 100) clearInterval(progressInterval);
        }, 100);
        
        return progressInterval;
    }
    
    setCookie(name, value) {
        let expires = ""; const date = new Date();
        date.setTime(date.getTime() + (60 * 60 * 1000)); // 1 hour
        expires = "; expires=" + date.toUTCString();
        
        document.cookie = name + "=" + (value || "") + expires + "; path=/; Secure; SameSite=Strict";
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        const cookieValue = parts.length === 2 ? parts.pop().split(';').shift() : null;
        
        if (name === 'access_token') this.access_token = cookieValue;
        
        return cookieValue;
    }
    
    deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=Strict';
    }

    cleanUp() {
        this.deleteCookie('access_token');
        this.deleteCookie('refresh_token');
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        
        this.access_token = null;
    }
    
    validatePasswordMatch(passwordField, confirmPasswordField, statusElement) {
        if (!passwordField || !confirmPasswordField || !statusElement)
            return;
        
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        
        if (!confirmPassword) {
            statusElement.textContent = '';
            statusElement.className = 'form-text mt-1';
            confirmPasswordField.classList.remove('is-valid', 'is-invalid');
            return;
        }
        
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

    initializeCharCount(inputElement, fieldType) {
        if (!inputElement) return;
        
        const charCountElement = inputElement.parentElement.querySelector('.char-count');
        if (charCountElement) {
            const currentLength = inputElement.value.length;
            const maxLength = this.VALIDATION_INPUTS[fieldType].maxLength;
            charCountElement.textContent = `${currentLength}/${maxLength}`;
            
            if (maxLength - currentLength <= 5) {
                charCountElement.classList.add('text-danger');
                charCountElement.classList.remove('text-white');
            } else {
                charCountElement.classList.remove('text-danger');
                charCountElement.classList.add('text-white');
            }
        }
    }
    
    validateInputLength(fieldType, event, componentsRef) {
        const input = event.target;
        const value = input.value;
        const validation = this.VALIDATION_INPUTS[fieldType];
        
        if (value.length > validation.maxLength) {
            input.value = value.slice(0, validation.maxLength);
            
            if (componentsRef) {
                const toastMessage = `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} cannot exceed ${validation.maxLength} characters.`;
                componentsRef.showToast('warning', 'Input Limit Reached', toastMessage);
            }
            return;
        }
        
        const charCountElement = input.parentElement.querySelector('.char-count');
        
        if (charCountElement) {
            charCountElement.textContent = `${value.length}/${validation.maxLength}`;
            
            if (validation.maxLength - value.length <= 5) {
                charCountElement.classList.add('text-danger');
                charCountElement.classList.remove('text-white');
            } else {
                charCountElement.classList.remove('text-danger');
                charCountElement.classList.add('text-white');
            }
        }
    }

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

    setupPasswordValidation(passwordField, confirmPasswordField, statusElement) {
        if (!passwordField || !confirmPasswordField || !statusElement) return;
        
        this.setupInputField(passwordField, 'password', components);
        this.setupInputField(confirmPasswordField, 'password', components);
        
        const validateFn = () => this.validatePasswordMatch(passwordField, confirmPasswordField, statusElement);
        
        passwordField.addEventListener('input', validateFn);
        confirmPasswordField.addEventListener('input', validateFn);
    }

    validatePasswordMatchFields(passwordField, confirmPasswordField, statusElement) {
        if (!passwordField || !confirmPasswordField || !statusElement) 
            return;
        
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
    
    initLogoutButton(app) {
        if (app.logoutInitialized) return;
        
        document.addEventListener('click', (event) => {
            const logoutBtn = event.target.closest('#logoutBtn');
            if (logoutBtn) {
                event.preventDefault();
                app.logout(); 
            }
        });
        
        app.logoutInitialized = true;
    }

    extractMatchData(matchHistory, currentUsername) {
        if (!Array.isArray(matchHistory)) return [];
        const entries = [];
        matchHistory.forEach(item => {
            if (item && typeof item === 'object') {
                entries.push(this.makeEntry(item, currentUsername));
            }
        });
        return entries;
    }

    makeEntry(match, currentUsername) {
        const p1 = match.player1Name || match.Player1Name || '';
        const p2 = match.player2Name || match.Player2Name || '';
        const vs = `${p1} vs ${p2}`;
        const score = `${match.player1Score !== undefined ? match.player1Score : match.Player1Score || 0} - ${match.player2Score !== undefined ? match.player2Score : match.Player2Score || 0}`;
        const winner = match.winner || '';
        return {
            type: match.matchType,
            vs,
            score,
            winner,
        };
    }
}

const utils = new Utils();

export default utils;
