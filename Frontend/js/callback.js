import utils from './utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    
    const statusMsg = document.getElementById('statusMsg');
    const progressBar = document.getElementById('authProgress');
    
    if (!statusMsg || !progressBar) {
        console.error('Callback.js: Could not find required DOM elements');
        return;
    }
    
    utils.startProgressAnimation(progressBar);
    
    try {
        const accessToken = utils.getUrlParameter('access_token');
        const refreshToken = utils.getUrlParameter('refresh_token');
        
        if (accessToken) {
            utils.setCookie('access_token', accessToken);
            utils.setCookie('refresh_token', refreshToken);
            
            statusMsg.textContent = 'Login successful! Redirecting...';
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            console.error('Callback.js: No access token found in URL parameters');
            statusMsg.textContent = 'Authentication failed. Redirecting to login...';
            statusMsg.style.color = '#e74c3c';
            
            utils.deleteCookie('access_token');
            
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
        
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    }
}); 