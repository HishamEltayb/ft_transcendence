import api from './api.js';
import app from './app.js';
import utils from './utils.js';
import components from './components.js';
import router from './router.js';
import register from './register.js';

class Login {
    constructor() {
        this.loginForm = {};
        this.router = null;
        this.register = null;
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
        this.initLoginForm();
        this.setupTabs();
    }
    
    getLoginForm() { 
        return {
            tab: document.getElementById('loginTab'),
            container: document.getElementById('loginFormContainer'),
            form: document.getElementById('loginForm'),
            submitBtn: document.getElementById('loginBtn'),
            login42Link: document.getElementById('login42Link'),
            usernameField: document.getElementById('loginUsername'),
            passwordField: document.getElementById('loginPassword')
        };
    }
    
    initLoginForm() {
        this.loginForm = this.getLoginForm();
        
        if (this.loginForm.login42Link)
            this.loginForm.login42Link.onclick = this.handle42LoginBtnClick.bind(this);
        
        if (this.loginForm.form) {
            if (this.loginForm.usernameField) 
                utils.setupInputField(this.loginForm.usernameField, 'username', components);
            
            if (this.loginForm.passwordField) 
                utils.setupInputField(this.loginForm.passwordField, 'password', components);
            
            if (this.loginForm.submitBtn) 
                this.loginForm.submitBtn.onclick = this.handleLoginBtnClick.bind(this);
        }
    }
    
    setupTabs() {
        const loginTab =  document.getElementById('loginTab');
        const registerTab =  document.getElementById('registerTab');
        
        if (loginTab && registerTab) {
            this.showLoginForm();
            loginTab.addEventListener('click', () => this.showLoginForm());
            registerTab.addEventListener('click', () => register.showRegisterForm());
        } else {
            console.warn('Login: Login/Register tabs not found');
        }
    }
    
    showLoginForm() {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        if (!loginTab || !loginContainer || !registerTab || !registerContainer) {
            console.warn('Login: Cannot switch tabs - missing elements');
            return;
        }
        
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        
        loginContainer.classList.add('show', 'active');
        loginContainer.classList.remove('fade');
        
        registerContainer.classList.remove('show', 'active');
        registerContainer.classList.add('fade');
    }
    
    async handleLoginBtnClick(event) {
        if (event) 
            event.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            components.showToast('error', 'Login Error', 'Please enter both username and password.');
            return;
        }
        
        if (username.length < utils.VALIDATION_INPUTS.username.minLength) {
            components.showToast('error', 'Login Error', `Username must be at least ${utils.VALIDATION_INPUTS.username.minLength} characters.`);
            return;
        }
        
        if (password.length < utils.VALIDATION_INPUTS.password.minLength) {
            components.showToast('error', 'Login Error', `Password must be at least ${utils.VALIDATION_INPUTS.password.minLength} characters.`);
            return;
        }
        
        utils.setFormLoading(this.loginForm.submitBtn, true);
        
        const loginData = {
            username,
            password
        };
        
        try {
            const result = await api.login(loginData);
            if (result.success) {
                document.getElementById('loginPassword').value = '';
                
                const passwordCounter = document.querySelector('#loginPassword').parentElement.querySelector('.char-count');
                if (passwordCounter) 
                    passwordCounter.textContent = `0/${utils.VALIDATION_INPUTS.password.maxLength}`;
                
                // Store user data and update state
                const userData = result.data;
                app.state.user = userData;
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Update UI and show success message
                this.updateUIAuthState();
                components.showToast('success', 'Login Successful', 'You have been logged in successfully.');
                
                // Navigate to home page
                router.navigate('/');
            } else {
                components.showToast('error', 'Login Failed', result.error || 'Invalid username or password.');
            }
            
            utils.setFormLoading(this.loginForm.submitBtn, false);
        } catch (error) {
            console.error('Login submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            utils.setFormLoading(this.loginForm.submitBtn, false);
        }
    }
    
    updateUIAuthState() {
        const loginNavBtn = document.getElementById('loginNavBtn');
        const loginBtn = document.getElementById('loginBtn');
        const loginDropdown = document.getElementById('loginDropdown');
        const loggedInUserImg = document.getElementById('loggedInUserImg');
        const loggedInUsername = document.getElementById('loggedInUsername');
        
        if (app.state.user) {
            if (loginNavBtn) loginNavBtn.parentElement.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'none';
            if (loginDropdown) loginDropdown.style.display = 'block';
            
            if (app.getIs42User && app.getIs42User()) {
                if (app.getUserImg && app.getUserImg() && loggedInUserImg) {
                    loggedInUserImg.src = app.getUserImg();
                    loggedInUserImg.style.display = 'block';
                } else if (loggedInUserImg) {
                    loggedInUserImg.style.display = 'none';
                }
            } else {
                if (app.getUsername && app.getUsername() && loggedInUsername) {
                    loggedInUsername.textContent = app.getUsername();
                    loggedInUsername.style.display = 'inline';
                } else if (loggedInUsername) {
                    loggedInUsername.style.display = 'none';
                }
            }
        } else {
            if (loginNavBtn) loginNavBtn.parentElement.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'block';
            if (loginDropdown) loginDropdown.style.display = 'none';
        }
    }

    // Methods merged from login with 42
    // =================================

    async handle42LoginBtnClick(event) {
        if (event) {
            event.preventDefault();
        }
        
        components.showToast('info', 'Connecting', 'Initializing 42 authentication...');
        
        try {
            const result = await api.get42AuthUrl();
            
            if (!result.success || !result.auth_url) {
                throw new Error(result.error || 'No authorization URL received');
            }
            
            components.showToast('success', 'Connected', 'Redirecting to 42 login page...');
            
            window.location.href = result.auth_url;
        } catch (error) {
            console.error('42 login error:', error);
            components.showToast('error', '42 Login Failed', error.message || 'Could not connect to 42 authentication service.');
        }
    }

    handleOAuthCallback(router) {
        const accessToken = utils.getCookie('access_token');
        
        const pageSection = utils.getPageSection();
        if (!pageSection) {
            console.error('OAuth Callback: pageSection not found');
            return;
        }
        
        if (accessToken) {
            // Set the access token cookie first
            utils.setCookie('access_token', accessToken);
            
            // Handle successful OAuth
            this.handleSuccessfulOAuth(pageSection, router);
        } else {
            console.error('OAuth Callback: No access token found in callback URL');
            this.handleFailedAuth(pageSection, router);
        }
    }

    async handleSuccessfulOAuth(pageSection, router) {
        // Show loading state
        pageSection.innerHTML = `
            <div class="auth-container text-center p-5">
                <h2 class="text-gold mb-4">Authentication Successful</h2>
                <div class="mb-4">
                    <div class="progress">
                        <div id="authProgress" class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                    </div>
                </div>
                <p class="text-white">Verifying account...</p>
            </div>
        `;
        
        try {
            // Fetch user data
            const result = await api.getUserData();
            
            if (!result.success || !result.userData) {
                throw new Error('Could not retrieve user data');
            }
            
            const userData = result.userData;
            
            // Complete login process
            this.completeOAuthLogin(pageSection, userData);
        } catch (error) {
            console.error('OAuth user data error:', error);
            this.handleFailedAuth(pageSection, router);
        }
    }
    
    completeOAuthLogin(pageSection, userData) {
        // Store user data
        app.state.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Show success message
        pageSection.innerHTML = `
            <div class="auth-container text-center p-5">
                <h2 class="text-gold mb-4">Authentication Successful</h2>
                <div class="mb-4">
                    <div class="progress">
                        <div id="authProgress" class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                    </div>
                </div>
                <p class="text-white">You have been successfully authenticated.</p>
                <p class="text-white">Redirecting you to the homepage...</p>
            </div>
        `;
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
    
    handleFailedAuth(pageSection, router) {
        pageSection.innerHTML = `
            <div class="auth-container text-center p-5">
                <h2 class="text-danger mb-4">Authentication Failed</h2>
                <p class="text-white">We couldn't complete the authentication process.</p>
                <p class="text-white">Please try again.</p>
                <button id="retryAuthBtn" class="btn btn-gold mt-3">Return to Login</button>
            </div>
        `;
        
        setTimeout(() => {
            const retryBtn = document.getElementById('retryAuthBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    if (router && router.navigate) {
                        router.navigate('/login');
                    } else {
                        window.location.href = '/login';
                    }
                });
            }
        }, 100);
    }
}

const login = new Login();

export default login;
