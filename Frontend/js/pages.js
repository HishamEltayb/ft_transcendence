import api from './api.js';
import components from './components.js';
import docHandler from './document.js';
import { AVAILABLE_PAGES, PAGES } from './constants.js';

class Pages {
    constructor() {
        this.appContainer = null;
        this.pageSection = null;
        
        // Initialize pages object with all pages from AVAILABLE_PAGES
        this.pages = {};
        AVAILABLE_PAGES.forEach(page => {
            this.pages[page] = null;
        });
        
        this.isLoading = false;
        this.loadingComplete = false;
    }
    
    init(appContainer) {
        this.appContainer = appContainer;
        
        this.pageSection = document.createElement('section');
        this.pageSection.id = 'pageSection';
        this.pageSection.className = 'page-content';
        this.appContainer.appendChild(this.pageSection);
    }
    
    async loadAllPages() {
        this.isLoading = true;
        this.loadingComplete = false;
        components.showSpinner();
        
        try {
            // Fetch all pages from the API
            const htmlPages = await api.fetchAllPages();
            
            // Store each page in our pages object
            Object.entries(htmlPages).forEach(([pageName, element]) => {
                if (element) {
                    this.pages[pageName] = element.innerHTML;
                }
            });
            
            this.isLoading = false;
            this.loadingComplete = true;
            components.hideSpinner();
            
            console.log('Pages loaded:', Object.keys(this.pages).filter(key => this.pages[key] !== null));
            
        } catch (error) {
            console.error("Error loading pages:", error);
            
            components.showToast(
                'error',
                'Content Load Error',
                'Failed to load page content. Please try refreshing the page.',
                6000
            );
            
            this.isLoading = false;
            this.loadingComplete = false;
            components.hideSpinner();
        }
    }
    
    showPage(pageName) {
        // Get the content for the requested page
        const content = this.pages[pageName];
        
        if (content) {
            // Simply replace the innerHTML of the page section
            this.pageSection.innerHTML = content;
            this.updateActiveNavLink(pageName);
            window.scrollTo(0, 0);
            
            // Special handling for game page to ensure proper initialization
            if (pageName === 'game') {
                // Force dispatch of gamePageLoaded event to ensure game initializes properly
                setTimeout(() => {
                    // Make sure the DOM is fully ready before dispatching
                    if (document.getElementById('pvpButton') && document.getElementById('pveButton')) {
                        document.dispatchEvent(new CustomEvent('gamePageLoaded'));
                    } else {
                        // Try again after a delay if buttons aren't found yet
                        setTimeout(() => {
                            document.dispatchEvent(new CustomEvent('gamePageLoaded'));
                        }, 200);
                    }
                }, 50);
            }
        } else  {
            console.error(`Error: Content for page ${pageName} not found!`);
            
            components.showToast(
                'error',
                'Page Not Found',
                `The requested page "${pageName}" could not be found.`,
                5000
            );
            
            if (this.pages.notFound) {
                this.pageSection.innerHTML = this.pages.notFound;
                this.updateActiveNavLink('notFound');
                document.dispatchEvent(new CustomEvent('pageShown', { 
                    detail: { page: 'notFound' } 
                }));
            } else if (this.pages.home) {
                this.pageSection.innerHTML = this.pages.home;
                this.updateActiveNavLink('home');
                document.dispatchEvent(new CustomEvent('pageShown', { 
                    detail: { page: 'home' } 
                }));
            }
            return;
        }
        
        components.showSpinner();
        
        try {
            this.pageSection.innerHTML = content;
            
            this.updateActiveNavLink(pageName);
            
            window.scrollTo(0, 0);
            
            document.dispatchEvent(new CustomEvent('pageShown', { 
                detail: { page: pageName } 
            }));
            
        } catch (error) {
            console.error(`Error showing page ${pageName}:`, error);
            
            components.showToast(
                'error',
                'Page Display Error',
                `There was a problem displaying the ${pageName} page.`,
                5000
            );
        } finally {
            components.hideSpinner();
        }
    }
    
    updateActiveNavLink(pageName) {
        docHandler.queryAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const navLink = docHandler.query(`#${pageName}NavBtn`);
        if (navLink) {
            navLink.classList.add('active');
        }
    }
    
    getPageElement(pageName) {
        return this.pages[pageName] ? true : null;
    }
    
    pageExists(pageName) {
        return AVAILABLE_PAGES.includes(pageName) && 
               pageName !== 'notFound' &&
               this.getPageElement(pageName);
    }
    
    getPageName(pageName) {
        if (!pageName) return 'home';
        return this.pageExists(pageName) ? pageName : 'notFound';
    }
    
    isLoaded() {
        // Check that loading is complete and all required pages are loaded
        return this.loadingComplete && 
            !this.isLoading && 
            AVAILABLE_PAGES.every(page => this.pages[page] !== null);
    }
}

const pages = new Pages();

export default pages; 