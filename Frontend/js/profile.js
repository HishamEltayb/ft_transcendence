import api from './api.js';
import app from './app.js';
import utils from './utils.js';
import components from './components.js';
import { VALIDATION_INPUTS } from './constants.js';

class Profile {
    constructor() {
        this.profileForm = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        document.addEventListener('pageShown', (event) => {
            if (event.detail.page === 'profile')
                this.initProfilePage();
        });
        
        this.initialized = true;
        console.log('Profile module initialized');
    }
    
    getProfileForm() {
        return {
            profileUsername: document.getElementById('profileUsername'),
            profileAvatar: document.getElementById('profileAvatar'),
            displayNameField: document.getElementById('settingDisplayName'),
            emailField: document.getElementById('settingEmail'),
            statsTotalGames: document.getElementById('statsTotalGames'),
            statsWins: document.getElementById('statsWins'),
            statsLosses: document.getElementById('statsLosses'),
            statsWinRate: document.getElementById('statsWinRate'),
            statsRank: document.getElementById('statsRank')
        };
    }
    
    initProfilePage() {
        this.profileForm = this.getProfileForm();
        
        this.populateProfileData();
        
        this.init2FA();
        
        if (this.profileForm.displayNameField) 
            utils.setupInputField(this.profileForm.displayNameField, 'username', VALIDATION_INPUTS, components);
        
        if (this.profileForm.emailField) 
            utils.setupInputField(this.profileForm.emailField, 'email', VALIDATION_INPUTS, components);
    }
    
    populateProfileData() {
        if (!app.state.user) {
            console.warn('No user state found, cannot populate profile data');
            return;
        }
        
        if (this.profileForm.profileUsername)
            this.profileForm.profileUsername.textContent = app.getUsername() || 'Username';
        
        if (this.profileForm.profileAvatar)
            this.profileForm.profileAvatar.src = app.getUserImg() || '../public/assets/icons/avatar.svg';
        
        if (this.profileForm.displayNameField)
            this.profileForm.displayNameField.value = app.getUsername() || '';
        
        if (this.profileForm.emailField)
            this.profileForm.emailField.value = app.getEmail() || '';
        
        if (this.profileForm.statsTotalGames)
            this.profileForm.statsTotalGames.textContent = app.getTotalGamesPlayed() || '0';
        
        if (this.profileForm.statsWins)
            this.profileForm.statsWins.textContent = app.getTotalWins() || '0';
        
        if (this.profileForm.statsLosses)
            this.profileForm.statsLosses.textContent = app.getTotalLosses() || '0';
        
        if (this.profileForm.statsWinRate)
        
        if (this.profileForm.statsRank)
            this.profileForm.statsRank.textContent = app.getRank() || 'Beginner';
        
        this.update2FAUI();
    }
    
    update2FAUI() {
        const is2FAEnabled = app.get2FAState() || false;
        const twoFAStatus = document.getElementById('twoFAStatus');
        const enableTwoFABtn = document.getElementById('enableTwoFABtn');
        const disableTwoFABtn = document.getElementById('disableTwoFABtn');
        
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
        const modal = document.getElementById('twoFAModal');
        const enableBtn = document.getElementById('enableTwoFABtn');
        const disableBtn = document.getElementById('disableTwoFABtn');
        const closeBtn = document.getElementById('twoFACloseButton');
        const form = document.getElementById('twoFAForm');
        
        if (enableBtn) {
            enableBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                let parentForm = enableBtn.closest('form');
                if (parentForm) 
                    parentForm.onsubmit = (e) => e.preventDefault();
                
                if (modal) {
                    const qrSection = document.getElementById('qrCodeSection');
                    if (qrSection) 
                            qrSection.classList.remove('d-none');
                    
                    const modalText = document.querySelector('.two-fa-text');
                    if (modalText)
                        modalText.textContent = 'After scanning the QR code, enter the 6-digit verification code from your authenticator app.';
                    
                    modal.classList.remove('d-none');
                    
                    this.setup2FA();
                }
                
                return false;
            });
        }
        
        if (disableBtn) {
            disableBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                let parentForm = disableBtn.closest('form');
                if (parentForm) 
                    parentForm.onsubmit = (e) => e.preventDefault();
                
                if (modal) {
                    const qrSection = document.getElementById('qrCodeSection');
                    if (qrSection) 
                            qrSection.classList.add('d-none');
                    
                    const modalText = document.querySelector('.two-fa-text');
                    if (modalText)
                        modalText.textContent = 'Enter the 6-digit verification code from your authenticator app to disable 2FA.';
                    
                    modal.classList.remove('d-none');
                }
                
                return false;
            });
        }
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (enableBtn && !enableBtn.classList.contains('d-none')) 
                    this.verify2FACode();
                else 
                    this.disable2FA();
                
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.classList.add('d-none');
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('d-none');
            });
        }
    }
    
    async setup2FA() {
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        const secretKeyElement = document.getElementById('secretKey');
        const errorElement = document.getElementById('twofa-error');
        
        if (!qrCodeContainer || !secretKeyElement) {
            console.error('setup2FA: Required elements not found', { 
                qrCodeContainer: !!qrCodeContainer, 
                secretKeyElement: !!secretKeyElement 
            });
            return;
        }
        
        
        qrCodeContainer.innerHTML = `<div class="spinner-border text-gold" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>`;
        secretKeyElement.textContent = 'Loading...';
        
        if (errorElement) errorElement.classList.add('d-none');
        
        try {
            const response = await api.setup2FA();
            
            if (!response || !response.qr_code || !response.secret_key) 
                components.showToast('error', '2FA Setup Error', response.error || 'Failed to set up 2FA');
            
            const qrImg = document.createElement('img');
            qrImg.src = response.qr_code;
            qrImg.alt = 'QR Code for 2FA';
            qrImg.className = 'qr-code';
            
            qrCodeContainer.innerHTML = '';
            qrCodeContainer.appendChild(qrImg);
            
            secretKeyElement.textContent = response.secret_key;
        } catch (error) {
            qrCodeContainer.innerHTML = '<div class="text-danger">Failed to load QR code</div>';
            secretKeyElement.textContent = 'Error loading secret key';
            
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to set up 2FA';
                errorElement.classList.remove('d-none');
            }
        }
    }
    
    async verify2FACode() {
        const codeInput = document.getElementById('twoFACode');
        const errorElement = document.getElementById('twofa-error');
        const submitButton = document.querySelector('#twoFAForm button[type="submit"]');
        
        if (!codeInput) return;
        
        const code = codeInput.value;
        
        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid 6-digit code';
                errorElement.classList.remove('d-none');
            }
            return;
        }
        
        utils.setFormLoading(submitButton, true);
        
        try {
            const data = await api.verify2FA(code);
            
            utils.setFormLoading(submitButton, false);
            
            if (data.success) {
                if (app.state.user) {
                    app.state.user.is_two_factor_enabled = true;
                    localStorage.setItem('user', JSON.stringify(app.state.user));
                }
                
                this.update2FAUI();
                
                components.showToast('success', '2FA Enabled', 'Two-factor authentication has been successfully enabled.');
                
                const modal = document.getElementById('twoFAModal');
                if (modal) modal.classList.add('d-none');
            } else {
                if (errorElement) {
                    errorElement.textContent = data.error || 'Verification failed';
                    errorElement.classList.remove('d-none');
                }
            }
        } catch (error) {
            components.showToast('error', '2FA Verification Error', error.message || 'Failed to verify 2FA');
            
            utils.setFormLoading(submitButton, false);
            
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to enable 2FA';
                errorElement.classList.remove('d-none');
            }
        }
    }
    
    async disable2FA() {
        const codeInput = document.getElementById('twoFACode');
        const errorElement = document.getElementById('twofa-error');
        const submitButton = document.querySelector('#twoFAForm button[type="submit"]');
        
        if (!codeInput) return;
        
        const code = codeInput.value;
        
        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid 6-digit code';
                errorElement.classList.remove('d-none');
            }
            return;
        }
        
        utils.setFormLoading(submitButton, true);
        
        try {
            const data = await api.disable2FA(code);
            
            utils.setFormLoading(submitButton, false);
            
            if (data.success) {
                if (app.state.user) {
                    app.state.user.is_two_factor_enabled = false;
                    localStorage.setItem('user', JSON.stringify(app.state.user));
                }
                
                this.update2FAUI();
                
                components.showToast('success', '2FA Disabled', 'Two-factor authentication has been successfully disabled.');
                
                const modal = document.getElementById('twoFAModal');
                if (modal) modal.classList.add('d-none');
            } else {
                if (errorElement) {
                    errorElement.textContent = data.error || 'Failed to disable 2FA';
                    errorElement.classList.remove('d-none');
                }
            }
        } catch (error) {
            components.showToast('error', '2FA Disable Error', error.message || 'Failed to disable 2FA');
            
            utils.setFormLoading(submitButton, false);
            
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to disable 2FA';
                errorElement.classList.remove('d-none');
            }
        }
    }
}

export default new Profile(); 