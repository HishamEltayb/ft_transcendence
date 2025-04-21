export const AVAILABLE_PAGES = ['home', 'game', 'login', 'profile', 'notFound'];

export const PAGES = {
    homePage: './pages/home.html',
    gamePage: './pages/game.html',
    loginPage: './pages/login.html',
    profilePage: './pages/profile.html',
    notFoundPage: './pages/notFound.html'
};

export const COMPONENTS = {
    headerComponent: './components/header.html',
    footerComponent: './components/footer.html',
    twoFactorModalComponent: './components/twoFactorModal.html'
};

export const ENDPOINTS = {
    // Authentication endpoints
    auth: {
        auth42: '/api/users/oauth/42/',

        login: '/api/users/auth/login',
        register: '/api/users/auth/register',
        logout: '/api/users/auth/logout',
        refreshToken: '/api/users/auth/refresh-token',
        verifyEmail: '/api/users/auth/verify-email',
        forgotPassword: '/api/users/auth/forgot-password',
        resetPassword: '/api/users/auth/reset-password',
        twoFactorAuth: '/api/users/auth/2fa',
    },
    
    // User endpoints
    user: {
        profile: '/api/users/profile',
        updateProfile: '/api/users/profile',
        changePassword: '/api/users/change-password',
        avatar: '/api/users/avatar',
        friends: '/api/users/friends',
        search: '/api/users/search',
        me: '/api/users/me',
        update: '/api/users/profile/update'
    },
    
    // Game endpoints
    game: {
        create: '/api/games/create',
        join: '/api/games/join',
        status: '/api/games/status',
        history: '/api/games/history',
        leaderboard: '/api/games/leaderboard'
    },
    
    // Stats endpoints
    stats: {
        user: '/api/stats/user',
        global: '/api/stats/global'
    },
    
    // Chat endpoints
    chat: {
        messages: '/api/chat/messages',
        send: '/api/chat/send'
    }
}; 