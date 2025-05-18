import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '@/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/Spinner';
import { useToast } from '@/components/ui/use-toast';
import { isAdminAuthenticated } from '@/utils/adminAuth';

// Track if we've attempted a redirect to prevent loops
let redirectAttempted = false;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkExistingAuth = async () => {
      setCheckingAuth(true);
      try {
        // Reset the redirect attempt flag when we land on the login page
        redirectAttempted = false;
        
        if (isAdminAuthenticated()) {
          // Check if admin auth is actually valid by making an API call
          try {
            const response = await fetch(`${API_URL}/admin/stats`, {
              headers: {
                'Authorization': localStorage.getItem('adminAuth') || ''
              }
            });
            
            if (response.ok) {
              // Only navigate if not already on admin dashboard
              if (location.pathname !== '/admin') {
                navigate('/admin');
              }
              return;
            } else {
              // Clear invalid auth data
              localStorage.removeItem('adminAuth');
              localStorage.removeItem('adminUsername');
              localStorage.removeItem('adminAuthTime');
            }
          } catch (err) {
            console.error('Error validating admin auth:', err);
          }
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkExistingAuth();
  }, [navigate, location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create Basic Auth header for initial authentication
      const authHeader = 'Basic ' + btoa(`${username}:${password}`);
      
      // Send request to admin stats endpoint to verify credentials
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': authHeader
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        } else {
          throw new Error('Failed to authenticate');
        }
      }
      
      // If authentication succeeded, store admin auth in localStorage
      localStorage.setItem('adminAuth', authHeader);
      localStorage.setItem('adminUsername', username);
      
      // Set authentication timestamp (for session timeout)
      localStorage.setItem('adminAuthTime', Date.now().toString());
      
      // Show success message
      toast({
        title: "Login successful",
        description: "You are now logged in as admin",
      });
      
      // Prevent multiple redirects
      if (redirectAttempted) {
        console.log('Redirect already attempted, preventing loop');
        window.location.href = '/admin'; // Force a full page reload
        return;
      }
      
      redirectAttempted = true;
      
      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your admin credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Admin username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Admin password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="mr-2" size="sm" /> : null}
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 