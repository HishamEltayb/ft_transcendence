import hooks from './hooks.js';


class Components {
    constructor() {
        this.appContainer = null;

        this.spinnerComponent = null;
        this.headerComponent = null;
        this.footerComponent = null;
        this.toastComponent = null;
        this.twoFAModalComponent = null;
        this.toastTitle = null;
        this.toastMessage = null;
        this.toastIcon = null;
        this.toastTimeout = null;
    }
    
    init(appContainer) {
        this.appContainer = appContainer;
        
        this.spinnerComponent = document.getElementById('spinnerContainer');
        this.toastComponent = document.getElementById('toastComponent');
        this.toastTitle = document.getElementById('toastTitle');
        this.toastMessage = document.getElementById('toastMsg');
        this.toastIcon = document.querySelector('.toast-icon');
        
        this.hideSpinner();
    }

    async loadAllComponents() {
        try {
            const componentsHtml = await hooks.useFetchAllComponents();
            
            if (!componentsHtml) {
                throw new Error('No components returned from hook');
            }
            
            // Store the components and append the header to the DOM
            this.components = componentsHtml;
            
            // Header is special and should be inserted at the top of the page
            if (this.components.headerComponent) {
                const header = this.components.headerComponent;
                document.body.insertBefore(header, document.body.firstChild);
                
                // Retrieve and store navbar references after insertion
                this.navbar = document.getElementById('mainNavbar');
                this.navbarLinks = document.querySelectorAll('.nav-link');
                this.navbarToggler = document.querySelector('.navbar-toggler');
                this.navbarCollapse = document.querySelector('.navbar-collapse');
                
                console.log('Components: Header component inserted into DOM');
            } else {
                console.error('Components: Header component not loaded');
            }
            
            console.log('Components: All components loaded successfully');
            return this.components;
        } catch (error) {
            console.error('Components: Error loading components:', error);
            throw error;
        }
    }

    appendFooter() {
        if (this.components && this.components.footerComponent) {
            const existingFooter = document.querySelector('footer');
            if (existingFooter) 
                existingFooter.remove();
            
            this.appContainer.appendChild(this.components.footerComponent);
            
        } else {
            console.error("Footer component not available to append");
        }
    }
    
    showToast(type, title, message, duration = 5000) {
        if (!this.toastComponent || !this.toastTitle || !this.toastMessage || !this.toastIcon) {
            console.error('Toast components not found');
            return;
        }
        
        // Clear any existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        // Reset any existing toast classes
        this.toastComponent.classList.remove('toast-error', 'toast-warning', 'toast-success', 'toast-info', 'hide');
        
        // Set toast type class
        if (['error', 'warning', 'success', 'info'].includes(type)) {
            this.toastComponent.classList.add(`toast-${type}`);
        } else {
            // Default to error if type is not recognized
            this.toastComponent.classList.add('toast-error');
            type = 'error';
        }
        
        // Update icon based on type
        let iconClass;
        switch (type) {
            case 'error':
                iconClass = 'bi-exclamation-triangle-fill';
                break;
            case 'warning':
                iconClass = 'bi-exclamation-circle-fill';
                break;
            case 'success':
                iconClass = 'bi-check-circle-fill';
                break;
            case 'info':
                iconClass = 'bi-info-circle-fill';
                break;
            default:
                iconClass = 'bi-exclamation-triangle-fill';
        }
        
        this.toastIcon.className = `bi ${iconClass} toast-icon`;
        
        // Set title and message
        this.toastTitle.textContent = title;
        this.toastMessage.textContent = message;
        
        // Show the toast
        this.toastComponent.classList.remove('d-none');
        
        // Set timeout to hide the toast after duration
        this.toastTimeout = setTimeout(() => {
            this.hideToast();
        }, duration);
    }
    
  
    hideToast() {
        if (this.toastComponent) {
            this.toastComponent.classList.add('hide');
            
            // After animation completes, hide the toast
            setTimeout(() => {
                this.toastComponent.classList.add('d-none');
                this.toastComponent.classList.remove('hide');
            }, 300); // Match the CSS animation duration
        }
    }
    
    showSpinner() {
        if (this.spinnerComponent)
            this.spinnerComponent.classList.remove('d-none');
    }
    
    hideSpinner() {
        if (this.spinnerComponent)
            this.spinnerComponent.classList.add('d-none');
    }
}

const components = new Components();

// // Expose components globally
// window.components = components;
export default components; 