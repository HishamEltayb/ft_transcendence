/**
 * Authentication utility for Transcendence
 * Checks if user is authenticated and redirects to login if not
 */

function checkAuthentication() {
    const accesstoken = getCookie('access_token');
    const refreshToken = getCookie('refresh_token');
    if (!accesstoken || !refreshToken) {
        // If not logged in, redirect to login page
        window.location.href = '/';
        return;
    }
    return true;
}

// Export the function for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuthentication };
}


// Check if user is logged in
