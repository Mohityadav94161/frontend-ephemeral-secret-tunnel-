import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import * as api from '../lib/api';

const ChatRedirect = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToChat = async () => {
      if (!roomCode) {
        navigate('/chat');
        return;
      }

      try {
        setIsLoading(true);
        // This would need to be implemented in the API
        const chatData = await api.getChatByRoomCode(roomCode);
        
        // Redirect to the full chat page
        navigate(`/chat/${chatData.id}`);
      } catch (error) {
        console.error('Error resolving chat code:', error);
        toast({
          title: 'Error',
          description: 'This chat link is invalid or has expired',
          variant: 'destructive',
        });
        navigate('/chat');
      } finally {
        setIsLoading(false);
      }
    };

    redirectToChat();
  }, [roomCode, navigate, toast]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-dark-lighter rounded-lg p-8 border border-border text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-medium mb-2">Connecting to Chat</h2>
        <p className="text-muted-foreground">Please wait while we connect you to the chat room...</p>
      </div>
    </div>
  );
};

export default ChatRedirect; 