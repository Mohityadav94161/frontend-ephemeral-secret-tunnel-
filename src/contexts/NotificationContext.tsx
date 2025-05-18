import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NotificationType = 'message' | 'join' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  chatId?: string;
  username?: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  sendNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('NotificationProvider mounted');
    
    // Check if the browser supports notifications
    if ('Notification' in window) {
      setPermission(Notification.permission);
      console.log('Notification permission:', Notification.permission);
    }
    
    // Setup visibility change listeners
    const handleVisibilityChange = () => {
      const newActiveState = !document.hidden;
      console.log('Page visibility changed:', newActiveState ? 'active' : 'inactive');
      setIsActive(newActiveState);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Improve URL change detection
    const checkCurrentChat = () => {
      const path = window.location.pathname;
      const chatMatch = path.match(/\/chat\/([a-zA-Z0-9-]+)/);
      const newChatId = chatMatch && chatMatch[1] ? chatMatch[1] : null;
      
      if (newChatId !== currentChatId) {
        console.log(`Current chat ID changed from ${currentChatId} to ${newChatId}`);
        setCurrentChatId(newChatId);
      }
    };
    
    // Run initial check
    checkCurrentChat();
    
    // Set up interval to periodically check the URL
    const intervalId = setInterval(checkCurrentChat, 1000);
    
    // Set up the popstate listener for navigation
    window.addEventListener('popstate', checkCurrentChat);
    
    // Also check when hash changes
    window.addEventListener('hashchange', checkCurrentChat);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', checkCurrentChat);
      window.removeEventListener('hashchange', checkCurrentChat);
      clearInterval(intervalId);
    };
  }, []);
  
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      return newPermission === 'granted';
    }
    
    return false;
  };
  
  const sendNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    const newNotification = { ...notification, id, timestamp };
    
    console.log('Sending notification:', newNotification);
    console.log('Current state:', { isActive, currentChatId, notificationChatId: notification.chatId });
    
    // Add to internal notifications list
    setNotifications(prev => [newNotification, ...prev]);
    
    // Check if we should send a web notification
    const shouldSendWebNotification = 
      // Only send if the user is not active on the page
      !isActive || 
      // Or if they're on a different chat than the one being notified about
      (notification.chatId && currentChatId !== notification.chatId);
    
    if (shouldSendWebNotification && permission === 'granted') {
      console.log('Sending web notification');
      // Send web notification
      try {
        const webNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png', // Make sure this path exists
          tag: notification.chatId || 'general'
        });
        
        webNotification.onclick = () => {
          window.focus();
          if (notification.chatId) {
            window.location.href = `/chat/${notification.chatId}`;
          }
          webNotification.close();
        };
      } catch (error) {
        console.error('Error sending web notification:', error);
      }
    }
  };
  
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      sendNotification,
      clearNotification,
      clearAllNotifications,
      requestPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 