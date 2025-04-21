import hooks from './hooks.js';
import components from './components.js';
import { AVAILABLE_PAGES } from './constants.js';
import store from './store.js';

class Pages {
    constructor() {
        this.appContainer = null;
        this.pageSection = null;
        
        this.pages = {
            home: null,
            game: null,
            login: null,
            profile: null,
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
    }
    
    async loadAllPages() {
        this.isLoading = true;
        this.loadingComplete = false;
        components.showSpinner();
        
        
        const slowLoadingTimeout = setTimeout(() => {
            if (this.isLoading) {
                components.showToast(
                    'warning',
                    'Slow Connection',
                    'Pages are taking longer than usual to load.',
                    3000
                );
            }
        }, 5000);
        
        try {
            const htmlPages = await hooks.useFetchAllPages();
            
            this.pages.home = htmlPages.homePage ? htmlPages.homePage.innerHTML : null;
            this.pages.game = htmlPages.gamePage ? htmlPages.gamePage.innerHTML : null;
            this.pages.login = htmlPages.loginPage ? htmlPages.loginPage.innerHTML : null;
            this.pages.profile = htmlPages.profilePage ? htmlPages.profilePage.innerHTML : null;
            this.pages.notFound = htmlPages.notFoundPage ? htmlPages.notFoundPage.innerHTML : null;
            
            this.isLoading = false;
            this.loadingComplete = true;
            
            clearTimeout(slowLoadingTimeout);
        } catch (error) {
            console.error("Error loading pages:", error);
            clearTimeout(slowLoadingTimeout);
            
            this.showErrorMessage();
            
            this.isLoading = false;
            this.loadingComplete = false;
            components.hideSpinner();
        }
    }
    
    showErrorMessage() {
        // Show error toast
        components.showToast(
            'error',
            'Content Loading Error',
            'Failed to load page content. Please try again.',
            8000  // Show for 8 seconds
        );
        
        // Also add a simple retry button in the page area
        if (this.pageSection) {
            this.pageSection.innerHTML = `
                <div class="text-center mt-5">
                    <p class="text-muted">Content could not be loaded</p>
                    <button class="btn btn-outline-primary" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Retry
                    </button>
                </div>
            `;
        }
    }
    
    showPage(pageName) {
        
        // Get the content for the requested page
        const content = this.pages[pageName];
        
        if (content) {
            // Before replacing content, store any form data from current page if needed
            this.saveCurrentPageForms();
            
            // Replace page content
            this.pageSection.innerHTML = content;
            this.updateActiveNavLink(pageName);
            window.scrollTo(0, 0);
            
            // Initialize the page with appropriate data after content is loaded
            switch(pageName) {
                case 'login':
                    this.initializeLoginPage();
                    break;
                case 'game':
                    this.initializeGamePage();
                    break;
                case 'profile':
                    this.initializeProfilePage();
                    break;
                case 'home':
                    this.initializeHomePage();
                    break;
                default:
                    // Default initialization for other pages
                    break;
            }
        } else {
            console.error(`Error: Content for page ${pageName} not found!`);
            if (this.pages.home) {
                this.pageSection.innerHTML = this.pages.home;
                this.updateActiveNavLink('home');
                this.initializeHomePage();
            }
        }
    }
    
    // Save any form data from the current page before navigation
    saveCurrentPageForms() {
        const forms = this.pageSection.querySelectorAll('form');
        if (!forms || forms.length === 0) return;
        
        
        forms.forEach(form => {
            if (form.id) {
                try {
                    const formData = new FormData(form);
                    const formDataObj = {};
                    
                    for (const [key, value] of formData.entries()) {
                        formDataObj[key] = value;
                    }
                    
                    // Save to store
                    store.saveFormData(form.id, formDataObj);
                } catch (error) {
                    console.error(`Pages: Error saving form data for ${form.id}:`, error);
                }
            }
        });
    }
    
    // Initialize login page with potentially saved form data
    initializeLoginPage() {
        console.log('Initializing login page');
        
        // Initialize login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            // Restore any previously entered login form data
            const savedFormData = store.getFormData('loginForm');
            if (savedFormData) {
                Object.entries(savedFormData).forEach(([key, value]) => {
                    const input = loginForm.querySelector(`[name="${key}"]`);
                    if (input && input.type !== 'password') { // Don't restore passwords for security
                        input.value = value;
                    }
                });
            }
            
            // Set up submit handler
            loginForm.addEventListener('submit', this.handleLoginFormSubmit);
            
            // Set up input change tracking
            loginForm.addEventListener('input', (e) => {
                const form = e.currentTarget;
                if (form.id) {
                    const formData = new FormData(form);
                    const formDataObj = {};
                    
                    for (const [key, value] of formData.entries()) {
                        if (key !== 'password') { // Don't store password
                            formDataObj[key] = value;
                        }
                    }
                    
                    // Save to store as user types
                    store.saveFormData(form.id, formDataObj);
                }
            });
        }
        
        // Initialize 42 login button - direct reference by ID
        const login42Link = document.getElementById('login42Link');
        if (login42Link) {
            console.log('Found login42Link button, attaching event handler');
            // Dynamically import the forms module to get access to the handler
            import('./forms.js').then(formsModule => {
                const forms = formsModule.default;
                if (forms && typeof forms.handleLogin42 === 'function') {
                    // Bind the handler directly to the button
                    login42Link.onclick = (e) => {
                        console.log('42 login button clicked via pages.js handler');
                        forms.handleLogin42(e);
                    };
                    console.log('Attached 42 login handler from forms module');
                } else {
                    console.warn('Could not find handleLogin42 method in forms module');
                }
            }).catch(error => {
                console.error('Error loading forms module:', error);
            });
        } else {
            console.warn('Login with 42 button (login42Link) not found in DOM during page initialization');
        }
        
        // Initialize any other OAuth login buttons using data attributes
        const oauthButtons = document.querySelectorAll('[data-oauth]');
        oauthButtons.forEach(button => {
            button.addEventListener('click', this.handleOAuthLogin);
        });
    }
    
    // Initialize profile page with user data
    initializeProfilePage() {
        console.log('Pages: initializeProfilePage called');
        
        // Get user data from store
        const appState = store.getState();
        const userData = appState.user;
        
        if (!userData) {
            console.warn('Pages: No user data available for profile page');
        } else {
            console.log('Pages: User data available, applying basic profile data');
            
            // Update profile avatar - this is something we can do without the Forms module
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                if (userData.profile_image) {
                    profileAvatar.src = userData.profile_image;
                    profileAvatar.alt = `${userData.username}'s avatar`;
                }
                
                // Add error handler for the image
                profileAvatar.onerror = function() {
                    this.src = '../public/assets/images/default-avatar.png';
                };
            }
            
            // Update username - something else we can do directly
            const profileUsername = document.getElementById('profileUsername');
            if (profileUsername) {
                profileUsername.textContent = userData.username || 'Unknown User';
            }
            
            // Update intra login
            const profileIntraLogin = document.getElementById('profileIntraLogin');
            if (profileIntraLogin) {
                profileIntraLogin.textContent = userData.intra_login || 'N/A';
            }
        }
        
        // Now load the Forms module to handle the rest of the profile initialization
        console.log('Pages: Loading Forms module for full profile initialization');
        import('./forms.js')
            .then(formsModule => {
                const forms = formsModule.default;
                if (forms && typeof forms.initProfilePage === 'function') {
                    console.log('Pages: Calling forms.initProfilePage() from pages.js');
                    // Add a small delay to ensure the DOM is ready
                    setTimeout(() => {
                        forms.initProfilePage();
                    }, 100);
                } else {
                    console.error('Pages: forms.initProfilePage is not available');
                }
            })
            .catch(error => {
                console.error('Pages: Error loading Forms module:', error);
            });
    }
    
    // Initialize game page with game state
    initializeGamePage() {
        
        // Get game state from store
        const appState = store.getState();
        const gameState = appState.gameState;
        
        if (gameState) {
            // Implement game state restoration logic here
        }
        
        // Initialize any game controls
        // ...
    }
    
    // Initialize home page
    initializeHomePage() {
        
        // Add any home page specific initialization
        // ...
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
            this.pages.profile &&
            this.pages.notFound;
    }
}

const pages = new Pages();

export default pages; 