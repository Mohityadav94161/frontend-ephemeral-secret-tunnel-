import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { API_URL } from '../config';

interface MessageData {
  chatId: string;
  content: string;
  sender_name: string;
  sender_id?: string;
  device_info?: string;
  timestamp?: string;
}

interface StatusUpdateData {
  messageId: string;
  chatId: string;
  status: 'delivered' | 'received' | 'seen';
  deviceInfo?: string;
  viewDuration?: number;
  timestamp?: string;
}

interface UserJoinData {
  chatId: string;
  username: string;
  userId?: string;
}

type MessageCallback = (data: MessageData) => void;
type StatusCallback = (data: StatusUpdateData) => void;
type UserJoinCallback = (data: UserJoinData) => void;
type CallbackFunction = MessageCallback | StatusCallback | UserJoinCallback;

export interface ChatSocketService {
  connect: () => Socket;
  disconnect: () => void;
  joinChat: (chatId: string, username: string, userId?: string) => void;
  leaveChat: (chatId: string, username: string, userId?: string) => void;
  sendMessage: (chatId: string, content: string, senderName: string, senderId?: string, deviceInfo?: string) => void;
  updateMessageStatus: (messageId: string, chatId: string, status: 'delivered' | 'received' | 'seen', deviceInfo?: string, viewDuration?: number) => void;
  subscribeToChat: (chatId: string, callback: MessageCallback) => void;
  subscribeToUserJoined: (chatId: string, callback: UserJoinCallback) => void;
  subscribeToMessageStatus: (chatId: string, callback: StatusCallback) => void;
  unsubscribeFromChat: (chatId: string, callback: CallbackFunction) => void;
}

let socket: Socket | null = null;
const listeners = new Map<string, CallbackFunction[]>();

const chatSocketService: ChatSocketService = {
  connect: () => {
    if (!socket) {
      socket = io(API_URL, {
        transports: ['websocket'],
        autoConnect: true
      });

      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      socket.on('message', (data: MessageData) => {
        const { chatId } = data;
        if (listeners.has(chatId)) {
          listeners.get(chatId)?.forEach(callback => callback(data));
        }
      });
      
      // Specifically listen for new message events
      socket.on('new-message', (data: MessageData) => {
        console.log('Received new message via socket:', data);
        const { chatId } = data;
        if (listeners.has(chatId)) {
          listeners.get(chatId)?.forEach(callback => callback(data));
        }
      });
      
      socket.on('user_joined', (data: UserJoinData) => {
        const { chatId } = data;
        if (listeners.has(chatId)) {
          listeners.get(chatId)?.forEach(callback => {
            if (typeof callback === 'function' && callback.name === 'userJoinedCallback') {
              callback(data);
            }
          });
        }
      });
      
      socket.on('message_status_update', (data: StatusUpdateData) => {
        const { chatId } = data;
        if (listeners.has(chatId)) {
          listeners.get(chatId)?.forEach(callback => {
            if (typeof callback === 'function' && callback.name === 'messageStatusCallback') {
              callback(data);
            }
          });
        }
      });
    }
    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinChat: (chatId: string, username: string, userId?: string) => {
    if (!socket) {
      socket = chatSocketService.connect();
    }
    
    socket.emit('join_chat', { chatId, username, userId });
  },

  leaveChat: (chatId: string, username: string, userId?: string) => {
    if (socket) {
      socket.emit('leave_chat', { chatId, username, userId });
    }
  },

  sendMessage: (chatId: string, content: string, senderName: string, senderId?: string, deviceInfo?: string) => {
    if (!socket) {
      socket = chatSocketService.connect();
    }
    
    const message: MessageData = {
      chatId,
      content,
      sender_name: senderName,
      sender_id: senderId,
      device_info: deviceInfo,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('send_message', message);
  },
  
  updateMessageStatus: (messageId: string, chatId: string, status: 'delivered' | 'received' | 'seen', deviceInfo?: string, viewDuration?: number) => {
    if (!socket) {
      socket = chatSocketService.connect();
    }
    
    const statusUpdate: StatusUpdateData = {
      messageId,
      chatId,
      status,
      deviceInfo,
      viewDuration,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('update_message_status', statusUpdate);
  },

  subscribeToChat: (chatId: string, callback: MessageCallback) => {
    if (!listeners.has(chatId)) {
      listeners.set(chatId, []);
    }
    listeners.get(chatId)?.push(callback);

    if (!socket) {
      socket = chatSocketService.connect();
    }
  },
  
  subscribeToUserJoined: (chatId: string, callback: UserJoinCallback) => {
    // Create a named function to allow filtering by event type
    const userJoinedCallback = function userJoinedCallback(data: UserJoinData) {
      callback(data);
    };
    
    if (!listeners.has(chatId)) {
      listeners.set(chatId, []);
    }
    listeners.get(chatId)?.push(userJoinedCallback);

    if (!socket) {
      socket = chatSocketService.connect();
    }
  },
  
  subscribeToMessageStatus: (chatId: string, callback: StatusCallback) => {
    // Create a named function to allow filtering by event type
    const messageStatusCallback = function messageStatusCallback(data: StatusUpdateData) {
      callback(data);
    };
    
    if (!listeners.has(chatId)) {
      listeners.set(chatId, []);
    }
    listeners.get(chatId)?.push(messageStatusCallback);

    if (!socket) {
      socket = chatSocketService.connect();
    }
  },

  unsubscribeFromChat: (chatId: string, callback: CallbackFunction) => {
    if (listeners.has(chatId)) {
      const callbacks = listeners.get(chatId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          listeners.delete(chatId);
        }
      }
    }
  }
};

export default chatSocketService; 