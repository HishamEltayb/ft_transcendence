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
                this.loginForm.submitBtn.onclick = this.submitLoginForm.bind(this);
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
    
    async submitLoginForm(event) {
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
                
                app.state.user = result.data;
                
                components.showToast('success', 'Login Successful', 'You have been logged in successfully.');
                
                router.navigate('/');
            } else {
                // Display error toast
                components.showToast('error', 'Login Failed', result.error || 'Invalid username or password.');
                utils.setFormLoading(this.loginForm.submitBtn, false);
            }
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
            // User is logged in - show user profile, hide login button
            if (loginNavBtn) loginNavBtn.parentElement.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'none';
            if (loginDropdown) loginDropdown.style.display = 'block';
            
            // Handle user display based on login type (42 or regular)
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
            // User is not logged in - show login button, hide user profile
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
            
            // Show success message
            components.showToast('success', 'Connected', 'Redirecting to 42 login page...');
            
            // Redirect to 42 login page
            window.location.href = result.auth_url;
        } catch (error) {
            console.error('42 login error:', error);
            components.showToast('error', '42 Login Failed', error.message || 'Could not connect to 42 authentication service.');
        }
    }

    // Main handler for OAuth callback - called from router
    handleOAuthCallback(router) {
        // Process the callback URL
        const { accessToken } = this.processOAuthCallback();
        
        // Get the page section
        const pageSection = utils.getPageSection();
        if (!pageSection) {
            console.error('OAuth Callback: pageSection not found');
            return;
        }
        
        if (accessToken) {
            // Handle successful authentication
            this.handleSuccessfulAuth(accessToken, pageSection);
        } else {
            console.error('OAuth Callback: No access token found in callback URL');
            
            // Handle failed authentication
            this.handleFailedAuth(pageSection, router);
        }
    }

    // Process OAuth callback URL parameters
    processOAuthCallback() {
        // Get the access token from URL parameters or hash
        const urlParams = new URLSearchParams(window.location.search);
        let accessToken = urlParams.get('access_token');
        
        // If not in search params, try the hash
        if (!accessToken && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            accessToken = hashParams.get('access_token');
        }
        
        return { accessToken };
    }
    
    // Handle OAuth successful authentication
    handleSuccessfulAuth(accessToken, pageSection) {
        // Store the token
        utils.setCookie('access_token', accessToken);
        
        // Create a success UI
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
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
    
    // Handle OAuth authentication failure
    handleFailedAuth(pageSection, router) {
        // Create a failure UI
        pageSection.innerHTML = `
            <div class="auth-container text-center p-5">
                <h2 class="text-danger mb-4">Authentication Failed</h2>
                <p class="text-white">We couldn't complete the authentication process.</p>
                <p class="text-white">Please try again.</p>
                <button id="retryAuthBtn" class="btn btn-gold mt-3">Return to Login</button>
            </div>
        `;
        
        // Add event listener to the retry button
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

// Create an instance when this module is imported
const login = new Login();

export default login;
