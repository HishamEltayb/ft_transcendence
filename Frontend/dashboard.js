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
    
    // Display 2FA status
    const twoFactorStatus = document.getElementById('twoFactorStatus');
    if (twoFactorStatus) {
        if (user.is_two_factor_enabled) {
            twoFactorStatus.innerHTML = `
                <div class="status-badge enabled">
                    <span class="status-icon">✓</span>
                    Two-factor authentication is enabled
                </div>
                <p>Your account is protected with an additional layer of security.</p>
            `;
        } else {
            twoFactorStatus.innerHTML = `
                <div class="status-badge disabled">
                    <span class="status-icon">!</span>
                    Two-factor authentication is not enabled
                </div>
                <p>Add an extra layer of security to your account by enabling 2FA.</p>
            `;
        }
    }

    // 2FA management button functionality
    const manage2FABtn = document.getElementById('manage2FABtn');
    if (manage2FABtn) {
        manage2FABtn.addEventListener('click', function() {
            window.location.href = '/2fa-setup.html';
        });
    }

    // Game button functionality
    const playGameBtn = document.getElementById('playGameBtn');
    playGameBtn.addEventListener('click', function() {
        fetch('/api/users/2fa/status/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accesstoken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to check 2FA status');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.is_two_factor_enabled) {
                alert('You must enable 2FA authentication to play the game!');
                return;
            }
            window.location.href = '/Game/game.html';
        })
        .catch(error => {
            console.error('2FA status check error:', error);
            alert('Error checking 2FA status, please try again later!');
            return;
        });
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        // Clear all authentication data with consistent format
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        // Also clear localStorage items
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Redirect to login page
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