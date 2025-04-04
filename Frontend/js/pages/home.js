import { navigate } from './router.js';

export function homePage() {
    return `
        <div class="home-container">
            <nav class="nav-container">
                <div class="d-flex justify-content-between align-items-center">
                    <h3 class="mb-0">Transcendence</h3>
                    <button class="btn btn-outline-danger" id="logoutBtn">Logout</button>
                </div>
            </nav>
            
            <div class="welcome-message">
                <h2>Welcome to Transcendence</h2>
                <p>Your gaming adventure starts here!</p>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Quick Play</h5>
                            <p class="card-text">Start a new game instantly!</p>
                            <button class="btn btn-primary">Play Now</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Profile</h5>
                            <p class="card-text">View your stats and achievements</p>
                            <button class="btn btn-secondary">View Profile</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add event listener after the page is rendered
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'logoutBtn') {
            // Here you would typically make an API call to logout
            console.log('Logging out...');
            navigate('/');
        }
    });
});
