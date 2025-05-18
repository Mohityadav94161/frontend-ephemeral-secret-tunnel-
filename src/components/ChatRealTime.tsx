import { useEffect, useState } from 'react';
import chatSocketService, { ChatMessage } from '@/lib/socket';
import { toast } from 'sonner';

interface ChatRealTimeProps {
  roomCode: string;
  onNewMessage?: (message: ChatMessage) => void;
  onUserTyping?: (username: string) => void;
  onUserStoppedTyping?: (username: string) => void;
}

export function ChatRealTime({ 
  roomCode, 
  onNewMessage, 
  onUserTyping, 
  onUserStoppedTyping 
}: ChatRealTimeProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the chat room
    if (roomCode) {
      chatSocketService.connect();
      chatSocketService.joinRoom(roomCode);

      // Setup listeners
      const onRoomJoined = (data: { roomId: string; name: string }) => {
        setIsConnected(true);
        toast.success(`Connected to chat room: ${data.name}`);
      };

      const handleNewMessage = (message: ChatMessage) => {
        if (onNewMessage) {
          onNewMessage(message);
        }
      };

      const handleUserTyping = (data: { username: string }) => {
        if (onUserTyping) {
          onUserTyping(data.username);
        }
      };

      const handleUserStoppedTyping = (data: { username: string }) => {
        if (onUserStoppedTyping) {
          onUserStoppedTyping(data.username);
        }
      };

      const handleError = (data: { message: string }) => {
        toast.error(`Chat error: ${data.message}`);
      };

      // Register event listeners
      chatSocketService.on('room-joined', onRoomJoined);
      chatSocketService.on('new-message', handleNewMessage);
      chatSocketService.on('user-typing', handleUserTyping);
      chatSocketService.on('user-stopped-typing', handleUserStoppedTyping);
      chatSocketService.on('error', handleError);

      // Cleanup function
      return () => {
        chatSocketService.off('room-joined', onRoomJoined);
        chatSocketService.off('new-message', handleNewMessage);
        chatSocketService.off('user-typing', handleUserTyping);
        chatSocketService.off('user-stopped-typing', handleUserStoppedTyping);
        chatSocketService.off('error', handleError);
        chatSocketService.disconnect();
      };
    }
  }, [roomCode, onNewMessage, onUserTyping, onUserStoppedTyping]);

  // This is a utility component that doesn't render anything visible
  return null;
} 