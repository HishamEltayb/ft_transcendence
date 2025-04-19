import pages from './pages.js';

class Router {
    init() {
        window.addEventListener('popstate', this.handleURL.bind(this));
        return this;
    }
    // .bind(this) is crucial here because it ensures that when handleURL is called, 
    // the this keyword inside that function will still refer to your original object/class 
    // instance rather than the Window object that fired the event
    
    handleURL() {
        const path = window.location.pathname;
        let pageName = 'home';
        
        if (path && path !== '/')
            pageName = path.split('/')[1] || '';
        
        const resolvedPage = pages.getPageName(pageName);
        pages.showPage(resolvedPage);
        return resolvedPage;
    }
    
    navigateTo(pageName) {
        const resolvedPage = pages.getPageName(pageName);
        
        this.updateURL(pageName || 'home');
        
        pages.showPage(resolvedPage);
        return resolvedPage;
    }
    
    // Update browser URL
    updateURL(pageName) {
        // Format URL based on page
        let url = '/';
        if (pageName !== 'home') {
            url = `/${pageName}`;
        }
        
        // Update browser history
        history.pushState({ page: pageName }, document.title, url);
    }
}

const router = new Router();

export default router;