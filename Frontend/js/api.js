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
      const response = await fetch(ENDPOINTS.auth.login, {
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

      if (!result.user)
        return { success: false, error: 'No user data received from server' };
      
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('isAuthenticated', false);
      
      return { success: true, data: result.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(registerData) {
    try {
      const response = await fetch(ENDPOINTS.auth.register, {
        method: 'POST',
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

  async logout() {
    try {
      await fetch(ENDPOINTS.auth.logout, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      utils.cleanUp();

      return { success: true };
    } catch (error) {
      utils.cleanUp();

      return { success: false, error: error.message };
    }
  }

  async get42AuthUrl() {
    try {
      const response = await fetch(ENDPOINTS.auth.auth42, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        console.error('API: 42 auth URL request failed with status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('API: 42 auth error details:', errorText);
        utils.cleanUp();
        return { success: false };
      }
      
      const data = await response.json();
      
      if (!data || !data.auth_url) {
        throw new Error('No authorization URL received from server');
      }
      
      return { success: true, auth_url: data.auth_url };
    } catch (error) {
      console.error('42 OAuth Error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserData(retryCount = 0) {
    try {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

      // if (retryCount === 0) {
      //   const user = localStorage.getItem('user');
      //   if (user) {
      //     return { success: true, userData: JSON.parse(user), isAuthenticated };
      //   }
      // }
      
      const response = await fetch(ENDPOINTS.user.me, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.status === 401 && retryCount < 1) {
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          return await this.getUserData(retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp(); 
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

      localStorage.setItem('user', JSON.stringify(userData));

      
      return { success: true, userData, isAuthenticated };
    } catch (error) {
      console.error(`Error in getUserData (attempt ${retryCount + 1}):`, error);
      return { success: false, error: error.message };
    }
  }
 
  async refreshToken() {
    try {
      const refreshEndpoint = ENDPOINTS.auth.refreshToken;
   
      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json'
        },
      });

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

  async setup2FA(retryCount = 0) {
    try {
      const response = await fetch(ENDPOINTS.auth.setup2FA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.status === 401 && retryCount < 1) {
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          return await this.setup2FA(retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp(); 
          throw new Error('Authentication expired. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API.setup2FA: Error response', errorData);
        throw new Error(errorData.error || 'Failed to setup 2FA');
      }
      
      const responseData = await response.json();
      
      return responseData;
    } catch (error) {
      console.error(`API.setup2FA: Error caught (attempt ${retryCount + 1})`, error);
      throw error;
    }
  }
  
  async verify2FA(code, retryCount = 0) {
    try {
      
      const response = await fetch(ENDPOINTS.auth.verify2FA, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp_token: code })
      });
      
      if (response.status === 401 && retryCount < 1) {
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          return await this.verify2FA(code, retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp(); 
          return { 
            success: false, 
            error: 'Authentication expired. Please log in again.',
            authExpired: true 
          };
        }
      }
      
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
      console.error(`2FA verification error (attempt ${retryCount + 1}):`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async disable2FA(code, retryCount = 0) {
    try {
      const response = await fetch(ENDPOINTS.auth.disable2FA, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp_token: code })
      });
      
      if (response.status === 401 && retryCount < 1) {
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          return await this.disable2FA(code, retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp(); 
          return { 
            success: false, 
            error: 'Authentication expired. Please log in again.',
            authExpired: true 
          };
        }
      }
      
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
      console.error(`2FA disabling error (attempt ${retryCount + 1}):`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async submitMatch(matchData, retryCount = 0) {
    try {
      const response = await fetch(ENDPOINTS.game.match, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(matchData)
      });
      if (response.status === 401 && retryCount < 1) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          return await this.submitMatch(matchData, retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp();
          return { success: false, error: 'Authentication expired. Please log in again.', authExpired: true };
        }
      }
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create match' };
      }
      return { success: true, data };
    } catch (error) {
      console.error(`submitMatch error (attempt ${retryCount + 1}):`, error);
      return { success: false, error: error.message };
    }
  }

  async createTournament(tournamentData, retryCount = 0) {
    try {
      const response = await fetch(ENDPOINTS.game.tournament, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(tournamentData)
      });
      if (response.status === 401 && retryCount < 1) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          return await this.createTournament(tournamentData, retryCount + 1);
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          utils.cleanUp();
          return { success: false, error: 'Authentication expired. Please log in again.', authExpired: true };
        }
      }
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create tournament' };
      }
      return { success: true, data };
    } catch (error) {
      console.error(`createTournament error (attempt ${retryCount + 1}):`, error);
      return { success: false, error: error.message };
    }
  }
  // async fetchMatchHistory() {
  //   try {
  //     const response = await fetch(ENDPOINTS.game.match_history, {
  //       method: 'GET',
  //       credentials: 'include',
  //       headers: { 
  //         'Content-Type': 'application/json' 
  //       }
  //     });
  //     if (!response.ok) {
  //       throw new Error(`Failed to fetch match history: ${response.status}`);
  //     }
  //     const data = await response.json();
  //     return { success: true, data };
  //   } catch (error) {
  //     console.error('Error fetching match history:', error);
  //     return { success: false, error: error.message };
  //   }
  // }
}

const api = new API();

export default api;