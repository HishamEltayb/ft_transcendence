// app.js - Main application entry point
import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import api from './api.js';
import docHandler from './document.js';
import gameLoader from './gameLoader.js'; 
import forms from './forms.js';
import profile from './profile.js';

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
        
    }
    
    async init() {
        
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
            router.init();
            
            this.initialized = true;
            
            // Check authentication state from cookie or localStorage
            
            await this.checkAuthState();
            
            // Initialize logout button listener AFTER authentication check
            // Pass the entire app instance to the docHandler
            docHandler.initLogoutButton(this);
            
            components.hideSpinner();
            
            // Dispatch an event to notify other components
            document.dispatchEvent(new CustomEvent('appInitialized', {
                detail: { app: this }
            }));
            
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
            },
            
            '/home': () => {
                this.state.currentPage = 'home';
                pages.showPage('home');
                docHandler.updateUIAuthState(this);
            },
            
            '/login': async () => {
                console.log('Checking login state');
                
                // Show spinner while checking
                components.showSpinner();
                
                try {
                    // First check if we already have a user in state (memory)
                    if (this.state.user) {
                        console.log('User already logged in, redirecting to profile');
                        components.showToast('info', 'Already Logged In', 'You are already logged in.');
                        router.navigate('/profile');
                        components.hideSpinner();
                        return;
                    }
                    
                    // If state is empty (might be after refresh), check with API
                    const result = await api.getUserData();
                    
                    if (result.success && result.userData) {
                        // User is authenticated but state was empty (after refresh)
                        this.state.user = result.userData;
                        docHandler.updateUIAuthState(this);
                        console.log('User authenticated after refresh, redirecting to profile');
                        components.showToast('info', 'Session Restored', 'Your session has been restored.');
                        router.navigate('/profile');
                        return;
                    } else {
                        // User is truly not authenticated, show login page
                        this.state.currentPage = 'login';
                        pages.showPage('login');
                        docHandler.updateUIAuthState(this);
                    }
                } catch (error) {
                    console.error('Error checking auth for login page:', error);
                    // On error, default to showing login page
                    this.state.currentPage = 'login';
                    pages.showPage('login');
                    docHandler.updateUIAuthState(this);
                } finally {
                    components.hideSpinner();
                }
            },
            
            '/game': () => {
                this.state.currentPage = 'game';
                pages.showPage('game');
                docHandler.updateUIAuthState(this);
            },
            
            '/profile': async () => {
                this.state.currentPage = 'profile';
                
                // Show spinner while checking auth
                components.showSpinner();
                
                try {
                    // First check if we already have a user in state
                    if (this.state.user) {
                        // User is already authenticated, show profile directly
                        console.log('User already authenticated, showing profile');
                        pages.showPage('profile');
                        docHandler.updateUIAuthState(this);
                        components.hideSpinner();
                        return;
                    }
                    
                    // If we don't have a user, check authentication state
                    const result = await api.getUserData();
                    
                    if (result.success && result.userData) {
                        // User is authenticated, update state and show profile
                        this.state.user = result.userData;
                        docHandler.updateUIAuthState(this);
                        pages.showPage('profile');
                    } else {
                        // User is not authenticated, redirect to login
                        console.log('Not authenticated, redirecting to login');
                        components.showToast('warning', 'Authentication Required', 'Please log in to view your profile.');
                        router.navigate('/login');
                    }
                } catch (error) {
                    console.error('Error checking auth for profile page:', error);
                    components.showToast('error', 'Authentication Error', 'An error occurred while checking authentication.');
                    router.navigate('/login');
                } finally {
                    components.hideSpinner();
                }
            },
            
            '*': () => {
                // console.error(`404 Not Found: ${path}`);
                this.state.currentPage = 'notFound';
                pages.showPage('notFound');
                docHandler.updateUIAuthState(this);
            }
        });
    }
    
   
    async checkAuthState() {
        try {
            const result = await api.getUserData();
            
            if (result.success && result.userData) {
                this.state.user = result.userData;
                docHandler.updateUIAuthState(this);
                
                // Initialize logout button if user is authenticated
                docHandler.initLogoutButton(this);
            } else {
                this.state.user = null;
            }
        } catch (error) {
            console.error('App: Error checking authentication state:', error);
            this.state.user = null;
        }
    }

    // Method to handle user logout
    async logout() {
        console.log('App: Logging out');
        
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
