export const AVAILABLE_PAGES = ['home', 'game', 'login', 'profile', 'notFound', 'twoFA'];

export const PAGES = {
    home: '/pages/home.html',
    login: '/pages/login.html',
    game: '/pages/game.html',
    notFound: '/pages/notFound.html',
    profile: '/pages/profile.html',
    twoFA: '/pages/twoFA.html'
};

export const TOAST_TYPES = ['error', 'warning', 'success', 'info'];

export const ENDPOINTS = {
    auth: {
        auth42: '/api/users/oauth/42/',
        login: '/api/users/login/',
        register: '/api/users/register/',
        logout: '/api/users/logout/',
        setup2FA: '/api/users/2fa/setup/',
        verify2FA: '/api/users/2fa/verify/',
        disable2FA: '/api/users/2fa/disable/',
        refreshToken: '/api/users/token/refresh/',
    },
    user: {
        me: '/api/users/me/',
    },
    // game: {
    //     create: '/api/games/create/',
    //     join: '/api/games/join/',
    //     status: '/api/games/status/',
    //     history: '/api/games/history/',
    //     leaderboard: '/api/games/leaderboard/'
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