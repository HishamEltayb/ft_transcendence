export const AVAILABLE_PAGES = ['home', 'game', 'login', 'notFound'];

export const PAGES = {
    homePage: './pages/home.html',
    gamePage: './pages/game.html',
    loginPage: './pages/login.html',
    notFoundPage: './pages/notFound.html'
};

export const COMPONENTS = {
    headerComponent: './components/header.html',
    footerComponent: './components/footer.html'
};

export const ENDPOINTS = {
    // Authentication endpoints
    auth: {
        auth42: '/api/users/oauth/42/',
        
        logout: '/api/users/logout/',

        login: '/api/users/login/',
        register: '/api/users/register/',
        refreshToken: '/api/users/refresh-token/',
        verifyEmail: '/api/users/verify-email/',
        forgotPassword: '/api/users/forgot-password/',
        resetPassword: '/api/users/reset-password/',
        twoFactorAuth: '/api/users/2fa/',
    },
    
    // User endpoints
    user: {
        profile: '/api/users/profile/',
        updateProfile: '/api/users/profile/',
        changePassword: '/api/users/change-password/',
        avatar: '/api/users/avatar/',
        friends: '/api/users/friends/',
        search: '/api/users/search/',
        me: '/api/users/me/',
        update: '/api/users/profile/update/'
    },
    
    // Game endpoints
    game: {
        create: '/api/games/create/',
        join: '/api/games/join/',
        status: '/api/games/status/',
        history: '/api/games/history/',
        leaderboard: '/api/games/leaderboard/'
    },
    
    // Stats endpoints
    stats: {
        user: '/api/stats/user/',
        global: '/api/stats/global/'
    },
    
    // Chat endpoints
    chat: {
        messages: '/api/chat/messages',
        send: '/api/chat/send'
    }
}; 

export const VALIDATION_INPUTS = {
    username: {
        minLength: 3,
        maxLength: 25,
    },
    email: {
        maxLength: 50,
    },
    password: {
        minLength: 8,
        maxLength: 25
    }
};