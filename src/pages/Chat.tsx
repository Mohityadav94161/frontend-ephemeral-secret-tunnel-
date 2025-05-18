import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { AlertTriangle, Send, Users, MessageSquare, Link as LinkIcon, Clock, RefreshCw, X } from 'lucide-react';
import CopyButton from '../components/CopyButton';
import Timer from '../components/Timer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '@/components/common/Spinner';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/config';
import * as api from '../lib/api';
import chatSocketService from '../lib/socket';
import PublicChatList from '../components/PublicChatList';
import JoinByCode from '../components/JoinByCode';
import ChatSettings from '../components/ChatSettings';
import UserChatHistory from '../components/UserChatHistory';
import InviteByPhone from '../components/InviteByPhone';
import ChatInviteDialog from '../components/ChatInviteDialog';
import MessageStatus from '../components/MessageStatus';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  transmission?: {
    sent: { 
      status: boolean;
      timestamp: string | null;
    };
    delivered: { 
      status: boolean;
      timestamp: string | null;
    };
    received: { 
      status: boolean;
      timestamp: string | null;
      deviceInfo: string | null;
    };
    seen: { 
      status: boolean;
      timestamp: string | null;
      viewDuration: number;
    };
  };
  sendError?: boolean | 'retrying';
  errorMessage?: string;
}

interface Participant {
  userId: string | null;
  username: string;
  joinedAt: string;
}

interface ChatData {
  id: string;
  name: string;
  created_by: string;
  owner_id: string;
  participants: {
    userId: string;
    username: string;
    joinedAt: string;
  }[];
  messages?: ChatMessage[];
  expires_at: string;
  created_at: string;
  last_activity: string;
  room_code: string;
  is_public?: boolean;
  description?: string;
  max_participants?: number;
  expiration_hours?: number;
  message_expiration_hours?: number;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

// Get device info for message tracking
const getDeviceInfo = () => {
  try {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`
    };
  } catch (e) {
    return 'unknown-device';
  }
};

// Chat component - handles both creating a new chat and joining an existing one
const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendNotification, requestPermission } = useNotifications();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State for chat creation
  const [chatName, setChatName] = useState('');
  const [chatDescription, setChatDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [expirationHours, setExpirationHours] = useState(48); // Default to 48 hours (2 days)
  const [messageExpirationHours, setMessageExpirationHours] = useState(48); // Default to 48 hours (2 days)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  
  // State for joining a chat
  const [username, setUsername] = useState(user?.username || '');
  const [hasJoined, setHasJoined] = useState(false);
  
  // State for chat interaction
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatExpiry, setChatExpiry] = useState<Date | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  
  // State for expiration notification
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  
  // State for invitation dialog
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newChatData, setNewChatData] = useState<{id: string; name: string; room_code: string} | null>(null);
  
  // Polling interval for messages
  const pollingIntervalRef = useRef<number | null>(null);
  
  // State for server settings
  const [settings, setSettings] = useState<{
    chat?: { defaultExpirationHours: number },
    message?: { defaultExpirationHours: number }
  } | null>(null);
  
  // Determine if current user is the room owner
  const isOwner = !!user && !!chatData && !!chatData.owner_id && chatData.owner_id === user.id;
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle chat data fetching and setup
  useEffect(() => {
    if (chatId) {
      // If we have a user, use their username
      if (user) {
        setUsername(user.username);
      }
      
      const fetchChat = async () => {
        try {
          setIsLoadingChat(true);
          const data = await api.getChat(chatId);
          
          // Set chat data
          setChatData(data);
          setChatExpiry(new Date(data.expires_at));
          
          // Convert messages to our format
          const formattedMessages = data.messages ? data.messages.map((msg: ChatMessage) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender_name,
            timestamp: new Date(msg.created_at)
          })) : [];
          
          setMessages(formattedMessages);
          
          // Check if user is already in participants list
          if (username && data.participants) {
            const isAlreadyJoined = data.participants.some(p => p.username === username);
            if (isAlreadyJoined) {
              setHasJoined(true);
            }
          }
          
          // If we've already joined the chat, set up polling but don't rejoin
          if (hasJoined && pollingIntervalRef.current === null) {
            pollForMessages();
            pollingIntervalRef.current = window.setInterval(pollForMessages, 3000);
          }
        } catch (err) {
          console.error('Error fetching chat:', err);
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to load chat data",
            variant: "destructive",
          });
          navigate('/chat');
        } finally {
          setIsLoadingChat(false);
        }
      };
      
      const pollForMessages = async () => {
        try {
          const data = await api.getChat(chatId);
          
          // Update chat data
          setChatData(data);
          
          // Convert messages to our format
          const formattedMessages = data.messages ? data.messages.map((msg: ChatMessage) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender_name,
            timestamp: new Date(msg.created_at)
          })) : [];
          
          // Update messages if we have new ones
          if (formattedMessages.length > messages.length) {
            setMessages(formattedMessages);
          }
        } catch (err) {
          // If we get an error here, the chat may have expired
          console.error('Error polling messages:', err);
          
          // Clear interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          if ((err as Error).message?.includes('expired')) {
            toast({
              title: "Chat expired",
              description: "This chat has expired due to inactivity",
              variant: "destructive",
            });
            navigate('/chat');
          }
        }
      };
      
      if (username || user) {
        fetchChat();
      }
      
      // Cleanup polling on unmount
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [chatId, username, user, toast, navigate, messages.length, hasJoined]);
  
  // Request notification permission on component mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);
  
  // Subscribe to socket events for user joined notifications
  useEffect(() => {
    if (chatId && hasJoined) {
      console.log('Setting up socket notification handlers for chat:', chatId);
      
      // Subscribe to user_joined events
      const handleUserJoined = (data) => {
        if (data.username !== username) {
          console.log('User joined notification triggered:', data);
          // Send notification about user joining
          sendNotification({
            type: 'join',
            title: 'New user joined',
            message: `${data.username} joined the chat`,
            chatId: chatId
          });
        }
      };
      
      // Subscribe to message events for this chat
      const handleNewMessage = (data) => {
        if (data.sender_name !== username) {
          console.log('Message notification triggered:', data);
          // Send notification about new message
          sendNotification({
            type: 'message',
            title: `Message from ${data.sender_name}`,
            message: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
            chatId: chatId
          });
          
          // Mark message as received
          if (data.id) {
            // Temporarily disabled due to API errors
            /*
            // Use async IIFE with try-catch for better error handling
            (async () => {
              try {
                // Stringify deviceInfo before sending to the server
                const deviceInfo = JSON.stringify(getDeviceInfo());
                await api.markMessageReceived(data.id, deviceInfo);
                // Update local message state to reflect received status
                setMessages(prevMessages => 
                  prevMessages.map(m => 
                    m.id === data.id 
                      ? {
                          ...m, 
                          transmission: {
                            ...m.transmission,
                            received: {
                              status: true, 
                              timestamp: new Date().toISOString(),
                              deviceInfo: deviceInfo
                            }
                          }
                        }
                      : m
                  )
                );
              } catch (err) {
                console.error(`Error marking message ${data.id} as received:`, err);
                // Continue with other operations even if this one fails
              }
            })();
            */
          }
        }
      };
      
      // Subscribe to socket events
      chatSocketService.subscribeToUserJoined(chatId, handleUserJoined);
      chatSocketService.subscribeToChat(chatId, handleNewMessage);
      
      return () => {
        chatSocketService.unsubscribeFromChat(chatId, handleUserJoined);
        chatSocketService.unsubscribeFromChat(chatId, handleNewMessage);
      };
    }
  }, [chatId, hasJoined, username, sendNotification]);
  
  // Mark messages as seen when they are viewed
  useEffect(() => {
    // Temporarily disabled due to API errors
    /*
    if (messages.length > 0 && hasJoined) {
      // Get only messages from others that haven't been marked as seen
      const unreadMessages = messages.filter(
        msg => msg.sender !== username && 
        msg.id && 
        (!msg.transmission?.seen?.status)
      );
      
      // Mark each message as seen
      unreadMessages.forEach(msg => {
        if (msg.id && !msg.id.startsWith('temp-')) {
          // Try to mark as seen, but don't let errors block the UI
          // Use a try-catch with async IIFE to properly handle the promise
          (async () => {
            try {
              await api.markMessageSeen(msg.id);
              // Update the message in the local state to reflect that it's been seen
              setMessages(prevMessages => 
                prevMessages.map(m => 
                  m.id === msg.id 
                    ? {...m, transmission: {...m.transmission, seen: {status: true, timestamp: new Date().toISOString(), viewDuration: 0}}}
                    : m
                )
              );
            } catch (err) {
              console.error(`Error marking message ${msg.id} as seen:`, err);
              // Continue with other messages even if this one fails
              // No need to show an error toast as this is a background operation
            }
          })();
        }
      });
    }
    */
  }, [messages, hasJoined, username]);
  
  // Fetch default expiration settings from server
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoadingConfig(true);
        const response = await fetch(`${API_URL}/admin/settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const settings = await response.json();
          if (settings.chat && settings.message) {
            setExpirationHours(settings.chat.defaultExpirationHours);
            setMessageExpirationHours(settings.message.defaultExpirationHours);
          }
        }
      } catch (error) {
        console.error('Error fetching default expiration settings:', error);
        // Fallback to current defaults if there's an error
      } finally {
        setIsLoadingConfig(false);
      }
    };
    
    // Only fetch settings if we're not in an existing chat
    if (!chatId) {
      fetchSettings();
    }
  }, [chatId]);
  
  // Create a new chat
  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chat name",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await api.createChat(
        chatName, 
        user?.id, 
        username || 'Anonymous',
        chatDescription,
        isPublic,
        maxParticipants,
        expirationHours,
        messageExpirationHours
      );
      
      toast({
        title: "Chat created",
        description: `Your chat room "${chatName}" is ready`,
      });
      
      // Copy share info to clipboard
      const roomCode = data.room_code;
      const shareText = `Join my chat on Ephemeral Secret Tunnel\nRoom Code: ${roomCode}\nURL: ${window.location.origin}/chat/${data.id}`;
      
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
      
      // Show invitation dialog
      setNewChatData({
        id: data.id,
        name: data.name,
        room_code: data.room_code
      });
      setShowInviteDialog(true);
      
      // Reset the form
      setChatName('');
      setChatDescription('');
      setIsPublic(true);
      setMaxParticipants(20);
      // Use the default values loaded from config with null checks
      setExpirationHours(settings?.chat?.defaultExpirationHours || 48);
      setMessageExpirationHours(settings?.message?.defaultExpirationHours || 48);
      
    } catch (err) {
      console.error('Error creating chat:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Join an existing chat
  const handleJoinChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Always use the authenticated user's username if available
    if (user && !username) {
      setUsername(user.username);
    }
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Join the chat only once
      await api.joinChat(chatId!, username, user?.id);
      setHasJoined(true);
      
      // After joining, fetch chat data and set up polling
      const data = await api.getChat(chatId!);
      
      // Set chat data
      setChatData(data);
      setChatExpiry(new Date(data.expires_at));
      
      // If user is authenticated, add this chat to their recent chats list (backend already handles this)
      
      // Convert messages to our format
      const formattedMessages = data.messages ? data.messages.map((msg: ChatMessage) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_name,
        timestamp: new Date(msg.created_at)
      })) : [];
      
      setMessages(formattedMessages);
      
      // Set up interval for polling
      if (pollingIntervalRef.current === null) {
        pollingIntervalRef.current = window.setInterval(async () => {
          try {
            const data = await api.getChat(chatId!);
            
            // Update chat data
            setChatData(data);
            
            // Convert messages to our format
            const formattedMessages = data.messages ? data.messages.map((msg: ChatMessage) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender_name,
              timestamp: new Date(msg.created_at)
            })) : [];
            
            // Update messages if we have new ones
            if (formattedMessages.length > messages.length) {
              setMessages(formattedMessages);
            }
          } catch (err) {
            console.error('Error polling messages:', err);
            
            if (pollingIntervalRef.current && (err as Error).message?.includes('expired')) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              
              toast({
                title: "Chat expired",
                description: "This chat has expired due to inactivity",
                variant: "destructive",
              });
              navigate('/chat');
            }
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Error joining chat:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to join chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Set sending state to true
    setIsSendingMessage(true);
    
    // Generate a temporary ID for the message
    const tempId = 'temp-' + Date.now();
    
    // Add message to UI immediately with pending status
    const tempMessage: Message = {
      id: tempId,
      content: inputMessage,
      sender: username,
      timestamp: new Date(),
      transmission: {
        sent: { status: true, timestamp: new Date().toISOString() },
        delivered: { status: false, timestamp: null },
        received: { status: false, timestamp: null, deviceInfo: null },
        seen: { status: false, timestamp: null, viewDuration: 0 }
      },
      sendError: false
    };
    
    // Add to local state immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Clear input field
    setInputMessage('');
    
    try {
      // Send message to server
      const response = await api.sendMessage(chatId!, inputMessage, username, user?.id);
      
      // Update the message with the actual ID and server response
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {
          ...msg,
          id: response.id,
          transmission: response.transmission
        } : msg
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Mark the message with an error status
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {
          ...msg,
          sendError: true,
          errorMessage: err instanceof Error ? err.message : "Failed to send message",
          transmission: {
            ...msg.transmission,
            sent: { status: false, timestamp: new Date().toISOString() }
          }
        } : msg
      ));
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      // Reset sending state
      setIsSendingMessage(false);
    }
  };
  
  // Handle message retry
  const handleRetryMessage = async (messageId: string, content: string) => {
    try {
      // Update message to show retry in progress
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          sendError: 'retrying'
        } : msg
      ));
      
      // Send message to server
      const response = await api.sendMessage(chatId!, content, username, user?.id);
      
      // On success, remove the old message with error and add the new one
      setMessages(prev => 
        prev.filter(msg => msg.id !== messageId).concat([{
          id: response.id,
          content,
          sender: username,
          timestamp: new Date(),
          transmission: response.transmission
        }])
      );
      
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (err) {
      console.error('Error retrying message:', err);
      
      // Keep error state but update with latest error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {
          ...msg,
          sendError: true,
          errorMessage: err instanceof Error ? err.message : "Failed to send message",
        } : msg
      ));
      
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to retry sending message",
        variant: "destructive",
      });
    }
  };
  
  // Handle message deletion (for failed messages)
  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };
  
  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handle chat room join by selecting from the public list
  const handleSelectChat = (selectedChatId: string) => {
    navigate(`/chat/${selectedChatId}`);
  };
  
  // Handle settings updated
  const handleSettingsUpdated = async () => {
    if (chatId) {
      try {
        const data = await api.getChat(chatId);
        setChatData(data);
        
        toast({
          title: "Settings updated",
          description: "The chat room settings have been updated",
        });
      } catch (err) {
        console.error('Error refreshing chat data:', err);
      }
    }
  };
  
  // Handle chat deleted
  const handleChatDeleted = () => {
    toast({
      title: "Chat deleted",
      description: "The chat room has been deleted",
    });
    navigate('/chat');
  };
  
  // Render message with status
  const renderMessage = (message: Message) => (
    <div 
      key={message.id}
      className={`flex ${message.sender === 'system' ? 'justify-center' : message.sender === username ? 'justify-end' : 'justify-start'}`}
    >
      {message.sender === 'system' ? (
        <div className="bg-muted-foreground/20 px-3 py-1 rounded text-xs">
          {message.content}
        </div>
      ) : (
        <div 
          className={`max-w-[85%] sm:max-w-[70%] break-words ${
            message.sender === username 
              ? message.sendError ? 'bg-destructive/20 border border-destructive/50' : 'bg-primary text-primary-foreground'
              : 'bg-card'
          } rounded-lg px-3 py-2 sm:px-4 sm:py-2`}
        >
          {message.sender !== username && (
            <div className="text-xs font-semibold mb-1">
              {message.sender}
            </div>
          )}
          <div className="text-sm sm:text-base">{message.content}</div>
          
          {/* Error message display */}
          {message.sendError && (
            <div className="mt-1 text-xs text-destructive">
              {message.sendError === 'retrying' 
                ? <div className="flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Retrying...</div> 
                : message.errorMessage || 'Failed to send'}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-1">
            <div className="text-[10px] sm:text-xs opacity-70">
              {formatTimestamp(message.timestamp)}
            </div>
            
            {/* Message status or retry/delete buttons */}
            {message.sender === username && (
              message.sendError ? (
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={() => handleRetryMessage(message.id, message.content)} 
                    disabled={message.sendError === 'retrying'}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                message.transmission && !message.id.startsWith('temp-') ? (
                  <MessageStatus 
                    transmission={message.transmission} 
                    className="ml-2" 
                  />
                ) : null
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  // If we're in an existing chat but haven't joined
  if (chatId && !hasJoined) {
    return (
      <div className="container py-8 px-4 max-w-md mx-auto">
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Join Secure Chat</h1>
          
          {isLoadingChat ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-muted-foreground">Loading chat information...</p>
            </div>
          ) : chatData && (
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-semibold">{chatData.name}</h2>
              {chatData.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{chatData.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{chatData.participants?.length || 0} participants</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleJoinChat} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">
                Your Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                maxLength={20}
                required
                className="text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : 'Join Chat'}
            </Button>
          </form>
          
          <p className="mt-4 text-xs sm:text-sm text-muted-foreground text-center">
            This chat is ephemeral and will expire after inactivity
          </p>
        </div>
      </div>
    );
  }
  
  // If we're in an active chat
  if (chatId && hasJoined) {
    return (
      <div className="container py-4 px-2 sm:px-4 max-w-3xl mx-auto flex flex-col h-[calc(100vh-150px)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{chatData?.name || 'Secure Chat'}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Connected as <span className="font-semibold">{username}</span>
              {chatData?.room_code && (
                <> • Code: <span className="font-mono font-semibold">{chatData.room_code}</span></>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {isOwner && chatData && user && (
              <>
                <ChatSettings 
                  chatId={chatId}
                  ownerId={user.id}
                  initialName={chatData.name}
                  initialDescription={chatData.description}
                  initialIsPublic={chatData.is_public}
                  initialMaxParticipants={chatData.max_participants}
                  roomCode={chatData.room_code}
                  onSettingsUpdated={handleSettingsUpdated}
                  onChatDeleted={handleChatDeleted}
                />
                <InviteByPhone 
                  chatName={chatData.name}
                  chatId={chatId}
                  roomCode={chatData.room_code}
                  buttonVariant="outline"
                  buttonSize="sm"
                  buttonClassName="gap-2"
                  buttonLabel="Invite by SMS"
                  showIcon={true}
                />
              </>
            )}
            
            <CopyButton 
              text={`Room Code: ${chatData?.room_code || ''}\nURL: ${window.location.origin}/chat/${chatId}`}
              label="Copy Share Info"
            />
            
            {chatExpiry && (
              <Timer 
                expiryTime={chatExpiry} 
                onExpire={() => navigate('/chat')}
                onNearExpiry={() => {
                  setShowExpiryWarning(true);
                  toast({
                    title: "Chat expiring soon",
                    description: "This chat will expire soon. Consider creating a new chat room.",
                    variant: "destructive",
                  });
                }}
              />
            )}
          </div>
        </div>
        
        {/* User list with invite button */}
        <div className="flex items-center gap-2 mb-3 bg-muted/40 rounded-md px-3 py-2">
          <div className="flex-1 flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-xs sm:text-sm">
              {chatData?.participants?.length || 0} participants
            </span>
          </div>
          {isOwner && chatData && (
            <InviteByPhone 
              chatName={chatData.name}
              chatId={chatId}
              roomCode={chatData.room_code}
              buttonVariant="secondary"
              buttonSize="sm"
              buttonClassName="text-xs py-1 h-8"
              buttonLabel="Invite"
              showIcon={false}
            />
          )}
        </div>
        
        <div className="flex-1 bg-muted rounded-md mb-4 overflow-y-auto p-2 sm:p-4">
          {isLoadingChat ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Loading chat messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet. Start chatting!
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(message => renderMessage(message))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm sm:text-base"
            disabled={isSendingMessage}
          />
          <Button type="submit" size="icon" disabled={isSendingMessage || !inputMessage.trim()}>
            {isSendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <div className="mt-2 text-[10px] sm:text-xs flex items-center justify-center text-muted-foreground">
          <AlertTriangle className="inline-block h-3 w-3 mr-1" />
          {showExpiryWarning ? (
            <span className="text-warning font-semibold">This chat is expiring soon! Create a new chat room.</span>
          ) : (
            <>
              Chat room expires after 
              {chatData?.expiration_hours ? 
                ` ${chatData.expiration_hours > 24 ? 
                    `${Math.floor(chatData.expiration_hours / 24)} days` : 
                    `${chatData.expiration_hours} hours`
                  }` : 
                ' inactivity'
              }.
              Messages expire after
              {chatData?.message_expiration_hours ? 
                ` ${chatData.message_expiration_hours > 24 ? 
                    `${Math.floor(chatData.message_expiration_hours / 24)} days` : 
                    `${chatData.message_expiration_hours} hours`
                  }` : 
                ' 2 hours'
              }.
              {chatData?.participants?.length > 0 && (
                <span className="ml-2">• {chatData.participants.length} participants</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  
  // Default: create a new chat or join existing
  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto">
      {/* Invitation dialog that shows after creating a chat */}
      {newChatData && (
        <ChatInviteDialog 
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          chatId={newChatData.id}
          chatName={newChatData.name}
          roomCode={newChatData.room_code}
        />
      )}
      
      {!user ? (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to create or join chat rooms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Creating and joining chats requires authentication to keep track of your chat history.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="w-full sm:w-auto">
                <a href="/login">Sign In</a>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="/register">Register</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="create" className="w-full">
          <div className="max-w-full overflow-hidden">
            <TabsList className="w-full flex flex-row justify-between bg-muted/50 p-1 rounded-lg">
              <TabsTrigger 
                value="create" 
                className="flex-1 text-[10px] md:text-xs lg:text-sm flex items-center justify-center py-2 md:py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Create</span>
              </TabsTrigger>
              <TabsTrigger 
                value="join" 
                className="flex-1 text-[10px] md:text-xs lg:text-sm flex items-center justify-center py-2 md:py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <LinkIcon className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Join</span>
              </TabsTrigger>
              <TabsTrigger 
                value="browse" 
                className="flex-1 text-[10px] md:text-xs lg:text-sm flex items-center justify-center py-2 md:py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Users className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Browse</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex-1 text-[10px] md:text-xs lg:text-sm flex items-center justify-center py-2 md:py-2.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Clock className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">History</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="create" className="mt-4 sm:mt-6">
            <Card className="border-0 sm:border shadow-none sm:shadow">
              <CardHeader>
                <CardTitle>Create Secure Chat</CardTitle>
                <CardDescription>
                  Create a new chat room and share it with others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateChat} className="space-y-4">
                  <div>
                    <Label htmlFor="chat-name" className="text-sm">Chat Name *</Label>
                    <Input
                      id="chat-name"
                      type="text"
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      placeholder="Enter a name for your chat"
                      maxLength={50}
                      required
                      className="text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="chat-description" className="text-sm">Description (optional)</Label>
                    <Textarea
                      id="chat-description"
                      value={chatDescription}
                      onChange={(e) => setChatDescription(e.target.value)}
                      placeholder="Describe the purpose of this chat room"
                      maxLength={200}
                      className="text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="public" className="text-sm">Public Chat</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow anyone to discover this chat
                      </p>
                    </div>
                    <Switch
                      id="public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max-participants" className="text-sm">Maximum Participants</Label>
                    <Input
                      id="max-participants"
                      type="number"
                      min={2}
                      max={100}
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
                      className="text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expiration-hours" className="text-sm">Chat Room Expiration</Label>
                    <Select 
                      value={expirationHours.toString()} 
                      onValueChange={(value) => setExpirationHours(parseInt(value))}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="expiration-hours" className="text-sm sm:text-base">
                        <SelectValue placeholder="Select expiration time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">2 days</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                        <SelectItem value="720">30 days</SelectItem>
                        <SelectItem value="2160">90 days</SelectItem>
                        <SelectItem value="8760">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chat room will expire after this period of inactivity
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="message-expiration-hours" className="text-sm">Message Expiration</Label>
                    <Select 
                      value={messageExpirationHours.toString()} 
                      onValueChange={(value) => setMessageExpirationHours(parseInt(value))}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="message-expiration-hours" className="text-sm sm:text-base">
                        <SelectValue placeholder="Select message expiration time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">2 days</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Messages will be automatically deleted after this amount of time
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Chat...
                      </>
                    ) : 'Create Chat'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="w-full">
                  <h3 className="text-sm font-semibold mb-2">How it works:</h3>
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <li>• Create a secure chat room</li>
                    <li>• Share the code or link with others to join</li>
                    <li>• Chat securely with end-to-end encryption</li>
                    <li>• Messages are automatically deleted after their expiration time</li>
                    <li>• Chat rooms expire after a period of inactivity</li>
                    <li>• Customize both message and chat room expiration times</li>
                  </ul>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="join" className="mt-4 sm:mt-6">
            <Card className="border-0 sm:border shadow-none sm:shadow">
              <JoinByCode onSuccess={handleSelectChat} />
            </Card>
          </TabsContent>
          
          <TabsContent value="browse" className="mt-4 sm:mt-6">
            <Card className="border-0 sm:border shadow-none sm:shadow">
              <PublicChatList limit={6} onChatSelected={handleSelectChat} />
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4 sm:mt-6">
            <Card className="border-0 sm:border shadow-none sm:shadow">
              <UserChatHistory onChatSelected={handleSelectChat} />
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Chat;
