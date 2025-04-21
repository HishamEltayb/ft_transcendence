import hooks from './hooks.js';
import components from './components.js';
import user from './user.js';
import store from './store.js';

class Forms {
    constructor() {
        
        // Flag to prevent multiple simultaneous initializations
        this.isProfileInitializing = false;
        
        // Don't try to access DOM elements here
        // They might not exist yet, especially when the app is first initialized
        
        // We'll fetch DOM elements when needed in specific methods
        this.login = {};
        this.register = {};
        this.profile = {};
        this.profileStats = {};
        this.matchHistoryTable = null;
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        console.log('Forms: Initializing forms');
        
        // Now it's safe to query for DOM elements if the page is loaded
        this.initLoginRegisterForms();
        
        // Check if we're on the login page
        if (window.location.pathname.includes('login')) {
            
            // Set up login/register tabs
            const loginTab = document.getElementById('loginTab');
            const registerTab = document.getElementById('registerTab');
            
            if (loginTab && registerTab) {
                // Default to showing login form
                this.showLoginForm();
                
            } else {
                console.warn('Forms: Login page tabs not found');
            }
        }
        
        // Don't initialize profile yet - will be done when profile page is shown
        // Don't add profile event listeners yet either
    }
    
    initLoginRegisterForms() {
        
        // Login form elements
        this.login = {
            tab: document.getElementById('loginTab'),
            container: document.getElementById('loginFormContainer'),
            form: document.getElementById('loginForm'),
            submitBtn: document.getElementById('loginBtn'),
            login42Link: document.getElementById('login42Link')
        };
        
        // Register form elements
        this.register = {
            tab: document.getElementById('registerTab'),
            container: document.getElementById('registerFormContainer'),
            form: document.getElementById('registerForm'),
            submitBtn: document.getElementById('registerBtn')
        };
        
        // Add event listeners for login/register
        if (this.login.form) {
            this.login.form.addEventListener('submit', this.submitLoginForm.bind(this));
        }
        
        if (this.login.login42Link) {
            this.login.login42Link.onclick = this.handleLogin42.bind(this);
        }
        
        if (this.register.form) {
            this.register.form.addEventListener('submit', this.submitRegisterForm.bind(this));
        }
        
        if (this.login.tab && this.register.tab) {
            this.login.tab.addEventListener('click', this.showLoginForm.bind(this));
            this.register.tab.addEventListener('click', this.showRegisterForm.bind(this));
        }
    }

    // Method to show the login form tab
    showLoginForm() {
        // Try to get fresh references to elements, as they might have changed due to navigation
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either our stored references or the fresh ones
        const tab1 = this.login.tab || loginTab;
        const tab2 = this.register.tab || registerTab;
        const container1 = this.login.container || loginContainer;
        const container2 = this.register.container || registerContainer;
        
        if (!tab1 || !container1 || !tab2 || !container2) {
            console.warn('Forms: Cannot switch tabs - missing elements:', {
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
    showRegisterForm() {
        console.log('Forms: Switching to register tab');
        
        // Try to get fresh references to elements, as they might have changed due to navigation
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginContainer = document.getElementById('loginFormContainer');
        const registerContainer = document.getElementById('registerFormContainer');
        
        // Use either our stored references or the fresh ones
        const tab1 = this.login.tab || loginTab;
        const tab2 = this.register.tab || registerTab;
        const container1 = this.login.container || loginContainer;
        const container2 = this.register.container || registerContainer;
        
        if (!tab1 || !container1 || !tab2 || !container2) {
            console.warn('Forms: Cannot switch tabs - missing elements:', {
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

    async initProfilePage() {
        // Check if we're already initializing or initialized
        if (this.isProfileInitializing) {
            return;
        }
        
        // Set flag to prevent multiple simultaneous initializations
        this.isProfileInitializing = true;
        
        // First check if we have an auth token (required for profile access)
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.warn('Forms: No auth token found, redirecting to login...');
            localStorage.setItem('redirectAfterLogin', 'profile');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
            this.isProfileInitializing = false;
            return;
        }
        
        // Re-fetch DOM elements, as they might not be in the DOM when the class was initialized
        this.refreshProfileDOMElements();
        
        try {
            // Get user data - first check store, then fetch if needed
            const storeState = store.getState();
            let userData = null;
            
            if (storeState.user && !store.shouldRefreshUserData()) {
                // Use cached data from store
                userData = storeState.user;
                this.populateAccountSettings(userData);
                this.populatePlayerStatistics(userData);
                this.populateMatchHistory(userData);
            } else {
                // Force fetch fresh user data
                const result = await hooks.useFetchUserData(true);
                
                if (result.success) {
                    userData = result.userData;
                    this.populateAccountSettings(userData);
                    this.populatePlayerStatistics(userData);
                    this.populateMatchHistory(userData);
                } else {
                    console.error('Failed to fetch user data for profile:', result.error);
                    // Try using cached data as fallback
                    if (storeState.user) {
                        userData = storeState.user;
                        this.populateAccountSettings(userData);
                        this.populatePlayerStatistics(userData);
                        this.populateMatchHistory(userData);
                    } else {
                        components.showToast('error', 'Data Error', 'Failed to load your profile data.');
                    }
                }
            }
            
            // Check for saved form data in store and use newer values
            const savedFormData = store.getFormData('profileForm');
            if (savedFormData) {
                this.restoreFormData(this.profile.form, savedFormData);
            }
            
        } catch (error) {
            console.error('Error initializing profile page:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred while loading your profile.');
        } finally {
            this.isProfileInitializing = false;
        }
    }
    
    /**
     * Refresh the DOM element references for the profile page
     * This ensures we have the latest DOM elements after page navigation
     */
    refreshProfileDOMElements() {
        // Check for required elements
        if (!document.getElementById('settingsForm')) {
            console.warn('Forms: Profile form not found');
            return false;
        }
        
        // Get profile section elements
        this.profile.username = document.getElementById('profileUsername');
        this.profile.avatar = document.getElementById('profileAvatar');
        this.profile.intraLogin = document.getElementById('profileIntraLogin');
        
        // Get match history element
        this.matchHistoryTable = document.getElementById('matchHistoryTable');
        
        // Get settings form elements
        this.profile.displayName = document.getElementById('settingDisplayName');
        this.profile.email = document.getElementById('settingEmail');
        this.profile.password = document.getElementById('settingPassword');
        this.profile.confirmPassword = document.getElementById('settingConfirmPassword');
        this.profile.twoFA = document.getElementById('setting2fa');
        this.profile.submitBtn = document.getElementById('saveSettingsBtn');
        
        // Add event listeners
        if (this.profile.submitBtn) {
            this.profile.submitBtn.addEventListener('click', this.submitProfileForm.bind(this));
        }
        
        // Add edit profile button event listener
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', this.toggleProfileEditMode.bind(this));
        }
        
        // Add 2FA checkbox change event listener
        if (this.profile.twoFA) {
            this.profile.twoFA.addEventListener('click', this.handle2FAButtonClick.bind(this));
        }
        
        return true;
    }
    
  
    // Populate player statistics
    populatePlayerStatistics(userData) {
        if (!userData || !this.profileStats) {
            console.warn('Forms: Cannot populate profile stats - missing data or elements');
            return;
        }
        
        // Make sure stats object exists
        const stats = userData.stats || {
            total_games: 0,
            wins: 0,
            losses: 0,
            rank: 'Beginner'
        };
        
        // Calculate win rate
        const winRate = stats.total_games > 0 
            ? Math.round((stats.wins / stats.total_games) * 100) 
            : 0;
        
        // Update UI elements
        if (this.profileStats.totalGames) {
            this.profileStats.totalGames.textContent = stats.total_games || 0;
        }
        
        if (this.profileStats.wins) {
            this.profileStats.wins.textContent = stats.wins || 0;
        }
        
        if (this.profileStats.losses) {
            this.profileStats.losses.textContent = stats.losses || 0;
        }
        
        if (this.profileStats.winRate) {
            this.profileStats.winRate.textContent = `${winRate}%`;
        }
        
        if (this.profileStats.rank) {
            this.profileStats.rank.textContent = stats.rank || 'Beginner';
        }
    }
    
    populateAccountSettings(userData) {
        // Add more detailed logging to see exactly what data we're getting
        // Check if userData is null or undefined
        if (!userData) {
            console.error('Forms: userData is null or undefined');
            return;
        }
        
        // Check if we have the form elements before trying to populate them
        if (!this.profile.displayName) {
            console.error('Forms: Display name input not found');
        }
        
        if (!this.profile.email) {
            console.error('Forms: Email input not found');
        }
        
        if (!this.profile.twoFA) {
            console.error('Forms: Two-Factor button not found');
        }
        
        // Set username
        if (this.profile.username) {
            this.profile.username.textContent = userData.username || 'Unknown User';
        }
        
        // Set intra login
        if (this.profile.intraLogin) {
            this.profile.intraLogin.textContent = userData.intra_login || 'N/A';
        }
        
        // Handle avatar image and URL
        if (this.profile.avatar) {
            if (userData.profile_image) {
                // Set the avatar image source
                this.profile.avatar.src = userData.profile_image;
                
                // Display the avatar URL
                if (this.profile.avatarUrl) {
                    this.profile.avatarUrl.textContent = userData.profile_image;
                }
            } else {
                // If there's no profile_image, don't show any text
                if (this.profile.avatarUrl) {
                    this.profile.avatarUrl.textContent = '';
                }
            }
            
            // Add error handler for the image
            this.profile.avatar.onerror = function() {
                this.src = '../public/assets/images/default-avatar.png';
            };
        }
        
        // Set form fields - using a more robust approach
        try {
            // Try to use getElementById directly if our element references are broken
            const displayNameInput = this.profile.displayName || document.getElementById('settingDisplayName');
            const emailInput = this.profile.email || document.getElementById('settingEmail');
            const passwordInput = this.profile.password || document.getElementById('settingPassword');
            const confirmPasswordInput = this.profile.confirmPassword || document.getElementById('settingConfirmPassword');
            const twoFAButton = this.profile.twoFA || document.getElementById('setting2fa');
            
            // Set display name/username
            if (displayNameInput) {
                displayNameInput.value = userData.username || '';
            }
            
            // Set email
            if (emailInput) {
                emailInput.value = userData.email || '';
            }
            
            // Password fields should be empty for security
            if (passwordInput) {
                passwordInput.value = '';
            }
            
            if (confirmPasswordInput) {
                confirmPasswordInput.value = '';
            }
            
            // Show 2FA button only if 2FA is not enabled
            if (twoFAButton) {
                if (userData.is_two_factor_enabled === true) {
                    // Hide button if 2FA already enabled
                    twoFAButton.style.display = 'none';
                } else {
                    // Show button if 2FA not enabled
                    twoFAButton.style.display = 'block';
                    twoFAButton.innerHTML = '<i class="bi bi-shield-lock-fill me-2"></i>Enable Two-Factor Authentication';
                    twoFAButton.classList.remove('btn-danger');
                    twoFAButton.classList.add('btn-gold');
                }
            }
            
            // Make sure the submit button is visible
            if (this.profile.submitBtn) {
                this.profile.submitBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('Forms: Error while setting form values:', error);
        }
    }
    
    // Populate match history table
    populateMatchHistory(userData) {
        
        if (!userData) {
            console.warn('Forms: Cannot populate match history - missing user data');
            return;
        }
        
        if (!this.matchHistoryTable) {
            console.warn('Forms: Cannot populate match history - match history table element not found');
            return;
        }
        
        const matchHistory = userData.match_history || [];
        
        
        if (matchHistory.length === 0) {
            // Show a "no matches" message
            this.matchHistoryTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No match history available</td>
                </tr>
            `;
            return;
        }
        
        let tableContent = '';
        
        matchHistory.forEach(match => {
            const result = match.won ? 'Win' : 'Loss';
            const resultClass = match.won ? 'text-success' : 'text-danger';
            
            tableContent += `
                <tr>
                    <td>${new Date(match.date).toLocaleDateString()}</td>
                    <td>${match.opponent || 'Unknown'}</td>
                    <td>${match.player_score} - ${match.opponent_score}</td>
                    <td class="${resultClass}">${result}</td>
                </tr>
            `;
        });
        
        this.matchHistoryTable.innerHTML = tableContent;
    }
    
    // Toggle profile edit mode
    toggleProfileEditMode() {
        const formFields = [
            this.profile.displayName,
            this.profile.email,
            this.profile.password,
            this.profile.confirmPassword,
            this.profile.twoFA
        ];
        
        // Toggle readonly state
        formFields.forEach(field => {
            if (field) {
                if (field.readOnly) {
                    field.readOnly = false;
                } else {
                    field.readOnly = true;
                }
            }
        });
        
        // Toggle submit button visibility
        if (this.profile.submitBtn) {
            this.profile.submitBtn.style.display = 
                this.profile.submitBtn.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    // Handle profile form submission
    async submitProfileForm(event) {
        event.preventDefault();
        
        // Get form values - try both our object references and direct getElementById
        const displayName = (this.profile.displayName ? this.profile.displayName.value : '') || 
                            (document.getElementById('settingDisplayName') ? document.getElementById('settingDisplayName').value : '');
        
        const email = (this.profile.email ? this.profile.email.value : '') || 
                     (document.getElementById('settingEmail') ? document.getElementById('settingEmail').value : '');
        
        const password = (this.profile.password ? this.profile.password.value : '') || 
                        (document.getElementById('settingPassword') ? document.getElementById('settingPassword').value : '');
        
        const confirmPassword = (this.profile.confirmPassword ? this.profile.confirmPassword.value : '') || 
                               (document.getElementById('settingConfirmPassword') ? document.getElementById('settingConfirmPassword').value : '');
        
        // Get 2FA state from user data (we can't change it through the form)
        const userData = store.getUserData();
        const twoFA = userData ? userData.is_two_factor_enabled : false;
        
        
        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                components.showToast('warning', 'Invalid Email', 'Please enter a valid email address.');
                return;
            }
        }
        
        // Validate password match if provided
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                components.showToast('warning', 'Password Mismatch', 'Passwords do not match. Please try again.');
                return;
            }
        }
        
        // Show loading state
        this.setLoading(this.profile.submitBtn, true);
        
        // Create profile update data object with correct field names
        // matching the UserSerializer in the backend
        const profileData = {
            username: displayName,
            email: email,
            is_two_factor_enabled: twoFA
        };
        
        // Add password if provided
        if (password) {
            profileData.password = password;
        }
        
        // Store form data in case submission fails
        const formDataForStore = { ...profileData };
        delete formDataForStore.password; // Don't store password
        store.saveFormData('profileForm', formDataForStore);
        
        try {
            // Use the hook to submit the profile update
            const result = await hooks.useUpdateUserProfile(profileData);
            
            if (result.success) {
                // Update user data in memory and store
                user.setUserData(result.userData, true);
                
                // Reset password fields
                if (this.profile.password) this.profile.password.value = '';
                if (this.profile.confirmPassword) this.profile.confirmPassword.value = '';
                
                // Show success toast
                components.showToast('success', 'Profile Updated', 'Your profile has been successfully updated.');
                
                // Toggle back to view mode
                this.toggleProfileEditMode();
            } else {
                components.showToast('error', 'Update Failed', result.error || 'Failed to update your profile. Please try again.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
        } finally {
            this.setLoading(this.profile.submitBtn, false);
        }
    }

    // Helper method to show loading state on a submitBtn
    setLoading(submitBtn, isLoading) {
        if (!submitBtn) return;
        
        if (isLoading) {
            // Store the original text
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            submitBtn.disabled = true;
        } else {
            // Restore the original text
            submitBtn.innerHTML = submitBtn.dataset.originalText || submitBtn.innerHTML;
            submitBtn.disabled = false;
        }
    }

    async submitLoginForm(event) {
        event.preventDefault();
        
        // Get form values
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate required fields
        if (!username || !password) {
            components.showToast('error', 'Login Error', 'Please enter both username and password.');
            return;
        }
        
        // Show loading state
        this.setLoading(this.login.submitBtn, true);
        
        // Create login data object
        const loginData = {
            username,
            password
        };
        
        try {
            // Use the hook to submit the data
            const result = await hooks.useSubmitLoginForm(loginData);
            
            // Handle the result
            if (result.success) {
                // Save username (but not password) in store for future use
                store.saveFormData('loginForm', { username });
                
                // Clear password field
                document.getElementById('loginPassword').value = '';
                
                // Fetch user data to update UI
                await hooks.useFetchUserData(true);
                
                // Force page reload to ensure all auth-dependent components update
                const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
                if (redirectAfterLogin) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = `/${redirectAfterLogin}`;
                } else {
                    window.location.href = '/';
                }
            } else {
                // Display error toast
                components.showToast('error', 'Login Failed', result.error || 'Invalid username or password.');
                this.setLoading(this.login.submitBtn, false);
            }
        } catch (error) {
            console.error('Login submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            this.setLoading(this.login.submitBtn, false);
        }
    }

    async submitRegisterForm(event) {
        event.preventDefault();
        
        // Get form values
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate required fields
        if (!username || !email || !password || !confirmPassword) {
            components.showToast('error', 'Registration Error', 'Please fill out all fields.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            components.showToast('warning', 'Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            components.showToast('warning', 'Password Mismatch', 'Passwords do not match. Please try again.');
            return;
        }
        
        // Show loading state
        this.setLoading(this.register.submitBtn, true);
        
        // Create registration data object
        const registerData = {
            username,
            email,
            password,
            confirmPassword
        };
        
        
        try {
            // Use the hook to submit the data
            const result = await hooks.useSubmitRegisterForm(registerData);
            
            // Handle the result
            if (result.success) {
                // Show success toast
                components.showToast('success', 'Registration Successful', 'Your account has been created. Please log in.');
                
                // Clear the form
                this.register.form.reset();
                
                // Switch to login form
                this.showLoginForm();
                this.setLoading(this.register.submitBtn, false);
            } else {
                // Display error toast
                components.showToast('error', 'Registration Failed', result.error || 'Please try again with a different username or email.');
                this.setLoading(this.register.submitBtn, false);
            }
        } catch (error) {
            console.error('Registration submission error:', error);
            components.showToast('error', 'System Error', 'An unexpected error occurred. Please try again later.');
            this.setLoading(this.register.submitBtn, false);
        }
    }

    async handleLogin42(event) {
        
        if (event) {
            event.preventDefault();
            // event.stopPropagation();
        }
        
        // Show loading message
        components.showToast('info', 'Connecting', 'Initializing 42 authentication...');
        
        try {
            
            // Call the backend directly to get the auth URL - NOTE: adding trailing slash back
            const response = await fetch('/api/users/oauth/42/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('42 OAuth error details:', text);
                    throw new Error('Failed to initiate 42 login: ' + text);
                });
            }
            
            const data = await response.json();
            
            if (!data.auth_url) {
                throw new Error('No authorization URL received from server');
            }
            
            // Show success message
            components.showToast('success', 'Connected', 'Redirecting to 42 login page...');
            
            // Store any redirection info before navigating away
            const currentPage = window.location.pathname.replace('/', '');
            if (currentPage && currentPage !== 'login') {
                localStorage.setItem('redirectAfterLogin', currentPage);
            }
            
            // Simply redirect to the auth URL
            window.location.href = data.auth_url;            
        } catch (error) {
            console.error('42 login error:', error);
            components.showToast('error', '42 Login Failed', error.message || 'Could not connect to 42 authentication service.');
        }
    }

    /**
     * Restore saved form data to a form
     * @param {HTMLFormElement} form - The form element to restore data to
     * @param {Object} formData - The form data to restore
     */
    restoreFormData(form, formData) {
        if (!form || !formData) return;
        
        try {
            // Restore each field
            Object.entries(formData).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"], #${key}`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value === true || value === 'true';
                    } else if (input.tagName === 'SELECT') {
                        const option = input.querySelector(`option[value="${value}"]`);
                        if (option) {
                            option.selected = true;
                        }
                    } else {
                        input.value = value;
                    }
                }
            });
            
        } catch (error) {
            console.error('Forms: Error restoring form data:', error);
        }
    }

    // Handle 2FA button click - only for enabling 2FA
    async handle2FAButtonClick(event) {
        console.log('2FA button clicked to enable 2FA');
        
        // Get the modal element using standard DOM methods
        const twoFAModal = document.getElementById('twoFAModal');
        
        if (!twoFAModal) {
            console.error('2FA modal element not found in the DOM!');
            components.showToast('error', '2FA Error', 'Could not find the 2FA setup interface.');
            return;
        }
        
        // Common modal setup
        const modalTitle = twoFAModal.querySelector('#twoFAModalLabel');
        const modalBody = twoFAModal.querySelector('.modal-body');
        const twoFAForm = document.getElementById('twoFAForm');
        const buttonText = twoFAForm.querySelector('[data-button-text]');
        const errorDiv = document.getElementById('twofa-error');
        
        // Clear any previous errors
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.classList.add('d-none');
        }
        
        // Remove any existing QR code containers to prevent duplicates
        const existingQRs = modalBody.querySelectorAll('.qr-code-container');
        existingQRs.forEach(container => container.remove());
        
        // ENABLING 2FA - STEP 1: Show initial instructions
        modalTitle.textContent = 'Set Up Two-Factor Authentication';
        
        // Update instruction text to reflect two-step process
        const instructionText = modalBody.querySelector('p.text-dark.mb-4');
        if (instructionText) {
            instructionText.textContent = 'Please wait while we generate your 2FA QR code...';
        }
        
        // Show the modal with Bootstrap
        const modal = new bootstrap.Modal(twoFAModal);
        modal.show();
        
        try {
            // First step: Generate the QR code immediately
            const spinner = twoFAForm.querySelector('[data-spinner]');
            const submitBtn = twoFAForm.querySelector('button[type="submit"]');
            
            if (spinner) spinner.classList.remove('d-none');
            if (submitBtn) submitBtn.disabled = true;
            
            // Generate the QR code first
            const setupResult = await hooks.useSetup2FA();
            
            if (!setupResult.success) {
                throw new Error(setupResult.error || 'Failed to generate QR code');
            }
            
            console.log('2FA setup response received');
            
            // Make sure we have a QR code
            if (!setupResult.qr_code) {
                throw new Error('QR code not received from server');
            }
            
            // Display the QR code - create a simple container
            const qrContainer = document.createElement('div');
            qrContainer.className = 'qr-code-container';
            qrContainer.style.backgroundColor = '#ffffff';
            qrContainer.style.padding = '20px';
            qrContainer.style.margin = '15px auto';
            qrContainer.style.maxWidth = '280px';
            qrContainer.style.border = '1px solid #ddd';
            qrContainer.style.borderRadius = '8px';
            qrContainer.style.textAlign = 'center';
            
            // Create heading
            const heading = document.createElement('h6');
            heading.className = 'mb-3 fw-bold text-dark';
            heading.textContent = 'Scan this QR code';
            qrContainer.appendChild(heading);
            
            // Create image element
            const img = document.createElement('img');
            
            // Handle different API response formats
            if (setupResult.qr_code.startsWith('data:image')) {
                img.src = setupResult.qr_code;
            } else if (setupResult.qr_code.startsWith('http')) {
                img.src = setupResult.qr_code;
            } else {
                // Assume it's a base64 string without the prefix
                img.src = `data:image/png;base64,${setupResult.qr_code}`;
            }
            
            img.alt = '2FA QR Code';
            img.style.maxWidth = '200px';
            img.style.height = 'auto';
            img.style.margin = '0 auto';
            img.style.display = 'block';
            img.style.padding = '8px';
            img.style.backgroundColor = 'white';
            img.style.border = '1px solid #dee2e6';
            
            qrContainer.appendChild(img);
            
            // Create manual code section
            if (setupResult.secret_key) {
                const manualDiv = document.createElement('div');
                manualDiv.style.marginTop = '15px';
                manualDiv.style.padding = '10px';
                manualDiv.style.backgroundColor = '#f8f9fa';
                manualDiv.style.border = '1px solid #dee2e6';
                manualDiv.style.borderRadius = '4px';
                
                const manualText = document.createElement('p');
                manualText.className = 'mb-2 text-dark';
                manualText.innerHTML = '<strong>Or enter this code manually:</strong>';
                manualDiv.appendChild(manualText);
                
                const codeElem = document.createElement('code');
                codeElem.style.padding = '8px';
                codeElem.style.backgroundColor = '#212529';
                codeElem.style.color = '#ffc107';
                codeElem.style.fontSize = '1rem';
                codeElem.style.display = 'block';
                codeElem.style.wordBreak = 'break-all';
                codeElem.style.borderRadius = '4px';
                codeElem.textContent = setupResult.secret_key;
                manualDiv.appendChild(codeElem);
                
                qrContainer.appendChild(manualDiv);
            }
            
            // Find a good place to insert the QR code
            if (instructionText) {
                instructionText.textContent = 'Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)';
                
                // Insert the QR code after the instruction text
                if (!modalBody.querySelector('.qr-code-container')) {
                    modalBody.insertBefore(qrContainer, instructionText.nextSibling);
                }
            } else {
                // Fallback - just append to modal body
                modalBody.appendChild(qrContainer);
            }
            
            // Show the verification code input
            const codeInputGroup = twoFAForm.querySelector('.mb-4');
            if (codeInputGroup) {
                codeInputGroup.style.display = 'block';
            }
            
            // Update button text for verification
            if (buttonText) {
                buttonText.textContent = 'Verify and Enable 2FA';
            }
            
            // Reset loading state
            if (spinner) spinner.classList.add('d-none');
            if (submitBtn) submitBtn.disabled = false;
            
            // Set up form submission handler for verification
            twoFAForm.onsubmit = async (e) => {
                e.preventDefault();
                
                const code = document.getElementById('twoFACode').value;
                if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
                    // Show validation error
                    if (errorDiv) {
                        errorDiv.textContent = 'Please enter a valid 6-digit code';
                        errorDiv.classList.remove('d-none');
                    }
                    return;
                }
                
                // Show loading
                if (spinner) spinner.classList.remove('d-none');
                if (buttonText) buttonText.textContent = 'Verifying...';
                if (submitBtn) submitBtn.disabled = true;
                
                try {
                    // Verify the 2FA code
                    const verifyResult = await hooks.useVerify2FA(code);
                    
                    if (!verifyResult.success) {
                        throw new Error(verifyResult.error || 'Verification failed');
                    }
                    
                    // Update user data
                    if (verifyResult.data && verifyResult.data.user) {
                        user.setUserData(verifyResult.data.user, true);
                    } else {
                        // Force refresh user data
                        await hooks.useFetchUserData(true);
                    }
                    
                    // Hide the button after successful 2FA setup
                    this.update2FAButtonState(true);
                    
                    // Show success
                    components.showToast('success', '2FA Enabled', 'Two-factor authentication has been successfully enabled for your account.');
                    
                    // Close modal
                    const bsModal = bootstrap.Modal.getInstance(twoFAModal);
                    if (bsModal) bsModal.hide();
                    
                    // Reset form
                    twoFAForm.reset();
                } catch (error) {
                    console.error('2FA verification error:', error);
                    
                    // Show error
                    if (errorDiv) {
                        errorDiv.textContent = error.message || 'Verification failed. Please try again.';
                        errorDiv.classList.remove('d-none');
                    }
                } finally {
                    // Reset loading state
                    if (spinner) spinner.classList.add('d-none');
                    if (buttonText) buttonText.textContent = 'Verify and Enable 2FA';
                    if (submitBtn) submitBtn.disabled = false;
                }
            };
        } catch (error) {
            console.error('2FA setup error:', error);
            
            // Show error message clearly
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to generate QR code.';
                errorDiv.classList.remove('d-none');
            }
            
            // Update instruction text
            if (instructionText) {
                instructionText.textContent = 'There was a problem setting up 2FA. Please try again.';
            }
            
            // Reset form for retry
            if (spinner) spinner.classList.add('d-none');
            if (submitBtn) {
                submitBtn.disabled = false;
                if (buttonText) buttonText.textContent = 'Try Again';
            }
        }
    }
    
    // Helper method to update 2FA button text based on state
    update2FAButtonState(isEnabled) {
        const button = this.profile.twoFA || document.getElementById('setting2fa');
        if (button) {
            if (isEnabled) {
                // Hide the button when 2FA is enabled
                button.style.display = 'none';
            } else {
                // Show the button when 2FA is disabled
                button.style.display = 'block';
                button.innerHTML = '<i class="bi bi-shield-lock-fill me-2"></i>Enable Two-Factor Authentication';
                button.classList.remove('btn-danger');
                button.classList.add('btn-gold');
            }
        }
    }
}

// Create an instance when this module is imported
const forms = new Forms();

export default forms;
