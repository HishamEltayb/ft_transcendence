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
            console.log('Forms: On login page, initializing login/register tabs');
            
            // Set up login/register tabs
            const loginTab = document.getElementById('loginTab');
            const registerTab = document.getElementById('registerTab');
            
            if (loginTab && registerTab) {
                // Default to showing login form
                this.showLoginForm();
                
                // Add explicit console logs for debugging
                console.log('Forms: Login page tabs found and initialized');
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
        console.log('Forms: Switching to login tab');
        
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
        
        console.log('Forms: Successfully switched to login tab');
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
        
        console.log('Forms: Successfully switched to register tab');
    }

    async initProfilePage() {
        // Check if we're already initializing or initialized
        if (this.isProfileInitializing) {
            console.log('Forms: Profile initialization already in progress, skipping');
            return;
        }
        
        // Set flag to prevent multiple simultaneous initializations
        this.isProfileInitializing = true;
        
        console.log('Forms: Initializing profile page');
        
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
                console.log('Forms: Using cached user data from store for profile page');
                userData = storeState.user;
                this.populateAccountSettings(userData);
                this.populatePlayerStatistics(userData);
                this.populateMatchHistory(userData);
            } else {
                // Force fetch fresh user data
                console.log('Forms: Fetching fresh user data for profile page');
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
                        console.log('Forms: Using cached user data as fallback');
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
                console.log('Forms: Restoring saved profile form changes');
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
        console.log('Forms: Refreshing profile DOM element references');
        
        // Check if needed elements exist in the DOM
        const settingsForm = document.getElementById('settingsForm');
        const displayNameInput = document.getElementById('settingDisplayName');
        const emailInput = document.getElementById('settingEmail');
        const passwordInput = document.getElementById('settingPassword');
        const confirmPasswordInput = document.getElementById('settingConfirmPassword');
        const twoFACheckbox = document.getElementById('setting2fa');
        const saveBtn = document.getElementById('saveSettingsBtn');
        
        // Log what we found
        console.log('Forms: DOM elements found:', {
            settingsForm: settingsForm ? 'Yes' : 'No',
            displayNameInput: displayNameInput ? 'Yes' : 'No',
            emailInput: emailInput ? 'Yes' : 'No',
            passwordInput: passwordInput ? 'Yes' : 'No',
            confirmPasswordInput: confirmPasswordInput ? 'Yes' : 'No',
            twoFACheckbox: twoFACheckbox ? 'Yes' : 'No',
            saveBtn: saveBtn ? 'Yes' : 'No'
        });
        
        // Update profile form elements
        this.profile = {
            form: settingsForm,
            displayName: displayNameInput,
            email: emailInput,
            password: passwordInput,
            confirmPassword: confirmPasswordInput,
            twoFA: twoFACheckbox,
            submitBtn: saveBtn,
            avatar: document.getElementById('profileAvatar'),
            avatarUrl: document.getElementById('avatarUrl'),
            username: document.getElementById('profileUsername'),
            intraLogin: document.getElementById('profileIntraLogin'),
            editBtn: document.getElementById('editProfileBtn')
        };
        
        // Update profile stats elements
        this.profileStats = {
            totalGames: document.getElementById('statsTotalGames'),
            wins: document.getElementById('statsWins'),
            losses: document.getElementById('statsLosses'),
            winRate: document.getElementById('statsWinRate'),
            rank: document.getElementById('statsRank')
        };
        
        // Update match history table
        this.matchHistoryTable = document.getElementById('matchHistoryTable');
        
        // Add listeners for form and edit button
        if (this.profile.form) {
            // Remove any existing listeners to avoid duplicates
            const newForm = this.profile.form.cloneNode(true);
            this.profile.form.parentNode.replaceChild(newForm, this.profile.form);
            this.profile.form = newForm;
            
            // Get updated references to form elements after the clone
            this.profile.displayName = this.profile.form.querySelector('#settingDisplayName');
            this.profile.email = this.profile.form.querySelector('#settingEmail');
            this.profile.password = this.profile.form.querySelector('#settingPassword');
            this.profile.confirmPassword = this.profile.form.querySelector('#settingConfirmPassword');
            this.profile.twoFA = this.profile.form.querySelector('#setting2fa');
            this.profile.submitBtn = this.profile.form.querySelector('#saveSettingsBtn');
            
            // Add submit listener
            this.profile.form.addEventListener('submit', this.submitProfileForm.bind(this));
        }
        
        if (this.profile.editBtn) {
            // Remove any existing listeners to avoid duplicates
            const newEditBtn = this.profile.editBtn.cloneNode(true);
            this.profile.editBtn.parentNode.replaceChild(newEditBtn, this.profile.editBtn);
            this.profile.editBtn = newEditBtn;
            
            // Add click listener
            this.profile.editBtn.addEventListener('click', this.toggleProfileEditMode.bind(this));
        }
    }
    
  
    // Populate player statistics
    populatePlayerStatistics(userData) {
        console.log('Forms: Populating profile stats with data:', userData);
        
        if (!userData || !this.profileStats) {
            console.warn('Forms: Cannot populate profile stats - missing data or elements');
            return;
        }
        
        // Debug element finding
        console.log('Forms: Stats elements:',
            this.profileStats.totalGames ? 'totalGames found' : 'totalGames missing',
            this.profileStats.wins ? 'wins found' : 'wins missing',
            this.profileStats.losses ? 'losses found' : 'losses missing',
            this.profileStats.winRate ? 'winRate found' : 'winRate missing',
            this.profileStats.rank ? 'rank found' : 'rank missing'
        );
        
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
        console.log('Forms: ACCOUNT SETTINGS DATA:', JSON.stringify(userData, null, 2));
        
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
            console.error('Forms: Two-Factor checkbox not found');
        }
        
        // Debugging element IDs
        console.log('Forms: Looking for form elements with IDs:', 
            'settingDisplayName,', 
            'settingEmail,', 
            'settingPassword,',
            'settingConfirmPassword,',
            'setting2fa'
        );
        
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
            const twoFAInput = this.profile.twoFA || document.getElementById('setting2fa');
            
            // Set display name/username
            if (displayNameInput) {
                console.log('Forms: Setting display name to:', userData.username || '');
                displayNameInput.value = userData.username || '';
            }
            
            // Set email
            if (emailInput) {
                console.log('Forms: Setting email to:', userData.email || '');
                emailInput.value = userData.email || '';
            }
            
            // Password fields should be empty for security
            if (passwordInput) {
                passwordInput.value = '';
            }
            
            if (confirmPasswordInput) {
                confirmPasswordInput.value = '';
            }
            
            // Two-factor authentication
            if (twoFAInput) {
                console.log('Forms: Setting 2FA checkbox to:', userData.is_two_factor_enabled ? 'checked' : 'unchecked');
                twoFAInput.checked = userData.is_two_factor_enabled === true;
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
        
        console.log('Forms: Profile form submission started');
        
        // Get form values - try both our object references and direct getElementById
        const displayName = (this.profile.displayName ? this.profile.displayName.value : '') || 
                            (document.getElementById('settingDisplayName') ? document.getElementById('settingDisplayName').value : '');
        
        const email = (this.profile.email ? this.profile.email.value : '') || 
                     (document.getElementById('settingEmail') ? document.getElementById('settingEmail').value : '');
        
        const password = (this.profile.password ? this.profile.password.value : '') || 
                        (document.getElementById('settingPassword') ? document.getElementById('settingPassword').value : '');
        
        const confirmPassword = (this.profile.confirmPassword ? this.profile.confirmPassword.value : '') || 
                               (document.getElementById('settingConfirmPassword') ? document.getElementById('settingConfirmPassword').value : '');
        
        const twoFA = (this.profile.twoFA ? this.profile.twoFA.checked : false) || 
                     (document.getElementById('setting2fa') ? document.getElementById('setting2fa').checked : false);
        
        console.log('Forms: Form values collected:', {
            displayName, 
            email, 
            passwordProvided: password ? 'Yes' : 'No',
            twoFA
        });
        
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
        
        console.log('Forms: Sending profile data:', JSON.stringify(profileData, null, 2));
        
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
            event.stopPropagation();
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
}

// Create an instance when this module is imported
const forms = new Forms();

export default forms;
