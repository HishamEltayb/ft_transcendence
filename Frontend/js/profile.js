import api from './api.js';
import components from './components.js';
import app from './app.js';
import utils from './utils.js';
import docHandler from './document.js';

class Profile {
    constructor() {
        this.profileForm = {};
        
        // Listen for page shown events
        document.addEventListener('pageShown', (event) => {
            // Initialize profile form when profile page is shown
            if (event.detail.page === 'profile') {
                this.initProfilePage();
            }
        });
    }
    
    // Initialize the profile page
    initProfilePage() {
        // Get profile form elements
        this.profileForm = docHandler.getProfileForm();
        
        // Populate profile form with user data
        this.populateProfileData();
        
        // Initialize 2FA
        this.init2FA();
    }
    
    // Populate the profile form with user data
    populateProfileData() {
        if (!app.state.user) {
            console.warn('No user state found, cannot populate profile data');
            return;
        }
        
        const user = app.state.user;
        
        // Set user profile data
        if (this.profileForm.profileUsername) {
            this.profileForm.profileUsername.textContent = app.getUsername() || 'Username';
        }
        if (this.profileForm.profileAvatar) {
            this.profileForm.profileAvatar.src = app.getUserImg() || '../public/assets/images/default-avatar.png';
        }
        
        // Set form input values
        if (this.profileForm.displayNameField) {
            this.profileForm.displayNameField.value = app.getUsername() || '';
        }
        
        if (this.profileForm.emailField) {
            this.profileForm.emailField.value = app.getEmail() || '';
        }
        
        // Set stats data
        if (this.profileForm.statsTotalGames) {
            this.profileForm.statsTotalGames.textContent = app.getTotalGamesPlayed() || '0';
        }
        
        if (this.profileForm.statsWins) {
            this.profileForm.statsWins.textContent = app.getTotalWins() || '0';
        }
        
        if (this.profileForm.statsLosses) {
            this.profileForm.statsLosses.textContent = app.getTotalLosses() || '0';
        }
        
        if (this.profileForm.statsWinRate) {
            this.profileForm.statsWinRate.textContent = app.getWinRate() ? `${app.getWinRate()}%` : '0%';
        }
        
        if (this.profileForm.statsRank) {
            this.profileForm.statsRank.textContent = app.getRank() || 'Beginner';
        }
        
        // Update 2FA UI based on user state
        this.update2FAUI();
    }
    
    // Update 2FA UI based on user state
    update2FAUI() {
        const is2FAEnabled = app.state.user.is_two_factor_enabled || false;
        const twoFAStatus = document.getElementById('twoFAStatus');
        const enableTwoFABtn = document.getElementById('enableTwoFABtn');
        const disableTwoFABtn = document.getElementById('disableTwoFABtn');
        
        // Update status badge
        if (twoFAStatus) {
            if (is2FAEnabled) {
                twoFAStatus.textContent = 'Enabled';
                twoFAStatus.classList.remove('bg-danger');
                twoFAStatus.classList.add('bg-success');
            } else {
                twoFAStatus.textContent = 'Disabled';
                twoFAStatus.classList.remove('bg-success');
                twoFAStatus.classList.add('bg-danger');
            }
        }
        
        // Show/hide appropriate buttons
        if (enableTwoFABtn && disableTwoFABtn) {
            if (is2FAEnabled) {
                enableTwoFABtn.classList.add('d-none');
                disableTwoFABtn.classList.remove('d-none');
            } else {
                enableTwoFABtn.classList.remove('d-none');
                disableTwoFABtn.classList.add('d-none');
            }
        }
    }
    
    init2FA() {
        // Get elements
        const modal = document.getElementById('twoFAModal');
        const enableBtn = document.getElementById('enableTwoFABtn');
        const disableBtn = document.getElementById('disableTwoFABtn');
        const closeBtn = document.getElementById('twoFACloseButton');
        const form = document.getElementById('twoFAForm');
        
        // Set up enable button
        if (enableBtn) {
            enableBtn.addEventListener('click', () => {
                // Show modal
                if (modal) {
                    // Show QR code section
                    const qrSection = document.getElementById('qrCodeSection');
                    if (qrSection) qrSection.classList.remove('d-none');
                    
                    // Update text
                    const modalText = document.querySelector('.two-fa-text');
                    if (modalText) {
                        modalText.textContent = 'After scanning the QR code, enter the 6-digit verification code from your authenticator app.';
                    }
                    
                    // Show modal
                    modal.classList.remove('d-none');
                    
                    // Fetch QR code
                    this.setup2FA();
                }
            });
        }
        
        // Set up disable button
        if (disableBtn) {
            disableBtn.addEventListener('click', () => {
                // Show modal
                if (modal) {
                    // Hide QR code section
                    const qrSection = document.getElementById('qrCodeSection');
                    if (qrSection) qrSection.classList.add('d-none');
                    
                    // Update text
                    const modalText = document.querySelector('.two-fa-text');
                    if (modalText) {
                        modalText.textContent = 'Enter the 6-digit verification code from your authenticator app to disable 2FA.';
                    }
                    
                    // Show modal
                    modal.classList.remove('d-none');
                }
            });
        }
        
        // Set up form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Determine action based on which button is visible
                if (enableBtn && !enableBtn.classList.contains('d-none')) {
                    this.verify2FACode();
                } else {
                    this.disable2FA();
                }
            });
        }
        
        // Set up close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.classList.add('d-none');
            });
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('d-none');
                }
            });
        }
    }
    
    // Setup 2FA by generating QR code
    setup2FA() {
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        const secretKeyElement = document.getElementById('secretKey');
        const errorElement = document.getElementById('twofa-error');
        
        if (!qrCodeContainer || !secretKeyElement) return;
        
        // Show loading state
        qrCodeContainer.innerHTML = `<div class="spinner-border text-gold" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>`;
        secretKeyElement.textContent = 'Loading...';
        
        // Hide error
        if (errorElement) errorElement.classList.add('d-none');
        
        // Get token
        const accessToken = utils.getCookie('access_token');
        
        // Log API request for debugging
        console.log('Sending 2FA setup request to API');
        
        // Use the API module instead of direct fetch
        
        fetch(`/api/users/2fa/setup/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(data => {
            console.log('2FA setup response:', data);
            
            // Display QR code
            const qrImg = document.createElement('img');
            qrImg.src = data.qr_code;
            qrImg.alt = 'QR Code for 2FA';
            qrImg.className = 'qr-code';
            
            // Clear any existing QR code
            qrCodeContainer.innerHTML = '';
            qrCodeContainer.appendChild(qrImg);
            
            // Display secret key
            secretKeyElement.textContent = data.secret_key;
        })
        .catch(error => {
            console.error('2FA setup error:', error);
            
            qrCodeContainer.innerHTML = '<div class="text-danger">Failed to load QR code</div>';
            secretKeyElement.textContent = 'Error loading secret key';
            
            // Show error
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to set up 2FA';
                errorElement.classList.remove('d-none');
            }
        });
    }
    
    // Verify 2FA code and enable 2FA
    verify2FACode() {
        const codeInput = document.getElementById('twoFACode');
        const errorElement = document.getElementById('twofa-error');
        
        if (!codeInput) return;
        
        const code = codeInput.value;
        
        // Basic validation
        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid 6-digit code';
                errorElement.classList.remove('d-none');
            }
            return;
        }
        
        // Show loading state
        const submitButton = document.querySelector('#twoFAForm button[type="submit"]');
        if (submitButton) {
            const spinner = submitButton.querySelector('[data-spinner]');
            const buttonText = submitButton.querySelector('[data-button-text]');
            
            if (spinner) spinner.classList.remove('d-none');
            if (buttonText) buttonText.textContent = 'Verifying...';
            submitButton.disabled = true;
        }
        
        // Get token
        const accessToken = utils.getCookie('access_token');
        
        // Log API request for debugging
        console.log('Sending 2FA verify request with code:', code);
        
        // Use the API module instead of direct fetch
        api.post('2fa/verify', { otp_token: code }, accessToken)
        .then(data => {
            console.log('2FA verify response:', data);
            
            // Reset button
            if (submitButton) {
                const spinner = submitButton.querySelector('[data-spinner]');
                const buttonText = submitButton.querySelector('[data-button-text]');
                
                if (spinner) spinner.classList.add('d-none');
                if (buttonText) buttonText.textContent = 'Verify';
                submitButton.disabled = false;
            }
            
            if (data.success) {
                // Update user data
                if (app.state.user) {
                    app.state.user.is_two_factor_enabled = true;
                    localStorage.setItem('user', JSON.stringify(app.state.user));
                }
                
                // Update UI
                this.update2FAUI();
                
                // Show success message
                components.showToast('success', '2FA Enabled', 'Two-factor authentication has been successfully enabled.');
                
                // Hide modal
                const modal = document.getElementById('twoFAModal');
                if (modal) modal.classList.add('d-none');
            } else {
                // Show error
                if (errorElement) {
                    errorElement.textContent = data.error || 'Verification failed';
                    errorElement.classList.remove('d-none');
                }
            }
        })
        .catch(error => {
            console.error('2FA verification error:', error);
            
            // Reset button
            if (submitButton) {
                const spinner = submitButton.querySelector('[data-spinner]');
                const buttonText = submitButton.querySelector('[data-button-text]');
                
                if (spinner) spinner.classList.add('d-none');
                if (buttonText) buttonText.textContent = 'Verify';
                submitButton.disabled = false;
            }
            
            // Show error
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to enable 2FA';
                errorElement.classList.remove('d-none');
            }
        });
    }
    
    // Disable 2FA
    disable2FA() {
        const codeInput = document.getElementById('twoFACode');
        const errorElement = document.getElementById('twofa-error');
        
        if (!codeInput) return;
        
        const code = codeInput.value;
        
        // Basic validation
        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid 6-digit code';
                errorElement.classList.remove('d-none');
            }
            return;
        }
        
        // Show loading state
        const submitButton = document.querySelector('#twoFAForm button[type="submit"]');
        if (submitButton) {
            const spinner = submitButton.querySelector('[data-spinner]');
            const buttonText = submitButton.querySelector('[data-button-text]');
            
            if (spinner) spinner.classList.remove('d-none');
            if (buttonText) buttonText.textContent = 'Verifying...';
            submitButton.disabled = true;
        }
        
        // Get token
        const accessToken = utils.getCookie('access_token');
        
        // Log API request for debugging
        console.log('Sending 2FA disable request with code:', code);
        
        // Use the API module instead of direct fetch
        api.post('2fa/disable', { otp_token: code }, accessToken)
        .then(data => {
            console.log('2FA disable response:', data);
            
            // Reset button
            if (submitButton) {
                const spinner = submitButton.querySelector('[data-spinner]');
                const buttonText = submitButton.querySelector('[data-button-text]');
                
                if (spinner) spinner.classList.add('d-none');
                if (buttonText) buttonText.textContent = 'Verify';
                submitButton.disabled = false;
            }
            
            if (data.success) {
                // Update user data
                if (app.state.user) {
                    app.state.user.is_two_factor_enabled = false;
                    localStorage.setItem('user', JSON.stringify(app.state.user));
                }
                
                // Update UI
                this.update2FAUI();
                
                // Show success message
                components.showToast('success', '2FA Disabled', 'Two-factor authentication has been successfully disabled.');
                
                // Hide modal
                const modal = document.getElementById('twoFAModal');
                if (modal) modal.classList.add('d-none');
            } else {
                // Show error
                if (errorElement) {
                    errorElement.textContent = data.error || 'Failed to disable 2FA';
                    errorElement.classList.remove('d-none');
                }
            }
        })
        .catch(error => {
            console.error('Disable 2FA error:', error);
            
            // Reset button
            if (submitButton) {
                const spinner = submitButton.querySelector('[data-spinner]');
                const buttonText = submitButton.querySelector('[data-button-text]');
                
                if (spinner) spinner.classList.add('d-none');
                if (buttonText) buttonText.textContent = 'Verify';
                submitButton.disabled = false;
            }
            
            // Show error
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to disable 2FA';
                errorElement.classList.remove('d-none');
            }
        });
    }
}

export default new Profile(); 