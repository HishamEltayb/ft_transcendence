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

    // Method to setup the login/register tabs
    setupLoginRegisterTabs(formInstance) {
        const tabs = this.getLoginRegisterTabs();
        
        if (tabs.loginTab && tabs.registerTab) {
            // Default to showing login form
            this.showLoginForm(formInstance);
            
            // Attach tab event listeners
            tabs.loginTab.addEventListener('click', () => this.showLoginForm(formInstance));
            tabs.registerTab.addEventListener('click', () => this.showRegisterForm(formInstance));
            
        } else {
            console.warn('DocumentHandler: Login/Register tabs not found');
        }
    }
    
    // Method to initialize the login and register forms
    initLoginRegisterForms(formInstance) {
        formInstance.login = this.getLoginForm();
        formInstance.register = this.getRegisterForm();


        if (formInstance.login.login42Link) {
            formInstance.login.login42Link.onclick = formInstance.handleLogin42.bind(formInstance);
        }

        if (formInstance.login.form) {
            if (formInstance.login.usernameField) {
                formInstance.setupInputField(formInstance.login.usernameField, 'username');
            }
            
            if (formInstance.login.passwordField) {
                formInstance.setupInputField(formInstance.login.passwordField, 'password');
            }

            // Add back button click handler
            if (formInstance.login.submitBtn) {
                formInstance.login.submitBtn.onclick = formInstance.handleLoginForm.bind(formInstance);
            }
        }
        
        if (formInstance.register.form) {
            // Add validation for register fields
            if (formInstance.register.usernameField) {
                formInstance.setupInputField(formInstance.register.usernameField, 'username');
            }
            
            if (formInstance.register.emailField) {
                formInstance.setupInputField(formInstance.register.emailField, 'email');
            }
            
            if (formInstance.register.passwordField) {
                formInstance.setupPasswordField(formInstance.register.passwordField, 'password');
            }
            
            if (formInstance.register.confirmPasswordField) {
                formInstance.setupPasswordField(formInstance.register.confirmPasswordField, 'password');
            }

            // Add back button click handler
            if (formInstance.register.submitBtn) {
                formInstance.register.submitBtn.onclick = formInstance.handleRegistrationForm.bind(formInstance);
            }
        }
    }

    // Method to show the login form tab
    showLoginForm(formInstance) {
        // Try to get fresh references to elements
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either stored references or fresh ones
        const tab1 = formInstance?.login?.tab || loginTab;
        const tab2 = formInstance?.register?.tab || registerTab;
        const container1 = formInstance?.login?.container || loginContainer;
        const container2 = formInstance?.register?.container || registerContainer;
        
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
    showRegisterForm(formInstance) {
        
        // Try to get fresh references to elements
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either stored references or fresh ones
        const tab1 = formInstance?.login?.tab || loginTab;
        const tab2 = formInstance?.register?.tab || registerTab;
        const container1 = formInstance?.login?.container || loginContainer;
        const container2 = formInstance?.register?.container || registerContainer;
        
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
    updateUIAuthState(appInstance) {
        
        const loginNavBtn = this.getById('loginNavBtn');
        const loginBtn = this.getById('loginBtn');
        const loginDropdown = this.getById('loginDropdown');
        const loggedInUserImg = this.getById('loggedInUserImg');
        const loggedInUsername = this.getById('loggedInUsername');
        
        if (appInstance.state.user) {
            // User is logged in - show user profile, hide login button
            if (loginNavBtn) loginNavBtn.parentElement.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'none';
            if (loginDropdown) loginDropdown.style.display = 'block';
            
            // Handle 42 user with image
            if (appInstance.getIs42User && appInstance.getIs42User() && 
                appInstance.getUserImg && appInstance.getUserImg()) {
                if (loggedInUserImg) {
                    loggedInUserImg.src = appInstance.getUserImg();
                    loggedInUserImg.style.display = 'block';
                }
            } else if (loggedInUserImg) {
                loggedInUserImg.style.display = 'none';
            }
            
            // Handle user display - use 42 image or username
            if (appInstance.getIs42User && appInstance.getIs42User()) {
                if (appInstance.getUserImg && appInstance.getUserImg() && loggedInUserImg) {
                    loggedInUserImg.src = appInstance.getUserImg();
                    loggedInUserImg.style.display = 'block';
                } else if (loggedInUserImg) {
                    loggedInUserImg.style.display = 'none';
                }
            } else {
                if (appInstance.getUsername && appInstance.getUsername() && loggedInUsername) {
                    loggedInUsername.textContent = appInstance.getUsername();
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

    initLogoutButton(appInstance) {
        // Use app's existing flag to track initialization
        if (appInstance.logoutInitialized) return;
        
        document.addEventListener('click', (event) => {
            const logoutBtn = event.target.closest('#logoutBtn');
            if (logoutBtn) {
                event.preventDefault();
                appInstance.logout(); // Use the app's logout method
            }
        });
        
        // Set the flag on the app instance
        appInstance.logoutInitialized = true;
    }
}

// Create a singleton instance
const docHandler = new DocumentHandler();

export default docHandler;

