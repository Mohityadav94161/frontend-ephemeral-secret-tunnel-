import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Users, Clock, RefreshCw } from 'lucide-react';

interface ChatHistory {
  chatId: string;
  chatName: string;
  roomCode: string;
  lastActivity: string;
}

interface UserChatHistoryProps {
  onChatSelected?: (chatId: string) => void;
}

export default function UserChatHistory({ onChatSelected }: UserChatHistoryProps) {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchChatHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user || !user.id) {
        console.error('User not authenticated in UserChatHistory');
        throw new Error('User not authenticated');
      }
      
      console.log('Fetching chat history for user:', user.id);
      const result = await api.getUserChatHistory(user.id);
      console.log('Chat history result:', result);
      setChats(result.chats || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError('Failed to load chat history');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('UserChatHistory component mounted, user:', user);
    if (user && user.id) {
      fetchChatHistory();
    } else {
      console.log('No user ID available for fetching chat history');
      setLoading(false);
    }
  }, [user]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin mr-2">
          <RefreshCw size={20} />
        </div>
        <span>Loading chat history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button 
          variant="outline" 
          onClick={fetchChatHistory} 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No chat history available</p>
        <Button 
          variant="outline" 
          onClick={fetchChatHistory} 
          className="mt-4"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Chat History</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchChatHistory}
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {chats.map(chat => (
          <Card key={chat.chatId} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{chat.chatName}</CardTitle>
              <CardDescription>
                Room Code: <span className="font-mono font-bold">{chat.roomCode}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Clock size={14} className="mr-1" />
                <span>Last active: {formatTime(chat.lastActivity)}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              {onChatSelected ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onChatSelected(chat.chatId)}
                >
                  Rejoin Chat
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/chat/${chat.chatId}`}>Rejoin Chat</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 