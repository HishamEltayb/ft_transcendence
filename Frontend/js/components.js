import hooks from './hooks.js';


class Components {
    constructor() {
        this.appContainer = null;

        this.spinnerComponent = null;
        this.headerComponent = null;
        this.footerComponent = null;
        this.toastComponent = null;
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
        this.showSpinner();
        
        try {
            const componentResults = await hooks.useFetchAllComponents();
            
            // Store header and footer references
            this.headerComponent = componentResults.headerComponent;
            this.footerComponent = componentResults.footerComponent;

            // Add header to app container
            this.appContainer.appendChild(this.headerComponent);

            this.hideSpinner();
            
        } catch (error) {
            console.error("Failed to load components:", error);
            this.hideSpinner();
        }
    }

    appendFooter() {
        if (this.footerComponent) {
            const existingFooter = document.querySelector('footer');
            if (existingFooter) 
                existingFooter.remove();
            
            this.appContainer.appendChild(this.footerComponent);
            
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

// Expose components globally
window.components = components;
export default components; 