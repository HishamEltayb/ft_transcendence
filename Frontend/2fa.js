// Global variables for API base URL
const API_BASE_URL = '/api/users';

// Helper function to display error messages
function displayError(element, message) {
    if (!element) {
        console.error('Error element not found for message:', message);
        alert(message); // Fallback to alert if element not found
        return;
    }
    element.textContent = message;
    element.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Helper function to display success messages
function displaySuccess(element, message) {
    if (!element) {
        console.error('Success element not found for message:', message);
        alert(message); // Fallback to alert if element not found
        return;
    }
    element.textContent = message;
    element.style.display = 'block';
}

// Function to get a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Check if the user is authenticated
function checkAuthentication() {
    const accessToken = getCookie('access_token');
    if (!accessToken) {
        // Redirect to login page
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Redirect to dashboard
function goToDashboard() {
    window.location.href = '/dashboard.html';
}

// Setup 2FA by generating QR code
function setup2FA() {
    if (!checkAuthentication()) return;
    
    const accessToken = getCookie('access_token');
    const setupError = document.getElementById('setupError');
    
    fetch(`${API_BASE_URL}/2fa/setup/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Failed to set up 2FA');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('2FA setup initiated, QR code received');
        
        // Display QR code
        const qrContainer = document.getElementById('qrCodeContainer');
        const qrImg = document.createElement('img');
        qrImg.src = data.qr_code;
        qrImg.alt = 'QR Code for 2FA';
        qrImg.className = 'qr-code';
        
        // Clear any existing QR code
        qrContainer.innerHTML = '';
        qrContainer.appendChild(qrImg);
        
        // Display secret key
        document.getElementById('secretKey').textContent = data.secret_key;
        
        // Show the QR setup section
        document.getElementById('setupInstructions').classList.add('hidden');
        document.getElementById('qrSetupSection').classList.remove('hidden');
    })
    .catch(error => {
        console.error('2FA setup error:', error);
        displayError(setupError, error.message || 'Failed to set up 2FA');
    });
}

// Verify 2FA code and enable 2FA
function verify2FACode() {
    if (!checkAuthentication()) return;
    
    const accessToken = getCookie('access_token');
    const verificationCode = document.getElementById('verificationCode').value;
    const setupError = document.getElementById('setupError');
    const setupSuccess = document.getElementById('setupSuccess');
    
    if (!verificationCode || verificationCode.length !== 6) {
        displayError(setupError, 'Please enter a valid 6-digit verification code');
        return;
    }
    
    fetch(`${API_BASE_URL}/2fa/verify/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp_token: verificationCode })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Verification failed');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displaySuccess(setupSuccess, 'Two-factor authentication has been successfully enabled!');
            
            // Disable verify button and show "Back to Dashboard" button
            document.getElementById('verifyCodeButton').disabled = true;
            document.getElementById('cancelSetupButton').textContent = 'Back to Dashboard';
            
            // Update user information in localStorage if needed
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData) {
                    userData.is_two_factor_enabled = true;
                    localStorage.setItem('user', JSON.stringify(userData));
                }
            } catch (e) {
                console.error('Error updating user data in localStorage:', e);
            }
        } else {
            throw new Error(data.error || 'Verification failed');
        }
    })
    .catch(error => {
        console.error('2FA verification error:', error);
        displayError(setupError, error.message || 'Failed to verify code');
    });
}

// Disable 2FA
function disable2FA() {
    if (!checkAuthentication()) return;
    
    const accessToken = getCookie('access_token');
    const disableCode = document.getElementById('disableCode').value;
    const disableError = document.getElementById('disableError');
    const disableSuccess = document.getElementById('disableSuccess');
    
    if (!disableCode || disableCode.length !== 6) {
        displayError(disableError, 'Please enter a valid 6-digit verification code');
        return;
    }
    
    fetch(`${API_BASE_URL}/2fa/disable/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp_token: disableCode })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Failed to disable 2FA');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displaySuccess(disableSuccess, 'Two-factor authentication has been successfully disabled!');
            
            // Disable disable button and show "Back to Dashboard" button
            document.getElementById('disableButton').disabled = true;
            
            // Update user information in localStorage if needed
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData) {
                    userData.is_two_factor_enabled = false;
                    localStorage.setItem('user', JSON.stringify(userData));
                }
            } catch (e) {
                console.error('Error updating user data in localStorage:', e);
            }
            
            // Redirect to dashboard after 2 seconds
            setTimeout(goToDashboard, 2000);
        } else {
            throw new Error(data.error || 'Failed to disable 2FA');
        }
    })
    .catch(error => {
        console.error('Disable 2FA error:', error);
        displayError(disableError, error.message || 'Failed to disable 2FA');
    });
}

// Show the right form based on 2FA status
function showCorrectForm() {
    // Get user data from localStorage
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (userData && userData.is_two_factor_enabled) {
            // User has 2FA enabled, show disable form
            document.getElementById('setup2FAForm').classList.add('hidden');
            document.getElementById('disable2FAForm').classList.remove('hidden');
        } else {
            // User doesn't have 2FA enabled, show setup form
            document.getElementById('setup2FAForm').classList.remove('hidden');
            document.getElementById('disable2FAForm').classList.add('hidden');
        }
    } catch (e) {
        console.error('Error parsing user data:', e);
        // Default to setup form if we can't determine status
        document.getElementById('setup2FAForm').classList.remove('hidden');
        document.getElementById('disable2FAForm').classList.add('hidden');
    }
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('2FA page loaded');
    
    // Check authentication
    if (!checkAuthentication()) return;
    
    // Show the correct form based on current 2FA status
    showCorrectForm();
    
    // Setup button event handlers
    document.getElementById('generateQRButton').addEventListener('click', setup2FA);
    document.getElementById('verifyCodeButton').addEventListener('click', verify2FACode);
    document.getElementById('disableButton').addEventListener('click', disable2FA);
    
    // Cancel buttons
    document.getElementById('cancelSetupButton').addEventListener('click', goToDashboard);
    document.getElementById('cancelDisableButton').addEventListener('click', goToDashboard);
});
