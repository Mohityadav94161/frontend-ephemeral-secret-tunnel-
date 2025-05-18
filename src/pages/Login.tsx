import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, error, isAuthenticated } = useAuth();

  // Extract returnUrl from query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const returnUrlParam = searchParams.get('returnUrl');
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl);
    }
  }, [isAuthenticated, navigate, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        // Navigate to the return URL after successful login
        navigate(returnUrl);
      } else if (error) {
        toast({
          title: "Login failed",
          description: error,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md animate-fade-in">
      <div className="flex flex-col items-center justify-center mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Login</h1>
        <p className="text-muted-foreground text-center">
          Access your account to use premium features
        </p>
      </div>
      
      <div className="bg-dark-lighter rounded-lg border border-border p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm text-muted-foreground mb-2">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="bg-dark border-border"
              autoComplete="username"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm text-muted-foreground mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-dark border-border"
              autoComplete="current-password"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-neon hover:bg-neon/80 text-black"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon hover:underline">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
