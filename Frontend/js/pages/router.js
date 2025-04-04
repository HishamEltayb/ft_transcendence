import { loginPage } from './login.js';
import { homePage } from './home.js';

const app = document.getElementById('app');

// Simple router
const router = {
    '/': loginPage,
    '/home': homePage
};

// Handle navigation
function navigate(path) {
    window.history.pushState({}, '', path);
    renderPage();
}

// Render the current page
function renderPage() {
    const path = window.location.pathname;
    const page = router[path] || router['/'];
    app.innerHTML = page();
}

// Initial render
renderPage();

// Handle browser back/forward buttons
window.addEventListener('popstate', renderPage);

// Export for use in other modules
export { navigate };
