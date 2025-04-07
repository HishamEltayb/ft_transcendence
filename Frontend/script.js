document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    // API URLs
    const API_BASE_URL = '/api/users';
    
    // Toggle between login and register forms
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
    
    // Login functionality
    loginButton.addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            displayError(loginError, 'Please enter both username and password');
            return;
        }
        
        fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        // Modify the success handler in the login function
        .then(data => {
            // Save token to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard page instead of root
            window.location.href = '/dashboard.html';
        })
        .catch(error => {
            displayError(loginError, 'Invalid username or password');
        });
    });
    
    // Register functionality
    registerButton.addEventListener('click', function() {
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
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(Object.values(data).flat().join(' '));
                });
            }
            return response.json();
        })
        .then(data => {
            // Show success message and switch to login
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            alert('Registration successful! Please log in.');
        })
        .catch(error => {
            displayError(registerError, error.message || 'Registration failed');
        });
    });
    
    // Helper function to display error messages
    function displayError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    // Check if user is already logged in
    // With this version that only redirects if we're on the login page:
    const token = localStorage.getItem('token');
    if (token && window.location.pathname === '/') {
        // Only redirect if we're on the login page
        window.location.href = '/dashboard.html';
    }
}); 