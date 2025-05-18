/**
 * Admin authentication utilities for secure access to admin features
 */

// Track if we're already navigating to login to prevent loops
let navigatingToLogin = false;

/**
 * Get the stored admin authentication header
 * @returns The Basic Auth header or an empty string if not authenticated
 */
export const getAdminAuthHeader = (): string => {
  return localStorage.getItem('adminAuth') || '';
};

/**
 * Check if the user is currently authenticated as an admin
 * @returns True if authenticated, false otherwise
 */
export const isAdminAuthenticated = (): boolean => {
  const authHeader = localStorage.getItem('adminAuth');
  const authTime = localStorage.getItem('adminAuthTime');
  
  if (!authHeader || !authTime) {
    return false;
  }
  
  // Check for session timeout (8 hours)
  const authTimeValue = parseInt(authTime);
  const currentTime = Date.now();
  const hoursSinceAuth = (currentTime - authTimeValue) / (1000 * 60 * 60);
  
  return hoursSinceAuth <= 8;
};

/**
 * Log out the admin user by clearing all admin authentication data
 */
export const logoutAdmin = (): void => {
  localStorage.removeItem('adminAuth');
  localStorage.removeItem('adminUsername');
  localStorage.removeItem('adminAuthTime');
};

/**
 * Get the currently logged in admin username
 * @returns The admin username or null if not authenticated
 */
export const getAdminUsername = (): string | null => {
  return localStorage.getItem('adminUsername');
};

/**
 * Handle admin authentication check and redirect
 * @param navigate React Router navigate function
 * @returns True if authentication was successful, false otherwise
 */
export const checkAdminAuth = (navigate: (path: string) => void): boolean => {
  // If we're already navigating to login, avoid recursion
  if (navigatingToLogin) return false;
  
  if (!isAdminAuthenticated()) {
    // Check if we're already on the login page to prevent loops
    if (window.location.pathname === '/admin/login') {
      return false;
    }
    
    try {
      navigatingToLogin = true;
      navigate('/admin/login');
      
      // Reset the flag after a delay
      setTimeout(() => {
        navigatingToLogin = false;
      }, 2000);
      
      return false;
    } catch (e) {
      console.error('Navigation error:', e);
      navigatingToLogin = false;
      return false;
    }
  }
  
  return true;
}; 