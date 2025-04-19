import hooks from './hooks.js';
import components from './components.js';
import { AVAILABLE_PAGES } from './constant.js';

class Pages {
    constructor() {
        this.appContainer = null;
        this.pageSection = null;
        
        this.pages = {
            home: null,
            game: null,
            login: null,
            profile: null
        };
        
        this.isLoading = false;
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
        components.showSpinner();
        
        try {
            const htmlPages = await hooks.useFetchAllPages();
            
            this.pages.home = htmlPages.homePage ? htmlPages.homePage.innerHTML : null;
            this.pages.game = htmlPages.gamePage ? htmlPages.gamePage.innerHTML : null;
            this.pages.login = htmlPages.loginPage ? htmlPages.loginPage.innerHTML : null;
            this.pages.profile = htmlPages.profilePage ? htmlPages.profilePage.innerHTML : null;
            this.pages.notFound = htmlPages.notFoundPage ? htmlPages.notFoundPage.innerHTML : null;
            
            this.showPage('home');
            
            this.isLoading = false;
            components.hideSpinner();
        } catch (error) {
            console.error("Error loading pages:", error);
            
            this.showErrorMessage();
            
            this.isLoading = false;
            components.hideSpinner();
        }
    }
    
    showErrorMessage() {
        if (this.pageSection) {
            this.pageSection.innerHTML = `
                <div class="alert alert-danger text-center m-5">
                    <h4>Error Loading Content</h4>
                    <p>Failed to load page content.</p>
                    <button class="btn btn-outline-danger mt-3" onclick="window.location.reload()">
                        Try Again
                    </button>
                </div>
            `;
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
        } else {
            console.error(`Error: Content for page ${pageName} not found!`);
            if (this.pages.home) {
                this.pageSection.innerHTML = this.pages.home;
                this.updateActiveNavLink('home');
            }
        }
    }
    
    updateActiveNavLink(pageName) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const selector = `.nav-link[data-page="${pageName}"], .nav-link[href="/${pageName}"]`;
        const activeLink = pageName === 'home' 
            ? document.querySelector(`.nav-link[data-page="home"], .nav-link[href="/"]`)
            : document.querySelector(selector);
        
        if (activeLink) {
            activeLink.classList.add('active');
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
    
    /**
     * Get the resolved page name, handling defaults and non-existent pages
     * @param {string} pageName - The requested page name
     * @returns {string} - The resolved page name ('home' for empty, 'notFound' for invalid)
     */
    getPageName(pageName) {
        if (!pageName) return 'home';
        return this.pageExists(pageName) ? pageName : 'notFound';
    }
    
    isLoaded() {
        return !this.isLoading && 
            this.pages.home && 
            this.pages.game && 
            this.pages.login && 
            this.pages.profile &&
            this.pages.notFound;
    }
}

const pages = new Pages();

export default pages; 