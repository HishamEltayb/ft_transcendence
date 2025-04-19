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

// Function to get a cookie by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Store tokens after login
function login(username, password, otpToken, loginError) {
    console.log('Login function called with API URL:', `${API_BASE_URL}/login/`);
    
    // Prepare request body - only include OTP if provided
    const requestBody = { username, password };
    if (otpToken) {
        requestBody.otp_token = otpToken;
    }
    
    fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log('Login response status:', response.status);
        if (!response.ok && response.status !== 200) {
            return response.json().then(data => {
                console.error('Login error details:', data);
                throw new Error(data.error || 'Login failed');
            });
        }
        return response.json();
    })
    .then(data => {
        // Check if 2FA verification is required
        if (data.require_2fa) {
            console.log('2FA required for login, showing OTP input');
            // Show 2FA verification form
            showOtpVerificationForm(username, password, data.user_id);
            return; // Stop here, wait for OTP verification
        }
        
        console.log('Login successful, received data:', data);
        // Save tokens to cookies
        document.cookie = `access_token=${data.access}; SameSite=Strict; Path=/`;
        document.cookie = `refresh_token=${data.refresh}; SameSite=Strict; Path=/`;
        
        // Fetch user data using the access token
        console.log('Fetching user data from API...');
        
        // Get username from login/register form for the basic user data
        const formUsername = username; // This comes from the login function parameters
        
        // Use the user data already returned from login if available
        if (data.user) {
            console.log('User data received with login response:', data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
            return;
        }
        
        // Otherwise fetch user details from the Django backend
        return fetch(`${API_BASE_URL}/me/`, { // UserDetailView endpoint in your Django backend
            headers: {
                'Authorization': `Bearer ${data.access}`
            }
        })
        .then(response => {
            console.log('User API response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch user data: ${response.status}`);
            }
            return response.json();
        })
        .then(userData => {
            console.log('User data retrieved:', userData);
            
            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            
            // Create a simple user object from the username used to login
            const simpleUser = { 
                username: formUsername,
                email: ''
            };
            
            console.log('Using simple user data:', simpleUser);
            localStorage.setItem('user', JSON.stringify(simpleUser));
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        });
    })
    .catch(error => {
        console.error('Login error:', error);
        displayError(loginError, error.message || 'Invalid username or password');
    });
}

// Display 2FA verification form
function showOtpVerificationForm(username, password, userId) {
    console.log('Showing 2FA verification form for user:', username);
    
    // Hide login and register forms
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    
    // Check if 2FA form already exists, if not create it
    let otpForm = document.getElementById('otpVerificationForm');
    
    if (!otpForm) {
        // Create the 2FA verification form
        otpForm = document.createElement('div');
        otpForm.id = 'otpVerificationForm';
        otpForm.className = 'auth-form';
        otpForm.innerHTML = `
            <h2>Two-Factor Authentication</h2>
            <p>Please enter the 6-digit verification code from your authenticator app.</p>
            <div class="form-group">
                <label for="otpCode">Verification Code</label>
                <input type="text" id="otpCode" name="otpCode" maxlength="6" required>
            </div>
            <div class="error-message" id="otpError"></div>
            <button type="button" id="verifyOtpButton">Verify</button>
            <button type="button" id="cancelOtpButton" class="secondary-button">Cancel</button>
        `;
        
        // Add the form to the container
        document.querySelector('.container').appendChild(otpForm);
        
        // Add event listeners for the new buttons
        document.getElementById('verifyOtpButton').addEventListener('click', function() {
            const otpCode = document.getElementById('otpCode').value;
            if (!otpCode || otpCode.length !== 6) {
                displayError(document.getElementById('otpError'), 'Please enter a valid 6-digit code');
                return;
            }
            
            // Submit the OTP for verification
            login(username, password, otpCode, document.getElementById('otpError'));
        });
        
        document.getElementById('cancelOtpButton').addEventListener('click', function() {
            // Hide OTP form and show login form again
            otpForm.classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
        });
    } else {
        // Just show the existing form
        otpForm.classList.remove('hidden');
    }
}

// Ensure this code runs when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing authentication page');
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const loginWith42Button = document.getElementById('loginWith42Button');
    
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    
    // Check for redirect messages (e.g., from game auth protection)
    const redirectMessage = sessionStorage.getItem('redirectMessage');
    if (redirectMessage) {
        displayError(loginError, redirectMessage);
        // Clear the message after displaying
        sessionStorage.removeItem('redirectMessage');
    }
    
    // Toggle between login and register forms
    showRegister.onclick = function(e) {
        console.log('Show register form clicked');
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    };
    
    showLogin.onclick = function(e) {
        console.log('Show login form clicked');
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    };
    
    // 42 OAuth Login functionality
    function handle42Login() {
        console.log('Login with 42 button clicked');
        // Redirect to the backend route for 42 OAuth
        fetch(`${API_BASE_URL}/oauth/42/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        })
        .then(response => {
            console.log('42 OAuth response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('42 OAuth error details:', text);
                    throw new Error('Failed to initiate 42 login: ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('42 OAuth successful, redirecting to:', data.auth_url);
            // Redirect to the 42 OAuth authorization URL
            window.location.href = data.auth_url;
        })
        .catch(error => {
            console.error('42 OAuth Error:', error);
            displayError(loginError, 'Failed to connect to 42 authentication service');
        });
    }
    
    // Attach 42 login button click handler
    // Attach 42 login button click handler
    loginWith42Button.onclick = function() {
        console.log('Login with 42 button clicked');
        // Redirect to the backend route for 42 OAuth
        fetch(`${API_BASE_URL}/oauth/42/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        })
        .then(response => {
            console.log('42 OAuth response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('42 OAuth error details:', text);
                    throw new Error('Failed to initiate 42 login: ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('42 OAuth successful, redirecting to:', data.auth_url);
            // Redirect to the 42 OAuth authorization URL
            window.location.href = data.auth_url;
        })
        .catch(error => {
            console.error('42 OAuth Error:', error);
            displayError(loginError, 'Failed to connect to 42 authentication service');
        });
    };

    // Use token for authenticated requests
    function getProtectedData() {
        fetch(`${API_BASE_URL}/me/`, {
            headers: {
                'Authorization': `Bearer ${getCookie('access_token')}`
            }
        })
        .then(response => {
            if (response.status === 401) {
                // Token expired, try refreshing
                refreshToken();
            }
            return response.json();
        })
        .then(data => {
            // Handle data
            console.log(data);
        })
        .catch(error => {
            displayError(loginError, 'Failed to fetch protected data');
        });
    }

    // Refresh token when needed
    function refreshToken() {
        fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: getCookie('refresh_token') })
        })
        .then(response => response.json())
        .then(data => {
            document.cookie = `access_token=${data.access}; SameSite=Strict; Path=/`;
            // Optionally refresh the refresh token too if your backend supports it
        })
        .catch(error => {
            displayError(loginError, 'Failed to refresh token');
        });
    }
    
    // Handler for login button click
    function handleLoginClick() {
        console.log('Login button clicked');
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            displayError(loginError, 'Please enter both username and password');
            return;
        }
        
        console.log('Attempting login with username:', username);
        // Call login with username, password, no OTP initially, and the error display element
        login(username, password, null, loginError);
    }
    
    // Attach click event directly
    loginButton.onclick = handleLoginClick;
    
    // Also add keyboard support for Enter key
    loginForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLoginClick();
        }
    });
    // Register functionality
    function handleRegisterClick() {
        console.log('Register button clicked');
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!username || !email || !password || !confirmPassword) {
            displayError(registerError, 'Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            displayError(registerError, 'Passwords do not match');
            return;
        }
        
        console.log('Attempting to register user:', username);
        fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                password2: confirmPassword
            })
        })
        .then(response => {
            console.log('Register response status:', response.status);
            if (!response.ok) {
                return response.json().then(data => {
                    console.error('Registration error details:', data);
                    throw new Error(Object.values(data).flat().join(' '));
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration successful:', data);
            // Auto-login after successful registration
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            
            alert('Registration successful! Logging you in...');
            
            // Log in automatically with the credentials they just registered with
            login(username, password, loginError);
        })
        .catch(error => {
            console.error('Registration error:', error);
            displayError(registerError, error.message || 'Registration failed');
        });
    }
    
    // Attach register button click handler
    registerButton.onclick = handleRegisterClick;
    
    // Add keyboard support for register form
    registerForm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRegisterClick();
        }
    });
    

    // Proper authentication check before redirecting to dashboard
    const accessToken = getCookie('access_token');
    const refresh_Token = getCookie('refresh_token'); 
    const userData = localStorage.getItem('user');
    
    // Only redirect if we have all required authentication data
    if (accessToken && refresh_Token && userData && window.location.pathname === '/') {
        try {
            // Make sure user data is valid JSON
            const user = JSON.parse(userData);
            if (user && user.username) {
                console.log('User already authenticated, redirecting to dashboard');
                window.location.href = '/dashboard.html';
            }
        } catch (e) {
            // If user data is invalid, clear authentication data
            console.error('Invalid user data, clearing authentication');
            document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            localStorage.removeItem('user');
        }
    }
}); 