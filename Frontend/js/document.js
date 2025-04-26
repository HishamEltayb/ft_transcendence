class DocumentHandler {
    // Helper method to find elements by ID
    getById(id) {
        return document.getElementById(id);
    }
    
    // Helper method to find elements by selector
    queryAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    // Helper method to find first element matching selector
    query(selector) {
        return document.querySelector(selector);
    }
    
    getAppContainer() {
        return document.getElementById('App');
    }

    getPageSection() {
        return document.getElementById('pageSection');
    }

    getLoginRegisterTabs() {
        return {
            loginTab: document.getElementById('loginTab'),
            registerTab: document.getElementById('registerTab')
        };
    }

    getLoginForm() { 
        const form = {
            tab: document.getElementById('loginTab'),
            container: document.getElementById('loginFormContainer'),
            form: document.getElementById('loginForm'),
            submitBtn: document.getElementById('loginBtn'),
            login42Link: document.getElementById('login42Link'),
            usernameField: document.getElementById('loginUsername'),
            passwordField: document.getElementById('loginPassword')
        };

        return form;
    }

    getRegisterForm() {
        const form = {
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

        return form;
    }

    getProfileForm() {
        return {
            profileUsername: document.getElementById('profileUsername'),
            profileIntraLogin: document.getElementById('profileIntraLogin'),
            profileAvatar: document.getElementById('profileAvatar'),
            displayNameField: document.getElementById('settingDisplayName'),
            emailField: document.getElementById('settingEmail'),
            twoFASwitch: document.getElementById('setting2fa'),
            statsTotalGames: document.getElementById('statsTotalGames'),
            statsWins: document.getElementById('statsWins'),
            statsLosses: document.getElementById('statsLosses'),
            statsWinRate: document.getElementById('statsWinRate'),
            statsRank: document.getElementById('statsRank')
        };
    }

    // Method to setup the login/register tabs
    setupLoginRegisterTabs(form) {
        const tabs = this.getLoginRegisterTabs();
        
        if (tabs.loginTab && tabs.registerTab) {
            // Default to showing login form
            this.showLoginForm(form);
            
            // Attach tab event listeners
            tabs.loginTab.addEventListener('click', () => this.showLoginForm(form));
            tabs.registerTab.addEventListener('click', () => this.showRegisterForm(form));
            
        } else {
            console.warn('DocumentHandler: Login/Register tabs not found');
        }
    }
    
    // Method to initialize the login and register forms
    initLoginRegisterForms(form) {
        form.login = this.getLoginForm();
        form.register = this.getRegisterForm();


        if (form.login.login42Link) {
            form.login.login42Link.onclick = form.handleLogin42.bind(form);
        }

        if (form.login.form) {
            if (form.login.usernameField) {
                form.setupInputField(form.login.usernameField, 'username');
            }
            
            if (form.login.passwordField) {
                form.setupInputField(form.login.passwordField, 'password');
            }

            // Add back button click handler
            if (form.login.submitBtn) {
                form.login.submitBtn.onclick = form.handleLoginForm.bind(form);
            }
        }
        
        if (form.register.form) {
            // Add validation for register fields
            if (form.register.usernameField) {
                form.setupInputField(form.register.usernameField, 'username');
            }
            
            if (form.register.emailField) {
                form.setupInputField(form.register.emailField, 'email');
            }
            
            if (form.register.passwordField) {
                form.setupPasswordField(form.register.passwordField, 'password');
            }
            
            if (form.register.confirmPasswordField) {
                form.setupPasswordField(form.register.confirmPasswordField, 'password');
            }

            // Add back button click handler
            if (form.register.submitBtn) {
                form.register.submitBtn.onclick = form.handleRegistrationForm.bind(form);
            }
        }
    }

    // Method to show the login form tab
    showLoginForm(form) {
        // Try to get fresh references to elements
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either stored references or fresh ones
        const tab1 = form?.login?.tab || loginTab;
        const tab2 = form?.register?.tab || registerTab;
        const container1 = form?.login?.container || loginContainer;
        const container2 = form?.register?.container || registerContainer;
        
        if (!tab1 || !container1 || !tab2 || !container2) {
            console.warn('DocumentHandler: Cannot switch tabs - missing elements:', {
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
    showRegisterForm(form) {
        
        // Try to get fresh references to elements
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either stored references or fresh ones
        const tab1 = form?.login?.tab || loginTab;
        const tab2 = form?.register?.tab || registerTab;
        const container1 = form?.login?.container || loginContainer;
        const container2 = form?.register?.container || registerContainer;
        
        if (!tab1 || !container1 || !tab2 || !container2) {
            console.warn('DocumentHandler: Cannot switch tabs - missing elements:', {
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

    // Method to update UI based on authentication state
    updateUIAuthState(app) {
        const loginNavBtn = this.getById('loginNavBtn');
        const loginBtn = this.getById('loginBtn');
        const loginDropdown = this.getById('loginDropdown');
        const loggedInUserImg = this.getById('loggedInUserImg');
        const loggedInUsername = this.getById('loggedInUsername');
        
        // Update 2FA switches
        this.update2FASwitch(app);
        
        if (app.state.user) {
            // User is logged in - show user profile, hide login button
            if (loginNavBtn) loginNavBtn.parentElement.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'none';
            if (loginDropdown) loginDropdown.style.display = 'block';
            
            // Handle 42 user with image
            if (app.getIs42User && app.getIs42User() && 
                app.getUserImg && app.getUserImg()) {
                if (loggedInUserImg) {
                    loggedInUserImg.src = app.getUserImg();
                    loggedInUserImg.style.display = 'block';
                }
            } else if (loggedInUserImg) {
                loggedInUserImg.style.display = 'none';
            }
            
            // Handle user display - use 42 image or username
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
    
    // Method to update 2FA toggle switches based on user state
    update2FASwitch(app) {
        // Only proceed if user is logged in
        if (!app.state.user) return;
        
        // Get both 2FA switches (header dropdown and profile page)
        const headerSwitch = this.getById('enable2FASwitch');
        const profileSwitch = this.getById('setting2fa');
        
        // Get current 2FA status
        const is2FAEnabled = app.getIs2FAEnabled ? app.getIs2FAEnabled() : false;
        
        // Update header dropdown switch if it exists
        if (headerSwitch) {
            headerSwitch.checked = is2FAEnabled;
        }
        
        // Update profile page switch if it exists
        if (profileSwitch) {
            profileSwitch.checked = is2FAEnabled;
        }
    }

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
    
    // Method to initialize 2FA switch in header
    init2FASwitch() {
        // Initialize the header 2FA switch
        const headerSwitch = this.getById('enable2FASwitch');
        if (headerSwitch) {
            // Initial state will be set by updateUIAuthState
            headerSwitch.disabled = false;
        }
    }
}

// Create a singleton instance
const docHandler = new DocumentHandler();

export default docHandler;

