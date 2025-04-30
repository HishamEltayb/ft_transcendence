import api from './api.js';
import utils from './utils.js';
import login from './login.js';
import twoFA from './twoFA.js';
import pages from './pages.js';
import game from './game.js';
import router from './router.js';
import profile from './profile.js';
import register from './register.js';
import components from './components.js';

class App {
    constructor() {
        this.appContainer = null;
        this.initialized = false;
        this.logoutInitialized = false;

        this.state = {
            user: null,
            isAuthenticated: false,
        };
    }
    
    async init() {
        this.appContainer = document.getElementById('App');
        
        if (!this.appContainer) {
            console.error("App: Container not found!");
            return false;
        }
        
        try {
            this.resetAppContainer();
            
            components.showSpinner();
            components.init(this.appContainer);
            
            
            pages.init(this.appContainer);
            await pages.loadAllPages();
            
            login.init();
            register.init();
            twoFA.init();
            profile.init();
            
            this.registerRoutes();
            
            await router.init();
            
            this.initialized = true;
            
            await this.checkAuthState();
            
            utils.initLogoutButton(this);
            
            document.dispatchEvent(new CustomEvent('appInitialized', {
                detail: { app: this }
            }));
            
            return true;
        } catch (error) {
            components.showToast(
                'error',
                'Application Error',
                'There was a problem loading the application. Please refresh the page.',
                5000
            );
            return false;
        } finally {
            components.hideSpinner();
        }
    }
    
    resetAppContainer() {
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
    }
    
    registerRoutes() {
        router.registerRoutes({
            '/': () => {
                if (this.get2FAState() && !this.getIsAuthenticated()) {
                    pages.showPage('twoFA');
                    login.updateUIAuthState();
                    return;
                }
                pages.showPage('home');
                login.updateUIAuthState();
            },
            
            '/home': () => {
                if (this.get2FAState() && !this.getIsAuthenticated()) {
                    pages.showPage('twoFA');
                    login.updateUIAuthState();
                    return;
                }
                pages.showPage('home');
                login.updateUIAuthState();
            },
            
            '/login': async () => {
                if (this.get2FAState() && !this.getIsAuthenticated()) {
                    pages.showPage('twoFA');
                    login.updateUIAuthState();
                    return;
                }

                components.showSpinner();
                
                try {
                    if (this.state.user) {
                        components.showToast('info', 'Already Logged In', 'You are already logged in.');
                        router.navigate('/profile');
                        return;
                    }
                    
                    const result = await api.getUserData();
                    
                    if (result.success && result.userData) {
                        this.state.user = result.userData;
                        this.state.isAuthenticated = result.isAuthenticated;
                        login.updateUIAuthState();
                        components.showToast('info', 'Session Restored', 'Your session has been restored.');
                        router.navigate('/profile');
                        return;
                    } else {
                        pages.showPage('login');
                        
                        login.renderForms();
                        register.renderForms();
                        
                        login.updateUIAuthState();
                    }
                } catch (error) {
                    pages.showPage('login');
                    
                    login.renderForms();
                    register.renderForms();
                    
                    login.updateUIAuthState();
                } finally {
                    components.hideSpinner();
                }
            },
            
            '/game': async () => {
                if (this.get2FAState() && !this.getIsAuthenticated()) {
                    pages.showPage('twoFA');
                    login.updateUIAuthState();
                    return;
                }

                components.showSpinner();
                
                try {
                    if (this.state.user) {
                        pages.showPage('game');
                        login.updateUIAuthState();
                        game.init(
                            this.getUsername(),
                            this.setMatch.bind(this),
                            this.setTournament.bind(this)
                        );
                        return;
                    }
                    
                    const result = await api.getUserData();
                    
                    if (result.success && result.userData) {
                        this.state.user = result.userData;
                        this.state.isAuthenticated = result.isAuthenticated;
                        login.updateUIAuthState();
                        pages.showPage('game');
                        game.init(
                            this.getUsername(),
                            this.setMatch.bind(this),
                            this.setTournament.bind(this)
                        );
                    } else {
                        components.showToast('warning', 'Authentication Required', 'Please log in to play the game.');
                        router.navigate('/login');
                    }
                } catch (error) {
                    components.showToast('error', 'Authentication Error', 'An error occurred while checking authentication.');
                    router.navigate('/login');
                } finally {
                    components.hideSpinner();
                }
            },
            
            '/profile': async () => {
                if (this.get2FAState() && !this.getIsAuthenticated()) {
                    pages.showPage('twoFA');
                    login.updateUIAuthState();
                    return;
                }
                
                components.showSpinner();
                
                try {
                    // if (this.state.user) {
                    //     pages.showPage('profile');
                    //     login.updateUIAuthState();
                    //     return;
                    // }
                    
                    const result = await api.getUserData();
                    
                    if (result.success && result.userData) {
                        this.state.user = result.userData;
                        this.state.isAuthenticated = result.isAuthenticated;
                        login.updateUIAuthState();
                        pages.showPage('profile');
                    } else {
                        components.showToast('warning', 'Authentication Required', 'Please log in to view your profile.');
                        router.navigate('/login');
                    }
                } catch (error) {
                    components.showToast('error', 'Authentication Error', 'An error occurred while checking authentication.');
                    router.navigate('/login');
                } finally {
                    components.hideSpinner();
                }
            },

            '/twoFA': async () => {
                components.showSpinner();
                
                try {
                    if (this.state.isAuthenticated) {
                        components.showToast('info', 'Already Authenticated', 'You are already verified.');
                        router.navigate('/');
                        return;
                    }
                    
                    if (!this.state.user) {
                        const result = await api.getUserData();
                        
                        if (result.success && result.userData) {
                            this.state.user = result.userData;
                            this.state.isAuthenticated = result.isAuthenticated;
                            login.updateUIAuthState();
                            
                            if (this.state.isAuthenticated) {
                                components.showToast('info', 'Already Authenticated', 'You are already verified.');
                                router.navigate('/');
                                return;
                            }
                        } else {
                            components.showToast('warning', 'Authentication Required', 'Please log in to set up 2FA.');
                            router.navigate('/login');
                            return;
                        }
                    }
                    
                    pages.showPage('twoFA');
                    login.updateUIAuthState();
                } catch (error) {
                    components.showToast('error', 'Authentication Error', 'An error occurred while checking authentication.');
                    router.navigate('/login');
                } finally {
                    components.hideSpinner();
                }
            },
            
            '*': () => {
                pages.showPage('notFound');
                login.updateUIAuthState();
            }
        });
    }
    
    async checkAuthState() {
        try {
            const result = await api.getUserData();
            
            if (result.success && result.userData) {
                this.state.user = result.userData;
                this.state.isAuthenticated = result.isAuthenticated;
                login.updateUIAuthState();
                utils.initLogoutButton(this);

                if (this.get2FAState() && !this.getIsAuthenticated()) 
                    router.navigate('/twoFA');
            } else {
                this.state.user = null;
            }
        } catch (error) {
            this.state.user = null;
        }
    }

    async logout() {
        components.showSpinner();
        
        try {
            await api.logout();
            
            this.state.user = null;
            
            login.updateUIAuthState();
            
            components.showToast('success', 'Logged Out', 'You have been successfully logged out.');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
            return true;
        } catch (error) {
            
            this.state.user = null;
            login.updateUIAuthState();
            
            components.showToast('warning', 'Logout Status', 'You have been logged out, but there was an issue with the server.');
       
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
            return false;
        } finally {
            components.hideSpinner();
        }
    }
    
    getState() {
        return this.state;
    }

    getUser() {
        if (this.state.user)
            return this.state.user;
        const storedUser = localStorage.getItem('user');
        if (!storedUser) 
            return null;
        try {
            return JSON.parse(storedUser);
        } catch (err) {
            console.error('Error parsing stored user from localStorage:', err);
            return null;
        }
    }

    getUserImg() {
        return this.state.user?.profile_image || '';
    }

    getUsername() {
        return this.state.user?.username || '';
    }

    getEmail() {
        return this.state.user?.email || '';
    }

    getIs42User() {
        return !!this.state.user?.is_oauth_user;
    }

    getTotalGamesPlayed() {
        return this.state.user?.total_games || 0;
    }

    getTotalWins() {
        return this.state.user?.wins || 0;
    }

    getWinRate() {
        return this.state.user?.win_rate || 0;
    }

    getTotalLosses() {
        return this.state.user?.losses || 0;
    }

    getRank() {
        return this.state.user?.rank || '';
    }

    get2FAState() {
        return !!this.state.user?.is_two_factor_enabled;
    }
    
    getIsAuthenticated() {
        if (!this.state.user) return false;
        return !!this.state.isAuthenticated;
    }

    initmatchHistoryArray() {
        if (!this.state.user) return;
        if (!Array.isArray(this.state.user.matchHistory)) {
            this.state.user.matchHistory = [];
        }
    }

    async setMatch(matchObj) {
        const result = await api.submitMatch(matchObj);

        if (!result.success) {
            components.showToast('error', 'Match Submission Error', 'An error occurred while submitting the match.');
            return;
        }

        this.initmatchHistoryArray();
        this.state.user.matchHistory.push(matchObj);
        localStorage.setItem('user', JSON.stringify(this.state.user));
    }

    async setTournament(matchArray) {
        const result = await api.createTournament(matchArray);

        if (!result.success) {
            components.showToast('error', 'Tournament Submission Error', 'An error occurred while submitting the tournament.');
            return;
        }

        this.initmatchHistoryArray();
        this.state.user.matchHistory.push(matchArray);
        localStorage.setItem('user', JSON.stringify(this.state.user));
    }
}

const app = new App();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.init();
    } catch (error) {
        if (components && components.hideSpinner) {
            components.hideSpinner();
        }
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const videoElement = document.querySelector('video');
        if (videoElement) {
        }
    }
});

export default app;


