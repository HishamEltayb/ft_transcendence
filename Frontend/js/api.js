import utils from './utils.js';
import { PAGES, ENDPOINTS } from './constants.js';

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
      
      const loginEndpoint = ENDPOINTS.auth.login;
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        credentials: 'include',  // Include credentials to handle cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json();

      console.log('Login result:', result);
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Login failed' };
      }
      
      if (result.token) {
        utils.setCookie('access_token', result.token);
      }


      localStorage.setItem('user', JSON.stringify(result.user));
      
      return { success: true, data: result.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(registerData) {
    try {
      const registerEndpoint = ENDPOINTS.auth.register;
      
      const response = await fetch(registerEndpoint, {
        method: 'POST',
        credentials: 'include',  // Include credentials to handle cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const result = await response.json();

      if (!response.ok) {
        const err = result.error || result.email || result.username || result.password || result.confirmPassword || 'Registration failed';
        return { success: false, error: err };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async get42AuthUrl() {
    try {
      const oauth42Endpoint = ENDPOINTS.auth.auth42;
      
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
        utils.cleanUp();
        return { success: false };
      }
      
      const data = await response.json();
      
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

  async getUserData(retryCount = 0) {
    try {
      // First try to get data from localStorage (only on initial call)
      if (retryCount === 0) {
        const user = localStorage.getItem('user');
        if (user) {
          return { success: true, userData: JSON.parse(user) };
        }
      }

      console.log(`Fetching user data (attempt ${retryCount + 1})...`);
      
      // Simple fetch request with credentials
      const response = await fetch(ENDPOINTS.user.me, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('Response:', response.status);
      
      // If unauthorized and we haven't exceeded retry limit, try refreshing token
      if (response.status === 401 && retryCount < 1) {
        console.log('Access token expired, attempting to refresh...');
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          console.log('Token refreshed successfully, retrying user data fetch');
          // Retry with incremented counter
          return await this.getUserData(retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp(); // Clear all auth data
          return { 
            success: false, 
            error: 'Authentication expired. Please log in again.',
            authExpired: true 
          };
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      
      const userData = await response.json();
      return { success: true, userData };
    } catch (error) {
      console.error(`Error in getUserData (attempt ${retryCount + 1}):`, error);
      return { success: false, error: error.message };
    }
  }
  
 
  // Method to refresh the access token using refresh token
  async refreshToken() {
    try {
      const refreshEndpoint = ENDPOINTS.auth.refreshToken;
   
      console.log('Attempting to refresh token...');
      
      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        credentials: 'include',  
        headers: {
          'Content-Type': 'application/json'
        },
      });

      console.log('Response:', response.status);
      
      if (!response.ok) {
        utils.cleanUp();
        return { success: false, error: 'Token refresh failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    console.log('API: Logging out');

    try {
      const logoutEndpoint = ENDPOINTS.auth.logout;
      
      // Get token
      const token = utils.getCookie('access_token') || localStorage.getItem('access_token');
      
      console.log('API: Token:', token);
      
      if (!token) {
        utils.cleanUp();
        return { success: true };
      }
      
      await fetch(logoutEndpoint, {
        method: 'POST',
        credentials: 'include',  // Include credentials to handle cookies
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      utils.cleanUp();
      
      return { success: true };
    } catch (error) {
      utils.cleanUp();
      
      return { success: false, error: error.message };
    }
  }

  // Method to handle 2FA setup requests
  async get2FASetup() {
    console.log('API.get2FASetup: Starting 2FA setup request');
    try {
      // Get token
      const token = utils.getCookie('access_token');
      console.log('API.get2FASetup: Access token available:', !!token);
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('API.get2FASetup: Sending request to /api/users/2fa/setup/');
      
      const response = await fetch(ENDPOINTS.auth.twoFASetup, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('API.get2FASetup: Response received', { 
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API.get2FASetup: Error response', errorData);
        throw new Error(errorData.error || 'Failed to setup 2FA');
      }
      
      const responseData = await response.json();
      console.log('API.get2FASetup: Successful response', { 
        hasQrCode: !!responseData.qr_code, 
        hasSecretKey: !!responseData.secret_key 
      });
      
      return responseData;
    } catch (error) {
      console.error('API.get2FASetup: Error caught', error);
      throw error;
    }
  }
  
  // Method to verify 2FA code
  async verify2FA(code) {
    try {
      const token = utils.getCookie('access_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/users/2fa/verify/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp_token: code })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: responseData.error || 'Failed to verify 2FA code' 
        };
      }
      
      return { 
        success: true, 
        ...responseData 
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  // Method to disable 2FA
  async disable2FA(code) {
    try {
      const token = utils.getCookie('access_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/users/2fa/disable/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp_token: code })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: responseData.error || 'Failed to disable 2FA' 
        };
      }
      
      return { 
        success: true, 
        ...responseData 
      };
    } catch (error) {
      console.error('2FA disabling error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  // Generic POST method for API calls with authentication
  async post(endpoint, data, token) {
    try {
      if (!token) {
        token = utils.getCookie('access_token');
      }
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/users/${endpoint}/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: responseData.error || `Failed to complete ${endpoint} request` 
        };
      }
      
      return { 
        success: true, 
        ...responseData 
      };
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

const api = new API();

export default api; 