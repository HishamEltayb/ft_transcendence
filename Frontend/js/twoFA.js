import api from './api.js';
import app from './app.js';
import utils from './utils.js';
import router from './router.js';
import components from './components.js';

class TwoFA {
    constructor() {
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        document.addEventListener('pageShown', (event) => {
            if (event.detail.page === 'twoFA') 
                this.init2FAPage();
        });
        
        this.initialized = true;
    }
    
    async init2FAPage() {
        const form = document.getElementById('twoFAForm');
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.verify2FACode();
            });
        }
        
        const inputField = document.getElementById('twoFACode');
        if (inputField) {
            setTimeout(() => {
                inputField.focus();
            }, 500);
        }
    }
    
    async verify2FACode() {
        const codeInput = document.getElementById('twoFACode');
        const errorElement = document.getElementById('twofa-error');
        const submitButton = document.querySelector('#twoFAForm button[type="submit"]');
        
        if (!codeInput) return;
        
        const code = codeInput.value;
        
        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid 6-digit code';
                errorElement.classList.remove('d-none');
            }
            return;
        }
        
        utils.setFormLoading(submitButton, true);
        
        try {
            const data = await api.verify2FA(code);
            
            utils.setFormLoading(submitButton, false);
            
            if (data.success) {
                if (app.state.user) {
                    app.state.isAuthenticated = true;
                    localStorage.setItem('isAuthenticated', true);
                    localStorage.setItem('user', JSON.stringify(app.state.user));
                }
                
                components.showToast('success', 'Authentication Successful', 'You have been successfully verified.');
                
                setTimeout(() => {
                    router.navigate('/');
                }, 1500);
            } else {
                if (errorElement) {
                    errorElement.textContent = data.error || 'Verification failed';
                    errorElement.classList.remove('d-none');
                }
                
                if (data.authExpired) {
                    components.showToast('error', 'Session Expired', 'Your session has expired. Please log in again.');
                    setTimeout(() => {
                        router.navigate('/login');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            
            utils.setFormLoading(submitButton, false);
            
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to verify code';
                errorElement.classList.remove('d-none');
            }
        }
    }
}

const twoFA = new TwoFA();


export default twoFA; 