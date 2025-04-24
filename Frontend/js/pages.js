import api from './api.js';
import components from './components.js';
import docHandler from './document.js';
import { AVAILABLE_PAGES } from './constants.js';

class Pages {
    constructor() {
        this.appContainer = null;
        this.pageSection = null;
        
        this.pages = {
            home: null,
            game: null,
            login: null,
            notFound: null
        };
        
        this.isLoading = false;
        this.loadingComplete = false;
    }
    
    init(appContainer) {
        this.appContainer = appContainer;
        
        this.pageSection = document.createElement('section');
        this.pageSection.id = 'pageSection';
        this.pageSection.className = 'page-content';
        this.appContainer.appendChild(this.pageSection);
        
        console.log('Pages: Initialized with App container and page section');
    }
    
    async loadAllPages() {
        this.isLoading = true;
        this.loadingComplete = false;
        components.showSpinner();
        
        try {
            const htmlPages = await api.fetchAllPages();
            
            this.pages.home = htmlPages.homePage ? htmlPages.homePage.innerHTML : null;
            this.pages.game = htmlPages.gamePage ? htmlPages.gamePage.innerHTML : null;
            this.pages.login = htmlPages.loginPage ? htmlPages.loginPage.innerHTML : null;
            this.pages.notFound = htmlPages.notFoundPage ? htmlPages.notFoundPage.innerHTML : null;
            
            this.isLoading = false;
            this.loadingComplete = true;
            
            console.log('Pages: Successfully loaded all pages');
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
        const content = this.pages[pageName];
        
        if (!content) {
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
            
            console.log(`Pages: Dispatching pageShown event for ${pageName}`);
            document.dispatchEvent(new CustomEvent('pageShown', { 
                detail: { page: pageName } 
            }));
            
            console.log(`Pages: Displayed ${pageName} page`);
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
        return this.loadingComplete && 
            !this.isLoading && 
            this.pages.home && 
            this.pages.game && 
            this.pages.login && 
            this.pages.notFound;
    }
}

const pages = new Pages();

export default pages; 