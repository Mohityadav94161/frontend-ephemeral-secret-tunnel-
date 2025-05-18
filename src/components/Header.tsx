import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/ui/button';
import { Menu, X, Bell, MessageSquare, User, BellOff, Shield, LogOut } from 'lucide-react';
import { logoutAdmin, isAdminAuthenticated } from '@/utils/adminAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from './ui/badge';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [bellAnimation, setBellAnimation] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, clearNotification, clearAllNotifications, requestPermission } = useNotifications();
  const notificationRef = useRef<HTMLDivElement>(null);
  const prevNotificationCount = useRef(0);
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');
  const isAdmin = isAdminAuthenticated();
  
  // Handle admin logout
  const handleAdminLogout = () => {
    logoutAdmin();
    window.location.href = '/admin/login';
  };
  
  // Handle click outside to close the notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Animate bell when new notifications arrive
  useEffect(() => {
    if (notifications.length > prevNotificationCount.current) {
      console.log('New notification detected! Animating bell');
      setBellAnimation(true);
      const timer = setTimeout(() => setBellAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
    prevNotificationCount.current = notifications.length;
  }, [notifications.length]);
  
  // Icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'join':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Navigate to chat when clicking a notification
  const handleNotificationClick = (chatId?: string) => {
    if (chatId) {
      window.location.href = `/chat/${chatId}`;
      setNotificationDropdownOpen(false);
    }
  };

  return (
    <header className="w-full bg-dark-lighter py-4 px-6 border-b border-border">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold gradient-text">Ephemeral</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/paste" className="text-muted-foreground hover:text-neon transition-colors">
            Paste
          </Link>
          <Link to="/fileshare" className="text-muted-foreground hover:text-neon transition-colors">
            File Share
          </Link>
          <Link to="/chat" className="text-muted-foreground hover:text-neon transition-colors">
            Chat
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-muted-foreground hover:text-neon transition-colors flex items-center gap-1">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          
          {user ? (
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className={`relative text-muted-foreground hover:text-neon ${bellAnimation ? 'animate-bounce' : ''}`}
                >
                  <Bell className={`h-5 w-5 ${bellAnimation ? 'text-neon' : ''}`} />
                  {notifications.length > 0 && (
                    <Badge 
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
                
                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notificationDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 bg-card border shadow-lg rounded-lg w-80 z-50 overflow-hidden flex flex-col"
                      ref={notificationRef}
                    >
                      <div className="p-3 border-b flex justify-between items-center bg-muted/50">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllNotifications();
                          }}
                          className="h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm flex flex-col items-center justify-center h-32">
                          <BellOff className="h-8 w-8 mb-2 opacity-50" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto max-h-72">
                          {notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className="p-3 border-b hover:bg-muted/50 relative cursor-pointer"
                              onClick={() => handleNotificationClick(notification.chatId)}
                            >
                              <div className="flex gap-2">
                                <div className={`p-2 rounded-full ${
                                  notification.type === 'message' ? 'bg-blue-100 text-blue-600' : 
                                  notification.type === 'join' ? 'bg-green-100 text-green-600' : 
                                  'bg-orange-100 text-orange-600'
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{notification.title}</h4>
                                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Link to="/profile" className="text-muted-foreground hover:text-neon transition-colors">
                Profile
              </Link>
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                  onClick={handleAdminLogout}
                >
                  <LogOut className="h-4 w-4" /> Admin Logout
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-white hover:bg-destructive/20"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="hover:text-neon hover:bg-neon/10">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-neon hover:bg-neon/80 text-black">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <div className="relative mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className={`relative text-muted-foreground hover:text-neon bg-card/50 ${bellAnimation ? 'animate-bounce' : ''}`}
              >
                <Bell className={`h-5 w-5 ${bellAnimation ? 'text-neon' : ''}`} />
                {notifications.length > 0 && (
                  <Badge 
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              
              {/* Mobile Notification Dropdown */}
              <AnimatePresence>
                {notificationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 bg-card border shadow-lg rounded-lg w-72 z-50 overflow-hidden flex flex-col"
                    ref={notificationRef}
                  >
                    <div className="p-3 border-b flex justify-between items-center bg-muted/50">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllNotifications();
                        }}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm flex flex-col items-center justify-center h-32">
                        <BellOff className="h-8 w-8 mb-2 opacity-50" />
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto max-h-72">
                        {notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className="p-3 border-b hover:bg-muted/50 relative cursor-pointer"
                            onClick={() => handleNotificationClick(notification.chatId)}
                          >
                            <div className="flex gap-2">
                              <div className={`p-2 rounded-full ${
                                notification.type === 'message' ? 'bg-blue-100 text-blue-600' : 
                                notification.type === 'join' ? 'bg-green-100 text-green-600' : 
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-border">
          <div className="container mx-auto px-4 space-y-3">
            <Link
              to="/paste"
              className="block py-2 text-muted-foreground hover:text-neon"
              onClick={() => setMobileMenuOpen(false)}
            >
              Paste
            </Link>
            <Link
              to="/fileshare"
              className="block py-2 text-muted-foreground hover:text-neon"
              onClick={() => setMobileMenuOpen(false)}
            >
              File Share
            </Link>
            <Link
              to="/chat"
              className="block py-2 text-muted-foreground hover:text-neon"
              onClick={() => setMobileMenuOpen(false)}
            >
              Chat
            </Link>
            
            {isAdmin && (
              <Link
                to="/admin"
                className="block py-2 text-amber-500 hover:text-amber-400 flex items-center gap-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="h-4 w-4" /> Admin Dashboard
              </Link>
            )}
            
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-muted-foreground hover:text-neon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                
                {isAdmin && (
                  <Button
                    variant="ghost"
                    className="justify-start text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                    onClick={() => {
                      handleAdminLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Admin Logout
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  className="justify-start text-muted-foreground hover:text-white hover:bg-destructive/20"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full hover:text-neon hover:bg-neon/10">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-neon hover:bg-neon/80 text-black">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
