import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Bell, User, X, BellOff } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface NotificationCenterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  position = 'bottom-right'
}) => {
  const { 
    notifications, 
    clearNotification, 
    clearAllNotifications,
    requestPermission
  } = useNotifications();
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    // Check if we already have permission
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setHasPermission(granted);
  };
  
  // Get position-specific classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };
  
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
  
  return (
    <div className={`fixed z-50 ${getPositionClasses()}`}>
      {/* Notification toggle */}
      <div className="mb-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-full h-10 w-10 p-0 relative"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-card border shadow-lg rounded-lg w-80 max-h-96 overflow-hidden flex flex-col"
          >
            <div className="p-3 border-b flex justify-between items-center bg-muted/50">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex gap-2">
                {!hasPermission && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRequestPermission}
                    className="h-7 text-xs"
                  >
                    Enable Notifications
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearAllNotifications}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm flex flex-col items-center justify-center h-32">
                <BellOff className="h-8 w-8 mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <AnimatePresence>
                  {notifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 border-b hover:bg-muted/50 relative"
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
                        onClick={() => clearNotification(notification.id)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter; 