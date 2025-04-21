import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import user from './user.js';
import store from './store.js';
// Explicitly import forms to ensure it's loaded
import forms from './forms.js';

/**
 * Main App class for initializing and coordinating the SPA
 * Uses store as the single source of truth
 */
class App {
    constructor() {
        this.appContainer = null;
        this.isInitialized = false;
        
        // Debug log
        console.log('App: Created instance');
    }
    
    /**
     * Initialize the application
     */
    async init() {
        console.log("App: Initializing...");
        
        // Get app container
        this.appContainer = document.getElementById('App');
        
        if (!this.appContainer) {
            console.error("App: Container not found!");
            return false;
        }
        
        try {
            // Show spinner during initialization
            components.showSpinner();
            
            // Reset app container
            this.resetAppContainer();
            
            // Initialize all modules in sequence
            // First initialize components
            components.init(this.appContainer);
            await components.loadAllComponents();
            
            // Then initialize pages
            pages.init(this.appContainer);
            await pages.loadAllPages();
            
            // Append footer
            components.appendFooter();
            
            // Initialize router
            console.log("App: Initializing router...");
            router.init();
            
            // Initialize user authentication
            console.log("App: Initializing user authentication...");
            await user.init();
            
            // Initialize forms
            console.log("App: Initializing forms...");
            await forms.init();
            
            // Mark app as initialized
            this.isInitialized = true;
            
            // Hide spinner
            components.hideSpinner();
            
            // Dispatch an event to notify other components
            document.dispatchEvent(new Event('appInitialized'));
            
            console.log("App: Initialization complete");
            return true;
        } catch (error) {
            console.error("App: Failed to initialize application:", error);
            components.hideSpinner();
            this.showInitError(error);
            return false;
        }
    }
    
    /**
     * Clear the app container
     */
    resetAppContainer() {
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
    }
    
    /**
     * Show initialization error
     */
    showInitError(error) {
        components.showToast(
            'error',
            'Application Error',
            'There was a problem loading the application. Please refresh the page.',
            5000  
        );
        
        this.resetAppContainer();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'container mt-5 text-center';
        errorDiv.innerHTML = `
            <div class="alert alert-danger">
                <h4>Application Error</h4>
                <p>${error.message || 'Unknown error'}</p>
            </div>
            <button class="btn btn-outline-primary mt-3" onclick="window.location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Retry
            </button>
        `;
        this.appContainer.appendChild(errorDiv);
    }
    
    /**
     * Check if app is initialized
     */
    isReady() {
        return this.isInitialized;
    }
}

// Create and initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM loaded, creating App instance");
    
    // Show spinner during initialization
    const spinnerContainer = document.getElementById('spinnerContainer');
    if (spinnerContainer) {
        spinnerContainer.classList.remove('d-none');
    }
    
    // Create app instance
    const app = new App();
    
    try {
        // Initialize app
        await app.init();
        
        // Make app globally available (for debugging)
        window.App = app;
        
        console.log("App initialization complete");
        
        // Initialize profile page if we're on that page
        const currentPath = window.location.pathname;
        if (currentPath.includes('profile')) {
            console.log("App: On profile page, initializing profile...");
            // Use a small delay to ensure DOM is fully rendered
            setTimeout(() => {
                if (typeof forms !== 'undefined' && forms.initProfilePage) {
                    forms.initProfilePage();
                }
            }, 100);
        }
    } catch (error) {
        console.error("App initialization failed:", error);
        
        // Hide spinner if initialization fails
        if (spinnerContainer) {
            spinnerContainer.classList.add('d-none');
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

export default App; 