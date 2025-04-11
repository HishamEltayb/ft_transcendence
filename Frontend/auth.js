/**
 * Authentication utility for Transcendence
 * Checks if user is authenticated and redirects to login if not
 */

function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        // If not logged in, redirect to login page
        window.location.href = '/';
        return false;
    }
    return true;
}

// Export the function for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuthentication };
}
