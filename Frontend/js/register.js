import api from './api.js';
import components from './components.js';
import utils from './utils.js';
import router from './router.js';
import login from './login.js';

class Register {
    constructor() {
        this.registerForm = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        document.addEventListener('pageShown', (event) => {
            if (event.detail.page === 'login') 
                this.renderForms();
        });
        
        this.initialized = true;
    }
    
    renderForms() {
        this.initRegisterForm();
    }
    
    getRegisterForm() {
        return {
            tab: document.getElementById('registerTab'),
            container: document.getElementById('registerFormContainer'),
            form: document.getElementById('registerForm'),
            submitBtn: document.getElementById('registerFormButton'),
            usernameField: document.getElementById('registerUsername'),
            emailField: document.getElementById('registerEmail'),
            passwordField: document.getElementById('registerPassword'),
            confirmPasswordField: document.getElementById('confirmPassword'),
            passwordMatchStatus: document.getElementById('passwordMatchStatus')
        };
    }
    
    initRegisterForm() {
        this.registerForm = this.getRegisterForm();
        
        if (this.registerForm.form) {
            if (this.registerForm.usernameField)
                utils.setupInputField(this.registerForm.usernameField, 'username', components);
            
            if (this.registerForm.emailField)
                utils.setupInputField(this.registerForm.emailField, 'email', components);
            
            if (this.registerForm.passwordField && this.registerForm.confirmPasswordField && this.registerForm.passwordMatchStatus) {
                utils.setupPasswordValidation(
                    this.registerForm.passwordField,
                    this.registerForm.confirmPasswordField,
                    this.registerForm.passwordMatchStatus
                );
            }
            
            if (this.registerForm.submitBtn)
                this.registerForm.submitBtn.onclick = this.handleRegisterBtnClick.bind(this);
        }
    }
    
    showRegisterForm() {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        if (!loginTab || !loginContainer || !registerTab || !registerContainer) {
            console.warn('Register: Cannot switch tabs - missing elements');
            return;
        }
        
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        
        registerContainer.classList.add('show', 'active');
        registerContainer.classList.remove('fade');
        
        loginContainer.classList.remove('show', 'active');
        loginContainer.classList.add('fade');
    }
    
    async handleRegisterBtnClick(event) {
        if (event)
            event.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!username || !email || !password || !confirmPassword) {
            components.showToast('error', 'Registration Error', 'Please fill out all fields.');
            return;
        }
        
        if (username.length < utils.VALIDATION_INPUTS.username.minLength) {
            components.showToast('error', 'Registration Error', `Username must be at least ${utils.VALIDATION_INPUTS.username.minLength} characters.`);
            return;
        }
        
        if (password.length < utils.VALIDATION_INPUTS.password.minLength) {
            components.showToast('error', 'Registration Error', `Password must be at least ${utils.VALIDATION_INPUTS.password.minLength} characters.`);
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            components.showToast('warning', 'Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        if (password !== confirmPassword) {
            components.showToast('warning', 'Password Mismatch', 'Passwords do not match. Please try again.');
            return;
        }
        
        utils.setFormLoading(this.registerForm.submitBtn, true);
        
        const registerData = {
            username,
            email,
            password,
            confirmPassword
        };
        
        try {
            const result = await api.register(registerData);
            
            if (result.success) {
                components.showToast('success', 'Registration Successful', 'Your account has been created. Please log in.');
                
                this.registerForm.form.reset();
                this.registerForm.passwordMatchStatus.textContent = '';
                this.registerForm.passwordMatchStatus.className = 'form-text mt-1';
                
                login.showLoginForm();
                
                utils.setFormLoading(this.registerForm.submitBtn, false);
            } else {
                components.showToast('error', 'Registration Failed', result.error || 'Please try again with a different username or email.');
                utils.setFormLoading(this.registerForm.submitBtn, false);
            }
        } catch (error) {
            console.error('Registration submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            utils.setFormLoading(this.registerForm.submitBtn, false);
        }
    }
}

const register = new Register();

export default register;
