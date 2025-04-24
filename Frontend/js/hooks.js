import { COMPONENTS, PAGES, ENDPOINTS } from './constants.js';

// Reference to be set from user.js to avoid circular imports
let userInstance = null;

class Hooks {
  setUserInstance(instance) {
    userInstance = instance;
  }

  async useFetchHtml(url, returnElement = true) {
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

  async useFetchAllComponents() {
    try {
      const promises = Object.entries(COMPONENTS).map(([name, url]) => 
        this.useFetchHtml(url).then(element => ({ name, element }))
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

  async useFetchAllPages() {
    try {
      const promises = Object.entries(PAGES).map(([name, url]) => 
        this.useFetchHtml(url, false).then(element => ({ name, element }))
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

  async useSubmitLoginForm(loginData) {
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
        // Always store the token in localStorage
        localStorage.setItem('authToken', data.token);
      }
      
      // Return the data for further processing if needed
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Hook for submitting registration data to the backend
  async useSubmitRegisterForm(registerData) {
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

      console.log('Hooks: Registration response:', response);
      
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      console.log('Registration successful:', data);
      
      // Return success data
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Return the error for handling
      return { success: false, error: error.message };
    }
  }

  // Hook for initiating 42 OAuth login
  async use42Login() {
    try {
      const oauth42Endpoint = ENDPOINTS.auth.auth42;
      console.log('Hooks: Initiating 42 OAuth, calling endpoint:', oauth42Endpoint);
      
      // Make API call to get the OAuth authorization URL
      const response = await fetch(oauth42Endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Hooks: 42 OAuth response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('42 OAuth error details:', errorText);
        throw new Error('Failed to initiate 42 login: ' + errorText);
      }
      
      const data = await response.json();
      
      // Validate response contains auth_url
      if (!data || !data.auth_url) {
        console.error('Hooks: No auth_url in response data:', data);
        throw new Error('No authorization URL received from server');
      }
      
      console.log('Hooks: 42 OAuth successful, received auth URL:', data.auth_url);
      
      // Return the OAuth data with success flag
      return { success: true, auth_url: data.auth_url };
    } catch (error) {
      console.error('42 OAuth Error:', error);
      
      // Return the error for handling
      return { success: false, error: error.message };
    }
  }

  async useFetchUserData(forceRefresh = false) {
    try {
      // Cache check - only use if not forcing refresh
      if (!forceRefresh) {
        // Try to get user data from localStorage
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            const storedTime = localStorage.getItem('userDataTimestamp');
            const dataAge = storedTime ? (Date.now() - parseInt(storedTime)) : Infinity;
            
            // Use cached data if it's less than 5 minutes old
            if (dataAge < 5 * 60 * 1000) { // 5 minutes
              console.log('Hooks: Using cached user data from localStorage');
              return { success: true, userData };
            }
          } catch (e) {
            console.error('Error parsing cached user data:', e);
            // Continue to fetch fresh data
          }
        }
      }
      
      console.log('Hooks: Fetching fresh user data from API');
      const userMeEndpoint = ENDPOINTS.user.me;
      
      const token = localStorage.getItem('authToken');
      
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

      // Save to localStorage with timestamp
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userDataTimestamp', Date.now().toString());

      return { success: true, userData };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Hook for optimized form submission with state preservation
  async useSubmitForm(formId, formData, endpoint, method = 'POST') {
    try {
      // Save form state to store before submission
      store.saveFormData(formId, formData);
      
      const token = localStorage.getItem('authToken');
      
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
      console.error(`Error submitting form ${formId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

const hooks = new Hooks();

export default hooks; 