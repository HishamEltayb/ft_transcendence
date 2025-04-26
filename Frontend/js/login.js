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
                
                // Store user temporarily
                const userData = result.data;
                
                console.log('userData', userData);
                
                // Check if 2FA is enabled
                if (userData.is_two_factor_enabled) {
                    // Show 2FA verification modal
                    this.show2FALoginVerification(userData);
                } else {
                    // Complete login if 2FA is not enabled
                    this.completeLogin(userData);
                }
            } else {
                components.showToast('error', 'Login Failed', result.error || 'Invalid username or password.');
                utils.setFormLoading(this.loginForm.submitBtn, false);
            }
        } catch (error) {
            console.error('Login submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            utils.setFormLoading(this.loginForm.submitBtn, false);
        }
    }
    
    // New method to show 2FA verification modal after login
    show2FALoginVerification(userData) {
        // Create 2FA verification modal if it doesn't exist
        let twoFAModal = document.getElementById('loginTwoFAModal');
        
        if (!twoFAModal) {
            twoFAModal = document.createElement('div');
            twoFAModal.id = 'loginTwoFAModal';
            twoFAModal.className = 'two-fa-container';
            
            twoFAModal.innerHTML = `
                <div class="two-fa-content">
                    <div class="two-fa-header">
                        <h5 class="two-fa-title">Two-Factor Authentication Required</h5>
                        <button type="button" class="close-button" id="loginTwoFACloseButton">&times;</button>
                    </div>
                    <div class="two-fa-body">
                        <div class="alert alert-danger d-none" id="login-twofa-error"></div>
                        
                        <p class="two-fa-text">Please enter the 6-digit verification code from your authenticator app to complete login.</p>
                        
                        <form id="loginTwoFAForm">
                            <div class="form-group">
                                <label for="loginTwoFACode" class="form-label">Verification Code</label>
                                <input type="text" class="form-control" id="loginTwoFACode" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="123456" required>
                                <div class="invalid-feedback">Please enter a valid 6-digit code</div>
                            </div>
                            
                            <div class="form-button-container">
                                <button type="submit" class="verify-button">
                                    <span class="spinner d-none" data-spinner></span>
                                    <span data-button-text>Verify</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            app.appContainer.appendChild(twoFAModal);
        }
        
        // Show the modal
        twoFAModal.classList.remove('d-none');
        
        // Set up event listeners
        const closeBtn = document.getElementById('loginTwoFACloseButton');
        const form = document.getElementById('loginTwoFAForm');
        
        // Handle close button - cancel login and cleanup
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                utils.cleanUp(); // Clear any auth data
                twoFAModal.classList.add('d-none');
                utils.setFormLoading(this.loginForm.submitBtn, false);
                components.showToast('info', 'Login Cancelled', 'Two-factor authentication is required to login.');
            });
        }
        
        // Handle form submission for 2FA verification
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const codeInput = document.getElementById('loginTwoFACode');
                const errorElement = document.getElementById('login-twofa-error');
                const submitButton = form.querySelector('button[type="submit"]');
                
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
                        // Complete login after successful 2FA verification
                        twoFAModal.classList.add('d-none');
                        this.completeLogin(userData);
                    } else {
                        if (errorElement) {
                            errorElement.textContent = data.error || 'Verification failed';
                            errorElement.classList.remove('d-none');
                        }
                        
                        // If authentication expired, cleanup and reset
                        if (data.authExpired) {
                            utils.cleanUp();
                            twoFAModal.classList.add('d-none');
                            utils.setFormLoading(this.loginForm.submitBtn, false);
                            components.showToast('error', 'Authentication Expired', 'Please try logging in again.');
                        }
                    }
                } catch (error) {
                    console.error('2FA verification error:', error);
                    
                    utils.setFormLoading(submitButton, false);
                    
                    if (errorElement) {
                        errorElement.textContent = error.message || 'Failed to verify 2FA code';
                        errorElement.classList.remove('d-none');
                    }
                }
            });
        }
        
        // Close modal when clicking outside
        twoFAModal.addEventListener('click', (e) => {
            if (e.target === twoFAModal) {
                utils.cleanUp(); // Clear any auth data
                twoFAModal.classList.add('d-none');
                utils.setFormLoading(this.loginForm.submitBtn, false);
                components.showToast('info', 'Login Cancelled', 'Two-factor authentication is required to login.');
            }
        });
    }
    
    // New method to complete login after all verifications
    completeLogin(userData) {
        // Store user data and update state
        app.state.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update UI and show success message
        login.updateUIAuthState();
        components.showToast('success', 'Login Successful', 'You have been logged in successfully.');
        
        // Navigate to home page
        router.navigate('/');
        
        // Reset form loading state
        utils.setFormLoading(this.loginForm.submitBtn, false);
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
        const { accessToken } = this.processOAuthCallback();
        
        const pageSection = utils.getPageSection();
        if (!pageSection) {
            console.error('OAuth Callback: pageSection not found');
            return;
        }
        
        if (accessToken) {
            // Set the access token cookie first
            utils.setCookie('access_token', accessToken);
            
            // Try to get user data to check 2FA status
            this.handleSuccessfulOAuth(pageSection, router);
        } else {
            console.error('OAuth Callback: No access token found in callback URL');
            this.handleFailedAuth(pageSection, router);
        }
    }

    processOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        let accessToken = urlParams.get('access_token');
        
        if (!accessToken && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            accessToken = hashParams.get('access_token');
        }
        
        return { accessToken };
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
            // Fetch user data to check 2FA status
            const result = await api.getUserData();
            
            if (!result.success || !result.userData) {
                throw new Error('Could not retrieve user data');
            }
            
            const userData = result.userData;
            
            // Check if 2FA is enabled
            if (userData.is_two_factor_enabled) {
                // Show 2FA verification UI
                this.showOAuth2FAVerification(pageSection, userData);
            } else {
                // Complete login if 2FA is not enabled
                this.completeOAuthLogin(pageSection, userData);
            }
        } catch (error) {
            console.error('OAuth user data error:', error);
            this.handleFailedAuth(pageSection, router);
        }
    }
    
    showOAuth2FAVerification(pageSection, userData) {
        // Show 2FA verification UI in the page section
        pageSection.innerHTML = `
            <div class="auth-container text-center p-5">
                <h2 class="text-gold mb-4">Two-Factor Authentication Required</h2>
                <div class="alert alert-danger d-none" id="oauth-twofa-error"></div>
                <p class="text-white mb-4">Please enter the 6-digit verification code from your authenticator app to complete login.</p>
                
                <form id="oauthTwoFAForm" class="mb-4">
                    <div class="form-group mb-3">
                        <input type="text" class="form-control form-control-lg mx-auto" style="max-width: 200px;" 
                            id="oauthTwoFACode" maxlength="6" inputmode="numeric" pattern="[0-9]*" 
                            placeholder="123456" required>
                    </div>
                    
                    <button type="submit" class="btn btn-gold mt-2" id="oauthVerifyBtn">
                        Verify and Login
                    </button>
                </form>
                
                <button id="oauthCancelBtn" class="btn btn-outline-light">Cancel</button>
            </div>
        `;
        
        // Setup form submission
        const form = document.getElementById('oauthTwoFAForm');
        const cancelBtn = document.getElementById('oauthCancelBtn');
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const codeInput = document.getElementById('oauthTwoFACode');
                const errorElement = document.getElementById('oauth-twofa-error');
                const submitButton = document.getElementById('oauthVerifyBtn');
                
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
                        // Complete login after successful 2FA verification
                        this.completeOAuthLogin(pageSection, userData);
                    } else {
                        if (errorElement) {
                            errorElement.textContent = data.error || 'Verification failed';
                            errorElement.classList.remove('d-none');
                        }
                        
                        // If authentication expired, redirect to login
                        if (data.authExpired) {
                            utils.cleanUp();
                            this.handleFailedAuth(pageSection, router);
                        }
                    }
                } catch (error) {
                    console.error('2FA verification error:', error);
                    
                    utils.setFormLoading(submitButton, false);
                    
                    if (errorElement) {
                        errorElement.textContent = error.message || 'Failed to verify 2FA code';
                        errorElement.classList.remove('d-none');
                    }
                }
            });
        }
        
        // Handle cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                utils.cleanUp();
                if (router && router.navigate) {
                    router.navigate('/login');
                } else {
                    window.location.href = '/login';
                }
            });
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
