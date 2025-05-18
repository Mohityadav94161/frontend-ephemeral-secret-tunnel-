import { Github, Lock, Shield, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-dark-lighter py-6 border-t border-border mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold gradient-text">Ephemeral</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Temporary. Anonymous. Secure.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center">
              <Lock className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm text-muted-foreground">End-to-End Encrypted</span>
            </div>
            
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm text-muted-foreground">No Logs Policy</span>
            </div>
            
            <Link
              to="/feedback"
              className="flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="text-sm">Feedback</span>
            </Link>
            
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-4 h-4 mr-2" />
              <span className="text-sm">Source Code</span>
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ephemeral. All content is automatically deleted.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
