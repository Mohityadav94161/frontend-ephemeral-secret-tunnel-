import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import * as api from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Users, Clock, RefreshCw } from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  room_code: string;
  description: string;
  participant_count: number;
  created_by: string;
  last_activity: string;
}

interface PublicChatListProps {
  limit?: number;
  onChatSelected?: (chatId: string) => void;
}

export default function PublicChatList({ limit = 10, onChatSelected }: PublicChatListProps) {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.listChats(true, limit, 0);
      setChats(result.chats);
    } catch (err) {
      console.error('Error fetching public chats:', err);
      setError('Failed to load chat rooms');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [limit]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleJoinByCode = (roomCode: string) => {
    if (onChatSelected) {
      // For modal use
      api.getChatByRoomCode(roomCode)
        .then(data => {
          onChatSelected(data.id);
        })
        .catch(err => {
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : "Failed to find chat room",
            variant: "destructive",
          });
        });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin mr-2">
          <RefreshCw size={20} />
        </div>
        <span>Loading chat rooms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button 
          variant="outline" 
          onClick={fetchChats} 
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
        <p>No public chat rooms available</p>
        <Button 
          variant="outline" 
          onClick={fetchChats} 
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
        <h2 className="text-xl font-bold">Public Chat Rooms</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchChats}
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {chats.map(chat => (
          <Card key={chat.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{chat.name}</CardTitle>
              <CardDescription>
                Room Code: <span className="font-mono font-bold">{chat.room_code}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {chat.description || "No description provided"}
              </p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Users size={14} className="mr-1" />
                <span className="mr-3">{chat.participant_count} participants</span>
                <Clock size={14} className="mr-1" />
                <span>Last active: {formatTime(chat.last_activity)}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              {onChatSelected ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleJoinByCode(chat.room_code)}
                >
                  Join Room
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/chat/${chat.id}`}>Join Room</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 