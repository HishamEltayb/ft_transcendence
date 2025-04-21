class Store {
    constructor() {
        this.state = this.loadState() || {
            currentPage: null,
            user: null,
            formData: {},
            userDataTimestamp: null,
            gameState: null,
            lastUpdate: Date.now()
        };

        window.addEventListener('beforeunload', () => this.saveState());
        
        // Debug log
        console.log('Store initialized with state:', this.getState());
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                return JSON.parse(savedState);
            }
            return null;
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
            return null;
        }
    }
    
    /**
     * Saves current state to localStorage
     */
    saveState() {
        try {
            this.state.lastUpdate = Date.now();
            localStorage.setItem('appState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving state to localStorage:', error);
        }
    }

    // USER DATA METHODS
    
    /**
     * Sets user data and persists to localStorage
     * @param {Object} userData - User data to store
     * @param {Boolean} persist - Whether to persist to localStorage immediately
     */
    setUserData(userData, persist = true) {
        this.state.user = userData;
        this.state.userDataTimestamp = Date.now();
        
        if (persist) {
            // Store in localStorage for redundancy
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('userDataTimestamp', Date.now().toString());
            this.saveState();
        }
    }

    /**
     * Get user data from store
     */
    getUserData() {
        return this.state.user;
    }

    /**
     * Check if authentication token exists
     */
    hasAuthToken() {
        return !!localStorage.getItem('authToken');
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Set authentication token
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.hasAuthToken() && !!this.state.user;
    }

    /**
     * Check if user data should be refreshed (older than 5 minutes)
     */
    shouldRefreshUserData() {
        if (!this.state.userDataTimestamp) return true;
        
        const dataAge = Date.now() - this.state.userDataTimestamp;
        return dataAge > 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Clear user data (logout)
     */
    clearUserData() {
        // First clear state properties
        this.state.user = null;
        this.state.userDataTimestamp = null;
        
        // Remove all relevant items from localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userDataTimestamp');
        localStorage.removeItem('appState');
        localStorage.removeItem('redirectAfterLogin');
        
        // Do not call this.saveState() here as it would save the state back to localStorage
    }

    // NAVIGATION METHODS
    
    /**
     * Set current page
     */
    setCurrentPage(pageName) {
        this.state.currentPage = pageName;
        this.saveState();
    }

    /**
     * Get current page
     */
    getCurrentPage() {
        return this.state.currentPage;
    }

    /**
     * Set redirect page after login
     */
    setRedirectAfterLogin(pageName) {
        localStorage.setItem('redirectAfterLogin', pageName);
    }

    /**
     * Get redirect page after login
     */
    getRedirectAfterLogin() {
        return localStorage.getItem('redirectAfterLogin');
    }

    /**
     * Clear redirect after login
     */
    clearRedirectAfterLogin() {
        localStorage.removeItem('redirectAfterLogin');
    }

    // FORM DATA METHODS
    
    /**
     * Save form data to maintain state between navigations
     */
    saveFormData(formId, data) {
        this.state.formData[formId] = {
            ...data,
            timestamp: Date.now()
        };
        this.saveState();
    }

    /**
     * Get form data for a specific form
     */
    getFormData(formId) {
        return this.state.formData[formId] || null;
    }

    /**
     * Clear form data for a specific form
     */
    clearFormData(formId) {
        if (this.state.formData[formId]) {
            delete this.state.formData[formId];
            this.saveState();
        }
    }

    /**
     * Clear all form data
     */
    clearAllFormData() {
        this.state.formData = {};
        this.saveState();
    }

    // GAME STATE METHODS
    
    /**
     * Save game state
     */
    saveGameState(state) {
        this.state.gameState = {
            ...state,
            timestamp: Date.now()
        };
        this.saveState();
    }

    /**
     * Get game state
     */
    getGameState() {
        return this.state.gameState;
    }

    /**
     * Clear game state
     */
    clearGameState() {
        this.state.gameState = null;
        this.saveState();
    }

    // GENERAL STATE METHODS
    
    /**
     * Get the entire state object (immutable copy)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Clear the entire store 
     */
    clearAll() {
        this.state = {
            currentPage: null,
            user: null,
            formData: {},
            userDataTimestamp: null,
            gameState: null,
            lastUpdate: Date.now()
        };
        
        // Clear localStorage as well
        localStorage.removeItem('appState');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userDataTimestamp');
    }
}

// Create a singleton instance
const store = new Store();

export default store; 