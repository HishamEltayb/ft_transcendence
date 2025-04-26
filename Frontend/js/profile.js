import api from './api.js';
import components from './components.js';
import app from './app.js';
import utils from './utils.js';
import docHandler from './document.js';
import router from './router.js';

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
    }
    
    // Populate the profile form with user data
    populateProfileData() {
        if (!app.state.user) {
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
            this.profileForm.displayNameField.value = user.username || '';
        }
        
        if (this.profileForm.emailField) {
            this.profileForm.emailField.value = user.email || '';
        }
        
        // Set stats data
        if (this.profileForm.statsTotalGames) {
            this.profileForm.statsTotalGames.textContent = user.total_games || '0';
        }
        
        if (this.profileForm.statsWins) {
            this.profileForm.statsWins.textContent = user.wins || '0';
        }
        
        if (this.profileForm.statsLosses) {
            this.profileForm.statsLosses.textContent = user.losses || '0';
        }
        
        if (this.profileForm.statsWinRate) {
            this.profileForm.statsWinRate.textContent = user.win_rate ? `${user.win_rate}%` : '0%';
        }
        
        if (this.profileForm.statsRank) {
            this.profileForm.statsRank.textContent = user.rank || 'Beginner';
        }
        
        // Set 2FA toggle state
        if (this.profileForm.twoFASwitch) {
            this.profileForm.twoFASwitch.checked = app.getIs2FAEnabled ? app.getIs2FAEnabled() : false;
        }
    }
}

export default new Profile(); 