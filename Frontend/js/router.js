// Removed direct import to break circular dependency
// import docHandler from './document.js';
import utils from './utils.js';
import login from './login.js';

class Router {
    constructor() {
        this.routes = {};
        this.initialized = false;
        this.currentPage = null;
    }

    async init() {
        if (this.initialized) return this;
        
        // Listen for browser back/forward navigation
        window.addEventListener('popstate', (event) => {
            this.handleURL();
        });
        
        // Handle clicks on all elements in document body using event delegation
        document.body.addEventListener('click', (event) => {
            // Handle all navigation buttons
            const navBtn = event.target.closest('[id$="NavBtn"], [id$="Btn"]');
            // .closest() - Checks if the clicked element or any of its ancestors matches a selector
            // [id$="NavBtn"] - A CSS attribute selector that matches any element with an ID ending in "NavBtn"
            // [id$="Btn"] - A CSS attribute selector that matches any element with an ID ending in "Btn"
            if (navBtn) {
                event.preventDefault();
                
                // Extract page name from button ID
                const id = navBtn.id.toLowerCase();
                let targetPath = '/';
                
                if (id.includes('home')) targetPath = '/home';
                else if (id.includes('game')) targetPath = '/game';
                else if (id.includes('login')) targetPath = '/login';
                
                // If button has href attribute, use that instead
                if (navBtn.getAttribute('href') && navBtn.getAttribute('href') !== '#') {
                    targetPath = navBtn.getAttribute('href');
                }
                
                this.navigate(targetPath);
                return;
            }
            
            const link = event.target.closest('a');
            
            if (link && 
                link.href && 
                link.href.startsWith(window.location.origin) && 
                !link.hasAttribute('target') &&
                !link.id.includes('NavBtn') && 
                !link.id.includes('Btn')) {
                
                event.preventDefault();
                
                // Extract the pathname from the link
                const path = new URL(link.href).pathname;
                
                // Navigate to the path
                this.navigate(path);
                return;
            }

            // Handle data-page attributes for navigation
            const pageElement = event.target.closest('[data-page]');
            if (pageElement) {
                event.preventDefault();
                const pageName = pageElement.getAttribute('data-page');
                this.navigate(`/${pageName}`);
            }
        });
        
        this.initialized = true;
        
        this.handleURL();
        
        return this;
    }

    registerRoutes(routes) {
        this.routes = {
            ...this.routes,
            ...routes
        };
        return this;
    }

    /**
     * Add a single route
     * @param {String} path - The route path
     * @param {Function} handler - Function to call when this route is matched
     */
    addRoute(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    /**
     * Handle the current URL
     */
    handleURL() {
        // Get the current path
        const path = window.location.pathname || '/';
        
        // Special handling for OAuth callback
        if (path.includes('/oauth/callback')) {
            login.handleOAuthCallback(this);
            return true;
        }
        
        // Find the matching route handler
        let handler = this.routes[path];
        
        // If no exact match, use the wildcard handler 
        if (!handler && this.routes['*']) {
            handler = this.routes['*'];
        } else if (!handler && this.routes['/']) {
            handler = this.routes['/'];
        }
        
        // If still no handler, show error
        if (!handler) {
            console.error(`No route handler found for path: ${path}`);
            return false;
        }
        
        // Call the handler
        try {
            this.currentPage = path;
            handler(path); // Pass the path to the handler
            
            // Dispatch navigation event
            document.dispatchEvent(new CustomEvent('navigationComplete', {
                detail: { path }
            }));
            
            return true;
        } catch (error) {
            console.error('Error in route handler:', error);
            return false;
        }
    }

    /**
     * Navigate to a new path
     * @param {String} path - The path to navigate to
     */
    navigate(path) {
        if (this.currentPage === path) {
            return;
        }
        
        // Update browser history
        window.history.pushState({}, '', path);
        
        // Handle the new URL
        this.handleURL();
    }
}

// Create and export a singleton instance
const router = new Router();
export default router; 