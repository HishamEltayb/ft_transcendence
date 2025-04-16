document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const accesstoken = getCookie('access_token');
    const refreshToken = getCookie('refresh_token');
    if (!accesstoken || !refreshToken) {
        // If not logged in, redirect to login page
        window.location.href = '/';
        return;
    }

    // Display user information
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = document.getElementById('userInfo');
    
    if (user.username) {
        userInfo.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
        `;
    }

    // Game button functionality
    const playGameBtn = document.getElementById('playGameBtn');
    playGameBtn.addEventListener('click', function() {
        // Use absolute path with leading slash to ensure proper routing
        window.location.href = '/Game/game.html';
    });

    // Logout functionality
    // const logoutBtn = document.getElementById('logoutBtn');
    // logoutBtn.addEventListener('click', function() {
    //     localStorage.removeItem('token');
    //     localStorage.removeItem('user');
    //     window.location.href = '/';
    // });
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        // Clear all authentication data with consistent format
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
           
        // Also clear localStorage items
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        console.log('User logged out, redirecting to login page');
        window.location.href = '/';     
    });
});

// // Old code - only checking for the presence of an access token
// const accesstoken = getCookie('access_token');
// if (accesstoken && window.location.pathname === '/') {
//     window.location.href = '/dashboard.html';
// }

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}