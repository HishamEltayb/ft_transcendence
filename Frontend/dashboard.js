document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
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
        window.location.href = 'Game/game.html';
    });

    // Tournament button functionality
    const tournamentBtn = document.getElementById('tournamentBtn');
    tournamentBtn.addEventListener('click', function() {
        window.location.href = 'Tournament/tournament.html';
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });
});