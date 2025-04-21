import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import user from './user.js';
import forms from './forms.js';
// import store from './store.js';

class App {
    constructor() {
        this.appContainer = null;
        this.isInitialized = false;
        console.log('App: Created instance');
    }
    
    async init() {
        console.log("App: Initializing...");
        
        this.appContainer = document.getElementById('App');
        
        if (!this.appContainer) {
            console.error("App: Container not found!");
            return false;
        }
        
        try {
            this.resetAppContainer();
            
            components.init(this.appContainer);
            await components.loadAllComponents();
            
            components.showSpinner();
        
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
            forms.init();
            
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
            components.showToast(
                'error',
                'Application Error',
                'There was a problem loading the application. Please refresh the page.',
                5000  
            );
            return false;
        }
    }

    resetAppContainer() {
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
    }

    isReady() {
        return this.isInitialized;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    
    try {
        await app.init();
        
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
        components.hideSpinner()
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
