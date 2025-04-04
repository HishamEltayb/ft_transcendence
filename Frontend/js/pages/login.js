import { navigate } from './router.js';

export function loginPage() {
    return `
        <div class="login-container">
            <h2 class="text-center mb-4">Login</h2>
            <form id="loginForm">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
        </div>
    `;
}

// Add event listener after the page is rendered
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'loginForm') {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Here you would typically make an API call to your backend
            console.log('Login attempt:', { username, password });
            
            // For now, just navigate to home page
            navigate('/home');
        }
    });
});
