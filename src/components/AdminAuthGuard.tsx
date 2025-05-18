import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminAuth, isAdminAuthenticated } from '@/utils/adminAuth';
import axios from 'axios';
import { getAdminAuthHeader } from '@/utils/adminAuth';

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

// Configure axios for admin API requests
axios.interceptors.request.use(function (config) {
  // Add admin auth header to all admin API requests
  if (config.url?.includes('/admin/')) {
    config.headers.Authorization = getAdminAuthHeader();
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Handle 401 responses globally - but allow AdminFeedback to handle its own auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && 
        window.location.pathname.includes('/admin') && 
        !window.location.pathname.includes('/admin/login') &&
        !window.location.pathname.includes('/admin/feedback') &&
        !isRedirecting) {
      
      // Set the flag to prevent multiple redirects
      isRedirecting = true;
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isRedirecting = false;
      }, 2000);
      
      // Redirect to login on auth failure, but only if not already on login page
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * A component that wraps admin pages to ensure they're protected by authentication
 */
export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Prevent multiple redirects during authentication check
    if (isRedirecting) return;
    
    const checkAuth = async () => {
      setIsChecking(true);
      try {
        // Just check if user is authenticated as admin without navigating
        // For the feedback page, we'll let it handle auth issues itself
        if (window.location.pathname.includes('/admin/feedback')) {
          setIsAuthenticated(isAdminAuthenticated());
        } else {
          // For other admin pages, use the normal auth check with navigation
          const authResult = checkAdminAuth(navigate);
          setIsAuthenticated(authResult);
        }
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Show nothing while checking authentication
  if (isChecking) {
    return <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // For the feedback page, render children even if not authenticated
  // The feedback page will handle displaying auth errors itself
  if (window.location.pathname.includes('/admin/feedback')) {
    return <>{children}</>;
  }

  // For other admin pages, only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
} 