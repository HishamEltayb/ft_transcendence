/**
 * Game authentication check
 * Verifies that the user is authenticated before allowing access to the game
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Game auth check running...');
    
    // Check if JWT access token exists
    const accessToken = getCookie('access_token');
    console.log('Game auth check - Access token:', accessToken ? 'Present' : 'Missing');
    
    if (!accessToken) {
        console.error('Missing access token, redirecting to login');
        // Clear any partial authentication state
        clearAuthState();
        // Redirect to login with message
        sessionStorage.setItem('redirectMessage', 'Please log in to play the game');
        window.location.href = '/';
        return;
    }
    
    // Verify user data exists in localStorage
    const userData = localStorage.getItem('user');
    console.log('User data found:', userData ? 'Yes' : 'No');
    console.log('User data content:', userData);
    
    if (!userData) {
        console.error('No user data found in localStorage');
        // Invalid session state - clear and redirect
        clearAuthState();
        sessionStorage.setItem('redirectMessage', 'Session error. Please log in again');
        window.location.href = '/';
        return;
    }
    
    try {
        // Try to parse user data to verify it's valid JSON
        const user = JSON.parse(userData);
        if (!user.username) {
            throw new Error('Invalid user data - no username');
        }
        
        // If code execution reaches here, authentication is successful
        console.log('Authentication successful for user:', user.username);
        
        // Set player name if available
        const player1NameInput = document.getElementById('player1NameInput');
        const player1Name = document.getElementById('player1Name');
        
        if (player1NameInput && user.username) {
            player1NameInput.value = user.username;
        }
        
        if (player1Name && user.username) {
            player1Name.textContent = user.username;
        }
        
    } catch (e) {
        console.error('Error parsing user data:', e);
        // Invalid JSON data - clear all authentication data
        clearAuthState();
        sessionStorage.setItem('redirectMessage', 'Session error. Please log in again');
        window.location.href = '/';
    }
});

/**
 * Clears all authentication-related data
 */
function clearAuthState() {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    localStorage.removeItem('user');
}

/**
 * Gets a cookie value by name
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
