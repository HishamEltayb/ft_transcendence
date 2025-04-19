import components from './components.js';
import pages from './pages.js';
import router from './router.js';
import { AVAILABLE_PAGES } from './constant.js';

class App {
    constructor() {
        this.appContainer = null;
    }
    
    async init() {
        console.log("Initializing application");
        
        this.appContainer = document.getElementById('App');
        
        if (!this.appContainer) {
            console.error("App container not found!");
            return false;
        }
        
        try {
            this.resetAppContainer();
            
            components.init(this.appContainer);
            await components.loadAllComponents();
            
            pages.init(this.appContainer);
            await pages.loadAllPages();
            
            components.appendFooter();

            // Initialize router after pages are fully loaded
            router.init();
            const initialPage = router.handleURL();
            console.log("Router initialized with initial page:", initialPage);
            
            this.initNavigationEvents();
            
            document.dispatchEvent(new Event('appInitialized'));
            
            return true;
        } catch (error) {
            console.error("Failed to initialize application:", error);
            return false;
        }
    }
    
    resetAppContainer() {
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
    }
    
    initNavigationEvents() {
        const navElements = document.querySelectorAll('[data-page]');
        navElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = element.getAttribute('data-page');
                router.navigateTo(pageName);
            });
        });
        
        const homeLinks = document.querySelectorAll('.navbar-brand, a[href="/"]');
        homeLinks.forEach(link => {
            if (!link.hasAttribute('data-page')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    router.navigateTo('home');
                });
            }
        });
        
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigateTo('home');
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed");
    
    const app = new App();
    
    try {
        const success = await app.init();
        console.log("App initialization " + (success ? "complete" : "failed"));
        window.App = app;
    } catch (error) {
        console.error("App initialization failed:", error);
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

window.navigateTo = function(pageName) {
    router.navigateTo(pageName);
};

export default App; 