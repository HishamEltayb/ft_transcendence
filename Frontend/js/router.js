import docHandler from './document.js';

class Router {
    constructor() {
        this.routes = {};
        this.initialized = false;
        this.currentPage = null;
        this.docHandler = docHandler;
    }

    init() {
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
        
        console.log('Router: Current path:', path);
        
        // Special handling for OAuth callback
        if (path.includes('/oauth/callback')) {
            console.log('Router: Detected OAuth callback URL');
            this.handleOAuthCallback();
            return true;
        }
        
        // Find the matching route handler
        let handler = this.routes[path];
        
        // If no exact match, try fallback to default
        if (!handler && this.routes['*']) {
            handler = this.routes['*'];
        } else if (!handler && this.routes['/']) {
            handler = this.routes['/'];
        }
        
        // If still no handler, show 404
        if (!handler) {
            console.error(`No route handler found for path: ${path}`);
            // Could redirect to a 404 page here
            return false;
        }
        
        // Call the handler
        try {
            this.currentPage = path;
            handler(path);
            
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
     * Handle OAuth callback from 42 authentication
     */
    handleOAuthCallback() {
        console.log('Router: Processing OAuth callback');
        
        // Get the access token from URL parameters or hash
        const urlParams = new URLSearchParams(window.location.search);
        let accessToken = urlParams.get('access_token');
        
        // If not in search params, try the hash
        if (!accessToken && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            accessToken = hashParams.get('access_token');
        }
        
        if (accessToken) {
            console.log('Router: Found access token in callback URL');
            
            // Store the token in localStorage
            localStorage.setItem('authToken', accessToken);
            
            // Create a simple callback page - this could be made more sophisticated
            document.getElementById('pageSection').innerHTML = `
                <div class="auth-container text-center p-5">
                    <h2 class="text-gold mb-4">Authentication Successful</h2>
                    <div class="mb-4">
                        <div class="progress">
                            <div id="authProgress" class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                        </div>
                    </div>
                    <p class="text-white">You have been successfully authenticated.</p>
                    <p class="text-white">Redirecting you to the homepage...</p>
                </div>
            `;
     
        } else {
            console.error('Router: No access token found in callback URL');
            
            // Show error in page
            document.getElementById('pageSection').innerHTML = `
                <div class="auth-container text-center p-5">
                    <h2 class="text-danger mb-4">Authentication Failed</h2>
                    <p class="text-white">We couldn't complete the authentication process.</p>
                    <p class="text-white">Please try again.</p>
                    <button id="retryAuthBtn" class="btn btn-gold mt-3">Return to Login</button>
                </div>
            `;
            
            // Add event listener to the retry button
            setTimeout(() => {
                const retryBtn = document.getElementById('retryAuthBtn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        this.navigate('/login');
                    });
                }
            }, 100);
        }
    }

    /**
     * Navigate to a new path
     * @param {String} path - The path to navigate to
     */
    navigate(path) {
        if (this.currentPage === path) {
            console.log(`Already on page: ${path}`);
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