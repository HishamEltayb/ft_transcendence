import pages from './pages.js';
import components from './components.js';
import user from './user.js';
import store from './store.js';
import forms from './forms.js';

class Router {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized)
            return this;
        
        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', this.handleURL.bind(this));
        
        // Initialize navigation event listeners
        this.initNavigationEvents();
        
        // Mark as initialized
        this.initialized = true;
        
        // Handle initial URL
        this.handleURL(true);
        
        // Debug
        console.log('Router: Initialized');
        
        return this;
    }
    
    /**
     * Initialize navigation event listeners
     */
    initNavigationEvents() {
        document.body.addEventListener('click', (e) => {
            // Handle nav button clicks
            if (e.target.id && e.target.id.startsWith('nav')) {
                e.preventDefault();
                const pageName = e.target.id.replace('nav', '').toLowerCase();
                if (pageName) {
                    this.navigateTo(pageName);
                }
                return;
            }
            
            // Handle data-page attributes
            const pageElement = e.target.closest('[data-page]');
            if (pageElement) {
                e.preventDefault();
                this.navigateTo(pageElement.getAttribute('data-page'));
                return;
            }
            
            // Handle logo clicks
            if (e.target.id === 'logo' || e.target.closest('#logo')) {
                e.preventDefault();
                this.navigateTo('home');
                return;
            }
            
            // Handle logout button clicks
            if (e.target.id === 'logoutBtn' || e.target.closest('[data-action="logout"]')) {
                e.preventDefault();
                // Call user logout function
                user.logout();
            }
        });
    }
    
    /**
     * Handle URL changes and navigate to appropriate page
     */
    handleURL(isInitialCall = false) {
        if (!this.initialized && !isInitialCall) {
            console.warn("Router: Not initialized yet. Initializing now...");
            this.init();
            return;
        }

        if (!isInitialCall) {
            components.showSpinner();
        }
        
        // Get page from URL
        const path = window.location.pathname;
        let pageName = 'home';
        
        // Special handling for OAuth callback
        if (path && path.includes('/oauth/callback')) {
            console.log('Router: Detected OAuth callback URL');
            if (!isInitialCall) components.hideSpinner();
            return 'oauth-callback';
        }
        
        if (path && path !== '/') {
            pageName = path.split('/')[1] || '';
        }
        
        // Resolve to valid page name
        const resolvedPage = pages.getPageName(pageName);
        
        // Update store with current page
        store.setCurrentPage(resolvedPage);
        
        // Wait for pages to load if needed
        if (!pages.isLoaded()) {
            console.warn("Router: Pages not fully loaded yet, showing spinner");
            return resolvedPage;
        }
        
        // Check authentication state for protected pages
        const authCheck = this.checkAuthStateForPage(resolvedPage);
        if (authCheck !== true) {
            if (!isInitialCall) components.hideSpinner();
            return authCheck;
        }
        
        // Show the page
        pages.showPage(resolvedPage);
        
        // Apply auth state to newly loaded page content
        user.updateUIAuthState();
        
        if (!isInitialCall) {
            components.hideSpinner();
        }
        
        return resolvedPage;
    }
    
    /**
     * Check if user is authorized to access the page
     * @returns {Boolean|String} True if authorized, or the page to redirect to
     */
    checkAuthStateForPage(pageName) {
        // Check if user data refresh is needed
        if (store.isAuthenticated() && store.shouldRefreshUserData()) {
            console.log('Router: Refreshing user data during navigation');
            user.refreshUserData(false);
        }
        
        user.updateUIAuthState();
        
        return true;
    }
    

    /**
     * Navigate to a specific page
     */
    async navigateTo(pageName, saveState = true) {
        if (!this.initialized) {
            console.warn("Router: Not initialized yet. Initializing now...");
            this.init();
        }

        components.showSpinner();
        
        // Resolve to valid page name
        const resolvedPage = pages.getPageName(pageName);
        
        // Update store
        store.setCurrentPage(resolvedPage);
        
        // Save current page state if needed
        if (saveState) {
            this.saveCurrentPageState();
        }
        
        // Check auth state
        const authCheck = this.checkAuthStateForPage(resolvedPage);
        if (authCheck !== true) {
            components.hideSpinner();
            return authCheck;
        }
        
        // Show the page
        pages.showPage(resolvedPage);
        
        // Apply auth state to newly loaded page content
        user.updateUIAuthState();
        
        // Special handling for specific pages
        if (resolvedPage === 'login') {
            console.log('Router: Loading login page, initializing login/register tabs...');
            // Small delay to ensure DOM is fully loaded
            setTimeout(() => {
                // Reapply auth state for any elements added by initialization
                user.updateUIAuthState();
                
                if (typeof forms !== 'undefined') {
                    // Reinitialize login/register forms
                    forms.initLoginRegisterForms();
                    
                    // Access tab elements directly
                    const loginTab = document.getElementById('loginTab');
                    const registerTab = document.getElementById('registerTab');
                    
                    if (loginTab && registerTab) {
                        // Set up click events again
                        loginTab.addEventListener('click', forms.showLoginForm.bind(forms));
                        registerTab.addEventListener('click', forms.showRegisterForm.bind(forms));
                        
                        // Default to showing login form
                        forms.showLoginForm();
                        console.log('Router: Login/register tabs initialized');
                    } else {
                        console.warn('Router: Login/register tabs not found');
                    }
                } else {
                    console.warn('Router: forms.js not loaded');
                }
            }, 100);
        }
        
        // Update URL
        this.updateURL(resolvedPage);
        
        // Dispatch a navigation complete event that can be used to ensure auth state is updated
        document.dispatchEvent(new CustomEvent('navigationComplete', { 
            detail: { pageName: resolvedPage } 
        }));
        
        components.hideSpinner();
        
        return resolvedPage;
    }
    
    /**
     * Update browser URL without reloading page
     */
    updateURL(pageName) {
        let url = '/';
        if (pageName !== 'home') {
            url = `/${pageName}`;
        }
        
        history.pushState({ page: pageName }, document.title, url);
    }

    /**
     * Save state of the current page before navigation
     */
    saveCurrentPageState() {
        const currentPage = store.getCurrentPage();
        
        if (!currentPage) return;
        
        console.log(`Router: Saving state for page: ${currentPage}`);
        
        // Save form data for specific pages
        if (currentPage === 'game') {
            this.saveGameState();
        }
        
        // Save overall state
        store.saveState();
    }
    
    /**
     * Save game state
     */
    saveGameState() {
        try {
            // Get game state from DOM or variables
            const gameState = {
                // Add game-specific state 
                timestamp: Date.now()
            };
            
            // Save to store
            store.saveGameState(gameState);
        } catch (error) {
            console.error('Router: Error saving game state:', error);
        }
    }
}

// Create singleton instance
const router = new Router();

export default router;