import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import user from './user.js';

class App {
    constructor() {
        this.appContainer = null;
        this.isInitialized = false;
    }
    
    async init() {
        console.log("Initializing app...");
        this.appContainer = document.getElementById('App');
        
        if (!this.appContainer) {
            console.error("App container not found!");
            return false;
        }
        
        try {
            components.showSpinner();
            this.resetAppContainer();
            
            components.init(this.appContainer);
            await components.loadAllComponents();
            
            pages.init(this.appContainer);
            await pages.loadAllPages();
            
            components.appendFooter();
            
            router.init();

            user.init(); 
            
            this.isInitialized = true;
            
            components.hideSpinner();
            
            document.dispatchEvent(new Event('appInitialized'));
            
            return true;
        } catch (error) {
            console.error("Failed to initialize application:", error);
            components.hideSpinner();
            this.showInitError();
            return false;
        }
    }
    
    resetAppContainer() {
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
    }
    
    showInitError() {
        components.showToast(
            'error',
            'Application Error',
            'There was a problem loading the application. Please refresh the page.',
            5000  
        );
        
        this.resetAppContainer();
        const retryDiv = document.createElement('div');
        retryDiv.className = 'text-center mt-5';
        retryDiv.innerHTML = `
            <button class="btn btn-outline-primary" onclick="window.location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Retry
            </button>
        `;
        this.appContainer.appendChild(retryDiv);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    
    const spinnerContainer = document.getElementById('spinnerContainer');
    if (spinnerContainer)
        spinnerContainer.classList.remove('d-none');
    
    const app = new App();
    
    try {
        await app.init();
        window.App = app;
    } catch (error) {
        console.error("App initialization failed:", error);
        if (spinnerContainer)
            spinnerContainer.classList.add('d-none');
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.play().catch(e => console.error("Video play failed on visibility change:", e));
        }
    }
});

export default App; 