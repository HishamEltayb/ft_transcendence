export const AVAILABLE_PAGES = ['home', 'game', 'login', 'notFound', 'profile'];

export const PAGES = {
    home: '/pages/home.html',
    login: '/pages/login.html',
    game: '/pages/game.html',
    notFound: '/pages/notFound.html',
    profile: '/pages/profile.html'
};

export const COMPONENTS = {
    headerComponent: '/components/header.html',
    footerComponent: '/components/footer.html',
    twoFAComponent: '/components/twoFA.html'
};

export const ENDPOINTS = {
    // Authentication endpoints
    auth: {
        auth42: '/api/users/oauth/42/',
        login: '/api/users/login/',
        register: '/api/users/register/',
        logout: '/api/users/logout/',
        twoFactorAuth: '/api/users/2fa/',

        refreshToken: '/api/users/refresh-token/',
        verifyEmail: '/api/users/verify-email/',
        forgotPassword: '/api/users/forgot-password/',
        resetPassword: '/api/users/reset-password/',
    },
    
    // User endpoints
    user: {
        me: '/api/users/me/',

        // profile: '/api/users/profile/',
        // updateProfile: '/api/users/profile/',
        // changePassword: '/api/users/change-password/',
        // avatar: '/api/users/avatar/',
        // friends: '/api/users/friends/',
        // search: '/api/users/search/',
        // update: '/api/users/profile/update/'
    },
    
    // Game endpoints
    // game: {
    //     create: '/api/games/create/',
    //     join: '/api/games/join/',
    //     status: '/api/games/status/',
    //     history: '/api/games/history/',
    //     leaderboard: '/api/games/leaderboard/'
    // },
    
    // Stats endpoints
    // stats: {
    //     user: '/api/stats/user/',
    //     global: '/api/stats/global/'
    // },
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