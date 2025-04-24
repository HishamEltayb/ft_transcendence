class DocumentHandler {
    // Helper method to find elements by ID
    getById(id) {
        return document.getElementById(id);
    }
    
    // Helper method to find elements by selector
    queryAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    // Helper method to find first element matching selector
    query(selector) {
        return document.querySelector(selector);
    }
    
    getAppContainer() {
        return document.getElementById('App');
    }

    getPageSection() {
        return document.getElementById('pageSection');
    }

    getLoginRegisterTabs() {
        return document.querySelectorAll('#loginTab, #registerTab');
    }

    getLoginForm() { 
        const form = {
            tab: document.getElementById('loginTab'),
            container: document.getElementById('loginFormContainer'),
            form: document.getElementById('loginForm'),
            submitBtn: document.getElementById('loginBtn'),
            login42Link: document.getElementById('login42Link'),
            usernameField: document.getElementById('loginUsername'),
            passwordField: document.getElementById('loginPassword')
        };

        return form;
    }

    getRegisterForm() {
        const form = {
            tab: document.getElementById('registerTab'),
            container: document.getElementById('registerFormContainer'),
            form: document.getElementById('registerForm'),
            submitBtn: document.getElementById('registerBtn'),
            usernameField: document.getElementById('registerUsername'),
            emailField: document.getElementById('registerEmail'),
            passwordField: document.getElementById('registerPassword'),
            confirmPasswordField: document.getElementById('confirmPassword'),
            passwordMatchStatus: document.getElementById('passwordMatchStatus')
        };

        return form;
    }
}

// Create a singleton instance
const docHandler = new DocumentHandler();
export default docHandler;

