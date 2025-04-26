import utils from './utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    
    // Get the DOM elements
    const statusMsg = document.getElementById('statusMsg');
    const progressBar = document.getElementById('authProgress');
    
    if (!statusMsg || !progressBar) {
        console.error('Callback.js: Could not find required DOM elements');
        return;
    }
    
    utils.startProgressAnimation(progressBar);
    
    try {
        // Get tokens from URL
        const accessToken = utils.getUrlParameter('access_token');
        
        if (accessToken) {
            
            // Save token to cookie with default 40-minute expiration
            utils.setCookie('access_token', accessToken);
            
            // Update status message
            statusMsg.textContent = 'Login successful! Redirecting...';
            
            // Simple redirect to home page - let app.js handle the rest
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            // No tokens found
            console.error('Callback.js: No access token found in URL parameters');
            statusMsg.textContent = 'Authentication failed. Redirecting to login...';
            statusMsg.style.color = '#e74c3c';
            
            // Clear any existing auth data
            utils.deleteCookie('access_token');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        }
    } catch (error) {
        console.error('Callback.js: Error processing authentication:', error);
        if (statusMsg) {
            statusMsg.textContent = 'An error occurred during authentication. Redirecting to login...';
            statusMsg.style.color = '#e74c3c';
        }
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    }
}); 