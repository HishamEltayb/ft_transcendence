import hooks from './hooks.js';
import components from './components.js';
import user from './user.js';

class Forms {
    constructor() {
        this.login = {
            tab: document.getElementById('loginTab'),
            container: document.getElementById('loginFormContainer'),
            form: document.getElementById('loginForm'),
            submitBtn: document.getElementById('loginBtn'),
            login42Link: document.getElementById('login42Link')
        };
        
        this.register = {
            tab: document.getElementById('registerTab'),
            container: document.getElementById('registerFormContainer'),
            form: document.getElementById('registerForm'),
            submitBtn: document.getElementById('registerBtn')
        };
        
        this.profile = {
            form: document.getElementById('settingsForm'),
            displayName: document.getElementById('settingDisplayName'),
            email: document.getElementById('settingEmail'),
            password: document.getElementById('settingPassword'),
            confirmPassword: document.getElementById('settingConfirmPassword'),
            twoFA: document.getElementById('setting2fa'),
            submitBtn: document.getElementById('saveSettingsBtn'),
            avatar: document.getElementById('profileAvatar'),
            avatarUrl: document.getElementById('avatarUrl'),
            username: document.getElementById('profileUsername'),
            intraLogin: document.getElementById('profileIntraLogin'),
            editBtn: document.getElementById('editProfileBtn')
        };

        // Profile stats elements
        this.profileStats = {
            totalGames: document.getElementById('statsTotalGames'),
            wins: document.getElementById('statsWins'),
            losses: document.getElementById('statsLosses'),
            winRate: document.getElementById('statsWinRate'),
            rank: document.getElementById('statsRank')
        };
        
        // Match history table
        this.matchHistoryTable = document.getElementById('matchHistoryTable');
        
        this.isProfileInitializing = false;
        
        this.init();
    }

    init() {
        if (this.login.form) {
            this.login.form.addEventListener('submit', this.submitLoginForm.bind(this));
        } else {
            console.warn('Login form not found in the DOM');
        }
        
        // Update 42 login button handling
        if (this.login.login42Link) {
            console.log('Found 42 login button, attaching event handler');
            
            // Need to bind the function directly
            console.log('handleLogin42');
            this.login.login42Link.onclick = this.handleLogin42.bind(this);
            console.log('handleLogin42 22');
            console.log('42 login handler attached successfully');
        } else {
            console.warn('Login with 42 button not found in the DOM');
        }

        if (this.register.form) {
            this.register.form.addEventListener('submit', this.submitRegisterForm.bind(this));
        } else {
            console.warn('Register form not found in the DOM');
        }
        
        if (this.login.tab && this.register.tab) {
            this.login.tab.addEventListener('click', this.showLoginForm.bind(this));
            this.register.tab.addEventListener('click', this.showRegisterForm.bind(this));
        } else {
            console.warn('Login/register tabs not found in the DOM');
        }

        // Initialize profile form if present
        if (this.profile.form) {
            this.profile.form.addEventListener('submit', this.submitProfileForm.bind(this));
            this.initProfilePage();
        }

        // Add event listener for profile edit button
        if (this.profile.editBtn) {
            this.profile.editBtn.addEventListener('click', this.toggleProfileEditMode.bind(this));
        }
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
        
        try {
            // Get user data - first check store, then fetch if needed
            const storeState = store.getState();
            let userData = null;
            
            if (storeState.user && !store.shouldRefreshUserData()) {
                // Use cached data from store
                console.log('Forms: Using cached user data from store for profile page');
                userData = storeState.user;
                this.populateProfileForm(userData);
            } else {
                // Force fetch fresh user data
                console.log('Forms: Fetching fresh user data for profile page');
                const result = await hooks.useFetchUserData(true);
                
                if (result.success) {
                    userData = result.userData;
                    this.populateProfileForm(userData);
                } else {
                    console.error('Failed to fetch user data for profile:', result.error);
                    // Try using cached data as fallback
                    if (storeState.user) {
                        console.log('Forms: Using cached user data as fallback');
                        userData = storeState.user;
                        this.populateProfileForm(userData);
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
    
    populateProfileForm(userData) {
        
        // Set username
        if (this.profile.username) {
            this.profile.username.textContent = userData.username || 'Unknown User';
        }
        
        // Set intra login - show only the value without prefix
        if (this.profile.intraLogin) {
            this.profile.intraLogin.textContent = userData.intra_login || 'N/A';
        }
        
        // Handle avatar image and URL
        if (this.profile.avatar) {
            if (userData.profile_image) {
                // Set the avatar image source directly to what the backend returns
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
            
            // Add error handler for the image - if loading fails, keep the default avatar
            this.profile.avatar.onerror = function() {
                this.src = '../public/assets/images/default-avatar.png';
            };
        }
        
        // Set form fields
        if (this.profile.displayName) {
            this.profile.displayName.value = userData.display_name || userData.username || '';
        }
        
        if (this.profile.email) {
            this.profile.email.value = userData.email || '';
        }
        
        // Two-factor authentication
        if (this.profile.twoFA) {
            this.profile.twoFA.checked = userData.two_factor_enabled || false;
        }
    }
    
    // Populate profile statistics
    populateProfileStats(userData) {
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
    
    // Populate match history table
    populateMatchHistory(userData) {
        const matchHistory = userData.match_history || [];
        
        if (matchHistory.length === 0 || !this.matchHistoryTable) {
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
        
        // Get form values
        const displayName = this.profile.displayName ? this.profile.displayName.value : '';
        const email = this.profile.email ? this.profile.email.value : '';
        const password = this.profile.password ? this.profile.password.value : '';
        const confirmPassword = this.profile.confirmPassword ? this.profile.confirmPassword.value : '';
        const twoFA = this.profile.twoFA ? this.profile.twoFA.checked : false;
        
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
        
        // Create profile update data object
        const profileData = {
            display_name: displayName,
            email: email,
            two_factor_enabled: twoFA
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
        console.log('LOGIN 42 BUTTON CLICKED - HANDLER EXECUTED');
        
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Show loading message
        components.showToast('info', 'Connecting', 'Initializing 42 authentication...');
        
        try {
            console.log('Starting 42 OAuth process...');
            
            // Call the backend directly to get the auth URL - NOTE: adding trailing slash back
            const response = await fetch('/api/users/oauth/42/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('42 OAuth response status:', response.status);
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('42 OAuth error details:', text);
                    throw new Error('Failed to initiate 42 login: ' + text);
                });
            }
            
            const data = await response.json();
            console.log('42 OAuth successful, redirecting to:', data.auth_url);
            
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
}

// Create an instance when this module is imported
const forms = new Forms();

export default forms;
