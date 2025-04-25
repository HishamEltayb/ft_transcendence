// app.js - Main application entry point
import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import api from './api.js';
import docHandler from './document.js';
import forms from './forms.js';

class App {
    constructor() {
        this.appContainer = null;
        this.initialized = false;
        this.logoutInitialized = false;
        // Application state that persists across all routes
        this.state = {
            user: null,
            currentPage: null,
            gameSettings: {},
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
            // Pass the entire app instance to the docHandler
            docHandler.initLogoutButton(this);
            
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
                docHandler.updateUIAuthState(this);
                console.log(`App: Displayed page: home`);
            },
            
            '/home': () => {
                this.state.currentPage = 'home';
                pages.showPage('home');
                docHandler.updateUIAuthState(this);
                console.log(`App: Displayed page: home`);
            },
            
            '/login': () => {
                this.state.currentPage = 'login';
                pages.showPage('login');
                docHandler.updateUIAuthState(this);
                console.log(`App: Displayed page: login`);
            },
            
            '/game': () => {
                this.state.currentPage = 'game';
                pages.showPage('game');
                docHandler.updateUIAuthState(this);
                console.log(`App: Displayed page: game`);
            },
            
            '*': (path) => {
                console.log('Path not found -----------:', path);
                
                console.error(`404 Not Found: ${path}`);
                this.state.currentPage = 'notFound';
                pages.showPage('notFound');
                docHandler.updateUIAuthState(this);
                console.log(`App: Displayed 404 page for route: ${path}`);
            }
        });
    }
    
   
    async checkAuthState() {
        console.log('App: Checking authentication state');
        try {
            const result = await api.getUserData();
            
            if (result.success && result.userData) {
                console.log('App: User is authenticated:', result.userData);
                this.state.user = result.userData;
                docHandler.updateUIAuthState(this);
                
                // Initialize logout button if user is authenticated
                docHandler.initLogoutButton(this);
            } else {
                console.log('App: User is not authenticated');
                this.state.user = null;
            }
        } catch (error) {
            console.error('App: Error checking authentication state:', error);
            this.state.user = null;
        }
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
            docHandler.updateUIAuthState(this);
            
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
            docHandler.updateUIAuthState(this);
            
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
