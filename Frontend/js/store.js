/**
 * Application store for maintaining state across page loads
 * Used for caching data, storing form data, and tracking page navigation
 */

class Store {
    constructor() {
        this.state = {
            currentPage: null,
            user: null,
            formData: {},
            userDataTimestamp: null,
            gameState: null
        };
    }

    // User data management
    setUserData(userData) {
        this.state.user = userData;
        this.state.userDataTimestamp = Date.now();
    }

    getUserData() {
        return this.state.user;
    }

    // Check if user data should be refreshed (older than 5 minutes)
    shouldRefreshUserData() {
        if (!this.state.userDataTimestamp) return true;
        
        const dataAge = Date.now() - this.state.userDataTimestamp;
        return dataAge > 5 * 60 * 1000; // 5 minutes
    }

    // Page navigation
    setCurrentPage(pageName) {
        this.state.currentPage = pageName;
    }

    getCurrentPage() {
        return this.state.currentPage;
    }

    // Form data persistence
    saveFormData(formId, data) {
        this.state.formData[formId] = {
            ...data,
            timestamp: Date.now()
        };
    }

    getFormData(formId) {
        return this.state.formData[formId] || null;
    }

    clearFormData(formId) {
        if (this.state.formData[formId]) {
            delete this.state.formData[formId];
        }
    }

    clearAllFormData() {
        this.state.formData = {};
    }

    // Game state management
    saveGameState(state) {
        this.state.gameState = {
            ...state,
            timestamp: Date.now()
        };
    }

    getGameState() {
        return this.state.gameState;
    }

    clearGameState() {
        this.state.gameState = null;
    }

    // Get the entire state
    getState() {
        return { ...this.state };
    }

    // Clear the entire store
    clearAll() {
        this.state = {
            currentPage: null,
            user: null,
            formData: {},
            userDataTimestamp: null,
            gameState: null
        };
    }
}

const store = new Store();

export default store; 