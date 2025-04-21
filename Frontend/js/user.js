import hooks from './hooks.js';
import store from './store.js';
import components from './components.js';

/**
 * User class that handles user authentication and UI updates
 * Utilizes the store as the single source of truth for user data
 */
class User {
    constructor() {
        // Register this instance with hooks
        hooks.setUserInstance(this);
    }

    /**
     * Initialize user authentication state
     */
    async init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Special handling for OAuth callback page
        if (this.isOAuthCallbackPage()) {
            console.log('User: OAuth callback page detected');
            return { success: true, message: 'OAuth callback page detected' };
        }
        
        // Check if authenticated
        if (!store.hasAuthToken()) {
            this.updateUIAuthState(false);
            return { success: false, error: 'No auth token' };
        }
        
        // We have a token, try to get user data
        try {
            let userData = store.getUserData();
            
            if (userData) {
                // We have cached user data, update UI immediately
                this.updateUIUserData(userData);
                
                // Check if we need to refresh from server
                if (store.shouldRefreshUserData()) {
                    console.log('User: Refreshing user data from server');
                    await this.refreshUserData(true);
                }
            } else {
                // No cached data, fetch from server
                console.log('User: No cached user data, fetching from server');
                const result = await this.fetchUserData();
                
                if (!result.success) {
                    // Failed to get user data, consider not authenticated
                    this.logout();
                    return { success: false, error: result.error };
                }
            }
            
            // Update UI auth state
            this.updateUIAuthState(true);
            return { success: true, userData: store.getUserData() };
        } catch (error) {
            console.error('User: Error during initialization:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update UI elements based on authentication state
     */
    updateUIAuthState(isAuthenticated = null) {
        // If not explicitly provided, get from store
        if (isAuthenticated === null) {
            isAuthenticated = store.isAuthenticated();
        }
        
        console.log('User: Updating UI auth state, authenticated =', isAuthenticated);
        
        try {
            // Update UI elements with data-auth attributes
            const authElements = document.querySelectorAll('[data-auth]');
            console.log(`User: Found ${authElements.length} elements with data-auth attribute`);
            
            authElements.forEach(element => {
                const authType = element.dataset.auth;
                const display = window.getComputedStyle(element).getPropertyValue('display');
                const defaultDisplay = display === 'none' ? 'block' : display;
                
                if (authType === 'logged-in') {
                    // Elements that should show when logged in
                    if (isAuthenticated) {
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
                    if (isAuthenticated) {
                        element.style.display = 'none';
                    } else {
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
            
            // Handle elements with auth-hide class (hide when authenticated)
            const authHideElements = document.querySelectorAll('.auth-hide');
            authHideElements.forEach(element => {
                if (isAuthenticated) {
                    element.style.display = 'none';
                } else {
                    const display = window.getComputedStyle(element).getPropertyValue('display');
                    const defaultDisplay = display === 'none' ? 'block' : display;
                    
                    if (element.classList.contains('d-flex') || 
                        element.classList.contains('dropdown') || 
                        element.classList.contains('flex-row') || 
                        element.classList.contains('flex-column')) {
                        element.style.display = 'flex';
                    } else {
                        element.style.display = defaultDisplay;
                    }
                }
            });
        } catch (error) {
            console.error('User: Error updating UI auth state:', error);
        }
    }

    /**
     * Update UI elements with user data
     */
    updateUIUserData(userData = null) {
        // If not provided, get from store
        if (!userData) {
            userData = store.getUserData();
        }
        
        if (!userData) {
            console.warn('User: No user data available for UI update');
            return;
        }
        
        console.log('User: Updating UI with user data');
        
        // Update elements with data-user attributes
        const userDataElements = document.querySelectorAll('[data-user]');
        userDataElements.forEach(element => {
            const dataField = element.dataset.user;
            if (dataField && userData[dataField]) {
                element.textContent = userData[dataField];
            }
        });
        
        // Update header avatar
        const headerAvatar = document.getElementById('headerUserAvatar');
        if (headerAvatar) {
            if (userData.profile_image) {
                headerAvatar.src = userData.profile_image;
            } else {
                headerAvatar.src = '../public/assets/images/default-avatar.png';
            }
            
            headerAvatar.onerror = function() {
                this.src = '../public/assets/images/default-avatar.png';
            };
        }
    }

    /**
     * Check if current page is OAuth callback
     */
    isOAuthCallbackPage() {
        return window.location.pathname.includes('/oauth/callback');
    }

    /**
     * Handle OAuth callback
     */
    handleOAuthCallback() {
        const statusMsg = document.getElementById('statusMsg');
        const progressBar = document.getElementById('authProgress');

        if (progressBar) {
            this.startProgressAnimation(progressBar);
        }
        
        this.processAuthentication(statusMsg);
    }

    /**
     * Start progress animation for OAuth process
     */
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

    /**
     * Process authentication after OAuth callback
     */
    processAuthentication(statusMsg) {
        const accessToken = this.getAccessToken();
        
        if (accessToken) {
            this.handleSuccessfulAuth(accessToken, statusMsg);
        } else {
            this.handleFailedAuth(statusMsg);
        }
    }

    /**
     * Extract access token from URL
     */
    getAccessToken() {
        let accessToken = this.getUrlParameter('access_token');
        
        // If not in search params, try the hash
        if (!accessToken && window.location.hash) {
            const hashToken = window.location.hash.match(/access_token=([^&]*)/);
            if (hashToken) {
                accessToken = decodeURIComponent(hashToken[1]);
            }
        }
        
        return accessToken;
    }

    /**
     * Get URL parameter by name
     */
    getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    /**
     * Handle successful authentication
     */
    async handleSuccessfulAuth(accessToken, statusMsg) {
        // Store the token using the store
        store.setAuthToken(accessToken);
        
        if (statusMsg) {
            statusMsg.textContent = 'Login successful! Fetching your profile...';
            statusMsg.style.color = 'var(--gold)';
        }
        
        try {
            // Fetch user data
            const result = await this.fetchUserData(true);
            
            if (result.success) {
                if (statusMsg) {
                    statusMsg.textContent = 'Profile loaded! Redirecting...';
                }
                
                // Handle redirect after login
                const redirectPage = store.getRedirectAfterLogin();
                
                setTimeout(() => {
                    if (redirectPage) {
                        store.clearRedirectAfterLogin();
                        window.location.href = `/${redirectPage}`;
                    } else {
                        window.location.href = '/';
                    }
                }, 1000);
            } else {
                throw new Error(result.error || 'Failed to fetch user data');
            }
        } catch (error) {
            console.error('User: Error during authentication:', error);
            
            // Still redirect even if profile fetch fails
            if (statusMsg) {
                statusMsg.textContent = 'Login successful, but profile fetch failed. Redirecting...';
            }
            
            const redirectPage = store.getRedirectAfterLogin();
            
            setTimeout(() => {
                if (redirectPage) {
                    store.clearRedirectAfterLogin();
                    window.location.href = `/${redirectPage}`;
                } else {
                    window.location.href = '/';
                }
            }, 2000);
        }
    }

    /**
     * Handle failed authentication
     */
    handleFailedAuth(statusMsg) {
        console.error('User: No access token found in URL');
        
        if (statusMsg) {
            statusMsg.textContent = 'Authentication failed. Redirecting to login...';
            statusMsg.style.color = '#e74c3c';
        }
        
        // Clear auth data
        this.logout();
        
        // Redirect to home
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }

    /**
     * Fetch user data from the server
     */
    async fetchUserData(forceRefresh = false) {
        try {
            const result = await hooks.useFetchUserData(forceRefresh);
            
            if (result.success) {
                // Update store
                store.setUserData(result.userData, true);
                
                // Update UI
                this.updateUIUserData(result.userData);
                this.updateUIAuthState(true);
                
                return { success: true, userData: result.userData };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('User: Error fetching user data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Refresh user data
     */
    async refreshUserData(forceRefresh = false) {
        return this.fetchUserData(forceRefresh);
    }

    /**
     * Set user data and update UI
     */
    setUserData(userData, updateUI = false) {
        store.setUserData(userData, true);
        
        if (updateUI) {
            this.updateUIUserData(userData);
            this.updateUIAuthState(true);
        }
    }

    /**
     * Get authentication status
     */
    getAuthStatus() {
        const userData = store.getUserData();
        return {
            isAuthenticated: store.isAuthenticated(),
            token: store.getAuthToken(),
            hasUserData: !!userData
        };
    }

    /**
     * Logout the user
     */
    logout() {
        // Clear local storage and store state
        store.clearUserData();
        
        // Update UI
        this.updateUIAuthState(false);
        
        // Redirect to home page
        window.location.href = '/';
    }

    /**
     * Get user data from store
     */
    getUserData() {
        return store.getUserData();
    }

    /**
     * Check if the current user has 2FA enabled
     * @returns {boolean} True if 2FA is enabled, false otherwise
     */
    is2FAEnabled() {
        const userData = this.getUserData();
        return userData && userData.is_two_factor_enabled === true;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle OAuth callback
        if (this.isOAuthCallbackPage()) {
            document.addEventListener('DOMContentLoaded', () => {
                this.handleOAuthCallback();
            });
        }
        
        // Update UI when page loads
        document.addEventListener('DOMContentLoaded', async () => {
            this.updateUIAuthState();
            
            if (store.isAuthenticated()) {
                if (store.shouldRefreshUserData()) {
                    await this.refreshUserData();
                } else {
                    this.updateUIUserData();
                }
            }
        });
        
        // Listen for navigation completion
        document.addEventListener('navigationComplete', (e) => {
            console.log('User: Navigation complete event detected, updating auth UI');
            this.updateUIAuthState();
        });
        
        // Refresh user data when page becomes visible after being hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && store.isAuthenticated()) {
                if (store.shouldRefreshUserData()) {
                    this.refreshUserData();
                }
            }
        });
        
        // Listen for store changes that might affect UI
        window.addEventListener('appStateChanged', () => {
            this.updateUIAuthState();
            this.updateUIUserData();
        });
    }
}

// Create a singleton instance
const user = new User();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    user.init();
});

export default user;