import { COMPONENTS, PAGES, ENDPOINTS } from './constants.js';
import utils from './utils.js';

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

  async submitLoginForm(loginData) {
    try {
      const loginEndpoint = ENDPOINTS.auth.login;
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      if (!response.ok)
        throw new Error('Login failed');
      
      const data = await response.json();
      
      if (data.token) {
        // Store in both cookie and localStorage for compatibility
        this.setCookie('authToken', data.token, 7); // 7 days
        localStorage.setItem('authToken', data.token);
      }
      
      // Return the data for further processing if needed
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async submitRegisterForm(registerData) {
    try {
      // Validate password match
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
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      
      // Return success data
      return { success: true, data };
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
        // Important: Include credentials to allow cookies to be set
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

  async fetchUserData() {
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
      
      if (!token) {
        throw new Error('No authentication token found');
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
  
  async submitFormData(endpoint, formData, method = 'POST') {
    try {
      // Get token - Check cookies first, then localStorage for backward compatibility
      let token = utils.getCookie('authToken');
      if (!token) {
        token = localStorage.getItem('authToken');
      }
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(endpoint, {
        method: method,
        headers: headers,
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      return { success: true, data: responseData };
    } catch (error) {
      console.error(`Error submitting data to ${endpoint}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Helper to set a cookie
  setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; Secure; SameSite=Strict";
  }
}

const api = new API();

export default api; 