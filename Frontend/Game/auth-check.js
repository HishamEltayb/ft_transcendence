/**
 * Game authentication check
 * Verifies that the user is authenticated before allowing access to the game
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        // If not logged in, redirect to login page with a message
        sessionStorage.setItem('redirectMessage', 'Please log in to play the game');
        window.location.href = '/';
        return;
    }
    
    // Verify user data exists
    const userData = localStorage.getItem('user');
    if (!userData) {
        // Invalid session state - clear and redirect
        localStorage.removeItem('token');
        sessionStorage.setItem('redirectMessage', 'Session error. Please log in again');
        window.location.href = '/';
        return;
    }
    
    try {
        // Try to parse user data to verify it's valid JSON
        const user = JSON.parse(userData);
        if (!user.username) {
            throw new Error('Invalid user data');
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
        // Invalid JSON data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.setItem('redirectMessage', 'Session error. Please log in again');
        window.location.href = '/';
    }
});
