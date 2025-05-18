
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Upload, MessageSquare, Shield, Clock, UserX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <FileText className="h-8 w-8 mb-4 text-neon" />,
      title: "Secure Text Sharing",
      description: "Share sensitive text that gets deleted after being viewed or expires after 24 hours."
    },
    {
      icon: <Upload className="h-8 w-8 mb-4 text-neon" />,
      title: "Temporary File Transfer",
      description: "Upload files that automatically delete after download or within 2 hours."
    },
    {
      icon: <MessageSquare className="h-8 w-8 mb-4 text-neon" />,
      title: "Ephemeral Chats",
      description: "Self-destructing conversations that disappear after 2 hours of inactivity."
    },
    {
      icon: <Shield className="h-8 w-8 mb-4 text-neon" />,
      title: "No Tracking",
      description: "We don't track who you are, what you share, or who you chat with."
    },
    {
      icon: <Clock className="h-8 w-8 mb-4 text-neon" />,
      title: "Time-Limited",
      description: "All content has an expiration date, leaving no traces behind."
    },
    {
      icon: <UserX className="h-8 w-8 mb-4 text-neon" />,
      title: "No Registration Required",
      description: "Use anonymously or create an account for premium features."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-6 gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Share. Chat. Disappear.
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Ephemeral is the most secure way to share sensitive content that automatically 
          self-destructs after being viewed or when time runs out.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link to="/paste">
            <Button className="bg-neon hover:bg-neon/80 text-black min-w-[150px]">
              Share Text
            </Button>
          </Link>
          <Link to="/fileshare">
            <Button variant="outline" className="border-neon text-neon hover:bg-neon/10 min-w-[150px]">
              Share Files
            </Button>
          </Link>
          <Link to="/chat">
            <Button variant="outline" className="border-neon text-neon hover:bg-neon/10 min-w-[150px]">
              Start Chat
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Ephemeral?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-dark-lighter p-6 rounded-lg border border-border hover:neon-border transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-12 text-center">
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-8 border border-neon/30">
          <h2 className="text-3xl font-bold mb-4">Ready for Premium Features?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Create an account to unlock extended storage time, larger file uploads, and more.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button className="bg-neon hover:bg-neon/80 text-black min-w-[150px]">
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="hover:text-neon hover:bg-neon/10 min-w-[150px]">
                  Login
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-success">
              Welcome back, {user.username}! You're currently using Ephemeral with {user.isPremium ? 'premium' : 'standard'} features.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
