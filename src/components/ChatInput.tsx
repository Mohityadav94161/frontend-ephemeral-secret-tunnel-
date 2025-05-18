import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendMessage } from '@/lib/api';
import chatSocketService from '@/lib/socket';

interface ChatInputProps {
  chatId: string;
  username: string;
  userId?: string;
  onMessageSent?: () => void;
}

export function ChatInput({ chatId, username, userId, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      chatSocketService.sendTyping(chatId, username);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        chatSocketService.sendStoppedTyping(chatId, username);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, chatId, username]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setIsSubmitting(true);
      await sendMessage(chatId, message, username, userId);
      setMessage('');
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
      setIsTyping(false);
      chatSocketService.sendStoppedTyping(chatId, username);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 border-t">
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] resize-none flex-1"
          disabled={isSubmitting}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!message.trim() || isSubmitting}
          className="h-[60px]"
        >
          Send
        </Button>
      </div>
    </div>
  );
} 