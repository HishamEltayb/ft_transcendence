// app.js - Main application entry point
import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import api from './api.js';
import forms from './forms.js';
// import constants from './constants.js';
import docHandler from './document.js';
import utils from './utils.js';

class App {
    constructor() {
        this.appContainer = null;
        this.initialized = false;
        
        // Application state that persists across all routes
        this.state = {
            user: null,
            user: false,
            currentPage: null,
            gameSettings: {},
            // Add more state properties as needed
        };
        
        console.log('App: Created instance');
    }
    
    async init() {
        console.log("App: Initializing...");
        
        // Get the main application container using docHandler
        this.appContainer = docHandler.getAppContainer();
        
        if (!this.appContainer) {
            console.error("App: Container not found!");
            return false;
        }
        
        try {
            // Clear the app container
            this.resetAppContainer();
            
            // Initialize components
            components.init(this.appContainer);
            await components.loadAllComponents();
            
            // Show loading spinner
            components.showSpinner();
            
            // Initialize pages
            pages.init(this.appContainer);
            await pages.loadAllPages();
            
            // Append footer
            components.appendFooter();
            
            // Register routes
            this.registerRoutes();
            
            // Initialize router
            console.log("App: Initializing router...");
            router.init();
            
            this.initialized = true;
            
            // Check authentication state from cookie or localStorage
            console.log("App: Checking initial authentication state...");
            
            await this.checkAuthState();
            
            // Initialize logout button listener AFTER authentication check
            this.initLogoutButton();
            
            components.hideSpinner();
            
            // Dispatch an event to notify other components
            document.dispatchEvent(new CustomEvent('appInitialized', {
                detail: { app: this }
            }));
            
            console.log("App: Initialization complete");
            return true;
        } catch (error) {
            console.error("App: Failed to initialize application:", error);
            components.hideSpinner();
            components.showToast(
                'error',
                'Application Error',
                'There was a problem loading the application. Please refresh the page.',
                5000
            );
            return false;
        }
    }
    
    registerRoutes() {
        router.registerRoutes({
            // Home page route
            '/': () => {
                this.state.currentPage = 'home';
                pages.showPage('home');
                this.updateUIAuthState();
                console.log(`App: Displayed page: home`);
            },
            
            '/home': () => {
                this.state.currentPage = 'home';
                pages.showPage('home');
                this.updateUIAuthState();
                console.log(`App: Displayed page: home`);
            },
            
            '/login': () => {
                this.state.currentPage = 'login';
                pages.showPage('login');
                this.updateUIAuthState();
                console.log(`App: Displayed page: login`);
            },
            
            '/game': () => {
                this.state.currentPage = 'game';
                pages.showPage('game');
                this.updateUIAuthState();
                console.log(`App: Displayed page: game`);
            },
            
            '*': () => {
                console.error(`Route not found: ${path}`);
                this.state.currentPage = 'notFound';
                pages.showPage('notFound');
                this.updateUIAuthState();
                console.log(`App: Displayed page: notFound`);
            }
        });
    }
    
   
    async checkAuthState() {
        console.log('App: Checking authentication state');
        try {
            const result = await api.fetchUserData();
            
            if (result.success && result.userData) {
                console.log('App: User is authenticated:', result.userData);
                this.state.user = result.userData;
                this.updateUIAuthState();
                
                // Add logout button listener since user is authenticated
                this.initLogoutButton();
            } else {
                console.log('App: User is not authenticated');
                this.state.user = null;
            }
        } catch (error) {
            console.error('App: Error checking authentication state:', error);
            this.state.user = null;
        }
    }

    updateUIAuthState() {
        console.log('App: Updating UI auth state, user =', this.state.user);
        
        const loginNavBtn = docHandler.getById('loginNavBtn');
        const loginBtn = docHandler.getById('loginBtn');

        const loginDropdown = docHandler.getById('loginDropdown');
        const loggedInUserImg = docHandler.getById('loggedInUserImg');
        const loggedInUsername = docHandler.getById('loggedInUsername');
        
        if (this.state.user) {
            loginNavBtn.parentElement.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'none';
            
            if (loginDropdown) loginDropdown.style.display = 'block';
            
            if (this.getIs42User() && this.getUserImg()) {
                loggedInUserImg.src = this.getUserImg();
                loggedInUserImg.style.display = 'block';
            } else loggedInUserImg.style.display = 'none';
            

            if (this.getIs42User()) {
                if (this.getUserImg()) {
                    loggedInUserImg.src = this.getUserImg();
                    loggedInUserImg.style.display = 'block';
                } else {
                    loggedInUserImg.style.display = 'none';
                }
            } else {
                if (this.getUsername()) {
                    loggedInUsername.textContent = this.getUsername();
                    loggedInUsername.style.display = 'inline';
                } else {
                    loggedInUsername.style.display = 'none';
                }
            }
        } else {
            loginNavBtn.parentElement.style.display = 'block';
            loginBtn.style.display = 'block';
            loginDropdown.style.display = 'none';
        }
    }

    // Method to initialize the logout button listener
    initLogoutButton() {
        // Only initialize once
        if (this._logoutInitialized) return;
        
        // Using event delegation for dynamically added logout button
        document.addEventListener('click', (event) => {
            const logoutBtn = event.target.closest('#logoutBtn');
            if (logoutBtn) {
                event.preventDefault();
                this.logout();
            }
        });
        
        // Set flag to prevent multiple initializations
        this._logoutInitialized = true;
        console.log('App: Logout button listener initialized');
    }
    
    // Method to handle user logout
    async logout() {
        console.log('App: Logging out user');
        components.showSpinner();
        
        try {
            // Call API logout function
            await api.logout();
            
            // Clear application state
            this.state.user = null;
            
            // Update UI
            this.updateUIAuthState();
            
            components.hideSpinner();
            
            // Show success message
            components.showToast('success', 'Logged Out', 'You have been successfully logged out.');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('App: Logout error:', error);
            
            // Even if error occurs, clear tokens and state
            this.state.user = null;
            this.updateUIAuthState();
            
            components.hideSpinner();
            components.showToast('warning', 'Logout Status', 'You have been logged out, but there was an issue with the server.');
       
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
            return false;
        }
    }
    
    resetAppContainer() {
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
    }
    
    getState() {
        return this.state;
    }

    getUser() {
        return this.state.user;
    }

    getUserImg() {
        return this.state.user.profile_image;
    }

    getUsername() {
        return this.state.user.username;
    }

    getEmail() {
        return this.state.user.email;
    }

    getIs42User() {
        return this.state.user.is_oauth_user;
    }

    getTotalGamesPlayed() {
        return this.state.user.total_games;
    }

    getTotalWins() {
        return this.state.user.wins;
    }

    getWinRate() {
        return this.state.user.win_rate;
    }

    getTotalLosses() {
        return this.state.user.losses;
    }

    getRank() {
        return this.state.user.rank;
    }

    getIs2FAEnabled() {
        return this.state.user.is_two_factor_enabled;
    }

    isReady() {
        return this.initialized;
    }

    
}

// Create a singleton instance
const app = new App();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.init();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        if (components && components.hideSpinner) {
            components.hideSpinner();
        }
    }
});

// Handle video playback when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.play().catch(e => console.error("Video play failed on visibility change:", e));
        }
    }
});

// Export the app instance
export default app;
