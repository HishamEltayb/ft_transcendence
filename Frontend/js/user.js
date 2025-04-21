import hooks from './hooks.js';

class User {
    constructor() {
        this.token = null;
        this.userData = null;
        this.isAuthenticated = false;
        
        hooks.setUserInstance(this);
    }

    async init() {
        
        // Set up event listeners first
        this.setupEventListeners();
        
        // Special handling for OAuth callback page
        if (this.isOAuthCallbackPage()) {
            // Let the event listener handle the callback, just return
            return { success: true, message: 'OAuth callback page detected' };
        }
        
        // Check if we have an auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.isAuthenticated = false;
            this.updateUIAuthState(); // Update UI for unauthenticated state
            return { success: false, error: 'No auth token' };
        }
        
        // We have a token, consider the user authenticated initially
        this.token = token;
        this.isAuthenticated = true;
        
        // Try to load user data from localStorage
        try {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
                this.userData = JSON.parse(storedUserData);
                this.updateUIUserData(); // Update UI with cached data immediately
                
                // Check when the data was last updated
                const timestamp = localStorage.getItem('userDataTimestamp');
                const dataAge = timestamp ? Date.now() - parseInt(timestamp) : Infinity;
                
                // If data is too old (> 30 minutes), refresh it
                if (dataAge > 30 * 60 * 1000) {
                    await this.refreshUserData();
                } else {
                }
                
                // Update UI with up-to-date auth state
                this.updateUIAuthState();
                return { success: true, userData: this.userData };
            } else {
                // No cached data, fetch from server
                const result = await hooks.useFetchUserData();
                
                if (result.success) {
                    this.userData = result.userData;
                    this.updateUIAuthState();
                    this.updateUIUserData();
                    return { success: true, userData: this.userData };
                } else {
                    console.error('User: Failed to fetch user data:', result.error);
                    // Handle invalid token or other auth errors
                    if (result.error === 'Unauthorized' || result.error === 'Invalid token') {
                        this.logout();
                    }
                    return { success: false, error: result.error };
                }
            }
        } catch (error) {
            console.error('User: Error during initialization:', error);
            return { success: false, error: error.message };
        }
    }

    updateUIAuthState() {
        
        // Update UI elements based on authentication state
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const authType = element.dataset.auth;
            const display = window.getComputedStyle(element).getPropertyValue('display');
            const defaultDisplay = display === 'none' ? 'block' : display; // Use flex if it was flex
            
            if (authType === 'logged-in') {
                // Elements that should show when logged in
                if (this.isAuthenticated) {
                    // Check if element was originally a flex container
                    if (element.classList.contains('d-flex') || 
                        element.classList.contains('dropdown') || 
                        element.classList.contains('flex-row') || 
                        element.classList.contains('flex-column')) {
                        element.style.display = 'flex';
                    } else {
                        element.style.display = defaultDisplay;
                    }
                } else {
                    element.style.display = 'none';
                }
            } else if (authType === 'logged-out') {
                // Elements that should show when logged out
                if (this.isAuthenticated) {
                    element.style.display = 'none';
                } else {
                    // Check if element was originally a flex container
                    if (element.classList.contains('d-flex') || 
                        element.classList.contains('dropdown') || 
                        element.classList.contains('flex-row') || 
                        element.classList.contains('flex-column')) {
                        element.style.display = 'flex';
                    } else {
                        element.style.display = defaultDisplay;
                    }
                }
            }
        });
    }

    updateUIUserData() {
        if (!this.userData) {
            console.warn('No user data available for UI update');
            return;
        }
        
        
        // Update user-specific elements
        const userDataElements = document.querySelectorAll('[data-user]');
        userDataElements.forEach(element => {
            const dataField = element.dataset.user;
            if (dataField && this.userData[dataField]) {
                element.textContent = this.userData[dataField];
            }
        });
        
        // Update user avatar in header
        const headerAvatar = document.getElementById('headerUserAvatar');
        if (headerAvatar) {
            if (this.userData.profile_image) {
                headerAvatar.src = this.userData.profile_image;
            } else {
                // If no profile image, use default
                headerAvatar.src = '../public/assets/images/default-avatar.png';
            }
            
            // Add error handler for the image
            headerAvatar.onerror = function() {
                this.src = '../public/assets/images/default-avatar.png';
            };
        }
    }

    isOAuthCallbackPage() {
        return window.location.pathname.includes('/oauth/callback');
    }

    handleOAuthCallback() {
        const statusMsg = document.getElementById('statusMsg');
        const progressBar = document.getElementById('authProgress');

        this.startProgressAnimation(progressBar);
        this.processAuthentication(statusMsg);
    }

    startProgressAnimation(progressBar) {
        if (!progressBar) return;
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
            
            if (progress >= 100) {
                clearInterval(progressInterval);
            }
        }, 100);
    }

    processAuthentication(statusMsg) {
        const accessToken = this.getAccessToken();
        
        if (accessToken) {
            this.handleSuccessfulAuth(accessToken, statusMsg);
        } else {
            this.handleFailedAuth(statusMsg);
        }
    }

    getAccessToken() {
        let accessToken = this.getUrlParameter('access_token');
        
        // If not in search params, try the hash (some OAuth providers use this)
        if (!accessToken && window.location.hash) {
            const hashToken = window.location.hash.match(/access_token=([^&]*)/);
            if (hashToken) {
                accessToken = decodeURIComponent(hashToken[1]);
            }
        }
        
        return accessToken;
    }

    getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    async handleSuccessfulAuth(accessToken, statusMsg) {
        localStorage.setItem('authToken', accessToken);
        this.token = accessToken;
        this.isAuthenticated = true;
        
        if (statusMsg) {
            statusMsg.textContent = 'Login successful! Fetching your profile...';
            statusMsg.style.color = 'var(--gold)';
        }
        
        try {
            // Simply call the hook which will update this instance directly
            const result = await hooks.useFetchUserData(true); // Force refresh to get fresh data
            
            if (result.success) {
                this.userData = result.userData;
                // Ensure the userData is saved to localStorage
                localStorage.setItem('userData', JSON.stringify(this.userData));
                localStorage.setItem('userDataTimestamp', Date.now().toString());
                // Update UI with user data
                this.updateUIUserData();
            } else {
                console.error('User: Failed to fetch user data after authentication:', result.error);
            }
            
            if (statusMsg) {
                statusMsg.textContent = 'Profile loaded! Redirecting...';
            }
            
            // Check if there's a redirect after login
            const redirectPage = localStorage.getItem('redirectAfterLogin');
            
            setTimeout(() => {
                if (redirectPage) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = `/${redirectPage}`;
                } else {
                    window.location.href = '/';
                }
            }, 1000);

        } catch (error) {
            console.error('Error fetching user data:', error);
            
            // Still redirect even if profile fetch fails
            if (statusMsg) {
                statusMsg.textContent = 'Login successful! Redirecting...';
            }
            
            // Check if there's a redirect after login
            const redirectPage = localStorage.getItem('redirectAfterLogin');
            
            setTimeout(() => {
                if (redirectPage) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = `/${redirectPage}`;
                } else {
                    window.location.href = '/';
                }
            }, 2000);
        }
    }

    handleFailedAuth(statusMsg) {
        // No token found
        console.error('No access token found in URL');
        if (statusMsg) {
            statusMsg.textContent = 'Authentication failed. Redirecting to login...';
            statusMsg.style.color = '#e74c3c';
        }
        
        // Clear any existing auth data
        this.logout();
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }

    checkAuthentication() {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        
        if (token) {
            this.token = token;
            this.isAuthenticated = true;
            
            // Try to get user data from localStorage
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    this.userData = JSON.parse(userData);
                } catch (e) {
                    console.error('Error parsing user data from localStorage:', e);
                    // Clear the corrupted data
                    localStorage.removeItem('userData');
                }
            }
            
            return true;
        }
        
        this.isAuthenticated = false;
        this.token = null;
        this.userData = null;
        return false;
    }

    async refreshUserData(forceRefresh = false) {
        if (!this.isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const result = await hooks.useFetchUserData(forceRefresh);
            
            if (result.success) {
                this.userData = result.userData;
                
                // Save to localStorage for persistence
                localStorage.setItem('userData', JSON.stringify(this.userData));
                localStorage.setItem('userDataTimestamp', Date.now().toString());
                
                // Update UI with fresh user data
                this.updateUIUserData();
                return { success: true, userData: this.userData };
            } else {
                console.error('User: Failed to refresh user data:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('User: Error refreshing user data:', error);
            return { success: false, error };
        }
    }

    getUserData() {
        // If we don't have userData in memory but have a token, try to load from localStorage
        if (!this.userData && this.isAuthenticated) {
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    this.userData = JSON.parse(userData);
                } catch (e) {
                    console.error('Error parsing user data from localStorage in getUserData:', e);
                }
            }
        }
        return this.userData;
    }
    
    // Update user data
    setUserData(userData, updateUI = false) {
        this.userData = userData;
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userDataTimestamp', Date.now().toString());
        
        if (updateUI) {
            this.updateUIUserData();
        }
    }

    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            token: this.token,
            hasUserData: !!this.userData
        };
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userDataTimestamp');
        this.token = null;
        this.userData = null;
        this.isAuthenticated = false;
        
        // Update UI to reflect logged-out state
        this.updateUIUserData();
        
        // Redirect to home page
        window.location.href = '/';
    }

    // Setup event listeners for page load and visibility
    setupEventListeners() {
        if (this.isOAuthCallbackPage()) {
            document.addEventListener('DOMContentLoaded', () => {
                this.handleOAuthCallback();
            });
        } else {
            document.addEventListener('DOMContentLoaded', async () => {
                // Update UI elements based on auth status
                this.updateUIAuthState();
                
                if (this.isAuthenticated) {
                    try {
                        // Check if we need to refresh data
                        const storedTime = localStorage.getItem('userDataTimestamp');
                        const dataAge = storedTime ? (Date.now() - parseInt(storedTime)) : Infinity;
                        
                        if (dataAge > 5 * 60 * 1000) { // 5 minutes
                            await this.refreshUserData();
                        } else {
                            // Still update UI with user data we have
                            this.updateUIUserData();
                        }
                    } catch (error) {
                        console.error('Error fetching user data during initialization:', error);
                        // Try to recover using local data
                        if (this.userData) {
                            this.updateUIUserData();
                        }
                    }
                }
            });
        }

        // Add event listeners for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isAuthenticated) {
                // Check if we need to refresh data
                const storedTime = localStorage.getItem('userDataTimestamp');
                const dataAge = storedTime ? (Date.now() - parseInt(storedTime)) : Infinity;
                
                if (dataAge > 5 * 60 * 1000) { // 5 minutes
                    this.refreshUserData();
                }
            }
        });
    }
}

const user = new User();
user.init();

export default user;