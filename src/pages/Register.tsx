import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import AuthInfoModal from '../components/AuthInfoModal';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthInfo, setShowAuthInfo] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await register(username, password);
      
      if (success) {
        toast({
          title: "Account created",
          description: "You've been registered successfully",
        });
        
        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md animate-fade-in">
      <div className="flex flex-col items-center justify-center mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Create Account</h1>
        <p className="text-muted-foreground text-center">
          Register to get expanded storage limits and premium features
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
              placeholder="Choose a username"
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
              placeholder="Create a password"
              className="bg-dark border-border"
              autoComplete="new-password"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-muted-foreground mb-2">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="bg-dark border-border"
              autoComplete="new-password"
            />
          </div>
          
          <div className="bg-warning/10 border border-warning/30 rounded p-3 flex items-start">
            <AlertTriangle className="h-5 w-5 text-warning mr-2 mt-0.5" />
            <p className="text-sm text-warning">
              We don't offer password recovery options. If you lose your password, your account cannot be recovered.
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-neon hover:bg-neon/80 text-black"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-neon hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>By registering, you understand that your data is stored locally and all content will be automatically deleted based on time limits.</p>
      </div>

      <AuthInfoModal 
        isOpen={showAuthInfo} 
        onClose={() => setShowAuthInfo(false)} 
      />
    </div>
  );
};

export default Register;
