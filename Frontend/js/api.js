import utils from './utils.js';
import { COMPONENTS, PAGES, ENDPOINTS } from './constants.js';

class API {
  async fetchHtml(url, returnElement = true) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) 
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      
      const html = await response.text();
      
      const tempElement = document.createElement('div');
      tempElement.innerHTML = html;
      
      return returnElement ? tempElement.firstChild : tempElement;
    } catch (error) {
      console.error(`Error fetching HTML from ${url}:`, error);
      throw error;
    }
  }

  async fetchAllComponents() {
    try {
      const promises = Object.entries(COMPONENTS).map(([name, url]) => 
        this.fetchHtml(url).then(element => ({ name, element }))
      );
      
      const results = await Promise.all(promises);
      
      const components = {};
      results.forEach(result => {
        components[result.name] = result.element;
      });
      
      return components;
    } catch (error) {
      console.error(`Error fetching components:`, error);
      throw error;
    }
  }

  async fetchAllPages() {
    try {
      const promises = Object.entries(PAGES).map(([name, url]) => 
        this.fetchHtml(url, false).then(element => ({ name, element }))
      );
      
      const results = await Promise.all(promises);
      
      const pages = {};
      results.forEach(result => {
        pages[result.name] = result.element;
      });
      
      return pages;
    } catch (error) {
      console.error(`Error fetching pages:`, error);
      throw error;
    }
  }

  async login(loginData) {
    try {
      console.log('API: Submitting login form');
      
      const loginEndpoint = ENDPOINTS.auth.login;
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Login failed' };
      }
      
      if (result.token) {
        utils.setCookie('authToken', result.token);
      }

      console.log('API: Login result:', result.user);

      localStorage.setItem('user', JSON.stringify(result.user));
      
      return { success: true, data: result.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async submitRegisterForm(registerData) {
    console.log('API: Submitting registration form');
    
    try {
      if (registerData.password !== registerData.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match.'
        };
      }

      // API endpoint for registration from the ENDPOINTS constant
      const registerEndpoint = ENDPOINTS.auth.register;
      
      // Make the POST request
      const response = await fetch(registerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const result = await response.json();


      console.log('API: Registration result:', result);
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Registration failed' };
      }
      
      
      // Return success data
      return { success: true, data:response.data };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Return the error for handling
      return { success: false, error: error.message };
    }
  }

  async get42AuthUrl() {
    try {
      const oauth42Endpoint = ENDPOINTS.auth.auth42;
      console.log('API: Requesting 42 auth URL from endpoint:', oauth42Endpoint);
      
      // Make API call to get the OAuth authorization URL
      const response = await fetch(oauth42Endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('API: 42 auth URL request failed with status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('API: 42 auth error details:', errorText);
        throw new Error('Failed to initiate 42 login: ' + errorText);
      }
      
      const data = await response.json();
      console.log('API: Received 42 auth URL response:', data);
      
      // Validate response contains auth_url
      if (!data || !data.auth_url) {
        throw new Error('No authorization URL received from server');
      }
      
      // Return the OAuth data with success flag
      return { success: true, auth_url: data.auth_url };
    } catch (error) {
      console.error('42 OAuth Error:', error);
      
      // Return the error for handling
      return { success: false, error: error.message };
    }
  }

  async getUserData() {
    try {
      console.log('API: Fetching fresh user data from API');
      const userMeEndpoint = ENDPOINTS.user.me;
      
      // Get token - Check cookies first, then localStorage for backward compatibility
      let token = utils.getCookie('authToken');
      console.log('API: Auth token from cookie:', token ? 'Present' : 'Missing');
      
      if (!token) {
        token = localStorage.getItem('authToken');
        console.log('API: Auth token from localStorage:', token ? 'Present' : 'Missing');
      }
      
      console.log('API: Token:', token);

      const user = localStorage.getItem('user');

      if (user) {
        return { success: true, userData: JSON.parse(user) };
      }

      if (!token) {
        return { success: true, userData: null };
      }
      
      const response = await fetch(userMeEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      console.log('API: Successfully fetched user data');

      return { success: true, userData };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      console.log('API: Logging out user');
      const logoutEndpoint = ENDPOINTS.auth.logout;
      
      // Get token
      const token = utils.getCookie('authToken') || localStorage.getItem('authToken');
      
      if (!token) {
        console.log('API: No token found, user already logged out');
        return { success: true };
      }
      
      await fetch(logoutEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      utils.deleteCookie('authToken');
      localStorage.removeItem('authToken');
      
      return { success: true };
    } catch (error) {
      utils.deleteCookie('authToken');
      localStorage.removeItem('authToken');
      
      return { success: false, error: error.message };
    }
  }
}

const api = new API();

export default api; 