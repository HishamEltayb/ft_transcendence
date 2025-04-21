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
            console.log('Components: Loading all components');
            
            // Load components using hooks
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
            
            // Check if the 2FA modal component was loaded
            if (this.components.twoFAModalComponent) {
                // Append the 2FA modal to the DOM
                document.body.appendChild(this.components.twoFAModalComponent);
                console.log('Components: 2FA modal component inserted into DOM');
                
                // Check it's actually in the DOM
                const twoFAModalCheck = document.getElementById('twoFAModal');
                if (twoFAModalCheck) {
                    console.log('Components: 2FA modal successfully added to the DOM');
                } else {
                    console.error('Components: 2FA modal not found in DOM after insertion!');
                }
            } else {
                console.error('Components: 2FA modal component not loaded');
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
    
    // Initialize the 2FA modal
    initializeTwoFAModal() {
        const twoFAForm = document.querySelector('#twoFAForm');
        const verificationCodeInput = document.querySelector('#verificationCode');
        const feedbackElement = document.querySelector('#twoFAFeedback');
        
        if (!twoFAForm || !verificationCodeInput) {
            console.error('Two-Factor Authentication form elements not found');
            return;
        }
        
        // Add input validation for numeric 6-digit code
        verificationCodeInput.addEventListener('input', (event) => {
            const value = event.target.value;
            
            // Allow only numeric input and limit to 6 digits
            if (!/^\d*$/.test(value)) {
                event.target.value = value.replace(/\D/g, '');
            }
            
            if (value.length > 6) {
                event.target.value = value.slice(0, 6);
            }
            
            // Validate as user types - show feedback when 6 digits entered
            if (value.length === 6) {
                verificationCodeInput.classList.remove('is-invalid');
                verificationCodeInput.classList.add('is-valid');
            } else if (value.length > 0) {
                verificationCodeInput.classList.remove('is-valid');
                verificationCodeInput.classList.add('is-invalid');
                feedbackElement.textContent = 'Please enter a 6-digit verification code';
                feedbackElement.classList.add('text-danger');
            } else {
                verificationCodeInput.classList.remove('is-valid', 'is-invalid');
                feedbackElement.textContent = '';
            }
        });
        
        twoFAForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const verificationCode = verificationCodeInput.value.trim();
            
            // Basic validation
            if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
                verificationCodeInput.classList.add('is-invalid');
                feedbackElement.textContent = 'Please enter a valid 6-digit verification code';
                feedbackElement.classList.add('text-danger');
                return;
            }
            
            // Show loading state
            const submitButton = twoFAForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';
            
            try {
                // Use the Hooks useVerify2FA method to verify the code
                const hooks = new Hooks();
                const result = await hooks.useVerify2FA(verificationCode);
                
                if (result.success) {
                    // Show success message
                    feedbackElement.textContent = 'Verification successful';
                    feedbackElement.classList.remove('text-danger');
                    feedbackElement.classList.add('text-success');
                    
                    // Reset form and close modal after a short delay
                    setTimeout(() => {
                        // Close the modal
                        const twoFAModal = bootstrap.Modal.getInstance(document.getElementById('twoFAModal'));
                        if (twoFAModal) {
                            twoFAModal.hide();
                        }
                        
                        // Reset the form
                        twoFAForm.reset();
                        verificationCodeInput.classList.remove('is-valid', 'is-invalid');
                        feedbackElement.textContent = '';
                        
                        // Optionally redirect or update UI based on successful verification
                        // For example, redirect to profile or dashboard
                        window.location.href = '/#/profile';
                    }, 1500);
                } else {
                    // Show error message
                    feedbackElement.textContent = result.error || 'Verification failed. Please try again.';
                    feedbackElement.classList.add('text-danger');
                    verificationCodeInput.classList.add('is-invalid');
                }
            } catch (error) {
                console.error('Error during 2FA verification:', error);
                feedbackElement.textContent = 'An error occurred during verification. Please try again.';
                feedbackElement.classList.add('text-danger');
            } finally {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
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