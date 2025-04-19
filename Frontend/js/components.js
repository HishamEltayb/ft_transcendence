import hooks from './hooks.js';


class Components {
    constructor() {
        this.appContainer = null;

        this.spinnerComponent = null;
        this.headerComponent = null;
        this.footerComponent = null;
    }
    
    init(appContainer) {
        this.appContainer = appContainer;
        
        this.spinnerComponent = document.getElementById('spinner-container');
        
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
    
    showSpinner() {
        if (this.spinnerComponent)
            this.spinnerComponent.classList.remove('hidden');
    }
    
    hideSpinner() {
        if (this.spinnerComponent)
            this.spinnerComponent.classList.add('hidden');
    }
}

const components = new Components();

// Expose components globally
window.components = components;
export default components; 