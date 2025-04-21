import pages from './pages.js';
import components from './components.js';
import user from './user.js';
import store from './store.js';

class Router {
    constructor() {
        this.initialized = false;
    }

    init() {
        window.addEventListener('popstate', this.handleURL.bind(this));
        this.initNavigationEvents();
        this.initialized = true;
        this.handleURL(true);  
        
        return this;
    }
    // .bind(this) is crucial here because it ensures that when handleURL is called, 
    // the this keyword inside that function will still refer to your original object/class 
    // instance rather than the Window object that fired the event
    
    initNavigationEvents() {
        document.body.addEventListener('click', (e) => {
            if (e.target.id && e.target.id.startsWith('nav')) {
                e.preventDefault();
                const pageName = e.target.id.replace('nav', '').toLowerCase();
                if (pageName) {
                    this.navigateTo(pageName);
                }
                return;
            }
            
            // Special handling for profile link
            if (e.target.id === 'navProfile' || (e.target.closest('a') && e.target.closest('a').id === 'navProfile')) {
                e.preventDefault();
                console.log('Router: Profile link clicked directly');
                
                // Force immediate fetch of fresh user data from server before navigation
                this.forceFetchUserDataAndNavigate();
                return;
            }
            
            const pageElement = e.target.closest('[data-page]');
            if (pageElement) {
                e.preventDefault();
                this.navigateTo(pageElement.getAttribute('data-page'));
                return;
            }
            
            if (e.target.id === 'logo' || e.target.closest('#logo')) {
                e.preventDefault();
                this.navigateTo('home');
                return;
            }
            
            if (e.target.id === 'logoutBtn' || e.target.closest('[data-action="logout"]')) {
                e.preventDefault();
                // Call the user logout function
                user.logout();
                // Then navigate to home page
                this.navigateTo('home');
            }
        });
    }
    
    handleURL(isInitialCall = false) {
        if (!this.initialized && !isInitialCall) {
            console.warn("Router not initialized yet. Initializing now...");
            this.init();
            return;
        }

        if (!isInitialCall) 
            components.showSpinner();
        
        const path = window.location.pathname;
        let pageName = 'home';
        
        // Special handling for OAuth callback - don't try to handle it in the router
        if (path && path.includes('/oauth/callback')) {
            console.log('Router: Detected OAuth callback URL - not handling in router');
            if (!isInitialCall) components.hideSpinner();
            return 'oauth-callback';
        }
        
        if (path && path !== '/')
            pageName = path.split('/')[1] || '';
        
        
        const resolvedPage = pages.getPageName(pageName);
        
        // Update the store with current page
        store.setCurrentPage(resolvedPage);
        
        if (!pages.isLoaded()) {
            console.warn("Pages not fully loaded yet, showing spinner");
            return resolvedPage;
        }
        
        // Ensure user authentication state is refreshed and UI is updated
        this.checkAuthStateForPage(resolvedPage);
        
        pages.showPage(resolvedPage);
        
        if (!isInitialCall)
            components.hideSpinner();
        
        return resolvedPage;
    }
    
    checkAuthStateForPage(pageName) {
        // Always check authentication state when navigating to a new page
        const authStatus = user.getAuthStatus();
        
        // Refresh user data if authenticated (happens asynchronously)
        if (authStatus.isAuthenticated && store.shouldRefreshUserData()) {
            console.log('Router: Refreshing user data during navigation');
            user.refreshUserData(false); // Use non-forcing refresh during regular navigation
        }
        
        // Handle protected pages
        if (this.isProtectedPage(pageName) && !authStatus.isAuthenticated) {
            console.warn(`Page ${pageName} requires authentication. Redirecting to login...`);
            // Store the intended destination for post-login redirect
            localStorage.setItem('redirectAfterLogin', pageName);
            this.navigateTo('login');
            components.showToast('warning', 'Authentication Required', 'Please log in to access this page.');
            return false;
        }
        
        // Update UI to match authentication state
        user.updateUIAuthState();
        
        return true;
    }
    
    isProtectedPage(pageName) {
        // List of pages that require authentication
        const protectedPages = ['profile', 'settings', 'dashboard'];
        return protectedPages.includes(pageName.toLowerCase());
    }
    
    async navigateTo(pageName) {
        if (!this.initialized) {
            console.warn("Router not initialized yet. Initializing now...");
            this.init();
        }

        components.showSpinner();
        
        const resolvedPage = pages.getPageName(pageName);
        
        // Save previous page state if needed (for forms, etc.)
        this.saveCurrentPageState();
        
        // Special handling for profile page navigation
        if (resolvedPage === 'profile') {
            console.log('Router: Special handling for profile page navigation');
            
            // Check if user is authenticated
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                console.warn('Router: No auth token for profile page, redirecting to login');
                localStorage.setItem('redirectAfterLogin', 'profile');
                this.updateURL('login');
                if (pages.isLoaded()) {
                    pages.showPage('login');
                }
                components.hideSpinner();
                components.showToast('warning', 'Authentication Required', 'Please log in to access this page.');
                return;
            }
            
            try {
                // Only force fresh fetch if the data is stale
                if (store.shouldRefreshUserData()) {
                    // Force fetch fresh user data directly from server - don't rely on localStorage
                    console.log('Router: Forcefully fetching fresh user data for profile page');
                    await import('./hooks.js').then(async (hooksModule) => {
                        const hooks = hooksModule.default;
                        if (hooks && typeof hooks.useFetchUserData === 'function') {
                            const result = await hooks.useFetchUserData();
                            if (result.success) {
                                console.log('Router: Successfully fetched fresh user data for profile page');
                                
                                // Use the user's setUserData method which updates the store
                                user.setUserData(result.userData, true);
                            } else {
                                console.error('Router: Failed to fetch fresh user data for profile page');
                            }
                        }
                    });
                } else {
                    console.log('Router: Using cached user data from store for profile page');
                }
            } catch (error) {
                console.error('Router: Error fetching fresh user data:', error);
            }
        }
        
        // Continue with regular navigation
        if (!await this.checkAuthStateForPage(resolvedPage)) {
            // If authentication check fails, stop navigation to this page
            components.hideSpinner();
            return;
        }
        
        this.updateURL(pageName || 'home');
        
        // Update the store with current page
        store.setCurrentPage(resolvedPage);
        
        if (!pages.isLoaded()) {
            console.warn("Pages not fully loaded yet, showing spinner");
            return resolvedPage;
        }
        
        // Display the page
        pages.showPage(resolvedPage);
        
        // For profile page, also ensure forms.initProfilePage is called directly 
        // after the page is displayed
        if (resolvedPage === 'profile') {
            import('./forms.js').then(formsModule => {
                const forms = formsModule.default;
                if (forms && typeof forms.initProfilePage === 'function') {
                    console.log('Router: Directly calling forms.initProfilePage after navigation');
                    forms.initProfilePage();
                }
            }).catch(error => {
                console.error('Router: Error loading forms module after profile navigation:', error);
            });
        }
        
        components.hideSpinner();
        return resolvedPage;
    }
    
    updateURL(pageName) {
        let url = '/';
        if (pageName !== 'home')
            url = `/${pageName}`;
        
        history.pushState({ page: pageName }, document.title, url);
    }

    // Special method to force fetch user data from server and then navigate to profile
    async forceFetchUserDataAndNavigate() {
        components.showSpinner();
        console.log('Router: Force fetching fresh user data from server before profile navigation');
        
        try {
            // Check for auth token
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                console.warn('Router: No auth token found for profile navigation');
                localStorage.setItem('redirectAfterLogin', 'profile');
                this.navigateTo('login');
                components.hideSpinner();
                return;
            }
            
            // Make a direct fetch to the server API - not using hooks or other cached methods
            const response = await fetch('/api/users/me/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user data: ${response.status}`);
            }
            
            const userData = await response.json();
            console.log('Router: Successfully fetched fresh user data before profile navigation');
            
            // Save fresh data to localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Update user object with fresh data
            import('./user.js').then(userModule => {
                const user = userModule.default;
                if (user) {
                    if (typeof user.setUserData === 'function') {
                        user.setUserData(userData, true);
                    } else {
                        user.userData = userData;
                        user.isAuthenticated = true;
                        user.token = authToken;
                        user.updateUIAuthState();
                        user.updateUIUserData();
                    }
                }
            });
            
            // Now navigate to profile page with fresh data already loaded
            this.updateURL('profile');
            
            if (pages.isLoaded()) {
                pages.showPage('profile');
                
                // Also explicitly initialize the profile page with fresh data
                import('./forms.js').then(formsModule => {
                    const forms = formsModule.default;
                    if (forms && typeof forms.initProfilePage === 'function') {
                        console.log('Router: Directly calling forms.initProfilePage after navigation');
                        forms.initProfilePage();
                    }
                });
            }
            
        } catch (error) {
            console.error('Router: Error fetching fresh user data before profile navigation:', error);
            // Still try to navigate to profile - it will use localStorage as fallback
            this.updateURL('profile');
            if (pages.isLoaded()) {
                pages.showPage('profile');
            }
        } finally {
            components.hideSpinner();
        }
    }

    // New method to save state of the current page before navigation
    saveCurrentPageState() {
        const currentState = store.getState();
        const currentPage = currentState.currentPage;
        
        if (!currentPage) return;
        
        console.log(`Router: Saving state for page: ${currentPage}`);
        
        // Save form data for specific pages
        if (currentPage === 'profile') {
            this.saveProfileFormState();
        } else if (currentPage === 'game') {
            this.saveGameState();
        }
        // Add other page-specific state saving as needed
    }
    
    // Save profile form state
    saveProfileFormState() {
        try {
            const profileForm = document.getElementById('profileForm');
            if (profileForm) {
                const formData = new FormData(profileForm);
                const formDataObj = {};
                
                for (const [key, value] of formData.entries()) {
                    formDataObj[key] = value;
                }
                
                console.log('Router: Saving profile form state to store');
                store.saveFormData('profileForm', formDataObj);
            }
        } catch (error) {
            console.error('Router: Error saving profile form state:', error);
        }
    }
    
    // Save game state
    saveGameState() {
        try {
            // Get any game state from DOM or variables
            const gameState = {
                // Add game-specific state here
                timestamp: Date.now()
            };
            
            // Save to store
            store.setState({ gameState });
        } catch (error) {
            console.error('Router: Error saving game state:', error);
        }
    }
}

const router = new Router();

export default router;